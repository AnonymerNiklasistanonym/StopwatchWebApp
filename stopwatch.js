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
    this.stopwatch.event('restart', () => {
      this.htmlDigitHandler.setTime()
    })
    this.stopwatch.event('start', () => {
      this.paintNow = true
      this.paint()
    })
    this.stopwatch.event('stop', () => {
      this.paintNow = false
      this.htmlDigitHandler.setTime()
    })
  }
  get state () {
    return {
      laps: this.stopwatch.laps.map(time => ({
        humanReadableTime: TimeConverter.humanReadableTimeString(time),
        time
      })),
      time: {
        humanReadableTime: TimeConverter.humanReadableTimeString(this.stopwatch.currentTime),
        time: this.stopwatch.currentTime
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
   * Event listener
   * @param {String} eventName
   * @param {function(...*): *} callback
   */
  event (eventName, callback) {
    this.stopwatch.eventPublic(eventName, callback)
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
    this.lapCounter = 0
    this.lastLapTime = 0
    this.stopwatch = stopwatch
    // Setup HTML document
    this.createLaps()
    // Setup stopwatch connection
    this.stopwatch.event('add_lap', this.addLap.bind(this))
    this.stopwatch.event('remove_lap', this.removeLap.bind(this))
    this.stopwatch.event('clear_laps', this.clearLaps.bind(this))
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
    if (this.lastLapTime === time) {
      return
    }
    this.lastLapTime = time
    this.lapCounter += 1
    const element = document.createElement('li')

    const removeElementOpposite = document.createElement('div')
    removeElementOpposite.className = 'stopwatch-remove-lap-cross-opposite'
    removeElementOpposite.style.display = 'none'

    const lapElement = document.createElement('div')
    lapElement.style.display = 'inline-block'
    lapElement.innerText = '' + this.lapCounter
    const removeElement = document.createElement('div')
    removeElement.className = 'stopwatch-remove-lap-cross'
    removeElement.style.display = 'none'

    const timeElement = document.createElement('time')
    timeElement.innerText = TimeConverter.humanReadableTimeString(time)

    const timeContainerElement = document.createElement('div')
    timeContainerElement.className = 'stopwatch_time_container'
    timeContainerElement.innerHTML = removeElementOpposite.outerHTML + timeElement.outerHTML + removeElement.outerHTML

    element.innerHTML = '#' + lapElement.outerHTML + ' ' + timeContainerElement.outerHTML
    element.addEventListener('mouseover', event => {
      element.childNodes[3].childNodes[0].style.display = 'inline-block'
      element.childNodes[3].childNodes[2].style.display = 'inline-block'
    })
    element.addEventListener('mouseout', event => {
      element.childNodes[3].childNodes[0].style.display = 'none'
      element.childNodes[3].childNodes[2].style.display = 'none'
    })
    element.childNodes[3].childNodes[2].addEventListener('click', event => {
      this.stopwatch.removeLap(Number(element.childNodes[1].innerText) - 1)
    })
    this.lapsDivElement.appendChild(element)
  }
  /**
   * Remove lap
   * @param {Number} index
   */
  removeLap (index) {
    this.lapsDivElement.removeChild(this.lapsDivElement.childNodes[index])
    this.lapCounter = this.lapsDivElement.childElementCount
    for (let index = 0; index < this.lapCounter; index++) {
      const element = this.lapsDivElement.childNodes[index]
      element.childNodes[1].innerText = index + 1
    }
  }
  /**
   * Remove all laps
   */
  clearLaps () {
    this.lapCounter = 0
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
    controlButton.innerHTML = title + '  ' + keySymbol.outerHTML

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
    // Reset/Initialize watch
    this.reset()
    // Reset event callbacks
    this.callbackAddLap = (index, lapTime) => {}
    this.callbackRemoveLap = (index, lapTime) => {}
    this.callbackClearLaps = () => {}
    this.callbackStart = (startedTime, startedUTCDate) => {}
    this.callbackStop = (stoppedTime, stoppedUTCDate) => {}
    this.callbackRestart = () => {}
    // Reset public event callbacks
    this.callbackPublicAddLap = this.callbackAddLap
    this.callbackPublicRemoveLap = this.callbackRemoveLap
    this.callbackPublicClearLaps = this.callbackClearLaps
    this.callbackPublicStart = this.callbackStart
    this.callbackPublicStop = this.callbackStop
    this.callbackPublicRestart = this.callbackRestart
  }
  /**
   * Get the current time
   * @returns {number}
   */
  get currentTime () {
    if (this.running) {
      return window.performance.now() - this.startedTime
    } else {
      return this.stoppedTime - this.startedTime
    }
  }
  /**
   * Get the current laps
   * @returns {*[]}
   */
  get currentLaps () {
    return this.laps
  }
  /**
   * Get if the watch is currently running
   * @returns {boolean}
   */
  get isRunning () {
    return this.running
  }
  /**
   * Reset and initialize all class variables
   */
  reset () {
    // Reset time
    this.startedTime = 0
    this.stoppedTime = 0
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
      const STARTED_TIME = window.performance.now()
      const DATE_TEMP = new Date()
      const STARTED_DATE = [DATE_TEMP.getUTCHours(), DATE_TEMP.getUTCMinutes(),
        DATE_TEMP.getUTCSeconds(), DATE_TEMP.getUTCMilliseconds() ].join(':')
      this.startedTime = STARTED_TIME - (this.stoppedTime - this.startedTime)
      // Event listeners
      this.callbackStart(STARTED_TIME, STARTED_DATE)
      this.callbackPublicStart(STARTED_TIME, STARTED_DATE)
    }
  }
  /**
   * Stop stopwatch
   */
  stop () {
    if (this.running) {
      this.running = false
      const STOPPED_TIME = window.performance.now()
      const DATE_TEMP = new Date()
      const STOPPED_DATE = [DATE_TEMP.getUTCHours(), DATE_TEMP.getUTCMinutes(),
        DATE_TEMP.getUTCSeconds(), DATE_TEMP.getUTCMilliseconds() ].join(':')
      this.stoppedTime = STOPPED_TIME
      // Event listeners
      this.callbackStop(STOPPED_TIME, STOPPED_DATE)
      this.callbackPublicStop(STOPPED_TIME, STOPPED_DATE)
    }
  }
  /**
   * Restart stopwatch
   */
  restart () {
    this.reset()
    this.clearLaps()
    // Event listeners
    this.callbackRestart()
    this.callbackPublicRestart()
    // ----------------
    this.start()
  }
  /**
   * Add a lap
   */
  addLap () {
    const temp = this.currentTime
    if (this.currentTime === 0) {
      return
    }
    let count = this.laps.push(temp)
    // Event listeners
    this.callbackAddLap(count - 1, temp)
    this.callbackPublicAddLap(count - 1, temp)
  }
  /**
   * Remove a lap
   * @param {number} index of lap that should be removed
   */
  removeLap (index) {
    let deletedElement = this.laps[index]
    if (index >= 0 && index < this.laps.length) {
      deletedElement = this.laps.splice(index, 1)
    }
    // Event listeners
    this.callbackRemoveLap(index, deletedElement)
    this.callbackPublicRemoveLap(index, deletedElement)
  }
  /**
   * Clear all laps
   */
  clearLaps () {
    this.laps = []
    // Event listeners
    this.callbackClearLaps()
    this.callbackPublicClearLaps()
  }
  /**
   * Event listener
   * @param {String} eventName
   * @param {*} callback
   */
  event (eventName, callback) {
    switch (eventName) {
      case 'start':
        this.callbackStart = callback
        break
      case 'stop':
        this.callbackStop = callback
        break
      case 'restart':
        this.callbackRestart = callback
        break
      case 'add_lap':
        this.callbackAddLap = callback
        break
      case 'remove_lap':
        this.callbackRemoveLap = callback
        break
      case 'clear_laps':
        this.callbackClearLaps = callback
        break
      default:
        console.error('The event "' + eventName + '" does not exist!')
        break
    }
  }
  /**
   * Public event listener
   * @param {String} eventName
   * @param {*} callback
   */
  eventPublic (eventName, callback) {
    switch (eventName) {
      case 'start':
        this.callbackPublicStart = callback
        break
      case 'stop':
        this.callbackPublicStop = callback
        break
      case 'restart':
        this.callbackPublicRestart = callback
        break
      case 'add_lap':
        this.callbackPublicAddLap = callback
        break
      case 'remove_lap':
        this.callbackPublicRemoveLap = callback
        break
      case 'clear_laps':
        this.callbackPublicClearLaps = callback
        break
      default:
        console.error('The public event "' + eventName + '" does not exist!')
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
    const timeNumberStrings = TimeConverter.humanReadableTimeNumberString(this.stopwatch.currentTime)
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
   * @param {Number} time in milliseconds
   * @returns {Number[][]} time
   */
  static humanReadableTimeDigits (time) {
    const timeNumbers = this.humanReadableTime(time)
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
   * @param {Number} time in milliseconds
   * @returns {String[][]} time
   */
  static humanReadableTimeNumberString (time) {
    return this.humanReadableTimeDigits(time).map(digits =>
      digits.map(digit => this.timeDigitStringMap[digit]))
  }
}
