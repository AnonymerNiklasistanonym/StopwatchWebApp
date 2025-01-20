// When the DOM is "fully loaded and parsed"
document.addEventListener('DOMContentLoaded', event => {
  const watchDiv = document.querySelector('div#stopwatchWatchDiv')
  const lapsUl = document.querySelector('ul#stopwatchLapsUl')
  const controlsUl = document.querySelector('ul#stopwatchControlsUl')
  const dataControlsUl = document.querySelector('ul#stopwatchDataControlsUl')
  // @ts-ignore
  const stopwatch = new StopwatchApi(watchDiv, { controlsUl, dataControlsUl, lapsUl, keyboardControls: true })
  stopwatch.removeEventListener('start', (startedTime, startedDate) => {
    console.debug('start', `startedTime=${startedTime}<=>${TimeConverter.humanReadableTimeString(startedTime)}`, `startedDate=${startedDate}`)
  })
  stopwatch.removeEventListener('stop', (stoppedTime, stoppedDate) => {
    console.debug('stop', `stoppedTime=${stoppedTime}<=>${TimeConverter.humanReadableTimeString(stoppedTime)}`, `stoppedDate=${stoppedDate}`)
  })
  stopwatch.removeEventListener('restart', () => { console.log('restart') })
  stopwatch.removeEventListener('add_lap', (index, lapTimeInMs) => {
    console.debug('add_lap', `index=${index}`, `lapTime=${lapTimeInMs}<=>${TimeConverter.humanReadableTimeString(lapTimeInMs)}`)
  })
  stopwatch.removeEventListener('remove_lap', (index, lapTimeInMs) => {
    console.debug('remove_lap', `index=${index}`, `lapTime=${lapTimeInMs}<=>${TimeConverter.humanReadableTimeString(lapTimeInMs)}`)
  })
  stopwatch.removeEventListener('clear_laps', () => { console.debug('clear_laps') })
})

// PWA Support if possible (register service worker)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
          .then((registration) => {
              console.log('Service Worker registered successfully with scope:', registration.scope)

              // Listen for updates to the service worker
              registration.onupdatefound = () => {
                  const installingWorker = registration.installing;
                  if (installingWorker) {
                      installingWorker.onstatechange = () => {
                          if (installingWorker.state === 'installed') {
                              if (navigator.serviceWorker.controller) {
                                  console.log('Service Worker detected new content, refresh')
                              }
                          }
                      }
                  }
              }
          })
          .catch((error) => {
              console.error('Service Worker registration failed:', error)
          })
  })
}
