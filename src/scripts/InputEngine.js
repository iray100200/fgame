import { gGameEngine } from "./GameEngine";
import { Class } from "./core";

const InputEngine = Class.extend({

  mode: 'touch',
  /**
   * A dictionary mapping ASCII key codes to string values describing
   * the action we want to take when that key is pressed.
   */
  bindings: {},

  /**
   * A dictionary mapping actions that might be taken in our game
   * to a boolean value indicating whether that action is currently being performed.
   */
  actions: {},

  listeners: [],

  init: function () {
  },

  setup: function () {
    this.bind(38, 'up');
    this.bind(37, 'left');
    this.bind(40, 'down');
    this.bind(39, 'right');
    this.bind(32, 'bomb');
    this.bind(18, 'bomb');

    this.bind(13, 'restart');
    this.bind(27, 'escape');
    this.bind(77, 'mute');
    this.bind(0, 'touch');

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.getElementById('canvas').addEventListener('touchstart', this.onTouch);
  },

  trigger(action) {
    if (!action) {
      this.actions = {};
      return;
    }
    gInputEngine.mode = 'keyboard';
    this.actions = {};
    if (action) {
      this.actions[action] = true;
    }
    const listeners = gInputEngine.listeners[action];
    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i];
        listener();
      }
    }
  },

  onKeyDown: function (event) {
    if (!gGameEngine.playing) return;
    if (event.key === 'F12') return
    gInputEngine.mode = 'keyboard';
    const action = gInputEngine.bindings[event.keyCode];
    if (action) {
      gInputEngine.actions[action] = true;
      event.preventDefault();
    }
    return false;
  },

  onKeyUp: function (event) {
    if (!gGameEngine.playing) return;
    const action = gInputEngine.bindings[event.keyCode];
    if (action) {
      gInputEngine.actions[action] = false;

      const listeners = gInputEngine.listeners[action];
      if (listeners) {
        for (let i = 0; i < listeners.length; i++) {
          const listener = listeners[i];
          listener();
        }
      }
      event.preventDefault();
    }
    return false;
  },

  onTouch: function (event) {
    gInputEngine.mode = 'touch';
    const action = 'touch';
    const canvas = document.getElementById('canvas');
    const touch = event.touches[0] || event.changedTouches[0];
    const offsetX = touch.clientX - canvas.offsetLeft;
    const offsetY = touch.clientY - canvas.offsetTop;
    const x = Math.ceil(offsetX / window.unit);
    const y = Math.ceil(offsetY / window.unit);
    const listeners = gInputEngine.listeners[action];
    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i];
        listener({ x: x - 1, y: y - 1 });
      }
    }
  },

  handleBomb: function (event) {
    event.preventDefault()
    event.stopPropagation();
    const action = 'bomb';
    gInputEngine.actions[action] = false;

    const listeners = gInputEngine.listeners[action];
    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i];
        listener();
      }
    }
  },

  /**
   * The bind function takes an ASCII keycode and a string representing
   * the action to take when that key is pressed.
   */
  bind: function (key, action) {
    this.bindings[key] = action;
  },

  addListener: function (action, listener) {
    this.listeners[action] = this.listeners[action] || new Array();
    this.listeners[action].push(listener);
  },

  removeAllListeners: function () {
    this.listeners = [];
  }
});

const gInputEngine = window.gInputEngine = window.gInputEngine || new InputEngine();

export {
  gInputEngine
};