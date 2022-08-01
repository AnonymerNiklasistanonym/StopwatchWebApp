/**
 * Stopwatch api implementation
 */
class StopwatchApi {
  /**
   * Creates an instance of StopwatchHandler.
   * @param {HTMLDivElement} watchDiv 'div' HTML element that should contain the watch
   * @param {{controlsUl: HTMLUListElement, lapsUl: HTMLUListElement, keyboardControls: boolean}} [options]
   */
  constructor (watchDiv, options) {
    // Initialize stopwatch
    this.stopwatch = new Stopwatch()
    // Create html structure for watch
    this.htmlDigitHandler = new HtmlDigitHandler(watchDiv, this.stopwatch)
    // Options
    if (options !== undefined) {
      if (options.controlsUl !== undefined) {
        // Create html structure for watch control / buttons
        this.htmlControlsHandler = new HtmlControlsHandler(options.controlsUl, this.stopwatch, {
          keyBoardListener: options.keyboardControls !== undefined && options.keyboardControls })
      }
      if (options.lapsUl !== undefined) {
        // Create html structure for laps
        this.htmlLapHandler = new HtmlLapHandler(options.lapsUl, this.stopwatch)
      }
    }

    this.paintNow = false
    this.stopwatch.registerEventListener('restart', () => {
      this.htmlDigitHandler.setTime()
    })
    this.stopwatch.registerEventListener('start', () => {
      this.paintNow = true
      this.paint()
    })
    this.stopwatch.registerEventListener('stop', () => {
      this.paintNow = false
      this.htmlDigitHandler.setTime()
    })
  }
  get state () {
    return {
      laps: this.stopwatch.laps.map(timeInMs => ({
        humanReadableTime: TimeConverter.humanReadableTimeString(timeInMs),
        timeInMs
      })),
      time: {
        humanReadableTime: TimeConverter.humanReadableTimeString(this.stopwatch.currentTimeInMs),
        timeInMs: this.stopwatch.currentTimeInMs
      },
      date: {
        start: this.stopwatch.startedDate?.toISOString(),
        stop: this.stopwatch.running ? new Date() : this.stopwatch.stoppedDate?.toISOString()
      }
    }
  }
  paint () {
    if (this.paintNow) {
      this.htmlDigitHandler.setTime()
      window.requestAnimationFrame(this.paint.bind(this))
    }
  }
  /**
   * Register event listener
   * @param {String} eventName
   * @param {Function} callback
   */
  removeEventListener (eventName, callback) {
    this.stopwatch.registerEventListener(eventName, callback)
  }
  /**
   * Remove event listener
   * @param {String} eventName
   * @param {Function} callback
   */
  removeEventListener (eventName, callback) {
    this.stopwatch.removeEventListener(eventName, callback)
  }
}

