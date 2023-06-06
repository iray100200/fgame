import { Class } from './core';
import { gGameEngine } from './GameEngine';
import { Diamond } from './Diamond';

const Who = {
  Player: 0,
  Enemy: 1,
};

const Dialogue = Class.extend({
  views: [],
  init: function (diamonds, current, dialogues) {
    this.dialogues = dialogues || [];
    this.count = diamonds.length;
    this.diamonds = diamonds;
    this.current = current;
    this.start();
  },
  start: function () {
    gGameEngine.playing = false;
    this.drawMask();
    const onTouch = () => {
      document.removeEventListener('touchend', onTouch);
      if (this.count === Diamond.colors.length) {
        return
      };
      this.continue();
    }
    document.addEventListener('touchend', onTouch);
  },
  drawMask: function () {
    if (this.mask) {
      return;
    }
    const mask = new createjs.Graphics().beginFill('rgba(0, 128, 0, 0.86)').drawRect(0, 0, gGameEngine.size.w, gGameEngine.size.h);
    this.mask = new createjs.Shape(mask);
    gGameEngine.stage.addChild(this.mask);

    if (this.count === Diamond.colors.length) {
      const success = new createjs.Bitmap(gGameEngine.dialogueImages.d6);
      const scale = gGameEngine.size.w / success.image.width
      success.scaleX = scale;
      success.scaleY = scale;
      success.y = gGameEngine.size.h / 2 - success.image.height * scale / 2;
      gGameEngine.stage.addChild(success);
      this.views.push(success);
      return
    }

    this.diamonds.forEach((t, index) => {
      const diamond = new createjs.Bitmap(gGameEngine[`diamond_${t.color}`]);
      const scale = 40 / diamond.image.width
      diamond.scaleX = scale;
      diamond.scaleY = scale;
      diamond.x = gGameEngine.size.w / 2 - ((this.diamonds.length - 1) / 2 - index) * 50 - 20;
      diamond.y = gGameEngine.size.h / 2 - 90;
      gGameEngine.stage.addChild(diamond);
      this.views.push(diamond);
    });

    const titles = Diamond.titles[this.current.color];

    const t01 = new createjs.Text(titles[0], 'bold 28px Arial', '#ffffff');
    t01.x = gGameEngine.size.w / 2 - t01.getMeasuredWidth() * 0.75 / 2;
    t01.y = gGameEngine.size.h / 2 - 180;
    t01.scaleX = 0.75;
    t01.scaleY = 0.75;
    gGameEngine.stage.addChild(t01);
    this.views.push(t01);

    const t02 = new createjs.Text(titles[1], 'bold 28px Arial', '#ffffff');
    t02.x = gGameEngine.size.w / 2 - t02.getMeasuredWidth() * 0.75 / 2;
    t02.y = gGameEngine.size.h / 2 - 140;
    t02.scaleX = 0.75;
    t02.scaleY = 0.75;
    gGameEngine.stage.addChild(t02);
    this.views.push(t02);

    const t1 = new createjs.Text(`恭喜你获得文化宝石${this.count}颗`, 'normal 28px Arial', '#ffffff');
    t1.x = gGameEngine.size.w / 2 - t1.getMeasuredWidth() * 0.75 / 2;
    t1.y = gGameEngine.size.h / 2 - 20;
    t1.scaleX = 0.75;
    t1.scaleY = 0.75;
    gGameEngine.stage.addChild(t1);

    const t2 = new createjs.Text(`还有${6 - this.count}颗达成目标`, 'normal 28px Arial', '#ffffff');
    t2.x = gGameEngine.size.w / 2 - t2.getMeasuredWidth() * 0.75 / 2;
    t2.y = gGameEngine.size.h / 2 + 20;
    t2.scaleX = 0.75;
    t2.scaleY = 0.75;
    gGameEngine.stage.addChild(t2);

    const t3 = new createjs.Text(`点击任意地方继续游戏`, 'normal 18px Arial', '#e0e0e0');
    t3.x = gGameEngine.size.w / 2 - t3.getMeasuredWidth() * 0.75 / 2;
    t3.y = gGameEngine.size.h - 60;
    t3.scaleX = 0.75;
    t3.scaleY = 0.75;
    gGameEngine.stage.addChild(t3);

    this.views.push(t1);
    this.views.push(t2);
    this.views.push(t3);

    this.views.push(this.mask);
  },
  drawPlayer: function () {
    const x = this.x1 = 30;
    const y = this.y1 = 240;
    const player = new createjs.Bitmap(gGameEngine.player);
    player.sourceRect = new createjs.Rectangle(40, 0, 40, 40);
    player.x = x;
    player.y = y;
    gGameEngine.stage.addChild(player);
    this.views.push(player);
  },
  drawEnemy: function () {
    const x = this.x2 = 30;
    const y = this.y2 = 300;
    const enemy = new createjs.Bitmap(gGameEngine.enemy);
    enemy.sourceRect = new createjs.Rectangle(0, 0, 40, 40);
    enemy.x = x;
    enemy.y = y;
    gGameEngine.stage.addChild(enemy);
    this.views.push(enemy);
  },
  destroy: function () {
    this.views.forEach((t) => {
      gGameEngine.stage.removeChild(t);
    });
    this.views = [];
  },
  who: {
    player: 0,
    enemy: 1
  },
  getDialogues: function () {
    return [
      // [this.x1, this.y1, 'Hello, I am Eva', Who.Player],
      // [this.x2, this.y2, 'Hello, I am Dva', Who.Enemy],
      // [this.x1, this.y1, 'How are you', Who.Player],
      // [this.x2, this.y2, 'I am fine, and you?', Who.Enemy]
    ]
  },
  current: 0,
  talks: new Map(),
  dialogue: function () {
    const dialogues = this.dialogues;
    if (dialogues && dialogues.length > 0) {
      this.drawPlayer();
      this.drawEnemy();
    } else {
      return
    }
    const tasks = dialogues.map(([x, y, text, who]) => {
      let talk
      if (this.talks.has(who)) {
        talk = this.talks.get(who);
      } else {
        talk = new Talk(x, y, who);
        this.talks.set(who, talk);
      }
      return () => talk.run(text);
    });
    new Queue(tasks).run(() => {
      document.addEventListener('touchend', this.continue.bind(this));
    });
  },
  continue: function () {
    this.destroy();
    this.talks.forEach((val) => {
      val.destroy();
    });
    setTimeout(() => {
      gGameEngine.playing = true;
    }, 300);
    document.removeEventListener('touchend', this.continue.bind(this));
  }
});

