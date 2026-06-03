import Phaser from 'phaser';
import { Structure } from './Structure';
import { Enemy } from './Enemy';
import { SafeZone } from './SafeZone';
import { LEVELS, type LevelData } from './levels';
import { calculateScore } from './scoring';

const GROUND_Y = 480;
const CANVAS_W = 800;
const CANVAS_H = 520;

export class FaultLineScene extends Phaser.Scene {
  private structures: Structure[] = [];
  private enemies: Enemy[] = [];
  private safeZones: SafeZone[] = [];
  private currentLevelIndex = 0;
  private currentLevel!: LevelData;

  private chargeStart = 0;
  private isCharging = false;
  private inputLocked = false;
  private quakesUsed = 0;
  private chargeRing!: Phaser.GameObjects.Image;
  private chargeTween: Phaser.Tweens.Tween | null = null;
  private cameraTremor: Phaser.Time.TimerEvent | null = null;

  private chainBonus = false;
  private chainBodyCount = 0;
  private chainTimer: Phaser.Time.TimerEvent | null = null;

  private quakeText!: Phaser.GameObjects.Text;
  private gameState: 'pregame' | 'playing' | 'won' | 'failed' | 'postgame' = 'pregame';
  private slowMoActive = false;

  constructor() { super('FaultLineScene'); }

  preload() {
    const base = '/games/fault-line/';

    // Real sprite assets
    this.load.image('wood_block',     `${base}wood_block.png`);
    this.load.image('stone_block',    `${base}stone_block.png`);
    this.load.image('stone_column',   `${base}stone_column.png`);
    this.load.image('crate',          `${base}crate.png`);
    this.load.image('artifact',       `${base}artifact.png`);
    this.load.image('safe_zone_glow', `${base}safe_zone_glow.png`);
    this.load.image('crack_decal',    `${base}crack.png`);
    // Both enemy types share guards.png; armored gets a blue tint at runtime
    this.load.image('sentinel', `${base}guards.png`);
    this.load.image('armored',  `${base}guards.png`);

    // Procedural textures — no matching file available
    this.genTex('ground_tile', 40, 40, (ctx) => {
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, 40, 40);
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1; ctx.strokeRect(0, 0, 40, 40);
    });
    this.genTex('ruins_tile', 40, 40, (ctx) => {
      ctx.fillStyle = '#2a2318'; ctx.fillRect(0, 0, 40, 40);
      ctx.strokeStyle = '#332b1e'; ctx.lineWidth = 1; ctx.strokeRect(0, 0, 40, 40);
      ctx.fillStyle = '#1e1a10'; ctx.fillRect(2, 2, 10, 10); ctx.fillRect(22, 22, 12, 12);
    });
    this.genTex('civilian', 36, 36, (ctx) => {
      ctx.fillStyle = '#cc5500'; ctx.fillRect(8, 20, 20, 12);
      ctx.fillStyle = '#f5c060'; ctx.beginPath(); ctx.arc(18, 16, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffdd00'; ctx.fillRect(8, 9, 20, 5);
      ctx.strokeStyle = '#f5c060'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(8, 20); ctx.lineTo(4, 12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(28, 20); ctx.lineTo(32, 12); ctx.stroke();
    });
    this.genTex('charge_ring', 128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 48, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.82, 'rgba(255,255,255,0.7)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(64, 64, 64, 0, Math.PI * 2); ctx.fill();
    });
    this.genTex('particle_dust', 6, 6, (ctx) => {
      ctx.fillStyle = '#888888'; ctx.beginPath(); ctx.arc(3, 3, 3, 0, Math.PI * 2); ctx.fill();
    });
  }

  private genTex(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    draw(canvas.getContext('2d')!);
    this.textures.addCanvas(key, canvas);
  }