class HtmlLapHandler {
  /**
   * Creates an instance of HtmlLapHandler.
   * @param {HTMLUListElement} lapsDivElement
   * @param {Stopwatch} stopwatch
   */
  constructor (lapsDivElement, stopwatch) {
    this.lapsDivElement = lapsDivElement
    this.stopwatch = stopwatch
    // Setup HTML document
    this.createLaps()
    // Setup stopwatch connection
    this.stopwatch.registerEventListener('add_lap', this.addLap.bind(this))
    this.stopwatch.registerEventListener('remove_lap', this.removeLap.bind(this))
    this.stopwatch.registerEventListener('clear_laps', this.clearLaps.bind(this))
  }
  /**
   * Create laps in HTML document in specified HTMLUListElement
   */
  createLaps () {
    this.lapsDivElement.id = 'stopwatch_laps_area'
    this.clearLaps()
  }
  /**
   * Add lap
   * @param {Number} index
   * @param {Number} time
   */
  addLap (index, time) {
    const element = document.createElement('li')

    const removeElementOpposite = document.createElement('div')
    removeElementOpposite.className = 'stopwatch-remove-lap-cross-opposite'
    removeElementOpposite.style.display = 'none'

    const lapElement = document.createElement('div')
    lapElement.style.display = 'inline-block'
    lapElement.innerText = index + 1
    const removeElement = document.createElement('div')
    removeElement.className = 'stopwatch-remove-lap-cross'
    removeElement.style.display = 'none'

    const timeElement = document.createElement('time')
    timeElement.innerText = TimeConverter.humanReadableTimeString(time)

    // On click on the digits copy the displayed lap time to the clipboard
    timeElement.addEventListener("click", () => {
      navigator.clipboard.writeText(timeElement.innerText).then(
        () => {
          console.debug("data written to clipboard")
        },
        () => {
          console.error("unable to write data to clipboard")
        }
      )
    })

    const timeContainerElement = document.createElement('div')
    timeContainerElement.className = 'stopwatch_time_container'
    timeContainerElement.appendChild(removeElementOpposite)
    timeContainerElement.appendChild(timeElement)
    timeContainerElement.appendChild(removeElement)

    element.innerText = '#'
    element.appendChild(lapElement)
    element.appendChild(timeContainerElement)
    element.addEventListener('mouseover', () => {
      removeElementOpposite.style.display = 'inline-block'
      removeElement.style.display = 'inline-block'
    })
    element.addEventListener('mouseout', () => {
      removeElementOpposite.style.display = 'none'
      removeElement.style.display = 'none'
    })
    removeElement.addEventListener('click', () => {
      this.stopwatch.removeLap(index)
    })
    this.lapsDivElement.insertBefore(element, this.lapsDivElement.firstChild);
  }
  /**
   * Remove lap
   * @param {Number} index
   */
  removeLap (index) {
    const actualIndex = index + 1
    console.debug(`Remove lap #${actualIndex} (index=${index})`)
    for (const element of this.lapsDivElement.childNodes) {
      if (element.childNodes[1].innerText === `${actualIndex}`) {
        this.lapsDivElement.removeChild(element)
        break
      }
    }
    // Now update the index of all the other children
    let newIndex = this.stopwatch.laps.length
    for (const element of this.lapsDivElement.childNodes) {
      console.debug(`Rename lap #${element.childNodes[1].innerText} to #${newIndex}`)
      element.childNodes[1].innerText = `${newIndex}`
      newIndex--
    }
  }
  /**
   * Remove all laps
   */
  clearLaps () {
    while (this.lapsDivElement.firstChild) {
      this.lapsDivElement.removeChild(this.lapsDivElement.firstChild)
    }
  }
}

