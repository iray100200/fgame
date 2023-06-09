import { Entity } from "./Entity";
import { Utils } from "./Utils";
import { gGameEngine } from "./GameEngine";


const Fire = Entity.extend({
  /**
   * Entity position on map grid
   */
  position: {},

  /**
   * Bitmap dimensions
   */
  size: {
    w: 38,
    h: 38
  },

  /**
   * Bitmap animation
   */
  bmp: null,

  /**
   * The bomb that triggered this fire
   */
  bomb: null,

  init: function (position, bomb) {
    this.bomb = bomb;

    const spriteSheet = new createjs.SpriteSheet({
      images: [gGameEngine.fireImg],
      frames: { width: this.size.w, height: this.size.h, regX: 0, regY: 0 },
      animations: {
        idle: [0, 5, null, 0.4],
      }
    });
    this.bmp = new createjs.Sprite(spriteSheet);
    this.bmp.gotoAndPlay('idle');
    const that = this;
    this.bmp.addEventListener('animationend', function () {
      that.remove();
    });

    this.position = position;

    const pixels = Utils.convertToBitmapPosition(position);
    this.bmp.x = pixels.x + 2;
    this.bmp.y = pixels.y - 5;

    gGameEngine.stage.addChild(this.bmp);
  },

  update: function () {
  },

  remove: function () {
    if (this.bomb.explodeListener) {
      this.bomb.explodeListener();
      this.bomb.explodeListener = null;
    }

    gGameEngine.stage.removeChild(this.bmp);

    for (let i = 0; i < this.bomb.fires.length; i++) {
      const fire = this.bomb.fires[i];
      if (this == fire) {
        this.bomb.fires.splice(i, 1);
      }
    }

    for (let i = 0; i < gGameEngine.bombs.length; i++) {
      const bomb = gGameEngine.bombs[i];
      if (this.bomb == bomb) {
        gGameEngine.bombs.splice(i, 1);
      }
    }
  }
});

export {
  Fire
};