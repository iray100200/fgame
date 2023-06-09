import { Entity } from "./Entity";
import { Utils } from "./Utils";
import { gGameEngine } from "./GameEngine";


const Bonus = Entity.extend({
  types: ['speed', 'bomb', 'fire'],

  type: '',
  position: {},
  bmp: null,

  init: function (position, typePosition) {
    this.type = this.types[typePosition];

    this.position = position;

    this.bmp = new createjs.Bitmap(gGameEngine.bonusesImg);
    const pixels = Utils.convertToBitmapPosition(position);
    this.bmp.x = pixels.x;
    this.bmp.y = pixels.y;
    this.bmp.sourceRect = new createjs.Rectangle(typePosition * 32, 0, 32, 32);
    gGameEngine.stage.addChild(this.bmp);
  },

  destroy: function () {
    gGameEngine.stage.removeChild(this.bmp);
    Utils.removeFromArray(gGameEngine.bonuses, this);

    if (!gGameEngine.mute) {
      const bonusSound = createjs.Sound.play('bonus');
      bonusSound.volume = gGameEngine.soundVolume.bonus;
    }
  }
});

export {
  Bonus
};