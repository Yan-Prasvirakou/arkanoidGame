let game = {
	width: 640,
	height: 360,
	ctx: undefined,
	rows: 4,
	cols: 8,
	running: true,
	score: 0,
	lives: 3,
	level: 1,
	blocks: [],
	animationID: undefined,
	numberOfBlocks: 32,
	sprites: {
		bg: undefined,
		platform: undefined,
		ball: undefined,
		mainBlocks: undefined,
		redBlocks: undefined,
		greenBlocks: undefined,
	},

	init() {
		let canvas = document.querySelector('canvas');
		this.ctx = canvas.getContext('2d');

		window.addEventListener('keydown', (event) => {
			if (event.code == 'ArrowLeft') {
				game.platform.dx = -game.platform.velocity;
			} else if (event.code == 'ArrowRight') {
				game.platform.dx = game.platform.velocity;
			} else if (event.code == 'Space') {
				game.platform.releaseBall();
			} else if (event.code == 'Enter') {
				if (this.running && this.lives) {
					window.cancelAnimationFrame(this.animationID);
					this.running = false;
					this.renderStopScreen('Pause');
				} else if (this.lives) {
					this.running = true;
					this.run();
				}
			}
		})

		window.addEventListener('keyup', () => {
			game.platform.stop();
		})
	},

	load() {
		for (let key in this.sprites) {
			this.sprites[key] = new Image();
			this.sprites[key].src = `img/${key}.png`;
		}
	},

	setBlockType(blockType) {
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				this.blocks.push({
					x: 68 * col + 50, // 68 - это размер блока + отступ
					// на col умножаем, чтобы блоки шли друг другом, а не накладывались одн на другой
					y: 38 * row + 35, // аналогично с row, 35 - отсутп от верхнего края
					width: 64,
					height: 32,
					isAlive: true,
					type: blockType,
				})
			}
		}
	},

	create() {
		if (this.level <= 2) this.setBlockType(this.sprites.mainBlocks)
		else if (this.level >= 3 && this.level <= 5) this.setBlockType(this.sprites.redBlocks)
		else if (this.level >= 6) this.setBlockType(this.sprites.greenBlocks)
	},

	start() {
		this.init();
		this.load();
		this.create();
		this.run();
	},

	render() {
		this.ctx.clearRect(0, 0, this.width, this.height);
		this.ctx.drawImage(this.sprites.bg, 0, 0);
		this.ctx.drawImage(this.sprites.platform, this.platform.x, this.platform.y);
		this.ctx.drawImage(
			this.sprites.ball, this.ball.width * this.ball.frame, 0, this.ball.width,
			this.ball.height, this.ball.x, this.ball.y, this.ball.width, this.ball.height
		);

		this.blocks.forEach(function (el) {
			if (el.isAlive) {
				// this.ctx.drawImage(this.sprites.mainBlocks, el.x, el.y);
				this.ctx.drawImage(el.type, el.x, el.y);
			}
		}, this); // если вторым аргументом не указать this, метод forEsch не поймет это слово

		this.ctx.font = '20px Arial';
		this.ctx.fillStyle = '#fff';
		this.ctx.textAlign = 'left';
		this.ctx.textBaseline = 'middle';
		this.ctx.fillText(`Level: ${this.level}    Score: ${this.score}    Lives: ${this.lives}`, 15, this.height - 10);
	},

	update() {
		if (this.ball.collide(this.platform) && !this.ball.onThePlatformBottom()) this.ball.bumpPlatform(this.platform);
		if (this.ball.onThePlatformBottom()) this.ball.moveDown();


		if (this.platform.dx) this.platform.move();

		if (this.ball.dx || this.ball.dy) this.ball.move();

		this.blocks.forEach(function (el) {
			if (el.isAlive) {
				if (this.ball.collide(el)) {
					this.ball.bumpBlock(el);
				}
			}
		}, this)

		this.ball.checkBounds();
		this.platform.checkBounds();
	},

	run() {
		this.update();
		this.render();

		if (this.running) {
			this.animationID = window.requestAnimationFrame(() => {
				game.run()
			})
		}
	},

	renderStopScreen(text) {
		this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
		this.ctx.fillRect(0, 0, this.width, this.height);

		this.ctx.font = '32px "Arial"';
		this.ctx.fillStyle = '#fff';
		this.ctx.textAlign = 'center';
		this.ctx.textBaseline = 'middle';
		this.ctx.fillText(text, this.width / 2, this.height / 2);
	},

	over() {
		window.cancelAnimationFrame(this.animationID);
		this.running = false;
		this.renderStopScreen('Game Over');
		setTimeout(() => {
			window.location.reload();
		}, 4000);
	},

}


