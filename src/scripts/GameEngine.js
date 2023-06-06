import { Class } from './core';
import { Bot } from './Bot';
import { Bonus } from './Bonus';
import { Player } from './Player';
import { Diamond } from './Diamond';
import { Menu } from './Menu';
import { Wall } from './Wall';
import { Grass } from './Grass';
import { Wood } from './Wood';
import PS from 'pathfinding';

const GameEngine = Class.extend({
  tileSize: 32,
  tilesX: 11,
  tilesY: 17,
  size: {},
  fps: 60,
  botsCount: 1, /* 0 - 3 */
  playersCount: 1, /* 1 - 2 */
  bonusesPercent: 10,
  hasStarted: false,

  stage: null,
  menu: null,
  players: [],
  bots: [],
  tiles: [],
  bombs: [],
  bonuses: [],
  grasses: [],
  woods: [],

  soundVolume: {
    bomb: 0.5,
    background: 0.6,
    diamond: 0.5,
    bonus: 0.5,
  },

  player: null,
  enemy: null,
  tilesImgs: {},
  dialogueImages: {},
  bombImg: null,
  fireImg: null,
  bonusesImg: null,

  playing: false,
  mute: true,
  soundtrackLoaded: false,
  soundtrackPlaying: false,
  soundtrack: null,

  diamonds: [],
  diamondsPositions: [
    [1, 2, 'red'],
    [1, 3, 'blue'],
    [1, 4, 'orange'],
    [1, 5, 'purple'],
    [1, 6, 'orange'],
    [1, 7, 'turquoise']
  ],

  getWallsPositions() {
    const x = this.tilesX;
    const y = this.tilesY;
    const outsideWalls = [
      ...Array.from({ length: x }).map((_, i) => {
        return [
          [i, 0, 0],
          [i, y - 1, 0]
        ]
      }).flat(),
      ...Array.from({ length: y - 2 }).map((_, i) => {
        return [
          [0, i + 1, 0],
          [x - 1, i + 1, 0]
        ]
      }).flat()
    ];
    return [
      ...outsideWalls,
    ]
  },

  grid: null,

  eventBus: new EventTarget(),

  init: function () {
    this.size = {
      w: this.tileSize * this.tilesX,
      h: this.tileSize * this.tilesY
    };

    this.grid = new PS.Grid(this.tilesX, this.tilesY);
  },

  load: function () {
    // Init canvas
    this.stage = new createjs.Stage('canvas');
    this.stage.enableMouseOver();

    // Load assets
    const queue = new createjs.LoadQueue();
    const that = this;
    queue.addEventListener('complete', function () {
      that.enemy = queue.getResult('enemy');
      that.player = queue.getResult('player');
      that.tilesImgs.grass = queue.getResult('tile_grass');
      that.tilesImgs.wall = queue.getResult('tile_wall');
      that.tilesImgs.wood = queue.getResult('tile_wood');
      that.tilesImgs.straw = queue.getResult('straw');
      that.tilesImgs.ground = queue.getResult('ground');
      that.bombImg = queue.getResult('bomb');
      that.fireImg = queue.getResult('fire');
      that.bonusesImg = queue.getResult('bonuses');
      that.diamondImg = queue.getResult('diamond');
      that.startBtn = queue.getResult('start_btn');
      that.dialogueImages.d6 = queue.getResult('dall');
      Diamond.colors.forEach(color => {
        const name = `diamond_${color}`;
        that[name] = queue.getResult(name);
      });
      that.setup();
      that.eventBus.dispatchEvent(new Event('loaded'));
    });

    const manifest = [
      { id: 'enemy', src: '/assets/img/enemy.png' },
      { id: 'player', src: '/assets/img/forg.png' },
      { id: 'tile_grass', src: '/assets/img/grass.png' },
      { id: 'tile_wall', src: '/assets/img/marker2.png' },
      // { id: 'tile_wood', src: '/assets/img/tile_wood.png' },
      { id: 'bomb', src: '/assets/img/bomb1.png' },
      { id: 'fire', src: '/assets/img/fire.png' },
      { id: 'bonuses', src: '/assets/img/bonuses.png' },
      { id: 'straw', src: '/assets/img/straw.png' },
      { id: 'ground', src: '/assets/img/ground.png' },
      { id: 'start_btn', src: '/assets/img/start.png' },
      { id: 'dall', src: '/assets/img/getall.png' }
    ];

    Diamond.colors.forEach(color => {
      const name = `diamond_${color}`;
      manifest.push({
        id: name,
        src: `/assets/img/diamonds/${color}.png`
      });
      that[name] = queue.getResult(name);
    });

    queue.loadManifest(manifest);

    createjs.Sound.addEventListener('fileload', this.onSoundLoaded);
    createjs.Sound.alternateExtensions = ['mp3'];
    createjs.Sound.registerSound('/assets/sound/bomb.mp3', 'bomb');
    createjs.Sound.registerSound('/assets/sound/bgm.mp3', 'game');
    createjs.Sound.registerSound('/assets/sound/diamond.mp3', 'diamond');
    createjs.Sound.registerSound('/assets/sound/bonus.mp3', 'bonus');
    createjs.Sound.registerSound('/assets/sound/countdown.mp3', 'countdown');

    // Create menu
    this.menu = new Menu();
  },

  setup: function () {
    this.ready = true;
    this.playing = false;
    this.hasStarted = false;
    if (!gInputEngine.bindings.length) {
      gInputEngine.setup();
    }

    this.bombs = [];
    this.tiles = [];
    this.bonuses = [];
    this.diamonds = [];
    this.walls = [];
    this.grasses = [];

    // Draw tiles
    this.drawTiles();
    this.drawDiamonds();
    this.drawBonuses();

    // Toggle sound
    gInputEngine.addListener('mute', this.toggleSound);

    // Escape listener
    gInputEngine.addListener('escape', function () {
      if (!gGameEngine.menu.visible) {
        gGameEngine.menu.show();
      }
    });

    // Start loop
    if (!createjs.Ticker.hasEventListener('tick')) {
      createjs.Ticker.addEventListener('tick', gGameEngine.update);
      createjs.Ticker.setFPS(this.fps);
    }

    if (!this.playing) {
      this.menu.show();
      this.text('Please standby');
    }
  },

  start() {
    this.hasStarted = true;
    this.menu.hide();
    this.spawnBots();
    this.spawnPlayers();
    this.playing = true;
    if (this.soundtrackLoaded) {
      this.playSoundtrack();
    }
  },

  onSoundLoaded: function (sound) {
    if (sound.id == 'game') {
      gGameEngine.soundtrackLoaded = true;
      if (gGameEngine.playersCount > 0) {
        gGameEngine.playSoundtrack();
      }
    }
  },

  playSoundtrack: function () {
    if (!gGameEngine.soundtrackPlaying && !gGameEngine.mute) {
      gGameEngine.soundtrack = createjs.Sound.play('game', 'none', 0, 0, -1);
      gGameEngine.soundtrack.volume = this.soundVolume.background;
      gGameEngine.soundtrack.loop = -1;
      gGameEngine.soundtrackPlaying = true;
    }
  },

  update: function () {
    // Player
    const player = gGameEngine.getPlayer();
    player && player.update();

    // Bots
    for (let i = 0; i < gGameEngine.bots.length; i++) {
      const bot = gGameEngine.bots[i];
      bot.update();
    }

    // Bombs
    for (let i = 0; i < gGameEngine.bombs.length; i++) {
      const bomb = gGameEngine.bombs[i];
      bomb.update();
    }
    // Stage
    gGameEngine.stage.update();
  },

  getRandomWoods(target, n) {
    target = target.sort(() => Math.random() > 0.5 ? 1 : -1);
    const result = [];
    for (let i = 0; i < n; ++i) {
      const random = Math.floor(Math.random() * target.length);
      if (result.includes(target[random])) {
        continue;
      }
      result.push(target[random]);
      target.splice(random, 1);
    }
    return result;
  },

  drawTiles: function () {
    const tiles = [];
    const grasses = [];
    const woods = [];
    const walls = this.getWallsPositions();

    for (let i = 1; i < this.tilesY - 1; i++) {
      for (let j = 1; j < this.tilesX - 1; j++) {
        if ((j % 2 == 0 && i % 2 == 0)) {
          // Wall tiles
        } else {
          // Grass tiles
          const grass = new Grass({ x: j, y: i });
          this.stage.addChild(grass.bmp);
          grasses.push(grass);
          if (grass.straw) {
            this.stage.addChild(grass.straw);
          }
        }
      }
    }

    for (let i = 1; i < this.tilesY - 1; i++) {
      for (let j = 1; j < this.tilesX - 1; j++) {
        if ((j % 2 == 0 && i % 2 == 0)) {
          // Wall tiles
        } else {
          // Wood tiles
          if (!(i <= 2 && j <= 2)
            && !(i >= this.tilesY - 3 && j >= this.tilesX - 3)) {

            const wood = new Wood({ x: j, y: i });
            this.stage.addChild(wood.bmp);
            tiles.push(wood);
            woods.push(wood);
          }
        }
      }
    }

    walls.forEach(([x, y, t, i]) => {
      const wall = new Wall(t, { x, y });
      this.stage.addChild(wall.bmp);
      tiles.push(wall);
    })

    for (let i = 1; i < this.tilesY - 1; i++) {
      for (let j = 1; j < this.tilesX - 1; j++) {
        if ((j % 2 == 0 && i % 2 == 0)) {
          // Wall tiles
          const wall = new Wall(10, { x: j, y: i });
          this.stage.addChild(wall.bmp);
          tiles.push(wall);
        }
      }
    }
    this.tiles = tiles;
    this.grasses = grasses;
    this.woods = woods;
  },

  drawBonuses: function () {
    // Cache woods tiles
    const woods = this.woods;

    // Sort tiles randomly
    woods.sort(function () {
      return 0.5 - Math.random();
    });

    // Distribute bonuses to quarters of map precisely fairly
    for (let j = 0; j < 4; j++) {
      const bonusesCount = Math.round(woods.length * this.bonusesPercent * 0.01 / 4);
      let placedCount = 0;
      for (let i = 0; i < woods.length; i++) {
        if (placedCount > bonusesCount) {
          break;
        }
        const tile = woods[i];
        if (this.diamonds.some(diamond => {
          return diamond.position.x === tile.position.x && diamond.position.y === tile.position.y;
        })) {
          break;
        }

        if ((j == 0 && tile.position.x < this.tilesX / 2 && tile.position.y < this.tilesY / 2)
          || (j == 1 && tile.position.x < this.tilesX / 2 && tile.position.y > this.tilesY / 2)
          || (j == 2 && tile.position.x > this.tilesX / 2 && tile.position.y < this.tilesX / 2)
          || (j == 3 && tile.position.x > this.tilesX / 2 && tile.position.y > this.tilesX / 2)) {

          const typePosition = placedCount % 3;
          const bonus = new Bonus(tile.position, typePosition);
          this.bonuses.push(bonus);

          // Move wood to front
          this.moveToFront(tile.bmp);

          placedCount++;
        }
      }
    }
  },

  spawnBots: function () {
    this.bots = [];

    const bot2 = new Bot({ x: this.tilesX - 2, y: this.tilesY - 2 });
    this.bots.push(bot2);
  },

  drawDiamonds: function () {
    const points = this.getRandomWoods(this.woods, Diamond.colors.length);
    points.forEach((wood, index) => {
      const { position } = wood;
      const { x, y } = position;
      const diamond = new Diamond({ x, y }, Diamond.colors[index]);
      this.diamonds.push(diamond);
      this.moveToFront(diamond.bmp);
      if (wood) {
        this.moveToFront(wood.bmp);
      }
    })
  },

  spawnPlayers: function () {
    this.players = [];

    const player = new Player({ x: 1, y: 1 });
    this.players.push(player);
  },

  /**
   * Checks whether two rectangles intersect.
   */
  intersectRect: function (a, b) {
    return (a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom);
  },

  /**
   * Returns tile at given position.
   */
  getTile: function (position) {
    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i];
      if (tile.position.x == position.x && tile.position.y == position.y) {
        return tile;
      }
    }
  },

  /**
   * Returns tile material at given position.
   */
  getTileMaterial: function (position) {
    const tile = this.getTile(position);
    return tile?.material || 'grass';
  },

  text: function (text) {
    this.menu.text(text);
  },

  win: function () {

  },

  die: function () {
    if (this.timer) {
      return;
    }
    this.menu.show();
    this.count = 5;
    this.punish();
  },

  startToGame: function () {
    this.menu.hide();
    if (this.hasStarted) {
      this.restart();
    } else {
      this.start();
    }
  },

  countdown: function (count) {
    if (count === 3 && !gGameEngine.mute) {
      const countdownSound = createjs.Sound.play('countdown', 'none', 0, 0, -1);
      countdownSound.volume = 0.5;
    }
    this.menu.text(count, 'bold 80px Helvetica', '#ffffff');
  },

  getPlayer: function () {
    return this.players[0];
  },

  punish() {
    this.timer = setTimeout(() => {
      if (this.count <= 0) {
        clearTimeout(this.timer);
        this.timer = null;
        this.menu.hide();
        this.getPlayer().reborn();
      } else {
        this.punish();
        this.menu.text('Punishment time ' + this.count--);
      }
    }, 1000);
  },

  getWinner: function () {
    const player = this.getPlayer();
    if (player.alive) {
      return player;
    }
  },

  reset: function() {
    gInputEngine.removeAllListeners();
    this.stage.removeAllChildren();
    this.setup();
  },

  restart: function () {
    gInputEngine.removeAllListeners();
    this.stage.removeAllChildren();
    if (!this.ready) {
      this.setup();
    }
    this.start();
  },

  continue: function () {
    this.playing = true;
    this.menu.hide();
  },

  stop: function () {
    this.menu.show();
    this.menu.text('Stopped');
    this.playing = false;
  },

  /**
   * Moves specified child to the front.
   */
  moveToFront: function (child) {
    const children = gGameEngine.stage.numChildren;
    gGameEngine.stage.setChildIndex(child, children - 1);
  },

  toggleSound: function () {
    if (gGameEngine.mute) {
      gGameEngine.mute = false;
      gGameEngine.soundtrack.resume();
    } else {
      gGameEngine.mute = true;
      gGameEngine.soundtrack.pause();
    }
  },

  countPlayersAlive: function () {
    let playersAlive = 0;
    for (let i = 0; i < gGameEngine.players.length; i++) {
      if (gGameEngine.players[i].alive) {
        playersAlive++;
      }
    }
    return playersAlive;
  },

  getPlayersAndBots: function () {
    const players = [];

    for (let i = 0; i < gGameEngine.players.length; i++) {
      players.push(gGameEngine.players[i]);
    }

    for (let i = 0; i < gGameEngine.bots.length; i++) {
      players.push(gGameEngine.bots[i]);
    }

    return players;
  }
});

const gGameEngine = window.gGameEngine = window.gGameEngine || new GameEngine();

export {
  gGameEngine
};
