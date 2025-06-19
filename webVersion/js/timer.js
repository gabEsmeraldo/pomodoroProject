function startTimer(hours, minutes, seconds) {
    console.log("Starting timer with " + hours + "h " + minutes + "m " + seconds + "s");
    var totalTimePomodoro = (parseInt(hours*3600)) + (parseInt(minutes*60)) + parseInt(seconds);
    var timer = setInterval(function() {
        let hours = Math.floor((totalTimePomodoro / 3600));
        let minutes = Math.floor(((totalTimePomodoro % 3600) / 60));
        let seconds = Math.floor((totalTimePomodoro % 3600) % 60);

        console.log(hours + "h " + minutes + "m " + seconds + "s ");
        console.log(totalTimePomodoro)
        totalTimePomodoro = totalTimePomodoro - 1;
        if (totalTimePomodoro <= 0) {
            clearInterval(timer);
            console.log("Timer finished!");
        }
    }, 1000);
}