class HtmlControlsHandler {
  /**
   * Creates an instance of HtmlControlsHandler.
   * @param {HTMLUListElement} controlsDivElement
   * @param {Stopwatch} stopwatch
   * @param {{keyBoardListener: boolean}} options
   */
  constructor (controlsDivElement, stopwatch, options) {
    this.stopwatch = stopwatch
    this.controlsDivElement = controlsDivElement

    if (options !== undefined) {
      this.addKeyBoardListener = options.keyBoardListener !== undefined && options.keyBoardListener
    } else {
      this.addKeyBoardListener = false
    }

    // Create controls
    this.createControls()
  }
  /**
   * Create controls in HTML document in specified HTMLUListElement
   */
  createControls () {
    while (this.controlsDivElement.firstChild) {
      this.controlsDivElement.removeChild(this.controlsDivElement.firstChild)
    }
    this.controlsDivElement.id = 'stopwatch_controls_area'
    this.controlsDivElement.appendChild(this.getControl('start_stop', 'Start/Stop', 'S',
      () => {
        document.getElementById('start_stop').focus()
        this.stopwatch.isRunning ? this.stopwatch.stop() : this.stopwatch.start()
      }))
    this.controlsDivElement.appendChild(this.getControl('restart', 'Restart', 'R',
      () => {
        document.getElementById('restart').focus()
        this.stopwatch.restart()
      }))
    this.controlsDivElement.appendChild(this.getControl('add_lap', 'Lap', 'L',
      () => {
        document.getElementById('add_lap').focus()
        this.stopwatch.addLap()
      }))
    this.controlsDivElement.appendChild(this.getControl('clear_laps', 'Clear laps', 'C',
      () => {
        document.getElementById('clear_laps').focus()
        this.stopwatch.clearLaps()
      }))
  }
  /**
   * Event listener
   * @param {String} eventName
   * @param {String} title
   * @param {String} keyboardShortcut
   * @param {function} callbackFun
   * @returns {HTMLButtonElement}
   */
  getControl (eventName, title, keyboardShortcut, callbackFun) {
    const controlButton = document.createElement('button')
    controlButton.id = eventName
    const keySymbol = document.createElement('kbd')
    keySymbol.className = 'light'
    keySymbol.innerText = keyboardShortcut
    controlButton.innerText = title
    controlButton.appendChild(keySymbol)

    controlButton.addEventListener('click', event => callbackFun())
    if (this.addKeyBoardListener) {
      this.addKeyDownListener(keyboardShortcut, callbackFun)
    }
    return controlButton
  }
  addKeyDownListener (keyDownUpperCase, callbackFun) {
    document.addEventListener('keydown', event => {
      if (event.key.toUpperCase() === keyDownUpperCase) {
        callbackFun()
      }
    }, false)
  }
}

/**
 * Stopwatch implementation
 */
