import { Entity } from './Entity';
import { Utils } from './Utils';
import { gGameEngine } from './GameEngine';
import { Fire } from './Fire';

const Bomb = Entity.extend({
  /**
   * Entity position on map grid
   */
  position: {},

  /**
   * How far the fire reaches when bomb explodes
   */
  strength: 1,

  /**
   * Bitmap dimensions
   */
  size: {
    w: 28,
    h: 28
  },

  /**
   * Bitmap animation
   */
  bmp: null,

  /**
   * Timer in frames
   */
  timer: 0,

  /**
   * Max timer value in seconds
   */
  timerMax: 2,

  exploded: false,

  fires: [],

  explodeListener: null,

  init: function (position, strength) {
    this.strength = strength;

    const spriteSheet = new createjs.SpriteSheet({
      images: [gGameEngine.bombImg],
      frames: {
        width: this.size.w,
        height: this.size.h,
        regX: 5,
        regY: 5
      },
      animations: {
        idle: [0, 4, 'idle', 0.2]
      }
    });
    this.bmp = new createjs.Sprite(spriteSheet);
    this.bmp.gotoAndPlay('idle');

    this.position = position;

    const pixels = Utils.convertToBitmapPosition(position);
    this.bmp.x = pixels.x + this.size.w / 4;
    this.bmp.y = pixels.y + this.size.h / 4;

    this.fires = [];

    // Allow players and bots that are already on this position to escape
    const players = gGameEngine.getPlayersAndBots();
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      if (Utils.comparePositions(player.position, this.position)) {
        player.escapeBomb = this;
      }
    }

    // gGameEngine.grid.setWalkableAt(position.x, position.y, false);
  },

  update: function () {
    if (!gGameEngine.playing) {
      return;
    }
    if (this.exploded) { return; }

    this.timer++;
    if (this.timer > this.timerMax * createjs.Ticker.getMeasuredFPS()) {
      this.explode();
    }
  },

  explode: function () {
    this.exploded = true;

    if (!gGameEngine.mute && gGameEngine.soundtrackPlaying) {
      const bombSound = createjs.Sound.play('bomb');
      bombSound.volume = gGameEngine.soundVolume.bomb;
    }

    // Fire in all directions!
    const positions = this.getDangerPositions();
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      this.fire(position);

      const material = gGameEngine.getTileMaterial(position);
      if (material == 'wood') {
        const tile = gGameEngine.getTile(position);
        tile.remove();
      } else if (material == 'grass') {
        // Explode bombs in fire
        for (let j = 0; j < gGameEngine.bombs.length; j++) {
          const bomb = gGameEngine.bombs[j];
          if (!bomb.exploded
            && Utils.comparePositions(bomb.position, position)) {
            bomb.explode();
          }
        }
      }
    }

    this.remove();
  },

  /**
   * Returns positions that are going to be covered by fire.
   */
  getDangerPositions: function () {
    const positions = [];
    positions.push(this.position);

    for (let i = 0; i < 4; i++) {
      let dirX;
      let dirY;
      if (i == 0) { dirX = 1; dirY = 0; }
      else if (i == 1) { dirX = -1; dirY = 0; }
      else if (i == 2) { dirX = 0; dirY = 1; }
      else if (i == 3) { dirX = 0; dirY = -1; }

      for (let j = 1; j <= this.strength; j++) {
        let explode = true;
        let last = false;

        const position = { x: this.position.x + j * dirX, y: this.position.y + j * dirY };


        const material = gGameEngine.getTileMaterial(position);
        if (material == 'wall') { // One can not simply burn the wall
          explode = false;
          last = true;
        } else if (material == 'wood') {
          explode = true;
          last = true;
        }

        if (explode) {
          positions.push(position);
        }

        if (last) {
          break;
        }
      }
    }

    return positions;
  },

  fire: function (position) {
    const fire = new Fire(position, this);
    this.fires.push(fire);
  },

  remove: function () {
    gGameEngine.stage.removeChild(this.bmp);
    // gGameEngine.grid.setWalkableAt(this.position.x, this.position.y, true);
  },

  setExplodeListener: function (listener) {
    this.explodeListener = listener;
  }
});

export {
  Bomb
};