  create() {
    this.currentLevelIndex = this.registry.get('currentLevelIndex') ?? 0;
    this.gameState = 'pregame';
    this.inputLocked = true;
    this.quakesUsed = 0;
    this.chainBonus = false;
    this.chainBodyCount = 0;
    this.slowMoActive = false;
    this.structures = [];
    this.enemies = [];
    this.safeZones = [];

    this.currentLevel = LEVELS[this.currentLevelIndex];
    this.loadLevel(this.currentLevel);
    this.setupGroundBody();
    this.setupInput();
    this.setupHUD();
    this.events.on('safeZoneFailed', this.onSafeZoneFailed, this);

    if (!this.registry.get('titleShown')) {
      this.showTitleCard();
    } else {
      this.gameState = 'playing';
      this.inputLocked = false;
    }
  }

  private loadLevel(level: LevelData) {
    // Tiled ground
    for (let x = 0; x < CANVAS_W; x += 40) {
      for (let row = 0; row < 3; row++) {
        this.add.image(x + 20, GROUND_Y + row * 40 + 20, level.groundTile).setDepth(0);
      }
    }

    // Act / level name
    this.add.text(CANVAS_W / 2, 18,
      `ACT ${level.act}  ·  ${level.name.toUpperCase()}`,
      { fontSize: '10px', color: '#444444', letterSpacing: 3 }
    ).setOrigin(0.5).setDepth(200);

    for (const def of level.structures) this.structures.push(new Structure(this, def));
    for (const def of level.enemies)    this.enemies.push(new Enemy(this, def));
    for (const def of level.safeZones)  this.safeZones.push(new SafeZone(this, def));
  }

  private setupGroundBody() {
    this.matter.add.rectangle(CANVAS_W / 2, GROUND_Y + 20, CANVAS_W + 100, 40, {
      isStatic: true, friction: 0.8, restitution: 0.1, label: 'ground'
    });
    this.matter.add.rectangle(-20, CANVAS_H / 2, 40, CANVAS_H * 2, { isStatic: true, label: 'wall' });
    this.matter.add.rectangle(CANVAS_W + 20, CANVAS_H / 2, 40, CANVAS_H * 2, { isStatic: true, label: 'wall' });
  }