class Stopwatch {
  /**
   * Creates an instance of Stopwatch.
   */
  constructor () {
    // Declare class variables
    /**
     * The start date
     * @type {Date}
     */
    this.startedDate = undefined
    /**
     * The stop date
     * @type {Date}
     */
    this.stoppedDate = undefined
    /**
     * The start time (high resolution time stamp in ms)
     * @type {DOMHighResTimeStamp}
     */
    this.startedTimeTimeStamp = 0
    /**
     * The stopped time (high resolution time stamp in ms)
     * @type {DOMHighResTimeStamp}
     */
    this.stoppedTimeTimeStamp = 0
    /**
     * The lap times (in ms)
     * @type {number[]}
     */
    this.laps = []
    /**
     * Is the timer currently running
     */
    this.running = false
    // Reset/Initialize watch
    this.reset()
    // Reset event callbacks
    /**
     * Callback that is triggered when a lap was added
     * @param {number} index The index of the added lap
     * @param {number} lapTimeInMs The time of the added lap
     * @type {[(index: number, lapTimeInMs: number) => void]}
     */
    this.callbacksAddLap = []
    /**
     * Callback that is triggered when a lap was removed
     * @param {number} index The index of the removed lap
     * @param {number} lapTimeInMs The time of the removed lap
     * @type {[(index: number, lapTimeInMs: number) => void]}
     */
    this.callbacksRemoveLap = []
    /**
     * Callback that is triggered when laps were cleared
     * @type {[() => void]}
     */
    this.callbacksClearLaps = []
    /**
     * Callback that is triggered when the stopwatch is started
     * @param {DOMHighResTimeStamp} startedTime TODO
     * @param {Date} startedUTCDate TODO
     * @type {[(startedTimeTimeStamp: DOMHighResTimeStamp, startedDate: Date) => void]}
     */
    this.callbacksStart = []
    /**
     * Callback that is triggered when the stopwatch is stopped
     * @param {DOMHighResTimeStamp} stoppedTime TODO
     * @param {Date} stoppedDate TODO
     * @type {[(stoppedTimeTimeStamp: DOMHighResTimeStamp, stoppedDate: Date) => void]}
     */
    this.callbacksStop = []
    /**
     * Callback that is triggered when the stopwatch is restarted
     * @type {[() => void]}
     */
    this.callbacksRestart = []
  }
  /**
   * Get the current time (in ms)
   */
  get currentTimeInMs () {
    return (this.running ? window.performance.now() : this.stoppedTimeTimeStamp) - this.startedTimeTimeStamp
  }
  /**
   * Get the current laps
   */
  get currentLaps () {
    return this.laps
  }
  /**
   * Get if the watch is currently running
   */
  get isRunning () {
    return this.running
  }
  /**
   * Reset and initialize all class variables
   */
  reset () {
    // Rest date
    this.startedDate = undefined
    this.stoppedDate = undefined
    // Reset time
    this.startedTimeTimeStamp = 0
    this.stoppedTimeTimeStamp = 0
    // Reset laps
    this.laps = []
    // Not running
    this.running = false
  }
  /**
   * Start stopwatch
   */
  start () {
    // if the watch isn't already running start it
    if (!this.running) {
      this.running = true
      // Get the current time as a DOMHighResTimeStamp, measured in milliseconds,
      // accurate to five thousandths of a millisecond (5 microseconds)
      // https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
      const startedTimeTimeStamp = window.performance.now()
      this.startedDate = new Date()
      this.startedTimeTimeStamp = startedTimeTimeStamp - (this.stoppedTimeTimeStamp - this.startedTimeTimeStamp)
      // Event listeners
      this.callbacksStart.forEach((callback) => callback(startedTimeTimeStamp, this.startedDate))
    }
  }
  /**
   * Stop stopwatch
   */
  stop () {
    if (this.running) {
      this.running = false
      this.stoppedTimeTimeStamp = window.performance.now()
      this.stoppedDate = new Date()
      // Event listeners
      this.callbacksStop.forEach((callback) => callback(this.stoppedTimeTimeStamp, this.stoppedDate))
    }
  }
  /**
   * Restart stopwatch
   */
  restart () {
    // Reset all variables
    this.reset()
    // Event listeners
    this.callbacksRestart.forEach((callback) => callback())
    // Start stopwatch
    this.start()
  }
  /**
   * Add a lap
   */
  addLap () {
    const currentTime = this.currentTimeInMs
    // Don't add laps if the current time is 0
    if (currentTime === 0) {
      console.debug("Don't add lap because the current time is 0")
      return
    }
    // Don't add laps if the time is the same as last lap time
    if (this.laps.length > 0 && currentTime === this.laps[this.laps.length - 1]) {
      console.debug("Don't add lap because the current time is the same as the last lap time")
      return
    }
    const indexOfNewLap = this.laps.push(currentTime)
    // Event listeners
    this.callbacksAddLap.forEach((callback) => callback(indexOfNewLap - 1, currentTime))
  }
  /**
   * Remove a lap
   * @param {number} index of lap that should be removed
   */
  removeLap (index) {
    const deletedLapTimeInMs = this.laps.splice(index, 1)
    // Event listeners
    this.callbacksRemoveLap.forEach((callback) => callback(index, deletedLapTimeInMs))
  }
  /**
   * Clear all laps
   */
  clearLaps () {
    this.laps = []
    // Event listeners
    this.callbacksClearLaps.forEach((callback) => callback())
  }
  /**
   * Register an event listener
   * @param {String} eventName The name of the event
   * @param {Function} callback The callback method that should be registered
   */
  registerEventListener (eventName, callback) {
    switch (eventName) {
      case 'start':
        this.callbacksStart.push(callback)
        break
      case 'stop':
        this.callbacksStop.push(callback)
        break
      case 'restart':
        this.callbacksRestart.push(callback)
        break
      case 'add_lap':
        this.callbacksAddLap.push(callback)
        break
      case 'remove_lap':
        this.callbacksRemoveLap.push(callback)
        break
      case 'clear_laps':
        this.callbacksClearLaps.push(callback)
        break
      default:
        console.error(`The event '${eventName}' does not exist!`)
        break
    }
  }
  /**
   * Remove an event listener
   * @param {String} eventName The name of the event
   * @param {Function} callback The callback method that should be removed
   */
  removeEventListener (eventName, callback) {
    switch (eventName) {
      case 'start':
        if (this.callbacksStart.indexOf(callback) > -1) {
          this.callbacksStart.splice(this.callbacksStart.indexOf(callback), 1)
        }
        break
      case 'stop':
        if (this.callbacksStop.indexOf(callback) > -1) {
          this.callbacksStop.splice(this.callbacksStop.indexOf(callback), 1)
        }
        break
      case 'restart':
        if (this.callbacksRestart.indexOf(callback) > -1) {
          this.callbacksRestart.splice(this.callbacksRestart.indexOf(callback), 1)
        }
        break
      case 'add_lap':
        if (this.callbacksAddLap.indexOf(callback) > -1) {
          this.callbacksAddLap.splice(this.callbacksAddLap.indexOf(callback), 1)
        }
        break
      case 'remove_lap':
        if (this.callbacksRemoveLap.indexOf(callback) > -1) {
          this.callbacksRemoveLap.splice(this.callbacksRemoveLap.indexOf(callback), 1)
        }
        break
      case 'clear_laps':
        if (this.callbacksClearLaps.indexOf(callback) > -1) {
          this.callbacksClearLaps.splice(this.callbacksClearLaps.indexOf(callback), 1)
        }
        break
      default:
        console.error(`The event '${eventName}' does not exist!`)
        break
    }
  }
}

