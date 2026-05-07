# Pomodoro Tray Desktop

Desktop tray version of the Pomodoro app.

## Commands

```bash
npm install
npm run dev
npm run dist:win
```

`npm run dist:win` builds a portable Windows `.exe` in `desktopVersion/dist/`.

## Behavior

- The app starts as a tray icon instead of a normal taskbar window.
- Left-click the tray icon to open or hide the timer popup.
- Right-click the tray icon to open settings and timer actions.
- The popup uses the default Monterey wallpaper, or the saved custom wallpaper.
- Pomodoro running state applies a black-and-white filter to the wallpaper.
- Break, paused, stopped, and initial states keep the wallpaper colored.
