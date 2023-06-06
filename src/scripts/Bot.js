import { Player } from './Player';
import { Utils } from "./Utils";
import { gGameEngine } from "./GameEngine";
import { Bomb } from './Bomb';
import PF from 'pathfinding';

const finder = new PF.DijkstraFinder();

const Bot = Player.extend({
  /**
   * Current direction
   */
  direction: 'up',
  lastDirection: '',

  /**
   * Directions that are not allowed to go because of collision
   */
  excludeDirections: [],

  /**
   * Current X axis direction
   */
  dirX: 0,

  /**
   * Current Y axis direction
   */
  dirY: -1,

  /**
   * Target position on map we are heading to
   */
  previousPosition: {},
  targetPosition: {},
  targetBitmapPosition: {},

  bombsMax: 1,

  wait: false,

  startTimerMax: 60,
  startTimer: 0,
  started: false,

  killerPath: null,
  killNow: false,

  size: {
    w: 40,
    h: 40
  },

  config: function () {
    const img = gGameEngine.enemy;
    return {
      images: [img],
      frames: { width: this.size.w, height: this.size.h, regX: 4, regY: 1 },
      animations: {
        idle: [0, 0, 'idle'],
        down: [0, 2, 'down', 0.1],
        left: [6, 8, 'left', 0.1],
        up: [3, 5, 'up', 0.1],
        right: [9, 11, 'right', 0.1],
        dead: [0, 0, 'dead', 0.1]
      }
    }
  },

  init: function (position) {
    this._super(position);
    this.startTimerMax = Math.random() * 60;
    this.findTargetPosition();
  },

  update: function () {
    if (!gGameEngine.playing) {
      this.animate('idle');
      return;
    }
    if (!this.alive) {
      this.fade();
      return;
    }

    if (!gGameEngine.players.some(player => player.alive)) {
      return;
    }

    this.wait = false;

    if (!this.started && this.startTimer < this.startTimerMax) {
      this.startTimer++;
      if (this.startTimer >= this.startTimerMax) {
        this.started = true;
      }
      this.animate('idle');
      this.wait = true;
    }

    if (this.targetBitmapPosition.x == this.bmp.x && this.targetBitmapPosition.y == this.bmp.y) {
      const canKillPlayer = this.canKillPlayer();
      if (canKillPlayer) {
        if (this.wantKillPlayer()) {
          this.plantBomb();
        }
      } else if (this.getNearWood() || this.wantKillPlayer()) {
        this.plantBomb();
      }

      // When in safety, wait until explosion
      if (this.bombs.length > 0) {
        if (this.isSafe(this.position)) {
          this.wait = true;
        }
      }
      // it's a trap
      if (!this.wait && this.isNearSafe() && this.isSafe(this.position)) {
        this.wait = true;
      }

      if (!this.wait || !this.targetPosition) {
        this.findTargetPosition();
      }
    }

    if (!this.wait) {
      this.moveToTargetPosition();
    } else {
      this.animate('idle');
    }
    this.handleBonusCollision();

    if (this.detectFireCollision()) {
      // Bot has to die
      this.die();
    }
  },

  isNearSafe() {
    return gGameEngine.bombs.some(bomb => {
      return (bomb.position.x === this.position.x && Math.abs(this.position.y - bomb.position.y) === bomb.strength + 1) ||
        (bomb.position.y === this.position.y && Math.abs(this.position.x - bomb.position.x) === bomb.strength + 1);
    });
  },

  /**
   * Finds the next tile position where we should move.
   */
  findTargetPosition: function () {
    const target = { x: this.position.x, y: this.position.y };
    target.x += this.dirX;
    target.y += this.dirY;

    const aimedTargets = this.getAimedTargets();
    if (aimedTargets.length > 0) {
      this.targetPosition = this.getRandomTarget(aimedTargets, true);
    } else {
      const possibleTargets = this.getPossibleTargets();
      // Do not go the same way if possible
      if (possibleTargets.length > 1) {
        const previousPosition = this.getPreviousPosition();
        for (let i = 0; i < possibleTargets.length; i++) {
          const item = possibleTargets[i];
          if (item.x == previousPosition.x && item.y == previousPosition.y) {
            possibleTargets.splice(i, 1);
          }
        }
      }
      this.targetPosition = this.getRandomTarget(possibleTargets);
    }
    if (this.targetPosition && this.targetPosition.x) {
      this.loadTargetPosition(this.targetPosition);
      this.targetBitmapPosition = Utils.convertToBitmapPosition(this.targetPosition);
    }
  },

  /**
   * Moves a step forward to target position.
   */
  moveToTargetPosition: function () {
    this.animate(this.direction);

    let velocity = this.velocity;
    const distanceX = Math.abs(this.targetBitmapPosition.x - this.bmp.x);
    const distanceY = Math.abs(this.targetBitmapPosition.y - this.bmp.y);
    if (distanceX > 0 && distanceX < this.velocity) {
      velocity = distanceX;
    } else if (distanceY > 0 && distanceY < this.velocity) {
      velocity = distanceY;
    }

    const targetPosition = { x: this.bmp.x + this.dirX * velocity, y: this.bmp.y + this.dirY * velocity };
    if (!this.detectWallCollision(targetPosition)) {
      this.bmp.x = targetPosition.x;
      this.bmp.y = targetPosition.y;
    }

    this.updatePosition();
  },

  canKillPlayer() {
    const players = gGameEngine.players;
    const best = players.map(player => {
      const path = finder.findPath(this.position.x, this.position.y, player.position.x, player.position.y, gGameEngine.grid.clone());
      return path;
    }).filter(t => t.length > 0).sort((a, b) => a.length - b.length);
    if (best.length > 0) {
      const next = best[0][1] || best[0][0];
      this.killerPath = {
        x: next[0], y: next[1]
      }
      return true
    }
    if (gGameEngine.players.some(t => t.position.x === this.position.x && t.position.y === this.position.y)) {
      this.killerPath = { ...this.position };
      return true;
    }
    return false;
  },

  getAimedTargets: function () {
    const woods = gGameEngine.woods;

    if (this.killerPath && this.isSafe(this.killerPath)) {
      return [this.killerPath];
    }

    const { x: cx, y: cy } = this.position;
    const targets = woods.map(t => t.position).sort((a, b) => {
      const t1 = Math.abs(a.x - cx) ** 2 + Math.abs(a.y - cy) ** 2;
      const t2 = Math.abs(b.x - cx) ** 2 + Math.abs(b.y - cy) ** 2
      return t1 - t2;
    });
    const result = [];
    targets.map(({ x, y }) => {
      const grid = gGameEngine.grid.clone();
      grid.setWalkableAt(x, y, true);
      const path = finder.findPath(cx, cy, x, y, grid);
      const next = path[1];
      if (!next) {
        return
      }
      const material = gGameEngine.getTileMaterial({ x: next[0], y: next[1] });
      const safe = path.slice(1, path.length - 1).every(p => {
        return this.isSafe({ x: p[0], y: p[1] });
      });
      return material === 'grass' && safe && { x: next[0], y: next[1] }
    }).filter(t => {
      return t;
    }).forEach(item => {
      if (!result.some(t => t.x === item.x && t.y === item.y)) {
        result.push(item);
      }
    });

    if (result.length === 0) {
      const grasses = [];
      for (let i = 0; i < gGameEngine.grasses.length; i++) {
        const tile = gGameEngine.grasses[i];
        const material = gGameEngine.getTileMaterial(tile.position);
        if (material === 'grass') {
          grasses.push(tile);
        }
      }
      const min = Math.min(gGameEngine.tilesX, gGameEngine.tilesY);
      const targets = grasses.map(t => t.position).sort((a, b) => {
        const t1 = Math.abs(a.x - cx) ** 2 + Math.abs(a.y - cy) ** 2;
        const t2 = Math.abs(b.x - cx) ** 2 + Math.abs(b.y - cy) ** 2
        return t1 - t2;
      }).slice(0, min ** 2);
      const result = [];
      targets.map(({ x, y }) => {
        const grid = gGameEngine.grid.clone();
        const path = finder.findPath(cx, cy, x, y, grid);
        const next = path[1];
        const last = path[path.length - 1];
        if (!next) {
          return
        }
        const safe = this.isSafe({ x: last[0], y: last[1] })
        return safe && { x: next[0], y: next[1] };
      }).filter(t => {
        return t;
      }).forEach(item => {
        if (!result.some(t => t.x === item.x && t.y === item.y)) {
          result.push(item);
        }
      });

      return result;
    }

    return result;
  },

  /**
   * Returns near grass tiles.
   */
  getPossibleTargets: function () {
    const targets = [];
    for (let i = 0; i < 4; i++) {
      let dirX;
      let dirY;
      if (i == 0) { dirX = 1; dirY = 0; }
      else if (i == 1) { dirX = -1; dirY = 0; }
      else if (i == 2) { dirX = 0; dirY = 1; }
      else if (i == 3) { dirX = 0; dirY = -1; }

      const position = { x: this.position.x + dirX, y: this.position.y + dirY };
      if (gGameEngine.getTileMaterial(position) == 'grass' && !this.hasBomb(position)) {
        targets.push(position);
      }
    }

    const safeTargets = [];
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (this.isSafe(target)) {
        safeTargets.push(target);
      }
    }

    const isLucky = Math.random() > 0.25;
    return safeTargets.length > 0 && isLucky ? safeTargets : targets;
  },

  /**
   * Loads vectors and animation name for target position.
   */
  loadTargetPosition: function (position) {
    this.dirX = position.x - this.position.x;
    this.dirY = position.y - this.position.y;
    if (this.dirX == 1 && this.dirY == 0) {
      this.direction = 'right';
    } else if (this.dirX == -1 && this.dirY == 0) {
      this.direction = 'left';
    } else if (this.dirX == 0 && this.dirY == 1) {
      this.direction = 'down';
    } else if (this.dirX == 0 && this.dirY == -1) {
      this.direction = 'up';
    }
  },

  /**
   * Gets previous position by current position and direction vector.
   */
  getPreviousPosition: function () {
    const previous = { x: this.targetPosition.x, y: this.targetPosition.y };
    previous.x -= this.dirX;
    previous.y -= this.dirY;
    return previous;
  },

  /**
   * Returns random item from array.
   */
  getRandomTarget: function (targets, order) {
    let index;
    if (order) {
      const length = targets.length;
      const rates = Array.from({ length: length }).map((t, i) => {
        return ((length - i) ** 3) * Math.random();
      });
      const max = Math.max(...rates);
      index = rates.indexOf(max);
    } else {
      index = Math.floor(Math.random() * targets.length);
    }
    return targets[index];
  },

  applyBonus: function (bonus) {
    this._super(bonus);

    // It is too dangerous to have more bombs available
    this.bombsMax = 1;
  },

  /**
   * Game is over when no bots and one player left.
   */
  die: function () {
    this.alive = false;
    setTimeout(() => {
      this.init({
        x: gGameEngine.tilesX - 2,
        y: gGameEngine.tilesY - 2
      });
      this.killerPath = null;
      this.findTargetPosition();
      this.velocity = 2;
      this.bombsMax = 1;
      this.bombStrength = 1;
      this.alive = true;
    }, 3000)
  },

  /**
   * Checks whether there is any wood around.
   */
  getNearWood: function () {
    for (let i = 0; i < 4; i++) {
      let dirX;
      let dirY;
      if (i == 0) { dirX = 1; dirY = 0; }
      else if (i == 1) { dirX = -1; dirY = 0; }
      else if (i == 2) { dirX = 0; dirY = 1; }
      else if (i == 3) { dirX = 0; dirY = -1; }

      const position = { x: this.position.x + dirX, y: this.position.y + dirY };
      if (gGameEngine.getTileMaterial(position) == 'wood') {
        return gGameEngine.getTile(position);
      }
    }
  },

  /**
   * Checks whether player is near. If yes and we are angry, return true.
   */
  wantKillPlayer: function () {
    let isNear = gGameEngine.players.some((t) => {
      return t.position.x === this.position.x && t.position.y === this.position.y;
    });

    if (isNear) return true;

    for (let i = 0; i < 5; i++) {
      let dirX;
      let dirY;
      if (i == 0) { dirX = 1; dirY = 0; }
      else if (i == 1) { dirX = -1; dirY = 0; }
      else if (i == 2) { dirX = 0; dirY = 1; }
      else if (i == 3) { dirX = 0; dirY = -1; }
      else if (i === 5) { dirX = 0; dirY = 0; }

      const position = { x: this.position.x + dirX, y: this.position.y + dirY };
      for (let j = 0; j < gGameEngine.players.length; j++) {
        const player = gGameEngine.players[j];
        if (player.alive && Utils.comparePositions(player.position, position)) {
          isNear = true;
          break;
        }
      }
    }

    const isAngry = Math.random() > 0.5;
    if (isNear && isAngry) {
      return true;
    }
  },

  /**
   * Places the bomb in current position
   */
  plantBomb: function () {
    for (let i = 0; i < gGameEngine.bombs.length; i++) {
      const bomb = gGameEngine.bombs[i];
      if (Utils.comparePositions(bomb.position, this.position)) {
        return;
      }
    }

    if (this.bombs.length < this.bombsMax) {
      const bomb = new Bomb(this.position, this.bombStrength);
      gGameEngine.stage.addChild(bomb.bmp);
      this.bombs.push(bomb);
      gGameEngine.bombs.push(bomb);

      const that = this;
      bomb.setExplodeListener(function () {
        Utils.removeFromArray(that.bombs, bomb);
        that.wait = false;
      });
    }
  },

  /**
   * Checks whether position is safe  and possible explosion cannot kill us.
   */
  isSafe: function (position) {
    for (let i = 0; i < gGameEngine.bombs.length; i++) {
      const bomb = gGameEngine.bombs[i];
      const fires = bomb.getDangerPositions();
      for (let j = 0; j < fires.length; j++) {
        const fire = fires[j];
        if (Utils.comparePositions(fire, position)) {
          return false;
        }
      }
    }
    return true;
  },

  hasBomb: function (position) {
    for (let i = 0; i < gGameEngine.bombs.length; i++) {
      const bomb = gGameEngine.bombs[i];
      if (Utils.comparePositions(bomb.position, position)) {
        return true;
      }
    }
    return false;
  }
});

export {
  Bot
};