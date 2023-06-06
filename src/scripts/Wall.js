import { Tile } from "./Tile";
import { Utils } from "./Utils";
import { gGameEngine } from "./GameEngine";


const types = {
  0: [6, 6, 64, 64],
  1: [1, 0, 32, 32],
  2: [2, 0, 32, 32],
  3: [3, 0, 32, 32],
  4: [4, 0, 32, 32],
  5: [5, 0, 32, 32],
  6: [6, 0, 32, 32],
  7: [7, 0, 32, 32],
  8: [8, 0, 32, 32],
  9: [9, 0, 32, 32],
  10: [10, 1, 64, 64],
}

const Wall = Tile.extend({
  /**
   * Entity position on map grid
   */
  position: {},

  /**
   * Bitmap dimensions
   */
  size: {
    w: 32,
    h: 32
  },

  /**
   * Bitmap animation
   */
  bmp: null,

  material: 'wall',

  init: function (type = 0, position) {
    this.position = position;
    let img = gGameEngine.tilesImgs.wall;
    this.bmp = new createjs.Bitmap(img);
    const pixels = Utils.convertToBitmapPosition(position);
    this.bmp.x = pixels.x;
    this.bmp.y = pixels.y;
    const typePosition = types[type];
    this.bmp.sourceRect = new createjs.Rectangle(
      typePosition[0] * 32,
      typePosition[1] * 32,
      typePosition[2],
      typePosition[3]
    );
    this.bmp.scaleX = 0.5;
    this.bmp.scaleY = 0.5;
    gGameEngine.grid.setWalkableAt(position.x, position.y, false);
  },
});

export {
  Wall
};