// Global variables for timer state
let timer;
let totalSeconds;
let isPaused = false;
let isRunning = false;
let isBreakTime = false;
let originalTime;

// Defines identifiers for accessing HTML elements
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

// Adds listeners
startButton.addEventListener('click', start);
pauseButton.addEventListener('click', pause);
unpauseButton.addEventListener('click', unpause);
resetButton.addEventListener('click', reset);
stopButton.addEventListener('click', stop);
breakButton.addEventListener('click', skip);
skipButton.addEventListener('click', skipToPomodoro);

// Initialize button states
disable(pauseButton);
disable(unpauseButton);
disable(resetButton);
disable(stopButton);
disable(breakButton);
disable(skipButton);

// Defines functions that get time for display
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

// Clamp input fields live so user cannot enter above max
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

// Defines functions that manipulate the countdown
function start() {
  console.log("Starting timer");
  changeToFullscreenTimer();
  
  // Set initial time based on current mode (pomodoro or break)
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
  
  // Update display and button states
  counterDiv.innerHTML = formatTime(totalSeconds);
  disable(startButton);
  enable(pauseButton);
  enable(resetButton);
  
  // Only show break button when in pomodoro mode
  if (!isBreakTime) {
    enable(breakButton);
    disable(skipButton);
  } else {
    disable(breakButton);
    enable(skipButton);
  }
  
  disable(unpauseButton);
  disable(stopButton);
  
  setOverlayBg('bw'); // Set background to black and white when timer starts
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
    // Timer finished
    clearInterval(timer);
    isRunning = false;
    console.log("Timer finished!");
    
    // Switch to break time or back to pomodoro
    if (!isBreakTime) {
      isBreakTime = true;
      console.log("Pomodoro finished, starting break");
      start(); // Start break timer
    } else {
      isBreakTime = false;
      console.log("Break finished, starting pomodoro");
      start(); // Start pomodoro timer
    }
  }
}

function pause() {
  if (isRunning && !isPaused) {
    clearInterval(timer);
    isPaused = true;
    isRunning = false;
    setOverlayBg('colored'); // Set background to colored when paused
    updateButtonStates();
    console.log("Timer paused");
  }
}

function unpause() {
  if (isPaused) {
    isPaused = false;
    isRunning = true;
    setOverlayBg('bw'); // Set background back to black and white when unpaused
    updateButtonStates();
    run();
    console.log("Timer unpaused");
  }
}

function reset() {
  clearInterval(timer);
  isRunning = false;
  isPaused = false;
  
  // Reset to original time for current mode (pomodoro or break)
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
  
  // Auto-start the timer after reset
  isRunning = true;
  isPaused = false;
  
  // Update button states for running timer
  disable(startButton);
  enable(pauseButton);
  enable(resetButton);
  
  // Only show break button when in pomodoro mode
  if (!isBreakTime) {
    enable(breakButton);
    disable(skipButton);
  } else {
    disable(breakButton);
    enable(skipButton);
  }
  
  disable(unpauseButton);
  disable(stopButton);
  
  // Start the countdown
  setOverlayBg('bw'); // Set background to black and white when timer is running
  updateButtonStates();
  run();
  
  console.log("Timer reset and auto-started");
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

  // Clear all input fields
  if (pomodoroHoursSelector) pomodoroHoursSelector.value = '';
  if (pomodoroMinutesSelector) pomodoroMinutesSelector.value = '';
  if (pomodoroSecondsSelector) pomodoroSecondsSelector.value = '';
  if (breakMinutesSelector) breakMinutesSelector.value = '';
  if (breakSecondsSelector) breakSecondsSelector.value = '';

  console.log("Timer stopped");
}

function skip() {
  clearInterval(timer);
  isRunning = false;
  isPaused = false;
  
  // Switch between pomodoro and break
  isBreakTime = !isBreakTime;
  
  if (isBreakTime) {
    console.log("Skipping to break");
  } else {
    console.log("Skipping to pomodoro");
  }
  
  setOverlayBg('bw'); // Set background to black and white when skipping to new timer
  start(); // Start the new timer
}

function skipToPomodoro() {
  clearInterval(timer);
  isRunning = false;
  isPaused = false;
  isBreakTime = false;
  setOverlayBg('bw'); // Set background to black and white when skipping to pomodoro
  // Start pomodoro timer immediately
  start();
  console.log("Skipped break, starting pomodoro");
}

// Defines functions to disable and re-enable HTML elements
function disable(element) {
  element.style.display = "none";
}

function enable(element) {
  element.style.display = "inline-block";
}

function updateButtonStates() {
  // Always enable reset
  enable(resetButton);
  // Pause/Unpause logic
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
  // Show break button only in pomodoro mode
  if (!isBreakTime) {
    enable(breakButton);
    disable(skipButton);
  } else {
    disable(breakButton);
    enable(skipButton);
  }
}