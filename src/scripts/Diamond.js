import { Entity } from "./Entity";
import { Utils } from "./Utils";
import { gGameEngine } from "./GameEngine";

const Diamond = Entity.extend({
  type: 'diamond',
  position: {},
  bmp: null,
  init: function (position, color) {
    this.position = position;
    this.color = color;

    this.bmp = new createjs.Bitmap(gGameEngine[`diamond_${color}`]);
    const pixels = Utils.convertToBitmapPosition(position);
    this.bmp.x = pixels.x;
    this.bmp.y = pixels.y;
    this.bmp.scaleX = gGameEngine.tileSize / this.bmp.image.width;
    this.bmp.scaleY = gGameEngine.tileSize / this.bmp.image.height;
    this.bmp.sourceRect = new createjs.Rectangle(0, 0, this.bmp.image.width, this.bmp.image.height);
    gGameEngine.stage.addChild(this.bmp);
  },

  destroy: function () {
    gGameEngine.stage.removeChild(this.bmp);
    Utils.removeFromArray(gGameEngine.diamonds, this);

    if (!gGameEngine.mute) {
      const diamondSound = createjs.Sound.play('diamond');
      diamondSound.volume = gGameEngine.soundVolume.diamond;
    }

    // gGameEngine.menu.diamondText(Diamond.titles[this.color], this.color);

    gGameEngine.eventBus.dispatchEvent(new CustomEvent('gain', {
      detail: this.color,
    }))
  }
});

Diamond.colors = ['red', 'blue', 'lime', 'orange', 'purple', 'turquoise']
Diamond.titles = {
  red: ['客户至上 光芒万丈', 'Customer Obsessed'],
  blue: ['同心同行 融合共赢', 'Together we achieve more'],
  lime: ['创新不止 未来无限', 'Endless Applied Innovation'],
  purple: ['引领变革 机会难得', 'Change brings new opportunities'],
  turquoise: ['夯实技术 追求艺术', 'Passion for Excellence'],
  orange: ['蓄力成长 共创辉煌', 'Live and Learn']
}

export {
  Diamond
};