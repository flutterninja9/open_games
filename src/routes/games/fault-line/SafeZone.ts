import Phaser from 'phaser';
import type { SafeZoneDef } from './levels';

export class SafeZone {
  private scene: Phaser.Scene;
  private glow: Phaser.GameObjects.Image;
  private healthBar: Phaser.GameObjects.Graphics;
  private glowTween: Phaser.Tweens.Tween | null = null;
  private lastHitTime = 0;

  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  failed = false;
  type: SafeZoneDef['type'];

  constructor(scene: Phaser.Scene, def: SafeZoneDef) {
    this.scene = scene;
    this.x = def.x;
    this.y = def.y;
    this.radius = def.radius;
    this.health = def.maxHealth;
    this.maxHealth = def.maxHealth;
    this.type = def.type;

    this.glow = scene.add.image(def.x, def.y, 'safe_zone_glow')
      .setDisplaySize(def.radius * 2.5, def.radius * 2.5)
      .setDepth(1)
      .setAlpha(0.85);

    const textureKey = def.type === 'civilian' ? 'civilian'
      : def.type === 'artifact' ? 'artifact'
      : 'stone_block';
    scene.add.image(def.x, def.y, textureKey)
      .setDepth(2)
      .setDisplaySize(40, def.type === 'artifact' ? 56 : 40);

    this.healthBar = scene.add.graphics().setDepth(200);
    this.drawHealthBar();
  }

  private drawHealthBar() {
    this.healthBar.clear();
    const pct = this.health / this.maxHealth;
    const barW = 48;
    const barH = 4;
    const bx = this.x - barW / 2;
    const by = this.y - this.radius - 12;

    this.healthBar.fillStyle(0x222222, 0.8);
    this.healthBar.fillRect(bx, by, barW, barH);

    const color = pct > 0.6 ? 0x00ff55 : pct > 0.3 ? 0xffaa00 : 0xff3333;
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(bx, by, barW * pct, barH);
  }

  checkImpact(bodies: MatterJS.BodyType[], now: number) {
    if (this.failed) return;
    if (now - this.lastHitTime < 500) return; // debounce hits

    for (const body of bodies) {
      if ((body as any).label === 'enemy' || (body as any).label === 'ground' || (body as any).label === 'wall') continue;
      if (body.isStatic) continue;
      const dx = body.position.x - this.x;
      const dy = body.position.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);

      if (dist < this.radius + 20 && speed > 8) {
        const impactForce = speed * (body.mass ?? 1);
        if (impactForce > 120) {
          this.lastHitTime = now;
          this.health = Math.max(0, this.health - 1);
          this.drawHealthBar();
          this.flashDamage();
          if (this.health <= 0) {
            this.failed = true;
            this.scene.events.emit('safeZoneFailed');
          } else if (this.health < this.maxHealth * 0.5) {
            this.startPulsing();
          }
          break;
        }
      }
    }
  }

  private flashDamage() {
    this.scene.tweens.add({
      targets: this.glow,
      alpha: 0.2,
      duration: 100,
      yoyo: true,
      onComplete: () => { this.glow.setAlpha(0.85); }
    });
  }

  private startPulsing() {
    if (this.glowTween) return;
    this.glowTween = this.scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.5, to: 1.0 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  getHealthPct(): number { return this.health / this.maxHealth; }

  destroy() {
    this.glowTween?.stop();
    this.glow.destroy();
    this.healthBar.destroy();
  }
}
