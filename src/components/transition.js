import { define } from '../utils/object'

export default function (Glide, Components, Events) {
  /**
   * Holds inactivity status of transition.
   * When true transition is not applied.
   *
   * @type {Boolean}
   */
  let disabled = false
  
  let afterHandlers = []

  const Transition = {
    /**
     * Composes string of the CSS transition.
     *
     * @param {String} property
     * @return {String}
     */
    compose (property) {
      let settings = Glide.settings

      if (!disabled) {
        return `${property} ${this.duration}ms ${settings.animationTimingFunc}`
      }

      return 'none'
    },

    /**
     * Sets value of transition on HTML element.
     *
     * @param {String=} property
     * @return {Void}
     */
    set (property = 'transform') {
      Components.Html.wrapper.style.transition = this.compose(property)
    },

    /**
     * Removes value of transition from HTML element.
     *
     * @return {Void}
     */
    remove () {
      Components.Html.wrapper.style.transition = ''
    },

    /**
     * Runs handler after animation.
     *
     * @param  {Function} handler
     * @return {Void}
     */
    after (handler) {
      let afterHandler = {
          handler: () => {
              clearTimeout(afterHandler.timerId)

              handler()

              afterHandlers.splice(afterHandlers.indexOf(afterHandler), 1)
          },

          timerId: setTimeout(() => {
              afterHandler.handler()
          }, this.duration)
      }

      afterHandlers.push(afterHandler)
    },
    
    callAfterHandlers () {
      while (afterHandlers.length) {
        afterHandlers[0].handler()
      }
    },

    /**
     * Enable transition.
     *
     * @return {Void}
     */
    enable () {
      disabled = false

      this.set()
    },

    /**
     * Disable transition.
     *
     * @return {Void}
     */
    disable () {
      disabled = true

      this.set()
      
      this.callAfterHandlers()
    }
  }

  define(Transition, 'duration', {
    /**
     * Gets duration of the transition based
     * on currently running animation type.
     *
     * @return {Number}
     */
    get () {
      let settings = Glide.settings

      if (Glide.isType('slider') && Components.Run.offset) {
        return settings.rewindDuration
      }

      return settings.animationDuration
    }
  })

  /**
   * Set transition `style` value:
   * - on each moving, because it may be cleared by offset move
   */
  Events.on('move', () => {
    Transition.set()
  })

  /**
   * Disable transition:
   * - before initial build to avoid transitioning from `0` to `startAt` index
   * - while resizing window and recalculating dimensions
   * - on jumping from offset transition at start and end edges in `carousel` type
   */
  Events.on(['build.before', 'resize', 'translate.jump'], () => {
    Transition.disable()
  })

  /**
   * Enable transition:
   * - on each running, because it may be disabled by offset move
   */
  Events.on('run', () => {
    Transition.enable()
  })

  /**
   * Remove transition:
   * - on destroying to bring markup to its inital state
   */
  Events.on('destroy', () => {
    Transition.remove()
  })

  return Transition
}
