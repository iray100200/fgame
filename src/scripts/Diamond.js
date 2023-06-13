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
  // We start with the customer experience and work backwards to the technology.
  red: ['客户至上 光芒万丈', 'We start with the customer experience', 'and work backwords to the technology.', '- Steve Jobs'],
  // None of us is as smart as all of us.
  blue: ['同舟共济 融合共赢', 'None of us is an smart as all of us.', '- Kenneth H. Blanchard'],
  // The best way to predict the future is to create it.
  lime: ['创新不止 未来无限', 'The besy way to predict the future is to', 'create it.', '- Peter Drucker'],
  // Change is the law of life, and those who look only to the past or the present are certain to miss the future.
  purple: ['拥抱变化 同心同行', 'Change is the law of life, and those who look', 'only to the past or the present are certain to miss the future.', '- John F. Kennedy'],
  // Think of technology more like a pain brush of an artist.
  turquoise: ['夯实技术 追求艺术', 'Think of technology more like a pain brush', 'of an artist.', '- Ned Johnson'],
  // Live as if you were to die tomorrow, learn as if you were to live forever.
  orange: ['蓄力成长 共创辉煌', 'Live as if you were to die tomorrow, learn as', 'if you were to live forever.', '- Mahatma Grandhi']
}

export {
  Diamond
};