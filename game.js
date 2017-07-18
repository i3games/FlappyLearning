(function () { // TODO figure out what this does and remove it
  var timeouts = [];
  var messageName = 'zero-timeout-message';

  function setZeroTimeout (fn) {
    timeouts.push(fn);
    window.postMessage(messageName, '*'); 
  }

  function handleMessage (event) {
    if (event.source === window && event.data === messageName) {
      event.stopPropagation();
      if (timeouts.length > 0) {
        var fn = timeouts.shift();
        fn();
      }
    }
  }

  window.addEventListener('message', handleMessage, true);

  window.setZeroTimeout = setZeroTimeout;
})();

class Bird {
  constructor (params) {
    this.x = 80;
    this.y = 250;
    this.width = 40;
    this.height = 30;

    this.alive = true;
    this.gravity = 0;
    this.velocity = 0.3;
    this.jump = -6;

    this.init(params);
  }

  init (params) {
    for (let i in params) {
      this[i] = params[i]; // ???
    }
  }

  flap () {
    this.gravity = this.jump;
  }

  update () {
    this.gravity = this.gravity + this.velocity;
    this.y = this.y + this.gravity;
  }

  isDead (height, pipes) {
    if (this.y >= height || this.y + this.height <= 0) {
      return true;
    }

    for (let i in pipes) {
      if (!(this.x > pipes[i].x + pipes[i].width ||
        this.x + this.width < pipes[i].x ||
        this.y > pipes[i].y + pipes[i].height ||
        this.y + this.height < pipes[i].y)) {
        return true;
      }
    }
  }
  }

class Pipe {
  constructor (params) {
    this.x = 0;
    this.y = 0;
    this.width = 50;
    this.height = 40;
    this.speed = 3;

    this.init(params);
  }

  init (params) {
    for (let i in params) {
      this[i] = params[i];
    }
  }

  update () {
    this.x = this.x - this.speed;
  }

  isOut () {
    return (this.x + this.width < 0);
  }
  }

class Game {
  constructor (neuvol, assets) {
    this.neuvol = neuvol;
    this.assets = assets;

    this.fps = 60;
    this.pipes = [];
    this.birds = [];
    this.score = 0;
    this.canvas = document.querySelector('#flappy'); // :(
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.spawnInterval = 90;
    this.interval = 0;
    this.gen = [];
    this.alives = 0;
    this.generation = 0;
    this.backgroundSpeed = 0.5;
    this.backgroundx = 0;
    this.maxScore = 0;
  }

  start () {
    this.preload(this.assets); // TODO replace callback in preload with a Promise
  }

  preload (images) {
    function load (sources, callback) {
      let nb = 0;
      let loaded = 0;
      let imgs = {};
      for (var i in sources) {
        nb++;
        imgs[i] = new Image();
        imgs[i].src = sources[i];
        imgs[i].onload = () => {
          loaded++;
          if (loaded === nb) {
            callback(imgs);
          }
        };
      }
    }
    load(images, (imgs) => {
      this.images = imgs;
      this.init();
      this.update();   // setTimeout
      this.display(); // requestAnimationFrame
    });
  }

  init () {
    this.interval = 0;
    this.score = 0;
    this.pipes = [];
    this.birds = [];

    this.gen = this.neuvol.nextGeneration(); //
    for (let i in this.gen) { // TODO
      let b = new Bird();
      this.birds.push(b);
    }
    this.generation++;
    this.alives = this.birds.length;
  }

