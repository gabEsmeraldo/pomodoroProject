let timer;
let totalSeconds;
let isPaused = false;
let isRunning = false;
let isBreakTime = false;
let originalTime;

const startButton = document.getElementById("startButton"),
      pauseButton = document.getElementById("pauseButton"),
      unpauseButton = document.getElementById("unpauseButton"),
      resetButton = document.getElementById("resetButton"),
      breakButton = document.getElementById("breakButton"),
      skipButton = document.getElementById("skipButton"),
      stopButton = document.getElementById("stopButton"),
      counterDiv = document.getElementById("timerDisplay");

const pomodoroHoursSelector = document.getElementById('pomodoroHoursSelector');
const pomodoroMinutesSelector = document.getElementById('pomodoroMinutesSelector');
const pomodoroSecondsSelector = document.getElementById('pomodoroSecondsSelector');
const breakMinutesSelector = document.getElementById('breakMinutesSelector');
const breakSecondsSelector = document.getElementById('breakSecondsSelector');

startButton.addEventListener('click', start);
pauseButton.addEventListener('click', pause);
unpauseButton.addEventListener('click', unpause);
resetButton.addEventListener('click', reset);
stopButton.addEventListener('click', stop);
breakButton.addEventListener('click', skip);
skipButton.addEventListener('click', skipToPomodoro);

disable(pauseButton);
disable(unpauseButton);
disable(resetButton);
disable(stopButton);
disable(breakButton);
disable(skipButton);

function getHours(totalSeconds) {
  return Math.floor(totalSeconds / 3600);
}

function getMinutes(totalSeconds) {
  return Math.floor((totalSeconds % 3600) / 60);
}

function getSeconds(totalSeconds) {
  let seconds = totalSeconds % 60;
  return (seconds < 10 ? "0" + seconds : seconds);
}

