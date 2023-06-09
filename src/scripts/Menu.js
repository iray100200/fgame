import { Class } from './core';
import { gGameEngine } from './GameEngine';

const Menu = Class.extend({
  visible: true,

  title: null,
  mask: null,

  init: function () {
    gGameEngine.botsCount = 0;
    gGameEngine.playersCount = 0;

    this.showLoader();
  },

  hide: function () {
    this.visible = false;
    gGameEngine.stage.removeChild(this.title);
    gGameEngine.stage.removeChild(this.mask);
    gGameEngine.stage.removeChild(this.startBtn);
    gGameEngine.stage.removeChild(this.orderBtn);
    this.title = null;
    this.mask = null;
    this.startBtn = null;
    this.orderBtn = null;
  },

  text: function (text = 'Please standy by', style = 'bold 28px Helvetica', color = '#ffffff') {
    if (this.title) {
      gGameEngine.stage.removeChild(this.title);
    }
    text = String(text).toUpperCase();
    this.title = new createjs.Text(text, style, color);
    const titleWidth = this.title.getMeasuredWidth();
    this.title.x = gGameEngine.size.w / 2 - titleWidth / 2;
    this.title.y = gGameEngine.size.h / 2 - this.title.getMeasuredHeight() / 2;
    gGameEngine.stage.addChild(this.title);
    gGameEngine.moveToFront(this.title);
  },

  show: function () {
    this.visible = true;
    if (this.mask) {
      return;
    }
    const mask = new createjs.Graphics().beginFill('rgba(0, 0, 0, 0.5)').drawRect(0, 0, gGameEngine.size.w, gGameEngine.size.h);
    this.mask = new createjs.Shape(mask);
    gGameEngine.stage.addChild(this.mask);
  },

  showLoader: function () {
    const bgGraphics = new createjs.Graphics().beginFill('green').drawRect(0, 0, gGameEngine.size.w, gGameEngine.size.h);
    const bg = new createjs.Shape(bgGraphics);
    gGameEngine.stage.addChild(bg);

    const loadingText = new createjs.Text('Loading...', '20px Helvetica', '#FFFFFF');
    loadingText.x = gGameEngine.size.w / 2 - loadingText.getMeasuredWidth() / 2;
    loadingText.y = gGameEngine.size.h / 2 - loadingText.getMeasuredHeight() / 2;
    gGameEngine.stage.addChild(loadingText);
    gGameEngine.stage.update();
  },

  showMenus: function () {
    gGameEngine.playing = false;
    this.show();
    const w1 = 235;
    const h1 = 80;
    const x1 =  gGameEngine.size.w / 2 - w1 * 0.75 / 2;
    const y1 = gGameEngine.size.h - 150;

    const startBtn = this.startBtn = new createjs.Bitmap('/assets/img/start.png');
    startBtn.scaleX = 0.75;
    startBtn.scaleY = 0.75;
    startBtn.x = x1;
    startBtn.y = y1;
    startBtn.sourceRect = new createjs.Rectangle(0, 0, w1, h1);
    gGameEngine.stage.addChild(startBtn);
    gGameEngine.stage.update();

    startBtn.addEventListener('mousedown', function() {
      if (gGameEngine.hasStarted) {
        gGameEngine.continue();
      } else {
        gGameEngine.start();
      }
    });

    const orderBtn = this.orderBtn = new createjs.Bitmap('/assets/img/order.png');
    orderBtn.x = gGameEngine.size.w / 2 - 120 / 2;
    orderBtn.y = 80;
    orderBtn.sourceRect = new createjs.Rectangle(0, 0, 120, 106);
    gGameEngine.stage.addChild(orderBtn);
    gGameEngine.stage.update();

    orderBtn.addEventListener('click', function() {
      window.open('/result', '_blank');
    });
  },

  diamondText: function (text, color, style = 'normal 24px Helvetica') {
    const label = new createjs.Text(text.toUpperCase(), style, color);
    const y = 40;
    const x =  gGameEngine.size.w / 2 - label.getMeasuredWidth() / 2;
    label.x = x;
    label.y = y;
    gGameEngine.stage.addChild(label);
    setTimeout(() => {
      gGameEngine.stage.removeChild(label);
    }, 3000)
  }
});

export {
  Menu
}