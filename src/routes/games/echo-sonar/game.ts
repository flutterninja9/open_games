import Phaser from 'phaser';

const MAZE = [
	"XXXXXXXXXXXXXXXXXXXX",
	"X....X.......X.....X",
	"X.XX.X.XXXXX.X.XXX.X",
	"X..X.....X.......X.X",
	"XX.XXXXX.X.XXXXX.X.X",
	"X......X.X...X...X.X",
	"X.XXXX.X.XXX.X.XXX.X",
	"X.X....X...X...X...X",
	"X.X.XXXXXX.XXXXX.X.X",
	"X.X......X.......X.X",
	"X.XXXXXX.XXXXXXX.XXX",
	"X......X.......X...E",
	"XXXXXXXXXXXXXXXXXXXX"
];

const TILE_SIZE = 40;

export function createGame(parent: HTMLElement) {
	const config: Phaser.Types.Core.GameConfig = {
		type: Phaser.AUTO,
		width: 800,
		height: 520,
		parent,
		physics: {
			default: 'arcade',
			arcade: { gravity: { x: 0, y: 0 }, debug: false }
		},
		scene: MainScene,
		backgroundColor: '#050505',
	};
	return new Phaser.Game(config);
}

class MainScene extends Phaser.Scene {
	player!: Phaser.Physics.Arcade.Sprite;
	cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
	keys!: any;
	rt!: Phaser.GameObjects.RenderTexture;
	
	health = 3;
	radars = 3;
	gameState: 'intro' | 'playing' | 'gameover' | 'won' = 'intro';
	darknessAlpha = 0;
	
	uiText!: Phaser.GameObjects.Text;
	enemies!: Phaser.Physics.Arcade.Group;
	exit!: Phaser.Physics.Arcade.Sprite;

	invulnerable = false;
	activeRadars: { sprite: Phaser.GameObjects.Sprite }[] = [];
	brush!: Phaser.GameObjects.Sprite;
	blackScreen!: Phaser.GameObjects.Sprite;

	constructor() { super('MainScene'); }

	preload() {
		this.load.image('assets', '/tilemap_echo_game.png');

		// Generate the brush for innate vision (small soft circle)
		const canvas = document.createElement('canvas');
		canvas.width = 256; canvas.height = 256;
		const ctx = canvas.getContext('2d');
		if (ctx) {
			const grd = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
			grd.addColorStop(0, "rgba(255, 255, 255, 1)");
			grd.addColorStop(1, "rgba(255, 255, 255, 0)");
			ctx.fillStyle = grd; ctx.fillRect(0, 0, 256, 256);
			this.textures.addCanvas('brush', canvas);
		}

		// Generate Radar Ring (a hollow circle that expands)
		const canvas2 = document.createElement('canvas');
		canvas2.width = 512; canvas2.height = 512;
		const ctx2 = canvas2.getContext('2d');
		if (ctx2) {
			ctx2.fillStyle = "rgba(255, 255, 255, 0)";
			ctx2.fillRect(0,0,512,512);
			
			const grd = ctx2.createRadialGradient(256, 256, 180, 256, 256, 256);
			grd.addColorStop(0, "rgba(255, 255, 255, 0)");
			grd.addColorStop(0.8, "rgba(255, 255, 255, 1)");
			grd.addColorStop(1, "rgba(255, 255, 255, 0)");
			
			ctx2.fillStyle = grd;
			ctx2.beginPath();
			ctx2.arc(256, 256, 256, 0, Math.PI * 2);
			ctx2.fill();
			this.textures.addCanvas('radarRing', canvas2);
		}

		// Generate a solid black pixel for the darkness overlay
		const canvas3 = document.createElement('canvas');
		canvas3.width = 16; canvas3.height = 16;
		const ctx3 = canvas3.getContext('2d');
		if (ctx3) {
			ctx3.fillStyle = '#000000';
			ctx3.fillRect(0,0,16,16);
			this.textures.addCanvas('blackPixel', canvas3);
		}
	}