class HtmlDigitHandler {
  /**
   * @param {HTMLDivElement} watchDivElement
   * @param {Stopwatch} stopwatch
   */
  constructor (watchDivElement, stopwatch) {
    this.watchDivElement = watchDivElement
    this.createDigits()
    this.stopwatch = stopwatch
    this.setTime()
  }
  setTime () {
    const timeNumberStrings = TimeConverter.humanReadableTimeNumberString(this.stopwatch.currentTimeInMs)
    for (let index = 0; index < 2; index++) {
      const tempElement = document.getElementById('hour' + index)
      tempElement.classList.remove(...TimeConverter.timeDigitStringMap)
      tempElement.classList.add(timeNumberStrings[0][index])
    }
    for (let index = 0; index < 2; index++) {
      const tempElement = document.getElementById('minute' + index)
      tempElement.classList.remove(...TimeConverter.timeDigitStringMap)
      tempElement.classList.add(timeNumberStrings[1][index])
    }
    for (let index = 0; index < 2; index++) {
      const tempElement = document.getElementById('second' + index)
      tempElement.classList.remove(...TimeConverter.timeDigitStringMap)
      tempElement.classList.add(timeNumberStrings[2][index])
    }
    for (let index = 0; index < 3; index++) {
      const tempElement = document.getElementById('millisecond' + index)
      tempElement.classList.remove(...TimeConverter.timeDigitStringMap)
      tempElement.classList.add(timeNumberStrings[3][index])
    }
  }
  /**
   * @returns {HTMLDivElement}
   */
  getDivider () {
    const node = document.createElement('div')
    node.className = 'stopwatch_digits_divider'
    for (let index = 0; index < 2; index++) {
      const element = document.createElement('span')
      element.className = 'stopwatch_digits_divider_' + index
      node.appendChild(element)
    }
    return node
  }
  /**
   * Get a digit
   * @param {String} digitId Id of digit
   * @returns {HTMLDivElement}
   */
  getDigit (digitId) {
    const node = document.createElement('div')
    node.id = digitId
    node.className = 'stopwatch_digits_element'
    for (let index = 0; index < 7; index++) {
      const element = document.createElement('span')
      element.className = 'stopwatch_digits_element_' + index
      node.appendChild(element)
    }
    return node
  }
  /**
   * Clears the area and creates stopwatch digits
   */
  createDigits () {
    while (this.watchDivElement.firstChild) {
      this.watchDivElement.removeChild(this.watchDivElement.firstChild)
    }
    this.watchDivElement.id = 'stopwatch_digits_area'
    for (let index = 0; index < 2; index++) {
      this.watchDivElement.appendChild(this.getDigit('hour' + index))
    }
    this.watchDivElement.appendChild(this.getDivider())
    for (let index = 0; index < 2; index++) {
      this.watchDivElement.appendChild(this.getDigit('minute' + index))
    }
    this.watchDivElement.appendChild(this.getDivider())
    for (let index = 0; index < 2; index++) {
      this.watchDivElement.appendChild(this.getDigit('second' + index))
    }
    this.watchDivElement.appendChild(this.getDivider())
    for (let index = 0; index < 3; index++) {
      this.watchDivElement.appendChild(this.getDigit('millisecond' + index))
    }

    // On click on the digits copy the current displayed time to the clipboard
    this.watchDivElement.addEventListener("click", () => {
      const text = Array.from(this.watchDivElement.children)
        .map(a => Array.from(a.classList).filter(a => a !== "stopwatch_digits_element"))
        .flat()
        .map(a => {
          switch (a) {
            case "stopwatch_digits_divider":
              return ":"
            case "zero":
              return "0"
            case "one":
              return "1"
            case "two":
              return "2"
            case "three":
              return "3"
            case "four":
              return "4"
            case "five":
              return "5"
            case "six":
              return "6"
            case "seven":
              return "7"
            case "eight":
              return "8"
            case "nine":
              return "9"
          }
        })
        .join("")
      navigator.clipboard.writeText(text).then(
        () => {
          console.debug("data written to clipboard")
        },
        () => {
          console.error("unable to write data to clipboard")
        }
      )
    })
  }
}

