pomodoroHoursSelector.addEventListener('change', () => {
    pomodoroHours = pomodoroHoursSelector.value;
    console.log(`Pomodoro hours updated to: ${pomodoroHours}`);
});
pomodoroMinutesSelector.addEventListener('change', () => {
    pomodoroMinutes = pomodoroMinutesSelector.value;
});
pomodoroSecondsSelector.addEventListener('change', () => {
    pomodoroSeconds = pomodoroSecondsSelector.value;
});
breakMinutesSelector.addEventListener('change', () => {
    breakMinutes = breakMinutesSelector.value;
});
breakSecondsSelector.addEventListener('change', () => { 
    breakSeconds = breakSecondsSelector.value;
});