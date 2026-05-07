import { app, BrowserWindow, ipcMain, Menu, nativeImage, Tray } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

let mainWindow;
let tray;
let lastMenuState = {
  isRunning: false,
  isPaused: false,
  isBreakTime: false,
  timeText: '25:00'
};

function rendererPath(...segments) {
  if (isDev) {
    const baseUrl = process.env.VITE_DEV_SERVER_URL.replace(/\/$/, '');
    const suffix = segments.map(segment => String(segment).replace(/^\/+/, '')).join('/');
    return suffix ? `${baseUrl}/${suffix}` : baseUrl;
  }

  return path.join(__dirname, '..', 'dist-renderer', ...segments);
}

function userDataPath(...segments) {
  return path.join(app.getPath('userData'), ...segments);
}

function toFileUrl(filePath) {
  return `file://${filePath.replaceAll(path.sep, '/')}`;
}

async function ensureSettingsFiles() {
  await fs.mkdir(userDataPath('assets'), { recursive: true });
}

async function readSettings() {
  await ensureSettingsFiles();

  try {
    const raw = await fs.readFile(userDataPath('settings.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeSettings(settings) {
  await ensureSettingsFiles();
  await fs.writeFile(userDataPath('settings.json'), JSON.stringify(settings, null, 2));
}

function bundledWallpaperUrl() {
  if (isDev) return rendererPath('/src/assets/montery-colored.jpg');
  return toFileUrl(path.join(process.resourcesPath, 'assets', 'montery-colored.jpg'));
}

async function getSettingsForRenderer() {
  const settings = await readSettings();

  return {
    wallpaperUrl: settings.wallpaperPath ? toFileUrl(settings.wallpaperPath) : bundledWallpaperUrl(),
    soundUrl: settings.soundPath ? toFileUrl(settings.soundPath) : null,
    hasCustomWallpaper: Boolean(settings.wallpaperPath),
    hasCustomSound: Boolean(settings.soundPath)
  };
}

async function saveUploadedFile(kind, payload) {
  await ensureSettingsFiles();

  const settings = await readSettings();
  const extension = path.extname(payload.name || '') || (kind === 'wallpaper' ? '.jpg' : '.mp3');
  const destination = userDataPath('assets', `${kind}${extension}`);
  const buffer = Buffer.from(new Uint8Array(payload.data));
  await fs.writeFile(destination, buffer);

  if (kind === 'wallpaper') settings.wallpaperPath = destination;
  if (kind === 'sound') settings.soundPath = destination;

  await writeSettings(settings);
  return getSettingsForRenderer();
}

async function resetStoredFile(kind) {
  const settings = await readSettings();
  const key = kind === 'wallpaper' ? 'wallpaperPath' : 'soundPath';

  if (settings[key]) {
    await fs.rm(settings[key], { force: true });
    delete settings[key];
  }

  await writeSettings(settings);
  return getSettingsForRenderer();
}

function createTrayIcon(timeText, isBreakTime, isPaused) {
  const background = isPaused ? '#5a5a5a' : isBreakTime ? '#1d6f42' : '#171717';
  const label = timeText.length > 5 ? timeText.slice(-5) : timeText;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="12" fill="${background}"/>
      <text x="32" y="37" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#F5F2D0">${label}</text>
    </svg>
  `;

  return nativeImage.createFromDataURL(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
}

function getTooltip(state = lastMenuState) {
  const mode = state.isBreakTime ? 'Break' : 'Pomodoro';
  const prefix = state.isPaused ? 'Paused' : state.isRunning ? mode : 'Ready';
  return `${prefix} - ${state.timeText}`;
}

function sendRendererCommand(command) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('tray:command', command);
}

function buildTrayMenu() {
  const startLabel = lastMenuState.isPaused
    ? 'Unpause'
    : lastMenuState.isRunning
      ? 'Pause'
      : 'Start';

  const switchLabel = lastMenuState.isBreakTime ? 'Skip to Pomodoro' : 'Start Break';

  const menu = Menu.buildFromTemplate([
    { label: 'Settings', click: () => showPopup('settings') },
    { type: 'separator' },
    { label: startLabel, click: () => sendRendererCommand('toggle-running') },
    { label: 'Reset', enabled: lastMenuState.isRunning || lastMenuState.isPaused, click: () => sendRendererCommand('reset') },
    { label: switchLabel, enabled: lastMenuState.isRunning || lastMenuState.isPaused, click: () => sendRendererCommand('switch-mode') },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setContextMenu(menu);
}

function updateTray(state = {}) {
  lastMenuState = { ...lastMenuState, ...state };

  if (!tray) return;
  tray.setImage(createTrayIcon(lastMenuState.timeText, lastMenuState.isBreakTime, lastMenuState.isPaused));
  tray.setToolTip(getTooltip());
  buildTrayMenu();
}

function positionPopup() {
  if (!tray || !mainWindow) return;

  const trayBounds = tray.getBounds();
  const windowBounds = mainWindow.getBounds();
  const display = trayBounds;
  const x = Math.round(display.x + display.width / 2 - windowBounds.width / 2);
  const y = Math.max(12, Math.round(display.y - windowBounds.height - 8));
  mainWindow.setPosition(x, y, false);
}

function showPopup(view = 'timer') {
  if (!mainWindow) return;
  mainWindow.webContents.send('popup:view', view);
  positionPopup();
  mainWindow.show();
  mainWindow.focus();
}

function togglePopup() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
    return;
  }

  showPopup('timer');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 430,
    height: 460,
    show: false,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    mainWindow.loadURL(rendererPath());
  } else {
    mainWindow.loadFile(rendererPath('index.html'));
  }

  mainWindow.on('blur', () => {
    if (mainWindow && !mainWindow.webContents.isDevToolsOpened()) mainWindow.hide();
  });
}

function createTray() {
  tray = new Tray(createTrayIcon(lastMenuState.timeText, false, false));
  tray.setToolTip(getTooltip());
  tray.on('click', togglePopup);
  buildTrayMenu();
}

ipcMain.handle('settings:get', getSettingsForRenderer);
ipcMain.handle('settings:setWallpaper', (_event, payload) => saveUploadedFile('wallpaper', payload));
ipcMain.handle('settings:setSound', (_event, payload) => saveUploadedFile('sound', payload));
ipcMain.handle('settings:resetWallpaper', () => resetStoredFile('wallpaper'));
ipcMain.handle('settings:resetSound', () => resetStoredFile('sound'));
ipcMain.on('tray:updateTimer', (_event, state) => updateTray(state));
ipcMain.on('window:hide', () => {
  if (mainWindow) mainWindow.hide();
});

app.whenReady().then(() => {
  app.setAppUserModelId('com.pomodoroproject.tray');
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {});

app.on('before-quit', () => {
  tray?.destroy();
});