game.ball = {
	width: 22,
	height: 22,
	frame: 0,
	x: 340,
	y: 278,
	dx: 0,
	dy: 0,
	velocity: 3,
	animation: undefined,
	jump() {
		this.dy = -this.velocity;
		this.dx = -this.velocity;
		this.animate();
	},
	animate() {
		this.animation = setInterval(() => {
			game.ball.frame++;
			if (game.ball.frame > 3) game.ball.frame = 0
		}, 80)
	},
	returnBalltoPlatform() {
		clearInterval(this.animation);
		this.x = game.numberOfBlocks ? game.platform.x + game.platform.width / 2 - this.width / 2 : 340;
		this.y = game.platform.y - this.height;
		this.dx = 0;
		this.dy = 0;
		game.platform.ball = game.ball;
	},
	move() {
		this.x += this.dx;
		this.y += this.dy;
	},
	collide(el) {
		let x = this.x + this.dx;
		let y = this.y + this.dy;

		if (x + this.width > el.x &&
			x < el.x + el.width &&
			y + this.height > el.y &&
			y < el.y + el.height) {
			return true;
		}
		return false;
	},
	bumpBlock(block) {
		this.dy *= -1;

		if (block.type == game.sprites.greenBlocks) {
			block.type = game.sprites.redBlocks;
		} else if (block.type == game.sprites.redBlocks) {
			block.type = game.sprites.mainBlocks;
		} else if (block.type == game.sprites.mainBlocks) {
			block.isAlive = false;
			game.numberOfBlocks--;
			game.score += game.level;
		}

		if (!game.numberOfBlocks) {
			setTimeout(() => {
				this.startNewLevel();
			}, 120);
		}
	},
	startNewLevel() {
		game.level++;
		game.create();
		this.returnBalltoPlatform()
		this.velocity += 0.5;
		game.numberOfBlocks = 32;
		game.platform.x = 300;
	},
	onTheleftSide(platform) {
		return (this.x + this.width / 2) < (platform.x + platform.width / 2);
	},
	bumpPlatform(platform) {
		this.dy = -this.velocity;
		this.dx = this.onTheleftSide(platform) ? -this.velocity : this.velocity;
	},
	onThePlatformBottom() {
		let x = this.x + this.dx;
		let y = this.y + this.dy;

		return (x + this.width > game.platform.x) &&
			(x < game.platform.x + game.platform.width) &&
			(y + this.height / 2 > game.platform.y + game.platform.height / 2)
	},
	moveDown() {
		this.dx > 0 ? this.dx = -this.velocity : this.dx = this.velocity;
	},
	checkBounds() {
		let x = this.x + this.dx;
		let y = this.y + this.dy;

		if (x < 0) {
			this.x = 0;
			this.dx = this.velocity;
		} else if (x + this.width > game.width) {
			this.x = game.width - this.width;
			this.dx = -this.velocity;
		} else if (y < 0) {
			this.y = 0;
			this.dy = this.velocity;
		} else if (y + this.height > game.height) {
			game.lives--;
			this.returnBalltoPlatform();
			if (!game.lives) {
				this.x = 3000;
				setTimeout(() => {
					game.over();
				}, 10);
			}
		}
	}
}

game.platform = {
	height: 35,
	width: 100,
	x: 300,
	y: 300,
	velocity: 6,
	dx: 0,
	ball: game.ball,
	releaseBall() {
		if (this.ball) {
			this.ball.jump();
			this.ball = false;
		}
	},
	move() {
		this.x += this.dx;

		if (this.ball) this.ball.x += this.dx;
	},
	stop() {
		this.dx = 0;

		if (this.ball) this.ball.dx = 0;
	},
	ballToPlatformCenter() {
		this.ball.x = this.x + this.width / 2 - this.ball.width / 2;
	},
	checkBounds() {
		if (this.x + this.width > game.width) {
			this.x = game.width - this.width;
			this.ballToPlatformCenter();
		} else if (this.x < 0) {
			this.x = 0;
			this.ballToPlatformCenter();
		}
	},
};


window.addEventListener('load', () => {
	game.start()
});