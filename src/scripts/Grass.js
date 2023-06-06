import { Tile } from './Tile';
import { Utils } from './Utils';
import { gGameEngine } from './GameEngine';


const Grass = Tile.extend({
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

  straw: null,

  material: 'grass',

  init: function (position) {
    const img = gGameEngine.tilesImgs.grass;
    this.position = position;
    this.bmp = new createjs.Bitmap(img);
    const pixels = Utils.convertToBitmapPosition(position);
    this.bmp.x = pixels.x;
    this.bmp.y = pixels.y;
    this.bmp.sourceRect = new createjs.Rectangle(3, 3, 34, 34);
    this.bmp.scaleX = 32 / 34;
    this.bmp.scaleY = 32 / 34;

    const hasRandomGrass = Math.random() > 0.8;
    if (hasRandomGrass) {
      this.straw = new createjs.Bitmap(gGameEngine.tilesImgs.straw);
      this.straw.x = pixels.x + (Math.random() * 8) * (Math.random() > 0.5 ? -1 : 1);
      this.straw.y = pixels.y + (Math.random() * 8) * (Math.random() > 0.5 ? -1 : 1);
      const random1 = Math.round(Math.random() * 10) % 3;
      const random2 = Math.round(Math.random() * 10) % 3;
      this.straw.sourceRect = new createjs.Rectangle((random1 - 1) * 64, (random2 - 1) * 64, 64, 64);
      this.straw.scaleX = 32 / 64;
      this.straw.scaleY = 32 / 64;
    }
  },

  update: function () {
  },

  remove: function () {  
  }
});

export {
  Grass
};