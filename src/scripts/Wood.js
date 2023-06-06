import { Utils } from './Utils';
import { Tile } from './Tile';
import { gGameEngine } from './GameEngine';

const Wood = Tile.extend({
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

  material: 'wood',

  init: function (position) {
    this.position = position;
    const img = gGameEngine.tilesImgs.wall;
    this.bmp = new createjs.Bitmap(img);
    const pixels = Utils.convertToBitmapPosition(position);
    this.bmp.x = pixels.x;
    this.bmp.y = pixels.y;
    this.bmp.sourceRect = new createjs.Rectangle(
      0,
      6 * 32,
      64,
      64
    );
    this.bmp.scaleX = 0.5;
    this.bmp.scaleY = 0.5;
    gGameEngine.grid.setWalkableAt(position.x, position.y, false);
  },

  update: function () {
  },

  remove: function () {
    gGameEngine.stage.removeChild(this.bmp);
    gGameEngine.grid.setWalkableAt(this.position.x, this.position.y, true);
    for (let i = 0; i < gGameEngine.tiles.length; i++) {
      const tile = gGameEngine.tiles[i];
      if (this == tile) {
        gGameEngine.tiles.splice(i, 1);
      }
    }
    for (var i = 0; i < gGameEngine.woods.length; i++) {
      const wood = gGameEngine.woods[i];
      if (this == wood) {
        gGameEngine.woods.splice(i, 1);
      }
    }
  }
});

export {
  Wood
};