import Phaser from 'phaser';
import type { EnemyDef } from './levels';

export class Enemy {
  sprite: Phaser.Physics.Matter.Image;
  type: 'sentinel' | 'armored';
  health: number;
  private spawnX: number;
  private patrolDistance: number;
  private direction = 1;
  private speed: number;
  private stunTimer = 0;
  alive = true;

  constructor(scene: Phaser.Scene, def: EnemyDef) {
    this.type = def.type;
    this.spawnX = def.x;
    this.patrolDistance = def.patrolDistance;
    this.health = def.type === 'armored' ? 2 : 1;
    this.speed = def.type === 'armored' ? 40 : 65;

    this.sprite = scene.matter.add.image(def.x, def.y, def.type, undefined, {
      mass: def.type === 'armored' ? 3 : 1,
      restitution: 0.1,
      friction: 0.8,
      frictionAir: 0.05,
      isStatic: false,
      label: 'enemy'
    }) as Phaser.Physics.Matter.Image;
    // Pin rotation so enemies stay upright under physics
    const b = this.sprite.body as MatterJS.BodyType;
    (b as any).inertia = Infinity;
    (b as any).inverseInertia = 0;
    this.sprite.setDisplaySize(36, 36);
  }

  update(delta: number) {
    if (!this.alive) return;

    if (this.stunTimer > 0) {
      this.stunTimer -= delta;
      return;
    }

    const body = this.sprite.body as MatterJS.BodyType;
    const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);

    if (this.sprite.y > 560 || this.sprite.y < -60) {
      this.alive = false;
      this.sprite.destroy();
      return;
    }

    if (speed > 5) return;

    const vx = this.direction * this.speed;
    (Phaser.Physics.Matter as any).Body.setVelocity(body, { x: vx, y: body.velocity.y });

    if (this.sprite.x > this.spawnX + this.patrolDistance) {
      this.direction = -1;
      this.sprite.setFlipX(true);
    } else if (this.sprite.x < this.spawnX - this.patrolDistance) {
      this.direction = 1;
      this.sprite.setFlipX(false);
    }
  }

  hit() {
    this.health--;
    if (this.health <= 0) {
      this.alive = false;
      this.sprite.destroy();
    } else {
      this.stunTimer = 800;
      this.sprite.setTint(0xff4444);
      setTimeout(() => { if (this.sprite?.active) this.sprite.clearTint(); }, 300);
    }
  }

  isAlive(): boolean { return this.alive; }

  destroy() {
    this.alive = false;
    if (this.sprite?.active) this.sprite.destroy();
  }
}
