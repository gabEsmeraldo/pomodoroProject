// Basic timer function
function startTimer(hours, minutes, seconds) {
    if(hours <= 0 && minutes <= 0 && seconds <= 0) {
        console.log("Timer set to 0, nothing to do.");
        return;
    }else if(hours > 23 || minutes > 59 || seconds > 59) {
        console.log("Invalid timer values. Please ensure hours are <= 23, minutes and seconds are <= 59.");
        return;
    }
    console.log("Starting timer with " + hours + "h " + minutes + "m " + seconds + "s");
    var totalTimePomodoro = (parseInt(hours*3600)) + (parseInt(minutes*60)) + parseInt(seconds);
    var timer = setInterval(function() {
        let hours = Math.floor((totalTimePomodoro / 3600));
        let minutes = Math.floor(((totalTimePomodoro % 3600) / 60));
        let seconds = Math.floor((totalTimePomodoro % 3600) % 60);

        updateTimerDisplay(hours, minutes, seconds);
        
        console.log(totalTimePomodoro)
        totalTimePomodoro = totalTimePomodoro - 1;
        if (totalTimePomodoro < 0) {
            clearInterval(timer);
            console.log("Timer finished!");
        }
    }, 1000);
}

// This function starts the pomodoro timer and sets up the break timer
function startPomodoroTimer(pomHours, pomMinutes, pomSeconds, breakMinutes, breakSeconds) {
    if (pomHours <= 0 && pomMinutes <= 0 && pomSeconds <= 0 && breakMinutes <= 0 && breakSeconds <= 0) {
        console.log("Invalid timer values. All values must be higher than 0.");
        //selectTimePopup();
        return;
    }else if (pomHours > 23 || pomMinutes > 59 || pomSeconds > 59 || breakMinutes > 59 || breakSeconds > 59) {
        console.log("Invalid timer values. Please ensure hours are <= 23, minutes and seconds are <= 59.");
        //selectTimePopup();
        return;
    }
    // console.log("Starting pomodoro timer with " + pomHours + "h " + pomMinutes + "m " + pomSeconds + "s");
    changeToFullscreenTimer();
    startTimer(pomHours, pomMinutes, pomSeconds);
    // Change to fullscreen timer view
    setTimeout(function() {
        startBreakTimer(breakMinutes, breakSeconds);
    }, (pomHours * 3600 + pomMinutes * 60 + pomSeconds) * 1000);
}

// This function starts the break timer and sets up the next pomodoro timer
function startBreakTimer(breakMinutes, breakSeconds) {
    console.log("Starting break timer with " + breakMinutes + "m " + breakSeconds + "s");
    startTimer(0, breakMinutes, breakSeconds);
    setTimeout(function() {
        console.log("Break finished!");
        startPomodoroTimer(pomodoroHours, pomodoroMinutes, pomodoroSeconds, breakMinutes, breakSeconds);
    }, (breakMinutes * 60 + breakSeconds) * 1000);
}

function updateTimerDisplay(hours, minutes, seconds) {
    let hoursFormated = (hours < 10 ? "0" + hours : hours);
    let minutesFormated = (minutes < 10 ? "0" + minutes : minutes);
    let secondsFormated = (seconds < 10 ? "0" + seconds : seconds);
    document.getElementById("timerDisplay").innerHTML = (hoursFormated + ":" + minutesFormated + ":" + secondsFormated);
}
