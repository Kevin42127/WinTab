# WinTab

A Windows 10 style new tab extension for Chrome with clock, search, shortcuts and start menu.

## Features

- **Clock** - Large font time and date display (Windows 10 lock screen style)
- **Search** - Google search with direct URL support
- **Shortcuts** - Tile-based shortcut grid with add/delete functionality
- **Start Menu** - Windows button with quick links to Extensions, Settings, Downloads, History, Bookmarks
- **Taskbar** - Bottom taskbar with start button
- **Notifications** - Windows 10 Toast style notifications

## Installation

1. Download or clone this project
2. Open Chrome browser
3. Go to `chrome://extensions/`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked"
6. Select the project folder

## Usage

- **Search** - Type in the search bar, press Enter to search via Google
- **Shortcuts** - Click tiles to open websites, hover to see delete button
- **Add Shortcut** - Click the "+" button to add a new shortcut
- **Start Menu** - Click the Windows icon on the taskbar

## Tech Stack

- Chrome Manifest V3
- Vanilla JavaScript (ES6+)
- CSS3 with Fluent Design
- Chrome Storage API

## Permissions

- `storage` - Save user settings and shortcuts
- `topSites` - Load most visited sites as default shortcuts
- `identity` - Detect user profile info

## File Structure

```
├── manifest.json      # Extension config
├── newtab.html        # New tab page
├── newtab.css         # Styles
├── newtab.js          # Main logic
├── background.js      # Service worker
├── icons/             # Icons
└── README.md          # Documentation
```

## Changelog

### v1.0.0
- Initial release
- Windows 10 Fluent Design dark theme
- Clock and date display
- Google search
- Shortcut tiles with add/delete
- Start menu with navigation
- Taskbar
- Toast notifications
- Responsive design

## License

MIT License