/**
 * Stopwatch handler implementation
 */
class TimeConverter {
  /**
   * Time digit strings
   */
  static get timeDigitStringMap () {
    return ['zero', 'one', 'two', 'three', 'four', 'five',
      'six', 'seven', 'eight', 'nine'
    ]
  }
  /**
   * Convert time to human readable time string array
   * @param {Number} time in milliseconds
   * @returns {String} time
   */
  static humanReadableTimeString (time) {
    return this.humanReadableTimeDigits(time).map(digits =>
      digits.join('')).join(':')
  }
  /**
   * Convert time to human readable time
   * @param {Number} time in milliseconds
   * @returns {Number[]} time
   */
  static humanReadableTime (time) {
    const h = Math.trunc(((time / 1000) / 60) / 60)
    const min = Math.trunc(((time / 1000) / 60) % 60)
    const sec = Math.trunc((time / 1000) % 60)
    const millisec = Math.trunc(time % 1000)
    return [h, min, sec, millisec]
  }
  /**
   * Convert time to human readable time string array
   * @param {Number} timeInMs in milliseconds
   * @returns {Number[][]} time
   */
  static humanReadableTimeDigits (timeInMs) {
    const timeNumbers = this.humanReadableTime(timeInMs)
    const padTime = (timeNumber, digits = 2) => ('0'.repeat(digits) + timeNumber).slice(-digits)
    const convertStringToDigits = digitsString => digitsString.split('')
    return [convertStringToDigits(padTime(timeNumbers[0])),
      convertStringToDigits(padTime(timeNumbers[1])),
      convertStringToDigits(padTime(timeNumbers[2])),
      convertStringToDigits(padTime(timeNumbers[3], 3))
    ]
  }
  /**
   * Convert time to human readable time string array
   * @param {Number} timeInMs in milliseconds
   * @returns {String[][]} time
   */
  static humanReadableTimeNumberString (timeInMs) {
    return this.humanReadableTimeDigits(timeInMs).map(digits =>
      digits.map(digit => this.timeDigitStringMap[digit]))
  }
}