function formatTime(totalSeconds) {
  const hours = getHours(totalSeconds);
  const minutes = getMinutes(totalSeconds);
  const seconds = getSeconds(totalSeconds);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function clampInputToMax(input, max) {
  input.addEventListener('input', function() {
    let val = parseInt(this.value);
    if (!isNaN(val) && val > max) {
      this.value = max;
    }
    if (val < 0) {
      this.value = 0;
    }
  });
}
if (pomodoroHoursSelector) clampInputToMax(pomodoroHoursSelector, 23);
if (pomodoroMinutesSelector) clampInputToMax(pomodoroMinutesSelector, 59);
if (pomodoroSecondsSelector) clampInputToMax(pomodoroSecondsSelector, 59);
if (breakMinutesSelector) clampInputToMax(breakMinutesSelector, 59);
if (breakSecondsSelector) clampInputToMax(breakSecondsSelector, 59);

function start() {
  changeToFullscreenTimer();
  
  if (!isBreakTime) {
    let hours = parseInt(pomodoroHoursSelector?.value) || 0;
    let minutes = parseInt(pomodoroMinutesSelector?.value) || 0;
    let seconds = parseInt(pomodoroSecondsSelector?.value) || 0;
    hours = clamp(hours, 0, 23);
    minutes = clamp(minutes, 0, 59);
    seconds = clamp(seconds, 0, 59);
    totalSeconds = hours * 3600 + minutes * 60 + seconds;
  } else {
    let minutes = parseInt(breakMinutesSelector?.value) || 0;
    let seconds = parseInt(breakSecondsSelector?.value) || 0;
    minutes = clamp(minutes, 0, 59);
    seconds = clamp(seconds, 0, 59);
    totalSeconds = minutes * 60 + seconds;
  }
  
  originalTime = totalSeconds;
  isRunning = true;
  isPaused = false;
  
  counterDiv.innerHTML = formatTime(totalSeconds);
  disable(startButton);
  enable(pauseButton);
  enable(resetButton);
  
  if (!isBreakTime) {
    enable(breakButton);
    disable(skipButton);
  } else {
    disable(breakButton);
    enable(skipButton);
  }
  
  disable(unpauseButton);
  disable(stopButton);
  
  setOverlayBg('bw');
  updateButtonStates();
  run();
}

function run() {
  timer = setInterval(tick, 1000);
}

function tick() {
  if (totalSeconds > 0) {
    totalSeconds--;
    counterDiv.innerHTML = formatTime(totalSeconds);
  } else {
    clearInterval(timer);
    isRunning = false;
    
    if (!isBreakTime) {
      isBreakTime = true;
      start();
    } else {
      isBreakTime = false;
      start();
    }
  }
}

function pause() {
  if (isRunning && !isPaused) {
    clearInterval(timer);
    isPaused = true;
    isRunning = false;
    setOverlayBg('colored');
    updateButtonStates();
  }
}

function unpause() {
  if (isPaused) {
    isPaused = false;
    isRunning = true;
    setOverlayBg('bw');
    updateButtonStates();
    run();
  }
}

function reset() {
  clearInterval(timer);
  isRunning = false;
  isPaused = false;
  
  if (!isBreakTime) {
    let hours = parseInt(pomodoroHoursSelector?.value) || 0;
    let minutes = parseInt(pomodoroMinutesSelector?.value) || 0;
    let seconds = parseInt(pomodoroSecondsSelector?.value) || 0;
    hours = clamp(hours, 0, 23);
    minutes = clamp(minutes, 0, 59);
    seconds = clamp(seconds, 0, 59);
    totalSeconds = hours * 3600 + minutes * 60 + seconds;
  } else {
    let minutes = parseInt(breakMinutesSelector?.value) || 0;
    let seconds = parseInt(breakSecondsSelector?.value) || 0;
    minutes = clamp(minutes, 0, 59);
    seconds = clamp(seconds, 0, 59);
    totalSeconds = minutes * 60 + seconds;
  }
  
  originalTime = totalSeconds;
  counterDiv.innerHTML = formatTime(totalSeconds);
  
  isRunning = true;
  isPaused = false;
  
  disable(startButton);
  enable(pauseButton);
  enable(resetButton);
  
  if (!isBreakTime) {
    enable(breakButton);
    disable(skipButton);
  } else {
    disable(breakButton);
    enable(skipButton);
  }
  
  disable(unpauseButton);
  disable(stopButton);
  
  setOverlayBg('bw');
  updateButtonStates();
  run();
}

function stop() {
  clearInterval(timer);
  isRunning = false;
  isPaused = false;
  isBreakTime = false;
  changeToInitialView();
  if (typeof changeToPomodoro === 'function') changeToPomodoro();
  enable(startButton);
  disable(pauseButton);
  disable(unpauseButton);
  disable(resetButton);
  disable(stopButton);
  disable(breakButton);
  disable(skipButton);

  if (pomodoroHoursSelector) pomodoroHoursSelector.value = '';
  if (pomodoroMinutesSelector) pomodoroMinutesSelector.value = '';
  if (pomodoroSecondsSelector) pomodoroSecondsSelector.value = '';
  if (breakMinutesSelector) breakMinutesSelector.value = '';
  if (breakSecondsSelector) breakSecondsSelector.value = '';
}

function skip() {
  clearInterval(timer);
  isRunning = false;
  isPaused = false;
  
  isBreakTime = !isBreakTime;
  
  setOverlayBg('bw');
  start();
}

function skipToPomodoro() {
  clearInterval(timer);
  isRunning = false;
  isPaused = false;
  isBreakTime = false;
  setOverlayBg('bw');
  start();
}

function disable(element) {
  element.style.display = "none";
}

function enable(element) {
  element.style.display = "inline-block";
}

function updateButtonStates() {
  enable(resetButton);
  if (isRunning && !isPaused) {
    enable(pauseButton);
    disable(unpauseButton);
    disable(stopButton);
  } else if (isPaused) {
    disable(pauseButton);
    enable(unpauseButton);
    enable(stopButton);
  } else {
    enable(pauseButton);
    disable(unpauseButton);
    disable(stopButton);
  }
  if (!isBreakTime) {
    enable(breakButton);
    disable(skipButton);
  } else {
    disable(breakButton);
    enable(skipButton);
  }
}