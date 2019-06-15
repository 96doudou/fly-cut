let app; // pixi 应用
let bg;
let ground;
let pipeContainer;
let rect;
let bird;
let configName;
let levelConfig;
let ticker;
let bump;
let groupPipe = 2;
let canvas;
let barObj = { //进度条相关
  width: 28,
  height: 360,
  left: 52,
  top: 25,
}
let UIWidth = 750;
let UIHeight = 1334;
let groundHeight = 300; //地面高度
let errorHeight = 20; //小鸟撞地面得误差距离
let createCanvasTimer; //创建canvas 点击事件监听器
let progressText; //通过几根管子的文案
let game = {
  level: 1,
  levelConfig: {
    level1_config: {
      totalPipe: 6, //总管子数-对
      passPipe: 0, //已通过的管子
      pipeMaxHeight: 400, //上下管子最大高度
      pipeMinHeight: 200, //上下管子的最小高度
      pipeTotalHeight: 700, // 上下管子总和的最大高度
      pipeTopDis: 300, //上下管子之间的距离
      pipeLeftDis: 400, //管子左右的间距
      pipeStartX: UIWidth - 200,
      groundRepeateTimes: 0,
      groundRepeateWidth: 3000,
      birdUpSpeed: 70, //点击一次小鸟的运动位移
      drawBirdTimes: 0,
      birdStartX: UIWidth / 2
    }
  }
}

/**
 * 是否有自己的加载方法
 * @method haveSelfLoad
 * @return {boolean} 
 */
function haveSelfLoad() {
  return true;
}

/**
 * 展示load 及进度条
 * @method showLoad
 */
function showLoad() {
  PIXI.loader.add([
    "img/bg.png",
    "img/ground.png",
    "img/banner.png",
    "img/bird.png",
    "img/pipe.png",
    "img/pipe2.png",
    "img/gameoverbg.png",
    "img/bird-bar1.png",
    "img/bird-bar2.png",
    "./img/font.png",
    "./img/font.fnt"
  ]).on('progress', loadProgressHandler).load(setup);
}

/**
 * pixi 初始化-创建canvas设置初始大小等
 * @method init
 */
function init() {
  app = new PIXI.Application({
    width: 750,
    height: 1334,
    antialias: true,
    transparent: false,
    resolution: 1,
    id: 'canvas'
  })
  //加载碰撞js
  bump = new Bump(PIXI);
  document.body.appendChild(app.view);
  app.renderer.view.style.position = "absolute";
  app.renderer.view.style.display = "block";
  app.renderer.autoResize = true;
  app.renderer.resize(UIWidth, UIHeight);
  configName = `level${game.level}_config`;
  levelConfig = game.levelConfig[configName];
  handleCanvasClick();
}

/**
 * canvas 绑定点击事件
 * @method handleCanvasClick
 */
function handleCanvasClick() {
  canvas = document.getElementsByTagName("canvas")[0];
  if (canvas) {
    canvas.addEventListener("touchend", handleClick);
    window.clearInterval(createCanvasTimer);

  } else {
    console.log("canvas 不存在");
    createCanvasTimer = window.setInterval(handleCanvasClick, 100);
  }
}

/**
 * canvas 点击事件处理
 * @method handleClick
 */
function handleClick() {
  bird.y = bird.y - levelConfig.birdUpSpeed;
  levelConfig.drawBirdTimes = 0;
}

function loadProgressHandler(loader, resource) {
  console.log(loader.progress + "%");
}
/**
 * 主题逻辑
 * @method setup
 */

function setup() {
  init();
  startGame();
}

function startGame() {
  drawBg();
  drawPipes();
  drawBird();
  drawProgressBar();
  drawGround();
  ticker = app.ticker;
  ticker.add(delta => gameLoop(delta));
}

function drawBg() {
  bg = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache["img/bg.png"], levelConfig.groundRepeateWidth, 1334);
  bg.position.set(0, 0);
  app.stage.addChild(bg);
}

function drawGround() {
  ground = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache["img/ground.png"], levelConfig.groundRepeateWidth, 1334);
  // ground.scale.set(0.5, 0.5);
  ground.position.set(0, 0);
  app.stage.addChild(ground);
}

function drawPipes() {
  pipeContainer = new PIXI.Container();
  for (let index = 0; index < levelConfig.totalPipe; index++) {

    let topPipeTexture = PIXI.utils.TextureCache["img/pipe.png"];
    let bottomPipeTexture = PIXI.utils.TextureCache["img/pipe2.png"];
    //随机生成上管道高度
    let rangeTopHeight = Math.floor(Math.random() * (levelConfig.pipeMaxHeight - levelConfig.pipeMinHeight) + levelConfig.pipeMinHeight);
    //下管道高度
    let rangeBottomHeight = levelConfig.pipeTotalHeight - rangeTopHeight;
    //创建上下管道精灵
    let topPipe = new PIXI.Sprite(topPipeTexture);
    let bottomPipe = new PIXI.Sprite(bottomPipeTexture);
    //设置上管道截取坐标
    topPipe.position.set(index * levelConfig.pipeLeftDis + levelConfig.pipeStartX, -topPipe.height + rangeTopHeight);
    //设置下管道截取坐标
    bottomPipe.position.set(index * levelConfig.pipeLeftDis + levelConfig.pipeStartX, rangeTopHeight + levelConfig.pipeTopDis);
    //上下管道加入到管道容器中
    pipeContainer.addChild(topPipe);
    pipeContainer.addChild(bottomPipe);
  }
  app.stage.addChild(pipeContainer);
}

