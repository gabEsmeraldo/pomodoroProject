import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import defaultWallpaper from './assets/montery-colored.jpg';

const desktop = window.pomodoroDesktop;

const DEFAULT_DURATIONS = {
  pomodoroHours: 0,
  pomodoroMinutes: 25,
  pomodoroSeconds: 0,
  breakMinutes: 5,
  breakSeconds: 0
};

function clamp(value, min, max) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return 0;
  return Math.max(min, Math.min(max, number));
}

function formatTime(totalSeconds) {
  const safeTotal = Math.max(0, totalSeconds);
  const hours = Math.floor(safeTotal / 3600);
  const minutes = Math.floor((safeTotal % 3600) / 60);
  const seconds = safeTotal % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function secondsFromDurations(mode, durations) {
  if (mode === 'pomodoro') {
    return (
      clamp(durations.pomodoroHours, 0, 23) * 3600 +
      clamp(durations.pomodoroMinutes, 0, 59) * 60 +
      clamp(durations.pomodoroSeconds, 0, 59)
    );
  }

  return clamp(durations.breakMinutes, 0, 59) * 60 + clamp(durations.breakSeconds, 0, 59);
}

async function fileToPayload(file) {
  return {
    name: file.name,
    type: file.type,
    data: await file.arrayBuffer()
  };
}

function playDefaultNotificationSound(audioContextRef) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  if (!audioContextRef.current) audioContextRef.current = new AudioContext();

  const context = audioContextRef.current;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.24);
}

