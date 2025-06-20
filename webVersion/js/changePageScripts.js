const pomodoroTimerSelector = document.getElementById("timerPomodoro");
const breakTimerSelector = document.getElementById("timerBreak");
const timerSelector = document.getElementById("selector");
const fullscreenTimer = document.getElementById("fullScreenTimer");


function changeToBreak(){
    pomodoroTimerSelector.style.display = "none";
    breakTimerSelector.style.display = "block";
    console.log("changeToBreak called");
}

function changeToPomodoro(){
    breakTimerSelector.style.display = "none";
    pomodoroTimerSelector.style.display = "block";
    console.log("changeToPomodoro called");
}

function changeToFullscreenTimer(){
    timerSelector.style.display = "none";
    fullscreenTimer.style.display = "block";
    console.log("changeToFullscreenTimer called");
}