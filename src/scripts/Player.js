import { Entity } from "./Entity";
import { Utils } from "./Utils";
import { gGameEngine } from "./GameEngine";
import { Bomb } from './Bomb';
import { Bot } from "./Bot";
import { gInputEngine } from "./InputEngine";
import PF from 'pathfinding';
import { Diamond } from "./Diamond";
import { Dialogue } from "./Dialogue";

const finder = new PF.AStarFinder();
const Player = Entity.extend({
  id: 0,

  /**
   * Moving speed
   */
  velocity: 1.5,

  /**
   * Max number of bombs user can spawn
   */
  bombsMax: 1,

  /**
   * How far the fire reaches when bomb explodes
   */
  bombStrength: 1,

  /**
   * Entity position on map grid
   */
  position: {},

  /**
   * Bitmap dimensions
   */
  size: {
    w: 40,
    h: 40
  },

  /**
   * Bitmap animation
   */
  bmp: null,

  alive: true,

  bombs: [],

  controls: {
    'up': 'up',
    'left': 'left',
    'down': 'down',
    'right': 'right',
    'bomb': 'bomb'
  },

  starttime: null,
  endtime: null,

  collections: [],

  /**
   * Bomb that player can escape from even when there is a collision
   */
  escapeBomb: null,

  deadTimer: 0,

  path: [],

  config: function () {
    const img = gGameEngine.player;
    return {
      images: [img],
      frames: { width: this.size.w, height: this.size.h, regX: 4, regY: 1 },
      animations: {
        idle: [1, 1, 'idle'],
        down: [0, 2, 'down', 0.1],
        left: [9, 11, 'left', 0.1],
        up: [6, 8, 'up', 0.1],
        right: [3, 5, 'right', 0.1],
        dead: [0, 0, 'dead', 0.1]
      }
    }
  },

  init: function (position, controls, id) {
    if (id) {
      this.id = id;
    }

    if (controls) {
      this.controls = controls;
    }

    if (!(this instanceof Bot)) {
      this.setTouchListener();
    }

    this.create(position);

    this.bombs = [];
    this.setBombsListener();
    this.starttime = Date.now();
  },

  create: function (position) {
    const spriteSheet = new createjs.SpriteSheet(this.config());
    this.bmp = new createjs.Sprite(spriteSheet);
    // this.bmp.scaleX = gGameEngine.tileSize / this.size.w;
    this.bmp.scaleY = (gGameEngine.tileSize) / this.size.h;

    this.position = position;
    const pixels = Utils.convertToBitmapPosition(position);
    this.bmp.x = pixels.x;
    this.bmp.y = pixels.y;

    gGameEngine.stage.addChild(this.bmp);
  },

  setTouchListener: function () {
    if (!gGameEngine.playing) return;
    gInputEngine.addListener('touch', this.onTouch.bind(this));
  },

  onTouch: function ({ x, y }) {
    if (!this.alive) return;
    if (x === this.position.x && y === this.position.y) {
      this.path = [];
      return;
    }
    this.path = finder.findPath(this.position.x, this.position.y, x, y, gGameEngine.grid.clone());
  },

  getDirection: function () {
    if (this.path.length === 0) return;
    const next = this.path[0];
    if (!next) return
    const { x: cx, y: cy } = this.bmp;
    const [x, y] = next;
    const nx = x * gGameEngine.tileSize;
    const ny = y * gGameEngine.tileSize;
    if (nx > cx + this.velocity) {
      return this.controls.right;
    }
    if (nx < cx - this.velocity) {
      return this.controls.left;
    }
    if (ny > cy + this.velocity) {
      return this.controls.down;
    }
    if (ny < cy - this.velocity) {
      return this.controls.up;
    }
    this.path.shift();
    return this.getDirection();
  },

  setBombsListener: function () {
    if (!(this instanceof Bot)) {
      const that = this;
      gInputEngine.addListener(this.controls.bomb, function () {
        if (!gGameEngine.playing) return;
        if (!that.alive) return;
        for (let i = 0; i < gGameEngine.bombs.length; i++) {
          const bomb = gGameEngine.bombs[i];
          if (Utils.comparePositions(bomb.position, that.position)) {
            return;
          }
        }
        let unexplodedBombs = 0;
        for (let i = 0; i < that.bombs.length; i++) {
          if (!that.bombs[i].exploded) {
            unexplodedBombs++;
          }
        }
        if (unexplodedBombs < that.bombsMax) {
          const bomb = new Bomb(that.position, that.bombStrength);
          gGameEngine.stage.addChild(bomb.bmp);
          that.bombs.push(bomb);
          gGameEngine.bombs.push(bomb);

          bomb.setExplodeListener(function () {
            Utils.removeFromArray(that.bombs, bomb);
          });
        }
      });
    }
  },

  fixedDirection: null,

  needtoFixPosition: function (position, dir) {
    let dirX, dirY, collision;
    if (dir === 'up') {
      dirY = -1;
      collision = this.detectWallCollisionWithCood({ x: position.x, y: (this.position.y - 1) * gGameEngine.tileSize }, {
        x: this.position.x, y: this.position.y - 1
      });
    }
    if (dir === 'down') {
      dirY = 1;
      collision = this.detectWallCollisionWithCood({ x: position.x, y: (this.position.y + 1) * gGameEngine.tileSize }, {
        x: this.position.x, y: this.position.y + 1
      });
    }
    if (dir === 'left') {
      dirX = -1;
      collision = this.detectWallCollisionWithCood({ x: (this.position.x - 1) * gGameEngine.tileSize, y: position.y }, {
        x: this.position.x - 1, y: this.position.y
      });
    }
    if (dir === 'right') {
      dirX = 1;
      collision = this.detectWallCollisionWithCood({ x: (this.position.x + 1) * gGameEngine.tileSize, y: position.y }, {
        x: this.position.x + 1, y: this.position.y
      });
    }
    if ((dir === 'up' || dir === 'down')) {
      if (position.x > this.position.x * gGameEngine.tileSize && collision) {
        return 'left'
      }
      if (position.x < this.position.x * gGameEngine.tileSize && collision) {
        return 'right'
      }
    }
    if ((dir === 'left' || dir === 'right')) {
      if (position.y > this.position.y * gGameEngine.tileSize && collision) {
        return 'up';
      }
      if (position.y < this.position.y * gGameEngine.tileSize && collision) {
        return 'down';
      }
    }
  },

  update: function () {
    if (!gGameEngine.playing) {
      this.animate('idle');
      return;
    }
    let detectMethod;
    if (gInputEngine.mode === 'touch') {
      const direction = this.getDirection();
      detectMethod = {
        [direction]: true
      };
    } else {
      detectMethod = gInputEngine.actions;
      if (this.timer) {
        cancelAnimationFrame(this.timer);
      }
    }
    if (!this.alive) {
      this.fade();
      return;
    }
    if (gGameEngine.menu.visible) {
      return;
    }
    const position = { x: this.bmp.x, y: this.bmp.y };
    let dir;

    if (detectMethod[this.controls.up]) {
      dir = 'up'
    }
    if (detectMethod[this.controls.down]) {
      dir = 'down'
    }
    if (detectMethod[this.controls.left]) {
      dir = 'left'
    }
    if (detectMethod[this.controls.right]) {
      dir = 'right'
    }

    this.fixedDirection = this.needtoFixPosition(position, dir);

    if (this.fixedDirection) {
      this.animate(this.fixedDirection)
      switch (this.fixedDirection) {
        case 'left':
          position.x -= this.velocity;
          break
        case 'right':
          position.x += this.velocity;
          break
        case 'up':
          position.y -= this.velocity;
          break
        case 'down':
          position.y += this.velocity;
          break;
      }

      this.bmp.x = position.x;
      this.bmp.y = position.y;
      this.updatePosition();
      return
    }

    let dirX = 0;
    let dirY = 0;
    if (detectMethod[this.controls.up]) {
      this.animate('up');
      position.y -= this.velocity;
      dirY = -1;
    } else if (detectMethod[this.controls.down]) {
      this.animate('down');
      position.y += this.velocity;
      dirY = 1;
    } else if (detectMethod[this.controls.left]) {
      this.animate('left');
      position.x -= this.velocity;
      dirX = -1;
    } else if (detectMethod[this.controls.right]) {
      this.animate('right');
      position.x += this.velocity;
      dirX = 1;
    } else {
      this.animate('idle');
    }

    if (position.x != this.bmp.x || position.y != this.bmp.y) {
      if (this.detectWallCollision(position)) {
        // If we are on the corner, move to the aisle
        const cornerFix = this.getCornerFix(dirX, dirY);
        if (cornerFix) {
          let fixX = 0;
          let fixY = 0;
          if (dirX) {
            fixY = (cornerFix.y - this.bmp.y) > 0 ? 1 : -1;
          } else {
            fixX = (cornerFix.x - this.bmp.x) > 0 ? 1 : -1;
          }
          this.bmp.x += fixX * this.velocity;
          this.bmp.y += fixY * this.velocity;
          this.updatePosition();
        }
      } else {
        this.bmp.x = position.x;
        this.bmp.y = position.y;
        this.updatePosition();
      }
    }

    if (this.detectFireCollision()) {
      this.die();
    }

    this.handleBonusCollision();
    this.handleDiamondCollosion();
  },

  /**
   * Checks whether we are on corner to target position.
   * Returns position where we should move before we can go to target.
   */
  getCornerFix: function (dirX, dirY) {
    const edgeSize = 30;

    // fix position to where we should go first
    let position = {};

    // possible fix position we are going to choose from
    const pos1 = { x: this.position.x + dirY, y: this.position.y + dirX };
    const bmp1 = Utils.convertToBitmapPosition(pos1);

    const pos2 = { x: this.position.x - dirY, y: this.position.y - dirX };
    const bmp2 = Utils.convertToBitmapPosition(pos2);

    // in front of current position
    if (gGameEngine.getTileMaterial({ x: this.position.x + dirX, y: this.position.y + dirY }) == 'grass') {
      position = this.position;
    }
    // right bottom
    // left top
    else if (gGameEngine.getTileMaterial(pos1) == 'grass'
      && Math.abs(this.bmp.y - bmp1.y) < edgeSize && Math.abs(this.bmp.x - bmp1.x) < edgeSize) {
      if (gGameEngine.getTileMaterial({ x: pos1.x + dirX, y: pos1.y + dirY }) == 'grass') {
        position = pos1;
      }
    }
    // right top
    // left bottom
    else if (gGameEngine.getTileMaterial(pos2) == 'grass'
      && Math.abs(this.bmp.y - bmp2.y) < edgeSize && Math.abs(this.bmp.x - bmp2.x) < edgeSize) {
      if (gGameEngine.getTileMaterial({ x: pos2.x + dirX, y: pos2.y + dirY }) == 'grass') {
        position = pos2;
      }
    }

    if (position.x && gGameEngine.getTileMaterial(position) == 'grass') {
      return Utils.convertToBitmapPosition(position);
    }
  },

  /**
   * Calculates and updates entity position according to its actual bitmap position
   */
  updatePosition: function () {
    this.position = Utils.convertToEntityPosition(this.bmp);
  },

  detectWallCollisionWithCood: function (position, cood) {
    const player = {};
    player.left = position.x;
    player.top = position.y;
    player.right = player.left + this.size.w;
    player.bottom = player.top + this.size.h;

    const left = { x: cood.x - 1, y: cood.y };
    const top = { x: cood.x, y: cood.y - 1 };
    const right = { x: cood.x + 1, y: cood.y };
    const bottom = { x: cood.x, y: cood.y + 1 };
    const pos = [left, top, right, bottom].filter(position => {
      return gGameEngine.getTileMaterial(position) !== 'grass';
    })

    // Check possible collision with all wall and wood tiles
    for (let i = 0; i < pos.length; i++) {
      const tilePosition = pos[i];

      const tile = {};
      tile.left = tilePosition.x * gGameEngine.tileSize + 14;
      tile.top = tilePosition.y * gGameEngine.tileSize + 10;
      tile.right = tile.left + gGameEngine.tileSize - 20;
      tile.bottom = tile.top + gGameEngine.tileSize - 16;

      if (gGameEngine.intersectRect(player, tile)) {
        return true;
      }
    }
    return false;
  },

  /**
   * Returns true when collision is detected and we should not move to target position.
   */
  detectWallCollision: function (position) {
    return this.detectWallCollisionWithCood(position, this.position);
  },

  /**
   * Returns true when the bomb collision is detected and we should not move to target position.
   */
  detectBombCollision: function (pixels) {
    const position = Utils.convertToEntityPosition(pixels);

    for (let i = 0; i < gGameEngine.bombs.length; i++) {
      const bomb = gGameEngine.bombs[i];
      // Compare bomb position
      if (bomb.position.x == position.x && bomb.position.y == position.y) {
        // Allow to escape from bomb that appeared on my field
        if (bomb == this.escapeBomb) {
          return false;
        } else {
          return true;
        }
      }
    }

    // I have escaped already
    if (this.escapeBomb) {
      this.escapeBomb = null;
    }

    return false;
  },

  detectFireCollision: function () {
    const bombs = gGameEngine.bombs;
    for (let i = 0; i < bombs.length; i++) {
      const bomb = bombs[i];
      for (let j = 0; j < bomb.fires.length; j++) {
        const fire = bomb.fires[j];
        const collision = bomb.exploded && fire.position.x == this.position.x && fire.position.y == this.position.y;
        if (collision) {
          return true;
        }
      }
    }
    return false;
  },

  /**
   * Checks whether we have got bonus and applies it.
   */
  handleBonusCollision: function () {
    for (let i = 0; i < gGameEngine.bonuses.length; i++) {
      const bonus = gGameEngine.bonuses[i];
      if (Utils.comparePositions(bonus.position, this.position)) {
        this.applyBonus(bonus);
        bonus.destroy();
      }
    }
  },

  handleDiamondCollosion: function () {
    gGameEngine.diamonds.forEach(diamond => {
      if (Utils.comparePositions(diamond.position, this.position)) {
        this.collections.push(diamond);
        diamond.destroy();
        setTimeout(() => {
          new Dialogue(this.collections, diamond);
        }, 300);
      }
    });
    if (this.collections.length === Diamond.colors.length) {
      gGameEngine.menu.show();
      gGameEngine.text('You win');
      this.endtime = Date.now();
      gGameEngine.eventBus.dispatchEvent(new CustomEvent('win', {
        detail: this.endtime - this.starttime
      }));
      gGameEngine.playing = false;
      this.animate('idle');
    }
  },

  /**
   * Applies bonus.
   */
  applyBonus: function (bonus) {
    if (bonus.type == 'speed') {
      if (this.velocity >= 3) {
        return;
      }
      this.velocity += 0.25;
    } else if (bonus.type == 'bomb') {
      this.bombsMax++;
    } else if (bonus.type == 'fire') {
      this.bombStrength++;
    }
  },

  /**
   * Changes animation if requested animation is not already current.
   */
  animate: function (animation) {
    if (!this.bmp.currentAnimation || this.bmp.currentAnimation.indexOf(animation) === -1) {
      this.bmp.gotoAndPlay(animation);
    }
  },

  die: function () {
    this.alive = false;
    this.animate('dead');
    this.fade();
    this.path = [];
    gGameEngine.die();
    this.velocity = 1.5;
    this.bombsMax = 1;
    this.bombStrength = 1;
  },

  reborn() {
    this.alive = true;
    this.path = [];
    this.bmp.gotoAndPlay('idle');
    this.create({ x: 1, y: 1 });
  },

  fade: function () {
    let timer = 0;
    const bmp = this.bmp;
    const fade = setInterval(function () {
      timer++;

      if (timer > 30) {
        bmp.alpha -= 0.05;
      }
      if (bmp.alpha <= 0) {
        clearInterval(fade);
      }

    }, 30);
  }
});

export {
  Player
};