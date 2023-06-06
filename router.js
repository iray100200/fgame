const express = require('express');
const router = express.Router();

const users = new Map();
const events = new Map();
const results = new Map();
const game = {
  playing: false,
}

function randomId () {
  return String(Math.random()).slice(5, 8) + parseInt(String(Date.now()).slice(8, 11)).toString(32).toUpperCase();
}

function route(io) {
  router.post('/join', (req, res) => {
    let id = req.cookies.id || randomId();
    const { user_name } = req.body;
    if (!users.has(id)) {
      users.set(id, {
        id: id,
        user_name
      });
    }
    res.cookie('username', user_name);
    res.cookie('id', id);
    res.redirect('/');
  });

  router.get('/start', (req, res) => {
    let count = 5;
    let timer;
    function start() {
      timer = setTimeout(() => {
        start()
        count--;
        if (count === 0) {
          game.playing = true;
          clearTimeout(timer);
          io.sockets.emit('start');
        } else {
          io.sockets.emit('countdown', count);
        }
      }, 1000);
    }
    start();
    res.send('success');
  });

  router.get('/stop', (req, res) => {
    game.playing = false;
    io.sockets.emit('stop');
    res.send('success');
  });

  router.get('/continue', (req, res) => {
    game.playing = true;
    io.sockets.emit('continue');
    res.send('success');
  });

  router.get('/reset', (req, res) => {
    users.clear();
    events.clear();
    results.clear();
    io.sockets.emit('reset');
    res.send('success');
  });

  return router;
}

module.exports = {
  route,
  events,
  users,
  results,
  game
};