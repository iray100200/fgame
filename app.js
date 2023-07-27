const express = require('express');
const path = require('path')
const fs = require('fs');
const app = express();
const PORT = 8080;
const { route, events, results, users, game } = require('./router');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const compression = require('compression');

app.use(compression());
app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/', express.static(path.resolve(__dirname, 'dist')));
app.use('/lib', express.static(path.resolve(__dirname, 'library')));
app.use('/assets', express.static(path.resolve(__dirname, 'assets')));

io.on('connection', (socket) => {
  const id = socket.handshake.query.id
  console.log(id, 'user connected');
  socket.emit('result', getResult());
  socket.emit('game', game);

  if (!events.has(id)) {
    events.set(id, []);
  }

  socket.on('gain', ({ id, color }) => {
    console.log(id, 'gain', color, 'diamond');

    const event = events.get(id);
    event && event.push({
      timestamp: Date.now(),
      diamond: color
    });
  });

  socket.on('win', ({ id, timespan }) => {
    console.log(id, 'colleced all the diamonds');
    let item;
    if (!results.has(id)) {
      item = {
        count: 1,
        timespan,
        timestamp: Date.now(),
      };
      results.set(id, item);
    } else {
      item = results.get(id);
      item.count += 1;
      item.timespan = timespan;
    }
    const result = getResult();
    io.sockets.emit('result', result);
  });
});

function getResult() {
  const result = [];
  users.forEach((val, key) => {
    result.push({
      id: key,
      username: val.user_name,
      ...results.get(key),
    });
  });
  return result.filter(t => t.timespan).sort((a, b) => {
    return a.timespan - b.timespan;
  });
}

app.get('*', (req, res, next) => {
  res.setHeader('cache-control', 'no-cache');
  next();
});

app.get('/', (req, res) => {
  fs.createReadStream(
    path.resolve(__dirname, 'index.html')
  ).pipe(res);
});

app.get('/login', (req, res) => {
  fs.createReadStream(
    path.resolve(__dirname, 'login.html')
  ).pipe(res);
});

app.get('/admin', (req, res) => {
  fs.createReadStream(
    path.resolve(__dirname, 'admin.html')
  ).pipe(res);
});

app.get('/result', (req, res) => {
  fs.createReadStream(
    path.resolve(__dirname, 'result.html')
  ).pipe(res);
});

app.get('/success', (req, res) => {
  fs.createReadStream(
    path.resolve(__dirname, 'success.html')
  ).pipe(res);
});

app.use('/api', route(io));

server.listen(PORT, '0.0.0.0', () => {
  console.log('Server is listening on port:', PORT);
});