function drawBird() {
  let clumsy = PIXI.utils.TextureCache["img/bird.png"];
  bird = new PIXI.Sprite(clumsy);
  bird.position.set(levelConfig.birdStartX - bird.width, UIHeight / 2);
  app.stage.addChild(bird);
}


/**
 * 绘制通过管子数量的进度条
 * @method drawProgressBar
 */
function drawProgressBar() {
  let barContainer = new PIXI.Container();
  let bar = new PIXI.Graphics();
  let text = `${levelConfig.passPipe}/${levelConfig.totalPipe}`;

  //创建文字之前。先把原来的移除
  app.stage.removeChild(progressText);

  progressText = new PIXI.extras.BitmapText(text, {
    font: "36px font"
  });
  if (levelConfig.passPipe != 0) {
    bar.beginFill(0xFF7800);
    let height = Math.floor(barObj.height * levelConfig.passPipe / levelConfig.totalPipe);

    bar.drawRoundedRect(0, barObj.height - height, barObj.width, height, barObj.width / 2);
    bar.endFill();
    bar.position.set(barObj.left, barObj.top);
  }

  let bar1 = new PIXI.Sprite(PIXI.utils.TextureCache["img/bird-bar1.png"]);
  let bar2 = new PIXI.Sprite(PIXI.utils.TextureCache["img/bird-bar2.png"]);
  barContainer.addChild(bar1);
  barContainer.addChild(bar);
  barContainer.addChild(bar2);
  //凑的位置 把字凑到合适的位置 
  progressText.position.set(barObj.left - 18, barObj.height + 36 + 346);
  barContainer.position.set(0, 346);
  app.stage.addChild(barContainer);
  app.stage.addChild(progressText);
}

function gameLoop(delta) {
  if (isCollision()) {
    if (birdIsDown()) {
      ticker.stop();
    } else {
      canvas.removeEventListener("touchend", handleClick);
      drawDownBird();
    }
  } else {
    drawDownBird();
    if (bg.x - canvas.width >= -bg.width) {
      bg.x--;
      ground.x--;
      pipeContainer.x--;
    } else {
      bg.x = 0;
      ground.x = 0;
      levelConfig.groundRepeateTimes++;
    }
  }
}

function drawDownBird() {
  levelConfig.drawBirdTimes++;
  // bird.anchor.x = 0.5;
  // bird.anchor.y = 0.5;
  // bird.rotation = 45;
  //小鸟的下落位移  1/2*gt^2
  bird.y = bird.y + 0.5 * Math.pow(levelConfig.drawBirdTimes / 30, 2);
}
/**
 * 判断是否碰撞方法
 * @method isCollision
 * @param {object} sprite
 * @param {object} spriteArrary
 * @return {boolean} 
 */

function isCollision(sprite, spriteArrary) {
  let isCollision = false;
  //小鸟撞到地面或上天
  isCollision = birdIsDown() || birdIsUp();
  bump.hit(bird, pipeContainer.children, false, false, true, function (collision, platform) {
    isCollision = true;
  });
  pipeContainer.children.forEach((val, index) => {
    if (index % groupPipe == 0 && levelConfig.passPipe == index / groupPipe) {
      //判断鸟和当前地面得位置
      let birdPosX = bird.x - ground.x + ((levelConfig.groundRepeateWidth - canvas.width) * levelConfig.groundRepeateTimes);
      //当前柱子得x坐标 
      let pipePosX = Math.floor(index / groupPipe) * levelConfig.pipeLeftDis + levelConfig.pipeStartX + val.width;
      console.log(birdPosX, pipePosX);
      if (birdPosX == pipePosX) {
        levelConfig.passPipe++;
        if (levelConfig.passPipe >= levelConfig.totalPipe) {
          alert("下一关");
        }
        drawProgressBar();
      }
    }
  });
  return isCollision;
}

/**
 * 判断小鸟是不是撞在地上
 * @method birdIsDown
 * @return {boolean}
 */

function birdIsDown() {
  if (bird.y >= UIHeight - groundHeight - bird.height * 2 - errorHeight) {
    return true;
  }

}

/**
 * 判断小鸟是不是要上天
 * @method birdIsUp
 * @return {boolean}
 */
function birdIsUp() {
  if (bird.y <= 0) {
    return true;
  }
}

showLoad();