	create() {
		this.gameState = 'intro';
		this.health = 3;
		this.radars = 3;
		this.darknessAlpha = 0;
		this.activeRadars = [];

		const tex = this.textures.get('assets');
		if (!tex.has('wall')) {
			tex.add('wall', 0, 256, 0, 128, 128);
			tex.add('floor', 0, 128, 384, 128, 128);
			tex.add('enemy', 0, 768, 0, 128, 128);
			tex.add('exit', 0, 768, 384, 256, 256);
		}

		const scale = TILE_SIZE / 128;

		for (let y = 0; y < MAZE.length; y++) {
			for (let x = 0; x < MAZE[y].length; x++) {
				const px = x * TILE_SIZE + TILE_SIZE / 2;
				const py = y * TILE_SIZE + TILE_SIZE / 2;
				const floor = this.add.sprite(px, py, 'assets', 'floor');
				floor.setScale(scale);
			}
		}

		const walls = this.physics.add.staticGroup();
		this.enemies = this.physics.add.group();

		for (let y = 0; y < MAZE.length; y++) {
			for (let x = 0; x < MAZE[y].length; x++) {
				const char = MAZE[y][x];
				const px = x * TILE_SIZE + TILE_SIZE / 2;
				const py = y * TILE_SIZE + TILE_SIZE / 2;

				if (char === 'X') {
					const wall = walls.create(px, py, 'assets', 'wall');
					wall.setScale(scale);
					wall.refreshBody();
				} else if (char === 'E') {
					this.exit = this.physics.add.sprite(px, py, 'assets', 'exit');
					this.exit.setScale(TILE_SIZE / 256);
					this.exit.setImmovable(true);
				}
			}
		}

		const playerGraphics = this.make.graphics({x:0,y:0}, false);
		playerGraphics.fillStyle(0xffffff, 1);
		playerGraphics.fillCircle(10, 10, 10);
		playerGraphics.generateTexture('playerTex', 20, 20);
		
		this.player = this.physics.add.sprite(1.5 * TILE_SIZE, 1.5 * TILE_SIZE, 'playerTex');
		this.player.setCircle(10);
		this.player.setCollideWorldBounds(true);

		const enemyPoints = [
			{x: 5.5, y: 3.5}, {x: 10.5, y: 1.5}, {x: 15.5, y: 5.5}, 
			{x: 7.5, y: 7.5}, {x: 13.5, y: 9.5}, {x: 3.5, y: 9.5}
		];

		for (const p of enemyPoints) {
			const ex = p.x * TILE_SIZE;
			const ey = p.y * TILE_SIZE;
			const enemy = this.enemies.create(ex, ey, 'assets', 'enemy');
			enemy.setScale(scale);
			enemy.setCircle(40, 24, 24);
			enemy.setVelocityX(50 * (Math.random() > 0.5 ? 1 : -1));
			enemy.setBounce(1);
			enemy.setCollideWorldBounds(true);
		}

		this.physics.add.collider(this.player, walls);
		this.physics.add.collider(this.enemies, walls);
		this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, undefined, this);
		this.physics.add.overlap(this.player, this.exit, this.winGame, undefined, this);

		// Darkness
		this.rt = this.add.renderTexture(0, 0, 800, 520);
		this.rt.setDepth(100);
		this.brush = this.make.sprite({ key: 'brush' }, false);
		
		// Create a black screen sprite to draw onto the render texture
		this.blackScreen = this.make.sprite({ x: 400, y: 260, key: 'blackPixel' }, false);
		this.blackScreen.setDisplaySize(800, 520);

		if (this.input.keyboard) {
			this.cursors = this.input.keyboard.createCursorKeys();
			this.keys = this.input.keyboard.addKeys('W,A,S,D');
		}

		this.input.on('pointerdown', () => {
			if (this.gameState === 'playing' && this.radars > 0) {
				this.radars--;
				this.fireRadar();
				this.updateUI();
			}
		});

		this.uiText = this.add.text(10, 10, `Health: ❤️❤️❤️ | Radars: 📡📡📡`, { fontSize: '18px', color: '#ffffff', backgroundColor: '#000000AA' });
		this.uiText.setPadding(8, 8, 8, 8);
		this.uiText.setDepth(200);

