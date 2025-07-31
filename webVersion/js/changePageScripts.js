(function() {
  const overlay = document.createElement('div');
  overlay.className = 'bg-overlay';
  overlay.id = 'bgOverlay';
  document.body.prepend(overlay);
})();

function setOverlayBg(mode) {
  const overlay = document.getElementById('bgOverlay');
  if (!overlay) return;
  if (mode === 'colored') {
    overlay.classList.remove('bw-mode');
  } else {
    overlay.classList.add('bw-mode');
  }
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
    setOverlayBg('bw');
}

function changeToInitialView(){
    fullscreenTimer.style.display = "none";
    timerSelector.style.display = "flex";
    setOverlayBg('colored');
}