export default function App() {
  const [view, setView] = useState('timer');
  const [mode, setMode] = useState('pomodoro');
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
  const [remaining, setRemaining] = useState(secondsFromDurations('pomodoro', DEFAULT_DURATIONS));
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [settings, setSettings] = useState({
    wallpaperUrl: defaultWallpaper,
    soundUrl: null,
    hasCustomWallpaper: false,
    hasCustomSound: false
  });
  const [uploadStatus, setUploadStatus] = useState('');
  const audioContextRef = useRef(null);
  const soundRef = useRef(null);

  const timeText = useMemo(() => formatTime(remaining), [remaining]);
  const wallpaperUrl = settings.wallpaperUrl || defaultWallpaper;
  const shouldUseGrayscale = isRunning && !isPaused && mode === 'pomodoro';

  const playNotificationSound = useCallback(() => {
    try {
      if (soundRef.current) {
        soundRef.current.currentTime = 0;
        soundRef.current.play().catch(() => {});
        return;
      }

      playDefaultNotificationSound(audioContextRef);
    } catch (error) {
      console.warn('Unable to play notification sound.', error);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    if (!desktop) return;
    const savedSettings = await desktop.getSettings();
    setSettings({
      wallpaperUrl: savedSettings.wallpaperUrl || defaultWallpaper,
      soundUrl: savedSettings.soundUrl,
      hasCustomWallpaper: savedSettings.hasCustomWallpaper,
      hasCustomSound: savedSettings.hasCustomSound
    });
  }, []);

  const startTimer = useCallback((targetMode = mode) => {
    const nextSeconds = secondsFromDurations(targetMode, durations) || secondsFromDurations(targetMode, DEFAULT_DURATIONS);
    setMode(targetMode);
    setRemaining(nextSeconds);
    setIsRunning(true);
    setIsPaused(false);
    setView('timer');
    playNotificationSound();
  }, [durations, mode, playNotificationSound]);

  const pauseTimer = useCallback(() => {
    if (!isRunning || isPaused) return;
    setIsPaused(true);
    playNotificationSound();
  }, [isPaused, isRunning, playNotificationSound]);

  const unpauseTimer = useCallback(() => {
    if (!isRunning || !isPaused) return;
    setIsPaused(false);
    playNotificationSound();
  }, [isPaused, isRunning, playNotificationSound]);

  const resetTimer = useCallback(() => {
    const nextSeconds = secondsFromDurations(mode, durations) || secondsFromDurations(mode, DEFAULT_DURATIONS);
    setRemaining(nextSeconds);
    setIsRunning(true);
    setIsPaused(false);
    setView('timer');
    playNotificationSound();
  }, [durations, mode, playNotificationSound]);

  const stopTimer = useCallback(() => {
    setMode('pomodoro');
    setRemaining(secondsFromDurations('pomodoro', durations) || secondsFromDurations('pomodoro', DEFAULT_DURATIONS));
    setIsRunning(false);
    setIsPaused(false);
    setView('timer');
    playNotificationSound();
  }, [durations, playNotificationSound]);

  const switchMode = useCallback(() => {
    const nextMode = mode === 'pomodoro' ? 'break' : 'pomodoro';
    startTimer(nextMode);
  }, [mode, startTimer]);

  const selectMode = (nextMode) => {
    setMode(nextMode);

    if (!isRunning) {
      setRemaining(secondsFromDurations(nextMode, durations) || secondsFromDurations(nextMode, DEFAULT_DURATIONS));
    }
  };

  const handleTrayCommand = useCallback((command) => {
    if (command === 'toggle-running') {
      if (!isRunning) startTimer(mode);
      else if (isPaused) unpauseTimer();
      else pauseTimer();
    }

    if (command === 'reset') resetTimer();
    if (command === 'switch-mode') switchMode();
  }, [isPaused, isRunning, mode, pauseTimer, resetTimer, startTimer, switchMode, unpauseTimer]);

  const updateDuration = (key, max) => (event) => {
    const value = clamp(event.target.value, 0, max);
    const nextDurations = { ...durations, [key]: value };
    setDurations(nextDurations);

    if (!isRunning) {
      setRemaining(secondsFromDurations(mode, nextDurations) || secondsFromDurations(mode, DEFAULT_DURATIONS));
    }
  };

  const saveWallpaper = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !desktop) return;
    setUploadStatus('Saving wallpaper...');
    const nextSettings = await desktop.setWallpaper(await fileToPayload(file));
    setSettings(nextSettings);
    setUploadStatus('Wallpaper saved');
  };

  const saveSound = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !desktop) return;
    setUploadStatus('Saving sound...');
    const nextSettings = await desktop.setSound(await fileToPayload(file));
    setSettings(nextSettings);
    setUploadStatus('Sound saved');
    if (nextSettings.soundUrl) soundRef.current = new Audio(nextSettings.soundUrl);
    playNotificationSound();
  };

  const resetWallpaper = async () => {
    if (!desktop) return;
    const nextSettings = await desktop.resetWallpaper();
    setSettings({ ...nextSettings, wallpaperUrl: nextSettings.wallpaperUrl || defaultWallpaper });
    setUploadStatus('Wallpaper reset');
  };

  const resetSound = async () => {
    if (!desktop) return;
    const nextSettings = await desktop.resetSound();
    setSettings(nextSettings);
    setUploadStatus('Sound reset');
  };

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!settings.soundUrl) {
      soundRef.current = null;
      return;
    }

    soundRef.current = new Audio(settings.soundUrl);
  }, [settings.soundUrl]);

  useEffect(() => {
    if (!desktop) return undefined;

    const removeCommandListener = desktop.onTrayCommand(handleTrayCommand);
    const removeViewListener = desktop.onPopupView(nextView => setView(nextView));

    return () => {
      removeCommandListener();
      removeViewListener();
    };
  }, [handleTrayCommand]);

  useEffect(() => {
    if (!desktop) return;

    desktop.updateTrayTimer({
      isRunning,
      isPaused,
      isBreakTime: mode === 'break',
      timeText
    });
  }, [isPaused, isRunning, mode, timeText]);

  useEffect(() => {
    if (!isRunning || isPaused) return undefined;

    const interval = window.setInterval(() => {
      setRemaining(current => {
        if (current > 1) return current - 1;

        window.setTimeout(() => {
          setMode(previousMode => {
            const nextMode = previousMode === 'pomodoro' ? 'break' : 'pomodoro';
            setRemaining(secondsFromDurations(nextMode, durations) || secondsFromDurations(nextMode, DEFAULT_DURATIONS));
            setIsRunning(true);
            setIsPaused(false);
            playNotificationSound();
            return nextMode;
          });
        }, 0);

        return 0;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [durations, isPaused, isRunning, playNotificationSound]);

  return (
    <main className="app-shell">
      <div
        className={`wallpaper-layer ${shouldUseGrayscale ? 'wallpaper-bw' : ''}`}
        style={{ backgroundImage: `url("${wallpaperUrl}")` }}
      />

      {view === 'settings' ? (
        <section className="panel settings-panel">
          <header className="panel-header">
            <h1>Settings</h1>
            <button type="button" aria-label="Close settings" onClick={() => setView('timer')}>x</button>
          </header>

          <label className="file-field">
            <span>Wallpaper</span>
            <input type="file" accept="image/*" onChange={saveWallpaper} />
          </label>
          <button type="button" onClick={resetWallpaper} disabled={!settings.hasCustomWallpaper}>Reset wallpaper</button>

          <label className="file-field">
            <span>Notification sound</span>
            <input type="file" accept="audio/*" onChange={saveSound} />
          </label>
          <div className="button-row">
            <button type="button" onClick={playNotificationSound}>Test sound</button>
            <button type="button" onClick={resetSound} disabled={!settings.hasCustomSound}>Reset sound</button>
          </div>
          <p className="status-text">{uploadStatus}</p>
        </section>
      ) : (
        <section className="panel timer-panel">
          {!isRunning ? (
            <>
              <div className="mode-switch">
                <button type="button" className={mode === 'pomodoro' ? 'active' : ''} onClick={() => selectMode('pomodoro')}>
                  Pomodoro
                </button>
                <button type="button" className={mode === 'break' ? 'active' : ''} onClick={() => selectMode('break')}>
                  Break
                </button>
              </div>

              {mode === 'pomodoro' ? (
                <div className="time-selector" aria-label="Pomodoro time">
                  <input type="number" min="0" max="23" value={durations.pomodoroHours} onChange={updateDuration('pomodoroHours', 23)} />
                  <span>:</span>
                  <input type="number" min="0" max="59" value={durations.pomodoroMinutes} onChange={updateDuration('pomodoroMinutes', 59)} />
                  <span>:</span>
                  <input type="number" min="0" max="59" value={durations.pomodoroSeconds} onChange={updateDuration('pomodoroSeconds', 59)} />
                </div>
              ) : (
                <div className="time-selector" aria-label="Break time">
                  <input type="number" min="0" max="59" value={durations.breakMinutes} onChange={updateDuration('breakMinutes', 59)} />
                  <span>:</span>
                  <input type="number" min="0" max="59" value={durations.breakSeconds} onChange={updateDuration('breakSeconds', 59)} />
                </div>
              )}

              <button type="button" className="primary-action" onClick={() => startTimer(mode)}>Start</button>
            </>
          ) : (
            <>
              <div className="running-state">{mode === 'break' ? 'Break' : 'Pomodoro'}</div>
              <div className="timer-display">{timeText}</div>
              <div className="button-row">
                {isPaused ? (
                  <button type="button" onClick={unpauseTimer}>Unpause</button>
                ) : (
                  <button type="button" onClick={pauseTimer}>Pause</button>
                )}
                <button type="button" onClick={resetTimer}>Reset</button>
                <button type="button" onClick={switchMode}>{mode === 'break' ? 'Skip' : 'Break'}</button>
                <button type="button" onClick={stopTimer}>Stop</button>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
