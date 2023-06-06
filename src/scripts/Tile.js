import { Entity } from "./Entity";
import { Utils } from "./Utils";
import { gGameEngine } from "./GameEngine";


const Tile = Entity.extend({
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

  material: '',

  init: function (material, position) {
    this.material = material;
    this.position = position;
    let img;
    if (material == 'grass') {
      img = gGameEngine.tilesImgs.grass;
    } else if (material == 'wall') {
      img = gGameEngine.tilesImgs.wall;
    } else if (material == 'wood') {
      img = gGameEngine.tilesImgs.wood;
    }
    this.bmp = new createjs.Bitmap(img);
    const pixels = Utils.convertToBitmapPosition(position);
    this.bmp.x = pixels.x;
    this.bmp.y = pixels.y;

    if (material !== 'grass') {
      gGameEngine.grid.setWalkableAt(position.x, position.y, false);
    } 
  },

  update: function () {
  },

  remove: function () {
    gGameEngine.stage.removeChild(this.bmp);
    gGameEngine.grid.setWalkableAt(this.position.x, this.position.y, true);
    for (var i = 0; i < gGameEngine.tiles.length; i++) {
      var tile = gGameEngine.tiles[i];
      if (this == tile) {
        gGameEngine.tiles.splice(i, 1);
      }
    }
    for (var i = 0; i < gGameEngine.woods.length; i++) {
      var wood = gGameEngine.woods[i];
      if (this == wood) {
        gGameEngine.woods.splice(i, 1);
      }
    }
  }
});

export {
  Tile
};