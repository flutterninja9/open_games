# Fault Line Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Fault Line — a tap-to-quake physics puzzle game using Phaser 4 + Matter.js, integrated into the existing SvelteKit open-games project with lazy loading.

**Architecture:** Multi-file modular layout under `src/routes/games/fault-line/`. `FaultLineScene.ts` orchestrates; `Structure`, `Enemy`, `SafeZone` are standalone classes; `levels.ts` holds all level data; `scoring.ts` is a pure function. All procedural canvas textures for now — real sprites swapped in Task 16.

**Tech Stack:** SvelteKit, Phaser 4.1.0, Matter.js (bundled in Phaser), TypeScript

---

## File Map

| File | Purpose |
|------|---------|
| `src/lib/games.ts` | Add fault-line entry |
| `src/routes/games/fault-line/+page.svelte` | Page shell, lazy-loads game |
| `src/routes/games/fault-line/game.ts` | `createGame(parent)` entry point |
| `src/routes/games/fault-line/FaultLineScene.ts` | Main Phaser scene, orchestrates all systems |
| `src/routes/games/fault-line/levels.ts` | `LevelData[]` — 6 level definitions |
| `src/routes/games/fault-line/Structure.ts` | Compound Matter bodies + breakable constraints |
| `src/routes/games/fault-line/Enemy.ts` | Sentinel + Armored enemy classes |
| `src/routes/games/fault-line/SafeZone.ts` | Safe zone sensor, health, glow |
| `src/routes/games/fault-line/scoring.ts` | Pure star-calculation function |

---

## Task 1: Register game + page shell

**Files:**
- Modify: `src/lib/games.ts`
- Create: `src/routes/games/fault-line/+page.svelte`

- [ ] **Step 1: Add fault-line to games registry**

In `src/lib/games.ts`, append to the `games` array:

```typescript
{
  id: 'fault-line',
  title: 'Fault Line',
  description: "Tap to quake. Destroy the targets. Don't touch the green.",
  path: '/games/fault-line',
  players: '1 Player',
  tags: ['physics', 'puzzle', 'destruction']
}
```

- [ ] **Step 2: Create `+page.svelte`**

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let container: HTMLElement;
  let gameInstance: any;

  onMount(async () => {
    const { createGame } = await import('./game');
    gameInstance = createGame(container);
  });

  onDestroy(() => {
    if (gameInstance) gameInstance.destroy(true);
  });
</script>

<svelte:head>
  <title>Fault Line — Open Games</title>
  <meta name="description" content="Tap to quake. Destroy the targets. Don't touch the green." />
</svelte:head>

<div class="page page-enter">
  <nav>
    <a href="/" class="back">← Open Games</a>
  </nav>
  <h1 class="title">Fault Line</h1>
  <p class="desc">
    Tap to release a shockwave. Destroy every enemy without touching the green safe zones.
    Hold to charge a bigger quake.
  </p>
  <div class="game-container" bind:this={container}></div>
</div>

<style>
  .page {
    max-width: 820px;
    margin: 0 auto;
    padding: 2rem 1.5rem 5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  nav { width: 100%; margin-bottom: 2rem; }
  .back {
    font-size: 0.8125rem;
    color: var(--gray-500);
    letter-spacing: 0.02em;
    transition: color 0.12s ease;
  }
  .back:hover { color: var(--gray-300); }
  .title {
    font-size: clamp(1.25rem, 3vw, 1.75rem);
    font-weight: 500;
    letter-spacing: -0.03em;
    color: var(--white);
    margin-bottom: 0.5rem;
    align-self: flex-start;
  }
  .desc {
    font-size: 0.875rem;
    color: var(--gray-400);
    margin-bottom: 2rem;
    align-self: flex-start;
    max-width: 600px;
    line-height: 1.5;
  }
  .game-container {
    width: 800px;
    height: 520px;
    background: #0a0a0a;
    border: 1px solid var(--gray-800);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  }
</style>
```

- [ ] **Step 3: Verify page loads**

Run `npm run dev`, navigate to `/games/fault-line`. Should see the page shell with no game yet (black container). No console errors about missing modules.

---

## Task 2: game.ts entry point + FaultLineScene skeleton

**Files:**
- Create: `src/routes/games/fault-line/game.ts`
- Create: `src/routes/games/fault-line/FaultLineScene.ts`

- [ ] **Step 1: Create `game.ts`**

```typescript
import Phaser from 'phaser';
import { FaultLineScene } from './FaultLineScene';

export function createGame(parent: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 520,
    parent,
    backgroundColor: '#0d0d0d',
    physics: {
      default: 'matter',
      matter: {
        gravity: { x: 0, y: 1.5 },
        debug: false
      }
    },
    scene: FaultLineScene
  };
  return new Phaser.Game(config);
}
```

- [ ] **Step 2: Create `FaultLineScene.ts` skeleton**

```typescript
import Phaser from 'phaser';

export class FaultLineScene extends Phaser.Scene {
  constructor() { super('FaultLineScene'); }

  preload() {}

