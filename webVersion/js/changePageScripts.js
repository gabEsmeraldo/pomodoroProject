(function() {
  const overlay = document.createElement('div');
  overlay.className = 'bg-overlay';
  overlay.id = 'bgOverlay';
  document.body.prepend(overlay);
})();

const SETTINGS_DB_NAME = 'pomodoroSettings';
const SETTINGS_DB_VERSION = 1;
const SETTINGS_STORE_NAME = 'files';
let settingsDbPromise;
let wallpaperObjectUrl;
let soundObjectUrl;
let customSound;
let audioContext;

function setOverlayBg(mode) {
  const overlay = document.getElementById('bgOverlay');
  if (!overlay) return;
  if (mode === 'colored') {
    overlay.classList.remove('bw-mode');
  } else {
    overlay.classList.add('bw-mode');
  }
}

function setOverlayForTimerState(running, paused, breakTime) {
  if (!running || paused || breakTime) {
    setOverlayBg('colored');
  } else {
    setOverlayBg('bw');
  }
}

function openSettingsDb() {
  if (settingsDbPromise) return settingsDbPromise;

  settingsDbPromise = new Promise(function(resolve, reject) {
    const request = indexedDB.open(SETTINGS_DB_NAME, SETTINGS_DB_VERSION);

    request.onupgradeneeded = function() {
      request.result.createObjectStore(SETTINGS_STORE_NAME);
    };

    request.onsuccess = function() {
      resolve(request.result);
    };

    request.onerror = function() {
      reject(request.error);
    };
  });

  return settingsDbPromise;
}

async function saveSettingsFile(key, file) {
  const db = await openSettingsDb();
  return new Promise(function(resolve, reject) {
    const transaction = db.transaction(SETTINGS_STORE_NAME, 'readwrite');
    transaction.objectStore(SETTINGS_STORE_NAME).put(file, key);
    transaction.oncomplete = resolve;
    transaction.onerror = function() {
      reject(transaction.error);
    };
  });
}

async function loadSettingsFile(key) {
  const db = await openSettingsDb();
  return new Promise(function(resolve, reject) {
    const transaction = db.transaction(SETTINGS_STORE_NAME, 'readonly');
    const request = transaction.objectStore(SETTINGS_STORE_NAME).get(key);
    request.onsuccess = function() {
      resolve(request.result);
    };
    request.onerror = function() {
      reject(request.error);
    };
  });
}

async function deleteSettingsFile(key) {
  const db = await openSettingsDb();
  return new Promise(function(resolve, reject) {
    const transaction = db.transaction(SETTINGS_STORE_NAME, 'readwrite');
    transaction.objectStore(SETTINGS_STORE_NAME).delete(key);
    transaction.oncomplete = resolve;
    transaction.onerror = function() {
      reject(transaction.error);
    };
  });
}

function setWallpaperFromBlob(blob) {
  const overlay = document.getElementById('bgOverlay');
  if (!overlay) return;
  if (wallpaperObjectUrl) URL.revokeObjectURL(wallpaperObjectUrl);
  wallpaperObjectUrl = URL.createObjectURL(blob);
  overlay.style.backgroundImage = `url('${wallpaperObjectUrl}')`;
}

function resetWallpaper() {
  const overlay = document.getElementById('bgOverlay');
  if (!overlay) return;
  if (wallpaperObjectUrl) URL.revokeObjectURL(wallpaperObjectUrl);
  wallpaperObjectUrl = null;
  overlay.style.backgroundImage = '';
}

function setSoundFromBlob(blob) {
  if (soundObjectUrl) URL.revokeObjectURL(soundObjectUrl);
  soundObjectUrl = URL.createObjectURL(blob);
  customSound = new Audio(soundObjectUrl);
}

function resetSound() {
  if (soundObjectUrl) URL.revokeObjectURL(soundObjectUrl);
  soundObjectUrl = null;
  customSound = null;
}

function playDefaultNotificationSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  if (!audioContext) audioContext = new AudioContext();

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.22);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.24);
}

function playNotificationSound() {
  try {
    if (customSound) {
      customSound.currentTime = 0;
      customSound.play().catch(function() {});
      return;
    }
    playDefaultNotificationSound();
  } catch (error) {
    console.warn('Unable to play notification sound.', error);
  }
}

async function loadSavedSettings() {
  try {
    const wallpaper = await loadSettingsFile('wallpaper');
    if (wallpaper) setWallpaperFromBlob(wallpaper);

    const sound = await loadSettingsFile('sound');
    if (sound) setSoundFromBlob(sound);
  } catch (error) {
    console.warn('Unable to load saved settings.', error);
  }
}

function setSettingsButtonVisible(visible) {
  const settingsButton = document.getElementById('settingsButton');
  if (!settingsButton) return;
  settingsButton.style.display = visible ? 'inline-block' : 'none';
}

function updateSettingsButtonVisibility(running, paused) {
  setSettingsButtonVisible(!running || paused);
}

function setupSettingsControls() {
  const settingsButton = document.getElementById('settingsButton');
  const settingsModal = document.getElementById('settingsModal');
  const settingsCloseButton = document.getElementById('settingsCloseButton');
  const wallpaperInput = document.getElementById('wallpaperInput');
  const soundInput = document.getElementById('soundInput');
  const resetWallpaperButton = document.getElementById('resetWallpaperButton');
  const resetSoundButton = document.getElementById('resetSoundButton');
  const testSoundButton = document.getElementById('testSoundButton');

  function openSettings() {
    settingsModal.classList.add('open');
    settingsModal.setAttribute('aria-hidden', 'false');
  }

  function closeSettings() {
    settingsModal.classList.remove('open');
    settingsModal.setAttribute('aria-hidden', 'true');
  }

  settingsButton.addEventListener('click', openSettings);
  settingsCloseButton.addEventListener('click', closeSettings);
  settingsModal.addEventListener('click', function(event) {
    if (event.target === settingsModal) closeSettings();
  });

  wallpaperInput.addEventListener('change', async function() {
    const file = wallpaperInput.files && wallpaperInput.files[0];
    if (!file) return;
    await saveSettingsFile('wallpaper', file);
    setWallpaperFromBlob(file);
  });

  soundInput.addEventListener('change', async function() {
    const file = soundInput.files && soundInput.files[0];
    if (!file) return;
    await saveSettingsFile('sound', file);
    setSoundFromBlob(file);
    playNotificationSound();
  });

  resetWallpaperButton.addEventListener('click', async function() {
    await deleteSettingsFile('wallpaper');
    resetWallpaper();
    wallpaperInput.value = '';
  });

  resetSoundButton.addEventListener('click', async function() {
    await deleteSettingsFile('sound');
    resetSound();
    soundInput.value = '';
  });

  testSoundButton.addEventListener('click', playNotificationSound);
}

const pomodoroTimerSelector = document.getElementById("timerPomodoro");
const breakTimerSelector = document.getElementById("timerBreak");
const timerSelector = document.getElementById("selector");
const fullscreenTimer = document.getElementById("fullScreenTimer");

function changeToBreak(){
    pomodoroTimerSelector.style.display = "none";
    breakTimerSelector.style.display = "block";
}

function changeToPomodoro(){
    breakTimerSelector.style.display = "none";
    pomodoroTimerSelector.style.display = "block";
}

function changeToFullscreenTimer(){
    timerSelector.style.display = "none";
    fullscreenTimer.style.display = "block";
}

function changeToInitialView(){
    fullscreenTimer.style.display = "none";
    timerSelector.style.display = "flex";
    setOverlayBg('colored');
}

setupSettingsControls();
loadSavedSettings();