		// Intro sequence: manually update darkness to avoid any tween target issues
		this.time.delayedCall(2000, () => {
			// Start fading in update loop
		});
	}

	fireRadar() {
		// Create a green visual ring
		const ring = this.add.sprite(this.player.x, this.player.y, 'radarRing');
		ring.setTint(0x00ff00);
		ring.setScale(0.1);
		ring.setDepth(150);
		
		this.activeRadars.push({ sprite: ring });

		this.tweens.add({
			targets: ring,
			scaleX: 4,
			scaleY: 4,
			alpha: 0,
			duration: 2000,
			ease: 'Quad.easeOut',
			onComplete: () => {
				ring.destroy();
				this.activeRadars = this.activeRadars.filter(r => r.sprite !== ring);
			}
		});
	}

	hitEnemy(p: any, e: any) {
		if (this.gameState !== 'playing' || this.invulnerable) return;
		
		this.health--;
		this.updateUI();

		if (this.health <= 0) {
			this.gameState = 'gameover';
			this.player.setTint(0xff0000);
			this.uiText.setText('GAME OVER - Tap to Restart');
			this.uiText.setColor('#ff0000');
			this.input.once('pointerdown', () => this.scene.restart());
		} else {
			this.invulnerable = true;
			this.player.setTint(0xff0000);
			
			const dx = this.player.x - e.x;
			const dy = this.player.y - e.y;
			const dist = Math.sqrt(dx*dx + dy*dy) || 1;
			this.player.setVelocity((dx/dist)*300, (dy/dist)*300);

			this.tweens.add({
				targets: this.player,
				alpha: 0.2,
				yoyo: true,
				repeat: 5,
				duration: 150,
				onComplete: () => {
					this.invulnerable = false;
					this.player.setTint(0xffffff);
					this.player.setAlpha(1);
				}
			});
		}
	}

	winGame() {
		if (this.gameState !== 'playing') return;
		this.gameState = 'won';
		this.player.setTint(0x00ff00);
		this.uiText.setText('YOU ESCAPED! - Tap to Restart');
		this.uiText.setColor('#00ff00');
		this.input.once('pointerdown', () => this.scene.restart());
	}

	updateUI() {
		if (this.gameState === 'playing' || this.gameState === 'intro') {
			const h = '❤️'.repeat(this.health);
			const r = '📡'.repeat(this.radars);
			this.uiText.setText(`Health: ${h} | Radars: ${r}`);
		}
	}

	update(time: number, delta: number) {
		if (this.gameState === 'gameover' || this.gameState === 'won') {
			this.player.setVelocity(0, 0);
			this.enemies.setVelocity(0, 0);
			return;
		}

		if (this.gameState === 'intro') {
			// Start fading after 2000ms
			if (time > 2000) {
				this.darknessAlpha += (0.98 / 2000) * delta;
				if (this.darknessAlpha >= 0.98) {
					this.darknessAlpha = 0.98;
					this.gameState = 'playing';
				}
			}
		}

		if (this.gameState === 'playing' && !this.invulnerable) {
			const speed = 150;
			let vx = 0; let vy = 0;

			if (this.cursors?.left.isDown || this.keys?.A.isDown) vx = -speed;
			else if (this.cursors?.right.isDown || this.keys?.D.isDown) vx = speed;

			if (this.cursors?.up.isDown || this.keys?.W.isDown) vy = -speed;
			else if (this.cursors?.down.isDown || this.keys?.S.isDown) vy = speed;

			if (vx !== 0 && vy !== 0) {
				vx *= 0.7071; vy *= 0.7071;
			}
			this.player.setVelocity(vx, vy);
		}

		// Darkness rendering
		this.rt.clear();
		
		if (this.darknessAlpha > 0) {
			// Draw solid black at specific alpha
			this.blackScreen.setAlpha(this.darknessAlpha);
			this.rt.draw(this.blackScreen, 400, 260);

			// Erase a small circle around the player
			this.brush.setScale(50 / 128);
			this.brush.setAlpha(0.4);
			this.rt.erase(this.brush, this.player.x, this.player.y);

			// Erase darkness where radars are expanding
			for (const radar of this.activeRadars) {
				this.rt.erase(radar.sprite, radar.sprite.x, radar.sprite.y);
			}
		}
	}
}
