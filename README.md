# StopwatchWebApp

A simple Javascript web app for a stopwatch.

## Features

- Built from scratch (no external dependencies or web requests whatsoever)
- Javascript classes are disconnected from each other and communication is resolved through callback events for better maintainability
- Responsive layout (mobile, tablet, desktop)
- CSS time display instead of a custom font
- Download a `.json` file with the stopped time and laps that contains human readable time strings and the millisecond count to reuse the information
- Click on the stopwatch time or the lap time to copy the displayed time to the clipboard

**Update 2025:**

- Add PWA features (native install, native file sharing, offline mode)

## Display

Open [`index.html`](index.html) with a browser.

## Build favicons

1. Install [`inkscape`](https://inkscape.org/) and run the script [`favicons/createPngFavicons.sh`](favicons/createPngFavicons.sh)
2. Install [`magick`](https://www.imagemagick.org/script/download.php#windows) and run the script [`favicons/createIcoFavicons.sh`](favicons/createIcoFavicons.sh)

## Used resources

- Favicon ([`favicons/favicon.svg`](favicons/favicon.svg)): [material.io](https://material.io/tools/icons/?search=time&icon=timer&style=baseline)
- CSS keyboard keys framework ([`keys.css`](keys.css)): [KEYS.css](https://github.com/michaelhue/keyscss)
