import { gGameEngine } from "./GameEngine";

const Utils = {};

/**
 * Returns true if positions are equal.
 */
Utils.comparePositions = function (pos1, pos2) {
  return pos1.x == pos2.x && pos1.y == pos2.y;
};


/**
 * Convert bitmap pixels position to entity on grid position.
 */
Utils.convertToEntityPosition = function (pixels) {
  const position = {};
  position.x = Math.round(pixels.x / gGameEngine.tileSize);
  position.y = Math.round(pixels.y / gGameEngine.tileSize);
  return position;
};

/**
 * Convert entity on grid position to bitmap pixels position.
 */
Utils.convertToBitmapPosition = function (entity) {
  const position = {};
  position.x = entity.x * gGameEngine.tileSize;
  position.y = entity.y * gGameEngine.tileSize;
  return position;
};

/**
 * Removes an item from array.
 */
Utils.removeFromArray = function (array, item) {
  for (let i = 0; i < array.length; i++) {
    if (item == array[i]) {
      array.splice(i, 1);
    }
  }
  return array;
};

export {
  Utils
};