  create() {
    this.add.text(400, 260, 'Fault Line — Loading...', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }

  update(_time: number, _delta: number) {}
}
```

- [ ] **Step 3: Verify game boots**

Navigate to `/games/fault-line`. Black canvas with "Fault Line — Loading..." text should appear. No console errors.

---

## Task 3: Procedural asset generation (preload)

**Files:**
- Modify: `src/routes/games/fault-line/FaultLineScene.ts`

All textures are generated via canvas in `preload()`. They are keyed consistently so real sprites can be dropped in as same-named files later.

- [ ] **Step 1: Replace `preload()` with canvas texture generation**

```typescript
preload() {
  this.generateTexture('wood_block', 40, 40, (ctx) => {
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(0, 0, 40, 40);
    ctx.strokeStyle = '#5a4010';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 38, 38);
    // grain lines
    ctx.strokeStyle = '#7a5c12';
    ctx.lineWidth = 1;
    for (let i = 8; i < 40; i += 8) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(40, i); ctx.stroke();
    }
  });

  this.generateTexture('stone_block', 40, 40, (ctx) => {
    ctx.fillStyle = '#6b6b6b';
    ctx.fillRect(0, 0, 40, 40);
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 38, 38);
    ctx.fillStyle = '#505050';
    ctx.fillRect(4, 4, 14, 14);
    ctx.fillRect(22, 22, 14, 14);
  });

  this.generateTexture('crate', 40, 40, (ctx) => {
    ctx.fillStyle = '#9c7a2e';
    ctx.fillRect(0, 0, 40, 40);
    ctx.strokeStyle = '#4a3a00';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, 38, 38);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(40,40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40,0); ctx.lineTo(0,40); ctx.stroke();
  });

  this.generateTexture('stone_column', 40, 40, (ctx) => {
    ctx.fillStyle = '#b8b0a0';
    ctx.fillRect(0, 0, 40, 40);
    ctx.strokeStyle = '#7a7060';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 38, 38);
    ctx.fillStyle = '#a09888';
    ctx.fillRect(5, 5, 30, 4);
    ctx.fillRect(5, 31, 30, 4);
  });

  this.generateTexture('sentinel', 36, 36, (ctx) => {
    // body
    ctx.fillStyle = '#e8a020';
    ctx.fillRect(10, 16, 16, 16);
    // head
    ctx.fillStyle = '#f5c060';
    ctx.beginPath(); ctx.arc(18, 12, 8, 0, Math.PI * 2); ctx.fill();
    // hard hat
    ctx.fillStyle = '#ffdd00';
    ctx.fillRect(8, 6, 20, 5);
    ctx.fillRect(6, 9, 24, 3);
    // eyes
    ctx.fillStyle = '#333';
    ctx.fillRect(14, 10, 3, 3);
    ctx.fillRect(20, 10, 3, 3);
  });

  this.generateTexture('armored', 40, 40, (ctx) => {
    // bulky body
    ctx.fillStyle = '#445566';
    ctx.fillRect(6, 14, 28, 22);
    // shoulder pads
    ctx.fillStyle = '#556677';
    ctx.fillRect(2, 14, 10, 10);
    ctx.fillRect(28, 14, 10, 10);
    // head with visor
    ctx.fillStyle = '#556677';
    ctx.beginPath(); ctx.arc(20, 10, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#88aacc';
    ctx.fillRect(12, 6, 16, 6);
  });

  this.generateTexture('civilian', 36, 36, (ctx) => {
    // body (crouching)
    ctx.fillStyle = '#cc5500';
    ctx.fillRect(8, 20, 20, 12);
    // head
    ctx.fillStyle = '#f5c060';
    ctx.beginPath(); ctx.arc(18, 16, 8, 0, Math.PI * 2); ctx.fill();
    // hard hat
    ctx.fillStyle = '#ffdd00';
    ctx.fillRect(8, 9, 20, 5);
    // arms over head
    ctx.strokeStyle = '#f5c060';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(8, 20); ctx.lineTo(4, 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(28, 20); ctx.lineTo(32, 12); ctx.stroke();
  });

  this.generateTexture('artifact', 40, 56, (ctx) => {
    // pedestal
    ctx.fillStyle = '#8a7a50';
    ctx.fillRect(8, 44, 24, 12);
    // urn body
    ctx.fillStyle = '#d4a830';
    ctx.beginPath();
    ctx.ellipse(20, 28, 12, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // urn neck
    ctx.fillStyle = '#c09020';
    ctx.fillRect(15, 10, 10, 8);
    // glow
    const grad = ctx.createRadialGradient(20, 30, 5, 20, 30, 20);
    grad.addColorStop(0, 'rgba(0,255,100,0.3)');
    grad.addColorStop(1, 'rgba(0,255,100,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(20, 30, 20, 0, Math.PI * 2); ctx.fill();
  });

  this.generateTexture('safe_zone_glow', 128, 128, (ctx) => {
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,255,80,0.25)');
    grad.addColorStop(0.6, 'rgba(0,255,80,0.12)');
    grad.addColorStop(1, 'rgba(0,255,80,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  });

  this.generateTexture('ground_tile', 40, 40, (ctx) => {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 40, 40);
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 40, 40);
  });

  this.generateTexture('ruins_tile', 40, 40, (ctx) => {
    ctx.fillStyle = '#2a2318';
    ctx.fillRect(0, 0, 40, 40);
    ctx.strokeStyle = '#332b1e';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 40, 40);
    ctx.fillStyle = '#1e1a10';
    ctx.fillRect(2, 2, 10, 10);
    ctx.fillRect(22, 22, 12, 12);
  });

  this.generateTexture('crack_decal', 80, 24, (ctx) => {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(20, 8); ctx.lineTo(35, 16); ctx.lineTo(50, 6);
    ctx.lineTo(65, 14); ctx.lineTo(80, 10);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#222222';
    ctx.beginPath();
    ctx.moveTo(35, 16); ctx.lineTo(30, 24);
    ctx.moveTo(50, 6); ctx.lineTo(55, 0);
    ctx.stroke();
  });

  this.generateTexture('charge_ring', 128, 128, (ctx) => {
    const grad = ctx.createRadialGradient(64, 64, 50, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.85, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(64, 64, 64, 0, Math.PI * 2); ctx.fill();
  });
}

private generateTexture(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  draw(ctx);
  this.textures.addCanvas(key, canvas);
}
```

- [ ] **Step 2: Verify textures generate**

In `create()`, temporarily add:
```typescript
this.add.image(100, 100, 'wood_block');
this.add.image(150, 100, 'stone_block');
this.add.image(200, 100, 'sentinel');
this.add.image(250, 100, 'safe_zone_glow');
```
Navigate to `/games/fault-line`. All four sprites should be visible. Remove these test lines before next task.

---

## Task 4: Level data types + 6 level definitions

**Files:**
- Create: `src/routes/games/fault-line/levels.ts`

- [ ] **Step 1: Create `levels.ts` with interfaces and all 6 levels**

```typescript
export type StructureType = 'wooden_tower' | 'crate_stack' | 'stone_pillar' | 'stone_arch' | 'stone_wall';
export type EnemyType = 'sentinel' | 'armored';
export type SafeZoneType = 'civilian' | 'artifact' | 'generator';

export interface StructureDef {
  type: StructureType;
  x: number;
  y: number;          // y of the bottom block
  blockCount?: number;
  width?: number;     // for walls: how many blocks wide
}

export interface EnemyDef {
  type: EnemyType;
  x: number;
  y: number;
  patrolDistance: number; // pixels each direction from spawn
}

export interface SafeZoneDef {
  type: SafeZoneType;
  x: number;
  y: number;
  radius: number;
  maxHealth: number;  // tolerance — how many force-hits before fail
}

export interface LevelData {
  id: string;
  act: 1 | 2;
  name: string;
  par: number;
  maxQuakes: number;  // quakes allowed before input locks
  structures: StructureDef[];
  enemies: EnemyDef[];
  safeZones: SafeZoneDef[];
  groundTile: 'ground_tile' | 'ruins_tile';
}

// Game canvas: 800×520. Ground surface: y=480 (blocks sit above this).
// Block size: 40×40. Sentinel/Armored spawns on ground: y=460.

export const LEVELS: LevelData[] = [
  // ── ACT 1: Construction Site ──────────────────────────────────────
  {
    id: 'l1',
    act: 1,
    name: 'First Tremor',
    par: 2,
    maxQuakes: 6,
    groundTile: 'ground_tile',
    structures: [
      { type: 'wooden_tower', x: 420, y: 480, blockCount: 5 }
    ],
    enemies: [
      { type: 'sentinel', x: 500, y: 460, patrolDistance: 40 }
    ],
    safeZones: [
      { type: 'civilian', x: 200, y: 460, radius: 45, maxHealth: 3 }
    ]
  },
  {
    id: 'l2',
    act: 1,
    name: 'Chain Reaction',
    par: 3,
    maxQuakes: 8,
    groundTile: 'ground_tile',
    structures: [
      { type: 'wooden_tower', x: 240, y: 480, blockCount: 4 },
      { type: 'wooden_tower', x: 560, y: 480, blockCount: 4 },
      { type: 'crate_stack',  x: 400, y: 480, blockCount: 3 }
    ],
    enemies: [
      { type: 'sentinel', x: 270, y: 460, patrolDistance: 50 },
      { type: 'sentinel', x: 530, y: 460, patrolDistance: 50 }
    ],
    safeZones: [
      { type: 'civilian', x: 680, y: 460, radius: 45, maxHealth: 3 }
    ]
  },
  {
    id: 'l3',
    act: 1,
    name: 'Overhead Platform',
    par: 4,
    maxQuakes: 10,
    groundTile: 'ground_tile',
    structures: [
      { type: 'stone_wall', x: 200, y: 480, width: 3 },    // left wall support
      { type: 'stone_wall', x: 560, y: 480, width: 3 },    // right wall support
      { type: 'wooden_tower', x: 380, y: 480, blockCount: 3 } // center structure
    ],
    enemies: [
      { type: 'sentinel', x: 350, y: 460, patrolDistance: 60 },
      { type: 'armored',  x: 450, y: 460, patrolDistance: 40 }
    ],
    safeZones: [
      { type: 'civilian', x: 100, y: 460, radius: 45, maxHealth: 2 },
      { type: 'civilian', x: 700, y: 460, radius: 45, maxHealth: 2 }
    ]
  },

  // ── ACT 2: Ancient Ruins ──────────────────────────────────────────
  {
    id: 'l4',
    act: 2,
    name: 'The Archway',
    par: 3,
    maxQuakes: 8,
    groundTile: 'ruins_tile',
    structures: [
      { type: 'stone_pillar', x: 280, y: 480, blockCount: 5 }, // left leg
      { type: 'stone_pillar', x: 520, y: 480, blockCount: 5 }, // right leg
      { type: 'stone_arch',   x: 400, y: 280, blockCount: 1 }  // keystone top
    ],
    enemies: [
      { type: 'sentinel', x: 310, y: 460, patrolDistance: 80 },
      { type: 'sentinel', x: 490, y: 460, patrolDistance: 80 }
    ],
    safeZones: [
      { type: 'artifact', x: 660, y: 450, radius: 50, maxHealth: 2 }
    ]
  },
  {
    id: 'l5',
    act: 2,
    name: 'Temple Row',
    par: 4,
    maxQuakes: 10,
    groundTile: 'ruins_tile',
    structures: [
      { type: 'stone_pillar', x: 160, y: 480, blockCount: 6 },
      { type: 'stone_pillar', x: 400, y: 480, blockCount: 6 },
      { type: 'stone_pillar', x: 640, y: 480, blockCount: 6 }
    ],
    enemies: [
      { type: 'sentinel', x: 200, y: 460, patrolDistance: 60 },
      { type: 'sentinel', x: 440, y: 460, patrolDistance: 60 }
    ],
    safeZones: [
      { type: 'artifact', x: 280, y: 450, radius: 50, maxHealth: 2 },
      { type: 'artifact', x: 520, y: 450, radius: 50, maxHealth: 2 }
    ]
  },
  {
    id: 'l6',
    act: 2,
    name: 'The Generator',
    par: 3,
    maxQuakes: 9,
    groundTile: 'ruins_tile',
    structures: [
      { type: 'stone_pillar', x: 180, y: 480, blockCount: 4 },
      { type: 'stone_pillar', x: 620, y: 480, blockCount: 4 }
    ],
    enemies: [
      { type: 'armored', x: 220, y: 460, patrolDistance: 60 },
      { type: 'armored', x: 580, y: 460, patrolDistance: 60 },
      { type: 'sentinel', x: 400, y: 300, patrolDistance: 80 }
    ],
    safeZones: [
      { type: 'generator', x: 400, y: 455, radius: 55, maxHealth: 2 }
    ]
  }
];
```

- [ ] **Step 2: Verify TypeScript compiles**

Run `npm run check`. Should report no errors in `levels.ts`.

---

## Task 5: Structure.ts — compound bodies + breakable constraints

**Files:**
- Create: `src/routes/games/fault-line/Structure.ts`

- [ ] **Step 1: Create `Structure.ts`**

```typescript
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
  breakMultiplier: number; // ratio of dist/restLength that breaks the joint
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
      // Horizontal wall — blocks side by side
      for (let i = 0; i < width; i++) {
        const bx = def.x + i * BLOCK_SIZE - ((width - 1) * BLOCK_SIZE) / 2;
        const by = def.y - BLOCK_SIZE / 2;
        this.addBlock(bx, by, mat);
      }
      this.connectBlocks(mat, 'horizontal');
    } else if (def.type === 'stone_arch') {
      // Arch keystone — single block, connects to nearby pillars via scene event
      const bx = def.x;
      const by = def.y;
      this.addBlock(bx, by, mat);
    } else {
      // Vertical tower / pillar / crate stack
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
      const restLength = direction === 'vertical' ? BLOCK_SIZE : BLOCK_SIZE;

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
    // Cleared when all blocks are below ground or moving very slowly and low
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run `npm run check`. No errors expected.

---

## Task 6: Enemy.ts — Sentinel + Armored patrol AI

**Files:**
- Create: `src/routes/games/fault-line/Enemy.ts`

- [ ] **Step 1: Create `Enemy.ts`**

```typescript
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
      fixedRotation: true,
      label: 'enemy'
    }) as Phaser.Physics.Matter.Image;
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

    // Fallen off screen
    if (this.sprite.y > 560 || this.sprite.y < -60) {
      this.alive = false;
      this.sprite.destroy();
      return;
    }

    // If launched by quake (high velocity), let physics handle it
    if (speed > 5) return;

    // Patrol
    const vx = this.direction * this.speed;
    Phaser.Physics.Matter.Matter.Body.setVelocity(body, { x: vx, y: body.velocity.y });

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
      // Stun flash for armored
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run `npm run check`. No errors expected.

---

## Task 7: SafeZone.ts — sensor, health, glow

**Files:**
- Create: `src/routes/games/fault-line/SafeZone.ts`

- [ ] **Step 1: Create `SafeZone.ts`**

```typescript
import Phaser from 'phaser';
import type { SafeZoneDef } from './levels';

export class SafeZone {
  private scene: Phaser.Scene;
  private glow: Phaser.GameObjects.Image;
  private healthBar: Phaser.GameObjects.Graphics;
  private glowTween: Phaser.Tweens.Tween | null = null;

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

    // Glow sprite beneath the protected area
    this.glow = scene.add.image(def.x, def.y, 'safe_zone_glow')
      .setDisplaySize(def.radius * 2.5, def.radius * 2.5)
      .setDepth(1)
      .setAlpha(0.85);

    // Show the protected object on top of the glow
    const textureKey = def.type === 'civilian' ? 'civilian'
      : def.type === 'artifact' ? 'artifact'
      : 'stone_block'; // generator — placeholder
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

  // Call each frame — checks if any high-speed body is inside radius
  checkImpact(bodies: MatterJS.BodyType[]) {
    if (this.failed) return;

    for (const body of bodies) {
      if ((body as any).label === 'enemy') continue;
      const dx = body.position.x - this.x;
      const dy = body.position.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);

      if (dist < this.radius + 20 && speed > 8) {
        const impactForce = speed * (body.mass ?? 1);
        const threshold = 120;
        if (impactForce > threshold) {
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
      tint: 0xff0000,
      duration: 100,
      yoyo: true,
      onComplete: () => { this.glow.clearTint(); }
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run `npm run check`. No errors.

---

## Task 8: scoring.ts — pure star calculation

**Files:**
- Create: `src/routes/games/fault-line/scoring.ts`

- [ ] **Step 1: Create `scoring.ts`**

```typescript
export interface ScoreResult {
  stars: 0 | 1 | 2 | 3;
  failed: boolean;
  richterMagnitude: number; // 1-6, for needle animation
}

export function calculateScore(
  quakesUsed: number,
  par: number,
  worstSafeZoneHealthPct: number, // 0 = destroyed, 1 = untouched
  chainBonus: boolean
): ScoreResult {
  if (worstSafeZoneHealthPct <= 0) {
    return { stars: 0, failed: true, richterMagnitude: 1 };
  }

  let stars: 0 | 1 | 2 | 3 = 1;

  if (quakesUsed <= par && worstSafeZoneHealthPct === 1) {
    stars = 3;
  } else if (quakesUsed <= par + 2 && worstSafeZoneHealthPct > 0.5) {
    stars = 2;
  } else {
    stars = 1;
  }

  // Chain bonus can push 2→3 but not 1→3
  if (chainBonus && stars === 2) stars = 3;

  const richterMagnitude = stars === 3 ? 5 + Math.random() : stars === 2 ? 3 + Math.random() : 1.5 + Math.random();

  return { stars, failed: false, richterMagnitude };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run `npm run check`. No errors.

---

## Task 9: FaultLineScene — level loading, ground, camera

**Files:**
- Modify: `src/routes/games/fault-line/FaultLineScene.ts`

Replace the stub `create()` with a full scene that:
1. Draws a tiled ground
2. Loads a level from `LEVELS`
3. Creates all structures, enemies, safe zones
4. Sets up a static ground body

- [ ] **Step 1: Rewrite `FaultLineScene.ts` with level loading**

```typescript
import Phaser from 'phaser';
import { Structure } from './Structure';
import { Enemy } from './Enemy';
import { SafeZone } from './SafeZone';
import { LEVELS, type LevelData } from './levels';

const GROUND_Y = 480;
const CANVAS_W = 800;
const CANVAS_H = 520;

export class FaultLineScene extends Phaser.Scene {
  private structures: Structure[] = [];
  private enemies: Enemy[] = [];
  private safeZones: SafeZone[] = [];
  private currentLevelIndex = 0;
  private currentLevel!: LevelData;

  // Input state
  private chargeStart = 0;
  private isCharging = false;
  private inputLocked = false;
  private quakesUsed = 0;
  private chargeRing!: Phaser.GameObjects.Image;
  private chargeTween: Phaser.Tweens.Tween | null = null;
  private cameraTremor: Phaser.Time.TimerEvent | null = null;

  // Scoring state
  private chainBonus = false;
  private chainBodyCount = 0;
  private chainTimer: Phaser.Time.TimerEvent | null = null;

  // HUD
  private quakeText!: Phaser.GameObjects.Text;
  private actText!: Phaser.GameObjects.Text;

  // Post-level
  private gameState: 'playing' | 'won' | 'failed' | 'postgame' = 'playing';

  constructor() { super('FaultLineScene'); }

  preload() {
    this.generateTexture('wood_block', 40, 40, (ctx) => {
      ctx.fillStyle = '#8B6914'; ctx.fillRect(0, 0, 40, 40);
      ctx.strokeStyle = '#5a4010'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, 38, 38);
      ctx.strokeStyle = '#7a5c12'; ctx.lineWidth = 1;
      for (let i = 8; i < 40; i += 8) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(40, i); ctx.stroke(); }
    });
    this.generateTexture('stone_block', 40, 40, (ctx) => {
      ctx.fillStyle = '#6b6b6b'; ctx.fillRect(0, 0, 40, 40);
      ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, 38, 38);
      ctx.fillStyle = '#505050'; ctx.fillRect(4, 4, 14, 14); ctx.fillRect(22, 22, 14, 14);
    });
    this.generateTexture('crate', 40, 40, (ctx) => {
      ctx.fillStyle = '#9c7a2e'; ctx.fillRect(0, 0, 40, 40);
      ctx.strokeStyle = '#4a3a00'; ctx.lineWidth = 3; ctx.strokeRect(1, 1, 38, 38);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(40,40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(40,0); ctx.lineTo(0,40); ctx.stroke();
    });
    this.generateTexture('stone_column', 40, 40, (ctx) => {
      ctx.fillStyle = '#b8b0a0'; ctx.fillRect(0, 0, 40, 40);
      ctx.strokeStyle = '#7a7060'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, 38, 38);
      ctx.fillStyle = '#a09888'; ctx.fillRect(5, 5, 30, 4); ctx.fillRect(5, 31, 30, 4);
    });
    this.generateTexture('sentinel', 36, 36, (ctx) => {
      ctx.fillStyle = '#e8a020'; ctx.fillRect(10, 16, 16, 16);
      ctx.fillStyle = '#f5c060'; ctx.beginPath(); ctx.arc(18, 12, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffdd00'; ctx.fillRect(8, 6, 20, 5); ctx.fillRect(6, 9, 24, 3);
      ctx.fillStyle = '#333'; ctx.fillRect(14, 10, 3, 3); ctx.fillRect(20, 10, 3, 3);
    });
    this.generateTexture('armored', 40, 40, (ctx) => {
      ctx.fillStyle = '#445566'; ctx.fillRect(6, 14, 28, 22);
      ctx.fillStyle = '#556677'; ctx.fillRect(2, 14, 10, 10); ctx.fillRect(28, 14, 10, 10);
      ctx.fillStyle = '#556677'; ctx.beginPath(); ctx.arc(20, 10, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#88aacc'; ctx.fillRect(12, 6, 16, 6);
    });
    this.generateTexture('civilian', 36, 36, (ctx) => {
      ctx.fillStyle = '#cc5500'; ctx.fillRect(8, 20, 20, 12);
      ctx.fillStyle = '#f5c060'; ctx.beginPath(); ctx.arc(18, 16, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffdd00'; ctx.fillRect(8, 9, 20, 5);
      ctx.strokeStyle = '#f5c060'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(8, 20); ctx.lineTo(4, 12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(28, 20); ctx.lineTo(32, 12); ctx.stroke();
    });
    this.generateTexture('artifact', 40, 56, (ctx) => {
      ctx.fillStyle = '#8a7a50'; ctx.fillRect(8, 44, 24, 12);
      ctx.fillStyle = '#d4a830'; ctx.beginPath(); ctx.ellipse(20, 28, 12, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c09020'; ctx.fillRect(15, 10, 10, 8);
      const grad = ctx.createRadialGradient(20, 30, 5, 20, 30, 20);
      grad.addColorStop(0, 'rgba(0,255,100,0.3)'); grad.addColorStop(1, 'rgba(0,255,100,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(20, 30, 20, 0, Math.PI * 2); ctx.fill();
    });
    this.generateTexture('safe_zone_glow', 128, 128, (ctx) => {
      const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0,255,80,0.25)');
      grad.addColorStop(0.6, 'rgba(0,255,80,0.12)');
      grad.addColorStop(1, 'rgba(0,255,80,0)');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128);
    });
    this.generateTexture('ground_tile', 40, 40, (ctx) => {
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, 40, 40);
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1; ctx.strokeRect(0, 0, 40, 40);
    });
    this.generateTexture('ruins_tile', 40, 40, (ctx) => {
      ctx.fillStyle = '#2a2318'; ctx.fillRect(0, 0, 40, 40);
      ctx.strokeStyle = '#332b1e'; ctx.lineWidth = 1; ctx.strokeRect(0, 0, 40, 40);
      ctx.fillStyle = '#1e1a10'; ctx.fillRect(2, 2, 10, 10); ctx.fillRect(22, 22, 12, 12);
    });
    this.generateTexture('crack_decal', 80, 24, (ctx) => {
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0,12); ctx.lineTo(20,8); ctx.lineTo(35,16); ctx.lineTo(50,6); ctx.lineTo(65,14); ctx.lineTo(80,10);
      ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = '#222';
      ctx.beginPath(); ctx.moveTo(35,16); ctx.lineTo(30,24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(50,6); ctx.lineTo(55,0); ctx.stroke();
    });
    this.generateTexture('charge_ring', 128, 128, (ctx) => {
      const grad = ctx.createRadialGradient(64, 64, 50, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.85, 'rgba(255,255,255,0.6)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(64, 64, 64, 0, Math.PI*2); ctx.fill();
    });
  }

  private generateTexture(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    draw(canvas.getContext('2d')!);
    this.textures.addCanvas(key, canvas);
  }

  create() {
    this.gameState = 'playing';
    this.quakesUsed = 0;
    this.chainBonus = false;
    this.structures = [];
    this.enemies = [];
    this.safeZones = [];

    this.currentLevel = LEVELS[this.currentLevelIndex];
    this.loadLevel(this.currentLevel);
    this.setupInput();
    this.setupHUD();
    this.setupGroundBody();

    this.events.on('safeZoneFailed', this.onSafeZoneFailed, this);
  }

  private loadLevel(level: LevelData) {
    // Draw tiled ground
    const tileKey = level.groundTile;
    for (let x = 0; x < CANVAS_W; x += 40) {
      for (let row = 0; row < 2; row++) {
        this.add.image(x + 20, GROUND_Y + row * 40 + 20, tileKey).setDepth(0);
      }
    }

    // Act label
    this.actText = this.add.text(400, 18, `ACT ${level.act} — ${level.name.toUpperCase()}`, {
      fontSize: '11px', color: '#555555', letterSpacing: 2
    }).setOrigin(0.5).setDepth(200);

    // Structures
    for (const def of level.structures) {
      this.structures.push(new Structure(this, def));
    }

    // Enemies
    for (const def of level.enemies) {
      this.enemies.push(new Enemy(this, def));
    }

    // Safe zones
    for (const def of level.safeZones) {
      this.safeZones.push(new SafeZone(this, def));
    }
  }

  private setupGroundBody() {
    // Invisible static ground platform
    this.matter.add.rectangle(CANVAS_W / 2, GROUND_Y + 20, CANVAS_W + 40, 40, {
      isStatic: true, friction: 0.8, restitution: 0.1, label: 'ground'
    });
    // Side walls
    this.matter.add.rectangle(-20, CANVAS_H / 2, 40, CANVAS_H, { isStatic: true, label: 'wall' });
    this.matter.add.rectangle(CANVAS_W + 20, CANVAS_H / 2, 40, CANVAS_H, { isStatic: true, label: 'wall' });
  }

  private setupInput() {
    this.chargeRing = this.add.image(0, 0, 'charge_ring').setAlpha(0).setDepth(50).setScale(0.5);

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.inputLocked || this.gameState !== 'playing') return;
      this.isCharging = true;
      this.chargeStart = this.time.now;
      this.chargeRing.setPosition(ptr.x, ptr.y).setAlpha(0.4).setScale(0.3).setTint(0xffffff);
      this.chargeTween = this.tweens.add({
        targets: this.chargeRing,
        scale: 1.2,
        tint: { from: 0xffffff, to: 0xff6600 },
        duration: 1500,
        ease: 'Quad.easeIn'
      });
      this.cameraTremor = this.time.addEvent({
        delay: 150, loop: true,
        callback: () => {
          if (!this.isCharging) return;
          const held = this.time.now - this.chargeStart;
          const intensity = Math.min(held / 1500, 1) * 0.003;
          this.cameras.main.shake(80, intensity);
        }
      });
    });

    this.input.on('pointerup', (ptr: Phaser.Input.Pointer) => {
      if (!this.isCharging || this.gameState !== 'playing') return;
      this.isCharging = false;
      this.chargeTween?.stop();
      this.cameraTremor?.remove();
      this.chargeRing.setAlpha(0);

      const held = this.time.now - this.chargeStart;
      const chargeMultiplier = 1 + Math.min(held / 1500, 1) * 2;
      this.fireQuake(ptr.x, ptr.y, chargeMultiplier);
    });
  }

  private fireQuake(epicenterX: number, epicenterY: number, chargeMultiplier: number) {
    this.quakesUsed++;
    this.updateHUD();

    const BASE_FORCE = 0.035;
    const BASE_RADIUS = 160;
    const force = BASE_FORCE * chargeMultiplier;
    const radius = BASE_RADIUS * (0.7 + chargeMultiplier * 0.3);

    // Screen shake
    this.cameras.main.shake(200 + chargeMultiplier * 100, 0.004 + chargeMultiplier * 0.004);

    // Crack decal at epicenter
    this.add.image(epicenterX, Math.min(epicenterY, GROUND_Y - 5), 'crack_decal')
      .setDepth(1)
      .setRotation(Math.random() * Math.PI)
      .setScale(0.7 + chargeMultiplier * 0.3);

    // Apply radial force to all dynamic bodies
    const MatterLib = Phaser.Physics.Matter.Matter;
    const allBodies = this.matter.world.getAllBodies();
    let bodiesAffected = 0;

    for (const body of allBodies) {
      if (body.isStatic) continue;
      const dx = body.position.x - epicenterX;
      const dy = body.position.y - epicenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius || dist < 1) continue;

      const t = 1 - dist / radius;
      const dirX = dx / dist;
      const dirY = dy / dist;
      const mag = force * t / Math.max(body.mass, 0.5);

      MatterLib.Body.applyForce(body, { x: epicenterX, y: epicenterY }, {
        x: dirX * mag,
        y: dirY * mag - mag * 0.3 // slight upward bias
      });
      bodiesAffected++;
    }

    // Chain detection
    if (bodiesAffected >= 3) {
      this.chainBodyCount = bodiesAffected;
      this.chainTimer?.remove();
      this.chainTimer = this.time.delayedCall(2000, () => {
        if (this.chainBodyCount >= 3) this.chainBonus = true;
        this.chainBodyCount = 0;
      });
    }

    // Lock input if quakes exhausted
    if (this.quakesUsed >= this.currentLevel.maxQuakes) {
      this.time.delayedCall(500, () => { this.inputLocked = true; });
    }
  }

  private setupHUD() {
    // Quake counter
    this.quakeText = this.add.text(12, 12, '', {
      fontSize: '13px', color: '#aaaaaa', letterSpacing: 1
    }).setDepth(200);
    this.updateHUD();
  }

  private updateHUD() {
    const remaining = this.currentLevel.maxQuakes - this.quakesUsed;
    this.quakeText.setText(`QUAKES  ${remaining} / ${this.currentLevel.maxQuakes}  ·  PAR ${this.currentLevel.par}`);
  }

  update(_time: number, delta: number) {
    if (this.gameState !== 'playing') return;

    // Update structures (check constraint breaks)
    for (const s of this.structures) {
      s.update((bx, by) => this.onConstraintBreak(bx, by));
    }

    // Update enemies
    for (const e of this.enemies) {
      e.update(delta);
    }

    // Check safe zone impacts
    const allBodies = this.matter.world.getAllBodies();
    for (const sz of this.safeZones) {
      sz.checkImpact(allBodies);
    }

    // Check win condition: all enemies dead
    const allEnemiesDead = this.enemies.every(e => !e.isAlive());
    if (allEnemiesDead && this.enemies.length > 0) {
      this.onLevelWon();
    }
  }

  private onConstraintBreak(x: number, y: number) {
    // Dust particles at break point
    const particles = this.add.particles(x, y, 'stone_block', {
      speed: { min: 30, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.15, end: 0 },
      lifespan: 600,
      quantity: 8,
      gravityY: 200
    });
    this.time.delayedCall(800, () => particles.destroy());

    // Slow-mo trigger
    const MatterLib = Phaser.Physics.Matter.Matter;
    const movingBodies = this.matter.world.getAllBodies()
      .filter(b => !b.isStatic && Math.sqrt(b.velocity.x**2 + b.velocity.y**2) > 2).length;

    if (movingBodies >= 3 && (this.matter.world as any).engine.timing.timeScale === 1) {
      (this.matter.world as any).engine.timing.timeScale = 0.3;
      this.time.delayedCall(500, () => {
        (this.matter.world as any).engine.timing.timeScale = 1;
      });
    }
  }

  private onSafeZoneFailed() {
    if (this.gameState !== 'playing') return;
    this.gameState = 'failed';
    this.inputLocked = true;
    this.showOutcomeScreen(false);
  }

  private onLevelWon() {
    if (this.gameState !== 'playing') return;
    this.gameState = 'won';
    this.inputLocked = true;

    const worstHealth = Math.min(...this.safeZones.map(sz => sz.getHealthPct()), 1);
    const { calculateScore } = require('./scoring') as typeof import('./scoring');
    const result = calculateScore(this.quakesUsed, this.currentLevel.par, worstHealth, this.chainBonus);
    this.showScoreScreen(result);
  }

  private showOutcomeScreen(won: boolean) {
    // Dark overlay
    const overlay = this.add.rectangle(CANVAS_W/2, CANVAS_H/2, CANVAS_W, CANVAS_H, 0x000000, 0.75).setDepth(300);
    const msg = won ? 'LEVEL CLEAR' : 'SAFE ZONE DESTROYED';
    const color = won ? '#00ff55' : '#ff3333';
    this.add.text(CANVAS_W/2, 180, msg, { fontSize: '28px', color, fontStyle: 'bold' }).setOrigin(0.5).setDepth(301);

    if (!won) {
      this.add.text(CANVAS_W/2, 340, 'TAP TO RETRY', { fontSize: '14px', color: '#888888', letterSpacing: 3 })
        .setOrigin(0.5).setDepth(301);
      this.input.once('pointerdown', () => this.scene.restart());
    }
  }

  private showScoreScreen(result: import('./scoring').ScoreResult) {
    const overlay = this.add.rectangle(CANVAS_W/2, CANVAS_H/2, CANVAS_W, CANVAS_H, 0x000000, 0.8).setDepth(300);

    this.add.text(CANVAS_W/2, 140, 'LEVEL CLEAR', { fontSize: '22px', color: '#ffffff', letterSpacing: 4 })
      .setOrigin(0.5).setDepth(301);

    // Stars
    const starSpacing = 60;
    for (let i = 0; i < 3; i++) {
      const filled = i < result.stars;
      const sx = CANVAS_W/2 + (i - 1) * starSpacing;
      const starG = this.add.graphics().setDepth(301);
      this.drawStar(starG, sx, 220, 22, filled ? 0xffcc00 : 0x333333);
    }

    // Richter scale
    this.add.text(CANVAS_W/2, 280, 'RICHTER SCALE', { fontSize: '10px', color: '#555555', letterSpacing: 3 })
      .setOrigin(0.5).setDepth(301);
    const needleG = this.add.graphics().setDepth(301);
    this.animateRichterNeedle(needleG, CANVAS_W/2, 330, result.richterMagnitude);

    // Quakes used
    this.add.text(CANVAS_W/2, 390, `${this.quakesUsed} QUAKES  ·  PAR ${this.currentLevel.par}`, {
      fontSize: '12px', color: '#666666', letterSpacing: 2
    }).setOrigin(0.5).setDepth(301);

    // Next level / retry buttons
    const hasNext = this.currentLevelIndex < LEVELS.length - 1;
    const nextLabel = hasNext ? 'NEXT LEVEL →' : 'ALL LEVELS COMPLETE';
    const nextBtn = this.add.text(CANVAS_W/2, 440, nextLabel, {
      fontSize: '13px', color: '#aaaaaa', letterSpacing: 3
    }).setOrigin(0.5).setDepth(301).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerover', () => nextBtn.setColor('#ffffff'));
    nextBtn.on('pointerout', () => nextBtn.setColor('#aaaaaa'));
    nextBtn.on('pointerdown', () => {
      if (hasNext) {
        this.currentLevelIndex++;
        this.scene.restart();
      }
    });

    const retryBtn = this.add.text(CANVAS_W/2, 468, 'RETRY', {
      fontSize: '11px', color: '#444444', letterSpacing: 3
    }).setOrigin(0.5).setDepth(301).setInteractive({ useHandCursor: true });
    retryBtn.on('pointerover', () => retryBtn.setColor('#888888'));
    retryBtn.on('pointerout', () => retryBtn.setColor('#444444'));
    retryBtn.on('pointerdown', () => this.scene.restart());
  }

  private drawStar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, color: number) {
    g.fillStyle(color, 1);
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.4;
      points.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
    }
    g.fillPoints(points, true);
  }

  private animateRichterNeedle(g: Phaser.GameObjects.Graphics, cx: number, cy: number, magnitude: number) {
    // Draw arc gauge background
    g.lineStyle(2, 0x333333, 1);
    g.beginPath();
    g.arc(cx, cy, 40, Math.PI, 0, false);
    g.strokePath();

    // Tick marks 1-6
    for (let i = 1; i <= 6; i++) {
      const angle = Math.PI - (i / 6) * Math.PI;
      const tx = cx + Math.cos(angle) * 44;
      const ty = cy + Math.sin(angle) * 44;
      g.fillStyle(0x444444, 1);
      g.fillCircle(tx, ty, 2);
    }

    // Animate needle from 0 to magnitude
    let current = 0;
    const target = (magnitude / 6) * Math.PI;
    const timer = this.time.addEvent({
      delay: 16, loop: true,
      callback: () => {
        current = Phaser.Math.Linear(current, target, 0.08);
        g.clear();
        // Redraw background
        g.lineStyle(2, 0x333333, 1);
        g.beginPath(); g.arc(cx, cy, 40, Math.PI, 0, false); g.strokePath();
        for (let i = 1; i <= 6; i++) {
          const a = Math.PI - (i/6)*Math.PI;
          g.fillStyle(0x444444,1); g.fillCircle(cx+Math.cos(a)*44, cy+Math.sin(a)*44, 2);
        }
        // Needle
        const needleAngle = Math.PI - current;
        g.lineStyle(2, 0xff4400, 1);
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(cx + Math.cos(needleAngle) * 36, cy + Math.sin(needleAngle) * 36);
        g.strokePath();
        g.fillStyle(0xff4400, 1); g.fillCircle(cx, cy, 4);
        if (Math.abs(current - target) < 0.005) timer.remove();
      }
    });
  }

  // Level restart must preserve currentLevelIndex across scene restart
  // Store it in the registry so scene.restart() picks it up
  private preserveLevelIndex() {
    this.registry.set('currentLevelIndex', this.currentLevelIndex);
  }
}
```

> **Note on `require`:** The `require('./scoring')` call won't work in ESM. Fix it in Task 10 — `scoring` will be imported at the top of the file instead.

- [ ] **Step 2: Fix the scoring import**

At the top of `FaultLineScene.ts`, add:
```typescript
import { calculateScore } from './scoring';
```
Then in `onLevelWon()`, replace:
```typescript
const { calculateScore } = require('./scoring') as typeof import('./scoring');
const result = calculateScore(this.quakesUsed, this.currentLevel.par, worstHealth, this.chainBonus);
```
With:
```typescript
const result = calculateScore(this.quakesUsed, this.currentLevel.par, worstHealth, this.chainBonus);
```

- [ ] **Step 3: Persist level index across restarts**

In `FaultLineScene`, update the constructor to read from registry, and save before restart:

```typescript
constructor() {
  super('FaultLineScene');
}

// In create(), before loading level:
create() {
  this.currentLevelIndex = this.registry.get('currentLevelIndex') ?? 0;
  // ... rest of create
}

// In showScoreScreen nextBtn.on('pointerdown'):
nextBtn.on('pointerdown', () => {
  if (hasNext) {
    this.registry.set('currentLevelIndex', this.currentLevelIndex + 1);
    this.scene.restart();
  }
});

// In onSafeZoneFailed / retry:
retryBtn.on('pointerdown', () => {
  this.registry.set('currentLevelIndex', this.currentLevelIndex);
  this.scene.restart();
});
```

- [ ] **Step 4: Run `npm run check`**

Expected: no TypeScript errors.

- [ ] **Step 5: Run dev server and smoke-test Level 1**

`npm run dev` → navigate to `/games/fault-line`. You should see:
- Tiled ground
- A wooden tower of 5 blocks
- A sentinel patrolling right of the tower
- A civilian with a green glow on the left
- "QUAKES  6 / 6 · PAR 2" in the top-left

Tap anywhere near the tower — it should shudder and possibly fall. The sentinel should fly off if caught in the radius. No console errors.

---

## Task 10: Wire enemies to quake + enemy death from debris

**Files:**
- Modify: `src/routes/games/fault-line/FaultLineScene.ts`

Currently enemies update their patrol but there's no mechanism to mark them dead when crushed. This task adds that.

- [ ] **Step 1: Add enemy crush detection in `update()`**

Add to the end of `update()`, after safe zone checks:

```typescript
// Enemy crush check: enemy body under low velocity after being struck by a structure body
for (const enemy of this.enemies) {
  if (!enemy.isAlive()) continue;
  const body = enemy.sprite.body as MatterJS.BodyType;
  const speed = Math.sqrt(body.velocity.x**2 + body.velocity.y**2);
  // Off screen = dead
  if (enemy.sprite.y > CANVAS_H + 60 || enemy.sprite.x < -60 || enemy.sprite.x > CANVAS_W + 60) {
    enemy.alive = false;
    enemy.sprite.destroy();
  }
}
```

- [ ] **Step 2: Verify enemies die when knocked off screen**

In the dev server, fire a large charged quake directly at the sentinel in Level 1. It should fly off the right or bottom edge and be removed. Once the sentinel is gone, the level-won screen should appear.

---

## Task 11: Level select / full flow test

**Files:**
- Modify: `src/routes/games/fault-line/FaultLineScene.ts`

- [ ] **Step 1: Add level select overlay before Level 1**

In `create()`, if `currentLevelIndex === 0` and `this.registry.get('levelSelectShown')` is not set, show a brief title card:

```typescript
private showTitleCard() {
  const overlay = this.add.rectangle(CANVAS_W/2, CANVAS_H/2, CANVAS_W, CANVAS_H, 0x000000, 0.92).setDepth(400);
  this.add.text(CANVAS_W/2, 180, 'FAULT LINE', {
    fontSize: '36px', color: '#ffffff', letterSpacing: 8, fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(401);
  this.add.text(CANVAS_W/2, 230, 'TAP TO QUAKE · HOLD TO CHARGE', {
    fontSize: '11px', color: '#555555', letterSpacing: 3
  }).setOrigin(0.5).setDepth(401);
  this.add.text(CANVAS_W/2, 300, 'DON\'T TOUCH THE GREEN', {
    fontSize: '14px', color: '#00cc44', letterSpacing: 3
  }).setOrigin(0.5).setDepth(401);
  this.add.text(CANVAS_W/2, 440, 'TAP ANYWHERE TO START', {
    fontSize: '12px', color: '#444444', letterSpacing: 3
  }).setOrigin(0.5).setDepth(401);

  this.input.once('pointerdown', () => {
    this.registry.set('levelSelectShown', true);
    this.tweens.add({
      targets: [overlay],
      alpha: 0,
      duration: 400,
      onComplete: () => {
        overlay.destroy();
        this.gameState = 'playing';
        this.inputLocked = false;
      }
    });
  });
  this.gameState = 'pregame' as any;
  this.inputLocked = true;
}
```

Call `this.showTitleCard()` at the end of `create()` only when `!this.registry.get('levelSelectShown')`.

- [ ] **Step 2: Play through all 6 levels**

Navigate to `/games/fault-line`. Verify:
1. Title card shows on first load only
2. Level 1 loads correctly — wooden tower, sentinel, civilian
3. Completing Level 1 shows score screen with stars and Richter needle
4. "NEXT LEVEL →" advances to Level 2
5. Level 4 shows ruins tile and stone pillars
6. After Level 6, "NEXT LEVEL →" shows "ALL LEVELS COMPLETE"
7. "RETRY" on any level restarts that same level (not Level 1)

---

## Task 12: Polish — particles, slow-mo validation, HUD safe zone bars

**Files:**
- Modify: `src/routes/games/fault-line/FaultLineScene.ts`

- [ ] **Step 1: Add per-safe-zone health bars to HUD**

Add to `setupHUD()`:
```typescript
// Safe zone labels under each glow
for (const sz of this.safeZones) {
  this.add.text(sz.x, sz.y + sz.radius + 18,
    sz.type.toUpperCase(),
    { fontSize: '9px', color: '#00aa44', letterSpacing: 2 }
  ).setOrigin(0.5).setDepth(201);
}
```

The `SafeZone` class already renders its own health bar (Task 7). This just adds the label.

- [ ] **Step 2: Validate slow-mo triggers**

In the dev server, on Level 2 (two towers + crate stack) fire a max-charge quake at the center crate stack. Verify:
- Three or more blocks start moving
- The physics visibly slow down for ~0.5 seconds
- Physics return to normal speed

If slow-mo doesn't trigger, add a console.log inside `onConstraintBreak` to verify it's being called.

- [ ] **Step 3: Tune physics constants if needed**

If structures feel too light (fly apart too easily) or too heavy (barely move), adjust in `Structure.ts`:

```typescript
// In MATERIALS — increase/decrease force values:
const BASE_FORCE = 0.035;  // increase if blocks barely move
const BASE_RADIUS = 160;   // increase if quake feels too small
```

Changes to test:
- Small tap (no hold): only blocks within ~112px should move
- Max charge (1.5s hold): blocks up to ~208px away should fly

---

## Task 13: Sprite asset swap (when assets are ready)

**Files:**
- Modify: `src/routes/games/fault-line/FaultLineScene.ts`
- Add files to: `static/fault-line/`

This task is skipped until you provide the generated sprite images. When you have them:

- [ ] **Step 1: Add sprite files to `static/fault-line/`**

Place these files in `static/fault-line/`:
```
wood_block.png     (64×64)
stone_block.png    (64×64)
crate.png          (64×64)
stone_column.png   (64×64)
sentinel.png       (64×64)
armored.png        (64×64)
civilian.png       (64×64)
artifact.png       (64×96)
safe_zone_glow.png (128×128)
crack_decal.png    (96×32)
ground_tile.png    (64×64)
ruins_tile.png     (64×64)
```

- [ ] **Step 2: Replace `generateTexture` calls with `this.load.image` in `preload()`**

Replace the entire `preload()` body with:

```typescript
preload() {
  const base = '/fault-line/';
  ['wood_block','stone_block','crate','stone_column','sentinel','armored',
   'civilian','artifact','safe_zone_glow','crack_decal','ground_tile','ruins_tile',
   'charge_ring'].forEach(key => {
    this.load.image(key, `${base}${key}.png`);
  });
}
```

Remove the `generateTexture` private method — it's no longer needed.

- [ ] **Step 3: Verify no broken textures**

Load the game. All sprites should show with real art. Pink/magenta squares = missing file.

---

## Self-Review Notes

- `currentLevelIndex` persistence across `scene.restart()` is handled via `this.registry` — verified consistent across Tasks 9 and 11.
- `require('./scoring')` anti-pattern is caught and fixed within Task 9.
- All 6 `LEVELS` entries use defined `StructureType`/`EnemyType`/`SafeZoneType` — no stringly-typed gaps.
- `SafeZone.checkImpact` fires every frame but skips bodies with `label === 'enemy'` — enemies can't damage safe zones directly, only physics blocks can.
- `isCleared()` on `Structure` uses a threshold of `y > 400` which is below the ground line (`GROUND_Y = 480`) — blocks that have settled on the ground will satisfy this after velocity drops.
- The `stone_arch` type in Level 4 creates a single block at the top — it is not yet physically connected to the two pillars. A future enhancement would add constraints from the arch to the pillar tops. For MVP, collapsing either pillar will topple the arch via contact physics.
