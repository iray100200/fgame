import 'easeljs/lib/easeljs';
import { gGameEngine } from "./scripts/GameEngine";
import { io } from 'socket.io-client';
import { gInputEngine } from './scripts/InputEngine';

const cookies = extractCookies();

const socket = window.socket = window.socket || io({
  query: {
    id: cookies.id
  },
});

socket.on('start', () => {
  if (!gGameEngine.playing) {
    gGameEngine.startToGame();
  }

  setTimeout(() => {
    socket.emit('win', {
      id: 'A731618'
    })
  }, 10000)
});

socket.on('countdown', (count) => {
  gGameEngine.countdown(count);
});

socket.on('stop', () => {
  gGameEngine.stop();
});

socket.on('continue', () => {
  gGameEngine.continue();
});

socket.on('reset', () => {
  gGameEngine.reset();
});

let resolve;
const detectPlayingStatusPromise = new Promise((r) => {
  resolve = r;
});

socket.on('game', ({ playing }) => {
  if (playing) {
    resolve();
  }
});

const canvas = document.createElement('canvas');
canvas.id = 'canvas';
canvas.width = gGameEngine.size.w;
canvas.height = gGameEngine.size.h;
canvas.style.width = '100vw';
document.getElementById('canvas_root').appendChild(canvas);
window.unit = canvas.offsetHeight / gGameEngine.tilesY;
gGameEngine.load();

gGameEngine.eventBus.addEventListener('loaded', () => {
  document.getElementById('loader').style.display = 'none';
  detectPlayingStatusPromise.then(() => {
    gGameEngine.start();
  });
});

gGameEngine.eventBus.addEventListener('gain', (evt) => {
  socket.emit('gain', {
    id: cookies.id,
    color: evt.detail
  })
});

gGameEngine.eventBus.addEventListener('win', (evt) => {
  socket.emit('win', {
    id: cookies.id,
    timespan: evt.detail
  })
});

function initJoyStick() {
  let direction;
  const pos = {};
  const timing = {};
  const MIN_MOVING_SIZE = 5;
  let showMenus = false
  let timer
  document.addEventListener('touchstart', (evt) => {
    showMenus = evt.touches.length === 2;
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      if (showMenus) {
        gGameEngine.menu.showMenus();
        return;
      }
    }, 1000);
    if (!gGameEngine.menu.visible) {
      evt.preventDefault();
    }
    pos.x = evt.touches[0].clientX;
    pos.y = evt.touches[0].clientY;
    timing.value = Date.now();
  });

  document.addEventListener('touchmove', (evt) => {
    if (!gGameEngine.menu.visible || evt.touches.length === 2) {
      evt.preventDefault();
    }
    const next = {
      x: evt.touches[0].clientX,
      y: evt.touches[0].clientY
    }
    let dir;
    if (next.x - pos.x > MIN_MOVING_SIZE) {
      dir = 'right';
      pos.x = next.x;
      pos.y = next.y;
    }
    if (pos.x - next.x > MIN_MOVING_SIZE) {
      dir = 'left';
      pos.x = next.x;
      pos.y = next.y;
    }
    if (pos.y - next.y > MIN_MOVING_SIZE) {
      dir = 'up';
      pos.x = next.x;
      pos.y = next.y;
    }
    if (next.y - pos.y > MIN_MOVING_SIZE) {
      dir = 'down'
      pos.x = next.x;
      pos.y = next.y;
    }
    if (dir) {
      direction = dir;
      gInputEngine.trigger(dir);
    }
  });
  document.addEventListener('touchend', (evt) => {
    if (!gGameEngine.menu.visible) {
      evt.preventDefault();
    }
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (Date.now() - timing.value < 500 && !direction) {
      gInputEngine.trigger('bomb');
    } else {
      direction = null;
      gInputEngine.trigger('');
    }
  });
}
initJoyStick();