class Talk {
  constructor(x, y, who) {
    this.x = x;
    this.y = y;
    this.who = who;
  }
  views = []
  count = 0
  eventTarget = new EventTarget()
  draw = () => {
    if (this.count >= this.text.length) {
      this.ended = true;
      return
    };
    this.ended = false;
    if (this.textBmp) {
      gGameEngine.stage.removeChild(this.textBmp);
    }
    let currText = this.text.slice(0, this.count + 1);
    this.textBmp = new createjs.Text(currText, 'normal 24px Arial', '#ffffff');
    this.count++;
    this.textBmp.x = this.x + 48;
    this.textBmp.y = this.y + this.textBmp.getMeasuredHeight() / 2;
    gGameEngine.stage.addChild(this.textBmp);
    this.views.push(this.textBmp);
  }

  destroy = () => {
    this.views.forEach((t) => {
      gGameEngine.stage.removeChild(t);
    });
    this.views = [];
  }

  handleFPS = (resolve) => () => {
    this.draw();
    if (this.ended) {
      resolve();
      if (this.fps) {
        this.fps.destroy();
      }
    }
  }

  run(text) {
    this.count = 0;
    this.text = text;
    return new Promise((resolve) => {
      this.fps = new FPS(this.handleFPS(resolve));
      this.fps.run();
    })
  }
}

class Queue {
  constructor(tasks) {
    this.tasks = tasks
  }

  async run(cb) {
    if (this.tasks.length === 0) {
      if (cb) {
        cb();
      }
      return;
    };
    const task = this.tasks.shift();
    await task();
    await this.run(cb);
  }
}

class FPS {
  constructor(fn) {
    this.fn = fn;
  }

  nextTick = Date.now()

  fps = 10

  run() {
    if (this.destroyed) return;
    this.timer = requestAnimationFrame(this.run.bind(this));
    if (Date.now() - this.nextTick > 1000 / this.fps) {
      this.nextTick = Date.now();
      this.fn();
    }
  }

  destroy() {
    cancelAnimationFrame(this.timer);
    this.destroyed = true;
  }
}

export {
  Dialogue
}