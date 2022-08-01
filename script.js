// When the DOM is "fully loaded and parsed"
document.addEventListener('DOMContentLoaded', event => {
  const watchDiv = document.querySelector('div#stopwatchWatchDiv')
  const lapsUl = document.querySelector('ul#stopwatchLapsUl')
  const controlsUl = document.querySelector('ul#stopwatchControlsUl')
  // @ts-ignore
  const stopwatch = new StopwatchApi(watchDiv, { controlsUl, lapsUl, keyboardControls: true })
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

  /**
   * Stack Overflow solution to download a file with JS:
   * https://stackoverflow.com/a/30800715
   * @author {volzotan} https://stackoverflow.com/users/1472381/volzotan
   * @author {bformet} https://stackoverflow.com/users/1189651/bformet
   * @param {*} exportObj
   * @param {String} exportName
   */
  const downloadObjectAsJson = (exportObj, exportName) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj, null, 4))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute('href', dataStr)
    downloadAnchorNode.setAttribute('download', exportName + '.json')
    document.body.appendChild(downloadAnchorNode) // required for firefox
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  document.addEventListener('keydown', event => {
    // If 'a' is pressed return state as json
    if (event.key === "a") {
      downloadObjectAsJson(stopwatch.state, 'stopwatch_state')
    }
  })
})
