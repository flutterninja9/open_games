import Phaser from 'phaser';
import type { StructureDef, StructureType } from './levels';

const BLOCK_SIZE = 40;

interface TrackedConstraint {
  constraint: MatterJS.ConstraintType;
  bodyA: MatterJS.BodyType;
  bodyB: MatterJS.BodyType;
  breakThreshold: number;
}

interface MaterialProps {
  mass: number;
  restitution: number;
  friction: number;
  stiffness: number;
  damping: number;
  breakMultiplier: number;
  textureKey: string;
}

const MATERIALS: Record<string, MaterialProps> = {
  wood: {
    mass: 1, restitution: 0.3, friction: 0.6,
    stiffness: 0.7, damping: 0.1, breakMultiplier: 1.6,
    textureKey: 'wood_block'
  },
  crate: {
    mass: 1.5, restitution: 0.4, friction: 0.5,
    stiffness: 0.6, damping: 0.08, breakMultiplier: 1.8,
    textureKey: 'crate'
  },
  stone: {
    mass: 4, restitution: 0.15, friction: 0.8,
    stiffness: 0.95, damping: 0.05, breakMultiplier: 1.18,
    textureKey: 'stone_block'
  },
  stone_column: {
    mass: 6, restitution: 0.1, friction: 0.9,
    stiffness: 0.98, damping: 0.04, breakMultiplier: 1.12,
    textureKey: 'stone_column'
  }
};

function materialFor(type: StructureType): MaterialProps {
  if (type === 'crate_stack') return MATERIALS.crate;
  if (type === 'stone_pillar' || type === 'stone_arch' || type === 'stone_wall') return MATERIALS.stone_column;
  return MATERIALS.wood;
}

export class Structure {
  blocks: Phaser.Physics.Matter.Image[] = [];
  private trackedConstraints: TrackedConstraint[] = [];
  private scene: Phaser.Scene;
  destroyed = false;

  constructor(scene: Phaser.Scene, def: StructureDef) {
    this.scene = scene;
    const mat = materialFor(def.type);
    const count = def.blockCount ?? 1;
    const width = def.width ?? 1;

    if (def.type === 'stone_wall') {
      for (let i = 0; i < width; i++) {
        const bx = def.x + i * BLOCK_SIZE - ((width - 1) * BLOCK_SIZE) / 2;
        const by = def.y - BLOCK_SIZE / 2;
        this.addBlock(bx, by, mat);
      }
      this.connectBlocks(mat, 'horizontal');
    } else if (def.type === 'stone_arch') {
      this.addBlock(def.x, def.y, mat);
    } else {
      for (let i = 0; i < count; i++) {
        const bx = def.x;
        const by = def.y - BLOCK_SIZE / 2 - i * BLOCK_SIZE;
        this.addBlock(bx, by, mat);
      }
      this.connectBlocks(mat, 'vertical');
    }
  }

  private addBlock(x: number, y: number, mat: MaterialProps): Phaser.Physics.Matter.Image {
    const block = this.scene.matter.add.image(x, y, mat.textureKey, undefined, {
      mass: mat.mass,
      restitution: mat.restitution,
      friction: mat.friction,
      frictionAir: 0.01,
      isStatic: false,
      shape: { type: 'rectangle', width: BLOCK_SIZE - 2, height: BLOCK_SIZE - 2 }
    }) as Phaser.Physics.Matter.Image;
    block.setDisplaySize(BLOCK_SIZE, BLOCK_SIZE);
    this.blocks.push(block);
    return block;
  }

  private connectBlocks(mat: MaterialProps, direction: 'vertical' | 'horizontal') {
    for (let i = 0; i < this.blocks.length - 1; i++) {
      const bodyA = this.blocks[i].body as MatterJS.BodyType;
      const bodyB = this.blocks[i + 1].body as MatterJS.BodyType;
      const restLength = BLOCK_SIZE;

      const constraint = this.scene.matter.add.constraint(bodyA, bodyB, restLength, mat.stiffness, {
        damping: mat.damping
      }) as MatterJS.ConstraintType;

      this.trackedConstraints.push({
        constraint,
        bodyA,
        bodyB,
        breakThreshold: restLength * mat.breakMultiplier
      });
    }
  }

  update(onBreak: (x: number, y: number) => void) {
    for (let i = this.trackedConstraints.length - 1; i >= 0; i--) {
      const tc = this.trackedConstraints[i];
      const dx = tc.bodyB.position.x - tc.bodyA.position.x;
      const dy = tc.bodyB.position.y - tc.bodyA.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > tc.breakThreshold) {
        this.scene.matter.world.removeConstraint(tc.constraint);
        this.trackedConstraints.splice(i, 1);
        const mx = (tc.bodyA.position.x + tc.bodyB.position.x) / 2;
        const my = (tc.bodyA.position.y + tc.bodyB.position.y) / 2;
        onBreak(mx, my);
      }
    }
  }

  isCleared(): boolean {
    return this.blocks.every(b => {
      const body = b.body as MatterJS.BodyType;
      const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
      return body.position.y > 560 || (speed < 0.3 && body.position.y > 400);
    });
  }

  destroy() {
    this.trackedConstraints.forEach(tc => {
      this.scene.matter.world.removeConstraint(tc.constraint);
    });
    this.trackedConstraints = [];
    this.blocks.forEach(b => b.destroy());
    this.blocks = [];
    this.destroyed = true;
  }
}