  update () {
    this.backgroundx = this.backgroundx + this.backgroundSpeed;
    let nextHole = 0;
    if (this.birds.length > 0) {
      for (let i = 0; i < this.pipes.length; i = i + 2) {
        if (this.pipes[i].x + this.pipes[i].width > this.birds[0].x) {
          nextHole = this.pipes[i].height / this.height;
          break;
        }
      }
    }

    for (let i in this.birds) {
      if (this.birds[i].alive) {
        const inputs = [this.birds[i].y / this.height, nextHole];
        const res = this.gen[i].compute(inputs, null); // Network
        if (res > 0.5) {
          this.birds[i].flap();
        }
        this.birds[i].update();
        if (this.birds[i].isDead(this.height, this.pipes)) {
          this.birds[i].alive = false;
          this.alives--;
          this.neuvol.networkScore(this.gen[i], this.score);
          if (this.isItEnd()) { this.init(); } // update and render continue running
        }
      }
    }

    for (let p = 0; p < this.pipes.length; p++) {
      this.pipes[p].update();
      if (this.pipes[p].isOut()) {
        this.pipes.splice(p, 1);
        p--;
      }
    }

    if (this.interval === 0) {
      const deltaBord = 50;
      const pipeHole = 120;
      const holePosition = Math.round(Math.random() * (this.height - deltaBord * 2 - pipeHole)) + deltaBord;
      this.pipes.push(new Pipe({ x: this.width, y: 0, height: holePosition }));
      this.pipes.push(new Pipe({ x: this.width, y: holePosition + pipeHole, height: this.height }));
    }

    this.interval++;
    if (this.interval === this.spawnInterval) {
      this.interval = 0;
    }

    this.score++;
    this.maxScore = (this.score > this.maxScore) ? this.score : this.maxScore;

    if (this.fps === 0) { // update runs on a setTimeout
      setZeroTimeout(() => { this.update(); });
    } else {
      setTimeout(() => { this.update(); }, 1000 / this.fps);
    }
  }

  isItEnd () {
    for (let i in this.birds) {
      if (this.birds[i].alive) {
        return false;
      }
    }
    return true;
  }

  display () {
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (let i = 0; i < Math.ceil(this.width / this.images.background.width) + 1; i++) {
      this.ctx.drawImage(this.images.background,
            i * this.images.background.width - Math.floor(this.backgroundx % this.images.background.width), 0);
    }

    for (let i in this.pipes) {
      if (i % 2 === 0) {
        this.ctx.drawImage(this.images.pipetop,
                this.pipes[i].x,
                this.pipes[i].y + this.pipes[i].height - this.images.pipetop.height,
                this.pipes[i].width, this.images.pipetop.height);
      } else {
        this.ctx.drawImage(this.images.pipebottom,
                  this.pipes[i].x, this.pipes[i].y, this.pipes[i].width, this.images.pipetop.height);
      }
    }

    this.ctx.fillStyle = '#FFC600';
    this.ctx.strokeStyle = '#CE9E00';
    for (let i in this.birds) {
      if (this.birds[i].alive) {
        this.ctx.save();
        this.ctx.translate(this.birds[i].x + this.birds[i].width / 2,
                    this.birds[i].y + this.birds[i].height / 2);
        this.ctx.rotate(Math.PI / 2 * this.birds[i].gravity / 20);
        this.ctx.drawImage(this.images.bird,
                      -this.birds[i].width / 2, -this.birds[i].height / 2, this.birds[i].width, this.birds[i].height);
        this.ctx.restore();
      }
    }

    this.ctx.fillStyle = 'white';
    this.ctx.font = '20px Oswald, sans-serif';
    this.ctx.fillText(`Score : ${this.score}`, 10, 25);
    this.ctx.fillText(`Max Score : ${this.maxScore}`, 10, 50);
    this.ctx.fillText(`Generation : ${this.generation}`, 10, 75);
    this.ctx.fillText(`Alive : ${this.alives} / ${this.neuvol.options.population}`, 10, 100);

    requestAnimationFrame(() => { // display runs on requestAnimationFrame
      this.display();
    });
  }
              }

let game;

window.onload = () => {
  const sprites = {
    bird: './img/bird.png',
    background: './img/background.png',
    pipetop: './img/pipetop.png',
    pipebottom: './img/pipebottom.png'
  };

  function start () {
    const neuvol = new NeuroEvolution({
      population: 50,
      network: [2, [2], 1]
    });
    game = new Game(neuvol, sprites);
    game.start();
  }

  start();
};

function speed (fps) { // TODO work on the UI side
  game.fps = parseInt(fps);
}