  private setupInput() {
    this.chargeRing = this.add.image(400, 300, 'charge_ring').setAlpha(0).setDepth(50).setScale(0.4);

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.inputLocked || this.gameState !== 'playing') return;
      this.isCharging = true;
      this.chargeStart = this.time.now;
      this.chargeRing.setPosition(ptr.x, ptr.y).setAlpha(0.5).setScale(0.3).setTint(0xffffff);
      this.chargeTween = this.tweens.add({
        targets: this.chargeRing,
        scale: 1.4,
        duration: 1500,
        ease: 'Quad.easeIn'
      });
      this.cameraTremor = this.time.addEvent({
        delay: 150,
        loop: true,
        callback: () => {
          if (!this.isCharging) return;
          const held = Math.min((this.time.now - this.chargeStart) / 1500, 1);
          this.cameras.main.shake(80, held * 0.003);
          // Shift ring tint from white to orange to red
          const r = Math.floor(255);
          const g = Math.floor(255 * (1 - held));
          this.chargeRing.setTint(Phaser.Display.Color.GetColor(r, g, 0));
        }
      });
    });

    this.input.on('pointerup', (ptr: Phaser.Input.Pointer) => {
      if (!this.isCharging) return;
      this.isCharging = false;
      this.chargeTween?.stop();
      this.cameraTremor?.remove();
      this.chargeRing.setAlpha(0);
      if (this.gameState !== 'playing') return;

      const held = this.time.now - this.chargeStart;
      const chargeMultiplier = 1 + Math.min(held / 1500, 1) * 2;
      this.fireQuake(ptr.x, ptr.y, chargeMultiplier);
    });
  }

  private fireQuake(epicenterX: number, epicenterY: number, chargeMultiplier: number) {
    this.quakesUsed++;
    this.updateHUD();

    const BASE_FORCE = 0.04;
    const BASE_RADIUS = 165;
    const force = BASE_FORCE * chargeMultiplier;
    const radius = BASE_RADIUS * (0.7 + chargeMultiplier * 0.3);

    // Screen shake
    this.cameras.main.shake(200 + chargeMultiplier * 80, 0.004 + chargeMultiplier * 0.004);

    // Crack decal
    this.add.image(epicenterX, Math.min(epicenterY, GROUND_Y - 4), 'crack_decal')
      .setDepth(1)
      .setRotation(Math.random() * Math.PI)
      .setScale(0.6 + chargeMultiplier * 0.3)
      .setAlpha(0.7);

    // Radial force on all dynamic bodies
    const MatterLib = Phaser.Physics.Matter as any;
    const allBodies = (this.matter.world as unknown as { getAllBodies(): MatterJS.BodyType[] }).getAllBodies();
    let bodiesMoving = 0;

    for (const body of allBodies) {
      if (body.isStatic) continue;
      const dx = body.position.x - epicenterX;
      const dy = body.position.y - epicenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius || dist < 1) continue;

      const t = 1 - dist / radius;
      const invMass = 1 / Math.max(body.mass, 0.5);
      const dirX = dx / dist;
      const dirY = dy / dist;
      const mag = force * t * invMass;

      MatterLib.Body.applyForce(
        body,
        { x: epicenterX, y: epicenterY },
        { x: dirX * mag, y: dirY * mag - mag * 0.25 }
      );
      bodiesMoving++;
    }

    // Chain bonus tracking
    if (bodiesMoving >= 3) {
      this.chainBodyCount = Math.max(this.chainBodyCount, bodiesMoving);
      this.chainTimer?.remove();
      this.chainTimer = this.time.delayedCall(2000, () => {
        if (this.chainBodyCount >= 3) this.chainBonus = true;
        this.chainBodyCount = 0;
      });
    }

    if (this.quakesUsed >= this.currentLevel.maxQuakes) {
      this.time.delayedCall(400, () => { this.inputLocked = true; });
    }
  }

  private setupHUD() {
    this.quakeText = this.add.text(12, 10, '', {
      fontSize: '12px', color: '#666666', letterSpacing: 1
    }).setDepth(200);
    this.updateHUD();
  }

  private updateHUD() {
    const rem = this.currentLevel.maxQuakes - this.quakesUsed;
    this.quakeText.setText(`QUAKES  ${rem} / ${this.currentLevel.maxQuakes}   PAR ${this.currentLevel.par}`);
  }

  update(_time: number, delta: number) {
    if (this.gameState !== 'playing') return;

    // Constraint break checks
    for (const s of this.structures) {
      s.update((bx, by) => this.onConstraintBreak(bx, by));
    }

    // Enemy update + off-screen cull
    for (const e of this.enemies) {
      e.update(delta);
      if (e.isAlive()) {
        const sy = e.sprite.y;
        const sx = e.sprite.x;
        if (sy > CANVAS_H + 80 || sy < -80 || sx < -80 || sx > CANVAS_W + 80) {
          e.alive = false;
          if (e.sprite.active) e.sprite.destroy();
        }
      }
    }

    // Safe zone impact checks
    const allBodies = (this.matter.world as unknown as { getAllBodies(): MatterJS.BodyType[] }).getAllBodies();
    const now = this.time.now;
    for (const sz of this.safeZones) {
      sz.checkImpact(allBodies, now);
    }

    // Win check
    const allDead = this.enemies.length > 0 && this.enemies.every(e => !e.isAlive());
    if (allDead && this.gameState === 'playing') {
      this.onLevelWon();
    }
  }

  private onConstraintBreak(x: number, y: number) {
    // Dust burst
    const particles = this.add.particles(x, y, 'particle_dust', {
      speed: { min: 25, max: 90 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 550,
      quantity: 10,
      gravityY: 180
    });
    this.time.delayedCall(700, () => particles.destroy());

    // Slow-mo
    if (!this.slowMoActive) {
      const movingCount = (this.matter.world as unknown as { getAllBodies(): MatterJS.BodyType[] }).getAllBodies()
        .filter(b => !b.isStatic && Math.sqrt(b.velocity.x ** 2 + b.velocity.y ** 2) > 2).length;
      if (movingCount >= 3) {
        this.slowMoActive = true;
        (this.matter.world as unknown as { engine: { timing: { timeScale: number } } }).engine.timing.timeScale = 0.3;
        this.time.delayedCall(500, () => {
          (this.matter.world as unknown as { engine: { timing: { timeScale: number } } }).engine.timing.timeScale = 1;
          this.slowMoActive = false;
        });
      }
    }
  }

  private onSafeZoneFailed() {
    if (this.gameState !== 'playing') return;
    this.gameState = 'failed';
    this.inputLocked = true;
    this.cameras.main.shake(400, 0.02);

    this.time.delayedCall(600, () => {
      this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.82).setDepth(300);
      this.add.text(CANVAS_W / 2, 190, 'SAFE ZONE DESTROYED', {
        fontSize: '24px', color: '#ff3333', fontStyle: 'bold', letterSpacing: 2
      }).setOrigin(0.5).setDepth(301);
      this.add.text(CANVAS_W / 2, 340, 'TAP TO RETRY', {
        fontSize: '13px', color: '#666666', letterSpacing: 4
      }).setOrigin(0.5).setDepth(301);
      this.input.once('pointerdown', () => {
        this.registry.set('currentLevelIndex', this.currentLevelIndex);
        this.scene.restart();
      });
    });
  }

  private onLevelWon() {
    this.gameState = 'postgame';
    this.inputLocked = true;

    const worstHealth = this.safeZones.length > 0
      ? Math.min(...this.safeZones.map(sz => sz.getHealthPct()))
      : 1;
    const result = calculateScore(this.quakesUsed, this.currentLevel.par, worstHealth, this.chainBonus);

    this.cameras.main.shake(250, 0.008);
    this.time.delayedCall(700, () => this.showScoreScreen(result));
  }

  private showScoreScreen(result: ReturnType<typeof calculateScore>) {
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.85).setDepth(300);

    this.add.text(CANVAS_W / 2, 100, 'LEVEL CLEAR', {
      fontSize: '20px', color: '#ffffff', letterSpacing: 6
    }).setOrigin(0.5).setDepth(301);

    this.add.text(CANVAS_W / 2, 132, `${this.currentLevel.act === 1 ? 'ACT I' : 'ACT II'}  ·  ${this.currentLevel.name.toUpperCase()}`, {
      fontSize: '10px', color: '#444444', letterSpacing: 3
    }).setOrigin(0.5).setDepth(301);

    // Stars
    for (let i = 0; i < 3; i++) {
      const filled = i < result.stars;
      const sx = CANVAS_W / 2 + (i - 1) * 58;
      const g = this.add.graphics().setDepth(301);
      this.drawStar(g, sx, 200, 20, filled ? 0xffcc00 : 0x2a2a2a);
      if (filled) {
        this.tweens.add({ targets: g, scaleX: { from: 0, to: 1 }, scaleY: { from: 0, to: 1 }, duration: 300, delay: i * 120, ease: 'Back.easeOut' });
      }
    }

    // Stats
    this.add.text(CANVAS_W / 2, 245,
      `${this.quakesUsed} quakes used  ·  par ${this.currentLevel.par}`,
      { fontSize: '11px', color: '#555555', letterSpacing: 1 }
    ).setOrigin(0.5).setDepth(301);

    // Richter scale
    this.add.text(CANVAS_W / 2, 278, 'RICHTER SCALE', {
      fontSize: '9px', color: '#444444', letterSpacing: 4
    }).setOrigin(0.5).setDepth(301);
    const needleG = this.add.graphics().setDepth(301);
    this.animateRichterNeedle(needleG, CANVAS_W / 2, 340, result.richterMagnitude);

    // Buttons
    const hasNext = this.currentLevelIndex < LEVELS.length - 1;
    const nextTxt = hasNext ? 'NEXT LEVEL →' : '— ALL LEVELS COMPLETE —';
    const nextBtn = this.add.text(CANVAS_W / 2, 420, nextTxt, {
      fontSize: '13px', color: hasNext ? '#aaaaaa' : '#555555', letterSpacing: 3
    }).setOrigin(0.5).setDepth(301);

    if (hasNext) {
      nextBtn.setInteractive({ useHandCursor: true });
      nextBtn.on('pointerover', () => nextBtn.setColor('#ffffff'));
      nextBtn.on('pointerout', () => nextBtn.setColor('#aaaaaa'));
      nextBtn.on('pointerdown', () => {
        this.registry.set('currentLevelIndex', this.currentLevelIndex + 1);
        this.registry.set('titleShown', true);
        this.scene.restart();
      });
    }

    const retryBtn = this.add.text(CANVAS_W / 2, 452, 'RETRY', {
      fontSize: '11px', color: '#3a3a3a', letterSpacing: 4
    }).setOrigin(0.5).setDepth(301).setInteractive({ useHandCursor: true });
    retryBtn.on('pointerover', () => retryBtn.setColor('#777777'));
    retryBtn.on('pointerout', () => retryBtn.setColor('#3a3a3a'));
    retryBtn.on('pointerdown', () => {
      this.registry.set('currentLevelIndex', this.currentLevelIndex);
      this.registry.set('titleShown', true);
      this.scene.restart();
    });
  }

  private drawStar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, color: number) {
    g.fillStyle(color, 1);
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.42;
      pts.push(new Phaser.Math.Vector2(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius));
    }
    g.fillPoints(pts, true);
  }

  private animateRichterNeedle(g: Phaser.GameObjects.Graphics, cx: number, cy: number, magnitude: number) {
    const drawGauge = (current: number) => {
      g.clear();
      g.lineStyle(1, 0x2a2a2a, 1);
      g.beginPath(); g.arc(cx, cy, 44, Math.PI, 0, false); g.strokePath();

      for (let i = 1; i <= 6; i++) {
        const a = Math.PI - (i / 6) * Math.PI;
        g.fillStyle(i <= 3 ? 0x336633 : i <= 5 ? 0x886633 : 0x883333, 1);
        g.fillCircle(cx + Math.cos(a) * 48, cy + Math.sin(a) * 48, 2);
        g.fillStyle(0x333333, 1);
        g.fillRect(cx + Math.cos(a) * 38 - 1, cy + Math.sin(a) * 38 - 1, 2, 2);
      }

      const needleAngle = Math.PI - current;
      const col = current / Math.PI < 0.5 ? 0x44aa44 : current / Math.PI < 0.8 ? 0xffaa00 : 0xff3300;
      g.lineStyle(2, col, 1);
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(needleAngle) * 38, cy + Math.sin(needleAngle) * 38);
      g.strokePath();
      g.fillStyle(col, 1); g.fillCircle(cx, cy, 4);
    };

    const target = (Math.min(magnitude, 6) / 6) * Math.PI;
    let current = 0;
    drawGauge(0);

    const timer = this.time.addEvent({
      delay: 16, loop: true,
      callback: () => {
        current += (target - current) * 0.07;
        drawGauge(current);
        if (Math.abs(current - target) < 0.003) { timer.remove(); drawGauge(target); }
      }
    });
  }

  private showTitleCard() {
    const overlay = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.93).setDepth(400);
    this.add.text(CANVAS_W / 2, 170, 'FAULT LINE', {
      fontSize: '38px', color: '#ffffff', fontStyle: 'bold', letterSpacing: 10
    }).setOrigin(0.5).setDepth(401);
    this.add.text(CANVAS_W / 2, 222, 'TAP TO QUAKE  ·  HOLD TO CHARGE', {
      fontSize: '11px', color: '#444444', letterSpacing: 4
    }).setOrigin(0.5).setDepth(401);
    this.add.text(CANVAS_W / 2, 290, "DON'T TOUCH THE GREEN", {
      fontSize: '14px', color: '#00cc44', letterSpacing: 3
    }).setOrigin(0.5).setDepth(401);
    this.add.text(CANVAS_W / 2, 430, 'TAP ANYWHERE TO START', {
      fontSize: '11px', color: '#333333', letterSpacing: 5
    }).setOrigin(0.5).setDepth(401);

    this.input.once('pointerdown', () => {
      this.registry.set('titleShown', true);
      this.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 350,
        onComplete: () => {
          overlay.destroy();
          this.gameState = 'playing';
          this.inputLocked = false;
        }
      });
    });
  }
}
