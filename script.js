// When the DOM is "fully loaded and parsed"
document.addEventListener('DOMContentLoaded', event => {
  const watchDiv = document.querySelector('div#stopwatchWatchDiv')
  const lapsUl = document.querySelector('ul#stopwatchLapsUl')
  const controlsUl = document.querySelector('ul#stopwatchControlsUl')
  // @ts-ignore
  const stopwatch = new StopwatchApi(watchDiv, { controlsUl, lapsUl, keyboardControls: true })
  stopwatch.event('start', (startedTime, startedUTCDate) => {
    console.log('start', `startedTime=${startedTime}<=>${TimeConverter.humanReadableTimeString(startedTime)}`,
      `startedUTCDate=${startedUTCDate}`)
  })
  stopwatch.event('stop', (stoppedTime, stoppedUTCDate) => {
    console.log('stop', `stoppedTime=${stoppedTime}<=>${TimeConverter.humanReadableTimeString(stoppedTime)}`,
      `stoppedUTCDate=${stoppedUTCDate}`)
  })
  stopwatch.event('restart', () => { console.log('restart') })
  stopwatch.event('add_lap', (index, lapTime) => {
    console.log('add_lap', `index=${index}`, `lapTime=${lapTime}<=>${TimeConverter.humanReadableTimeString(lapTime)}`)
  })
  stopwatch.event('remove_lap', (index, lapTime) => {
    console.log('remove_lap', `index=${index}`, `lapTime=${lapTime}<=>${TimeConverter.humanReadableTimeString(lapTime)}`)
  })
  stopwatch.event('clear_laps', () => { console.log('clear_laps') })

  /**
   * Stack Overflow solution to download a file with JS:
   * https://stackoverflow.com/a/30800715
   * @author {volzotan} https://stackoverflow.com/users/1472381/volzotan
   * @author {bformet} https://stackoverflow.com/users/1189651/bformet
   * @param {*} exportObj
   * @param {String} exportName
   */
  const downloadObjectAsJson = (exportObj, exportName) => {
    var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj, null, 4))
    var downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute('href', dataStr)
    downloadAnchorNode.setAttribute('download', exportName + '.json')
    document.body.appendChild(downloadAnchorNode) // required for firefox
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  document.addEventListener('keydown', event => {
    // If 'a' is pressed return state as json
    if (event.keyCode === 65) {
      downloadObjectAsJson(stopwatch.state, 'stopwatch_state')
    }
  })
})
