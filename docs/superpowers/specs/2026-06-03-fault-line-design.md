# Fault Line — Game Design Spec

**Date:** 2026-06-03  
**Status:** Approved  
**Stack:** SvelteKit + Phaser 4.1.0 + Matter.js (built-in)

---

## Overview

Fault Line is a physics puzzle game with one verb: tap to quake. Every tap emits a radial shockwave that applies outward force to structures and enemies within its radius. The constraint is safe zones — marked objects that must survive. Destroy everything dangerous without touching the protected.

MVP scope: 6 levels (3 Act 1, 3 Act 2), tap-to-quake, hold-to-charge, breakable joint structures, safe zone tolerance meter, sentinel + armored guard enemies, 3-star scoring.

---

## Architecture

### File Structure

```
src/routes/games/fault-line/
  +page.svelte          — SvelteKit page: container, nav, description, lazy-loads game
  game.ts               — createGame(parent) entry point, Phaser + Matter.js config
  FaultLineScene.ts     — Main Phaser scene: orchestrates all systems, owns lifecycle
  levels.ts             — LevelData[] definitions for all 6 levels
  Structure.ts          — Builds compound Matter.js bodies with breakable constraints
  Enemy.ts              — Sentinel and Armored enemy classes with patrol AI
  SafeZone.ts           — Safe zone object with tolerance health + visual glow
  scoring.ts            — Star calculation from quake count, safe zone health, chains
```

### Lazy Loading

`+page.svelte` dynamically imports `game.ts` inside `onMount`, identical to Echo Sonar. `onDestroy` calls `gameInstance.destroy(true)`. No Phaser code loads until the route is visited.

### Scene Ownership

`FaultLineScene` owns the Phaser lifecycle (preload / create / update). It instantiates `Structure`, `Enemy`, and `SafeZone` objects from level data, manages the input state machine, applies radial forces, and delegates scoring. It does not contain game logic inline — each concern lives in its module.

---

## Physics Model

### Matter.js Setup

```typescript
physics: {
  default: 'matter',
  matter: {
    gravity: { x: 0, y: 1 },
    debug: false
  }
}
```

### Structures — Compound Bodies + Breakable Constraints

Each structure is a set of `MatterJS.BodyType` instances connected by `Phaser.Physics.Matter.MatterPhysics` constraints:

- `stiffness: 0.8`, `damping: 0.1` for wood (flexible, absorbs shock)
- `stiffness: 0.98`, `damping: 0.05` for stone (rigid until sudden snap)

Each constraint tracks `breakThreshold`: the maximum distance between connected bodies before the constraint is destroyed. Wood: `threshold = restingLength * 1.4`. Stone: `threshold = restingLength * 1.15` (snaps more suddenly).

Every `update()` frame we iterate active constraints and call `this.matter.world.removeConstraint(c)` when the current separation exceeds its threshold. The body then falls freely under gravity.

### Radial Quake Force

On quake trigger (pointer up after tap or hold):

```
for each dynamic body in scene:
  dist = distance(body.position, epicenter)
  if dist < quakeRadius:
    t = 1 - (dist / quakeRadius)          // linear falloff, 1 at center
    t = max(t, 0)
    direction = normalize(body.position - epicenter)
    forceMagnitude = baseForce * t / body.mass
    Matter.Body.applyForce(body, epicenter, direction * forceMagnitude)
```

`baseForce` and `quakeRadius` scale with `chargeMultiplier`.

### Hold-to-Charge

- `pointerdown` → record `chargeStart = scene.time.now`, begin camera micro-tremor loop
- `pointerup` → `held = scene.time.now - chargeStart`
- `chargeMultiplier = 1 + Math.min(held / 1500, 1) * 2` → range 1x–3x over 1.5s
- `quakeRadius = BASE_RADIUS * (0.8 + chargeMultiplier * 0.4)`
- Camera micro-tremor during hold: `cameras.main.shake(80, 0.002 * chargeMultiplier)` every 150ms

### Mass Differentiation

| Material     | Mass | Break Threshold Multiplier |
|-------------|------|--------------------------|
| Wood block  | 1    | 1.4× resting length      |
| Crate       | 1.5  | 1.5× (rolls easily)      |
| Stone block | 4    | 1.15× (sudden snap)      |
| Stone pillar| 6    | 1.12×                    |

---

## Input System

Two input modes managed by a state machine in `FaultLineScene`:

| State       | Trigger                     | Action                            |
|------------|----------------------------|-----------------------------------|
| `IDLE`      | —                           | Awaiting input                    |
| `CHARGING`  | `pointerdown`               | Start charge timer, camera tremor |
| `QUAKING`   | `pointerup`                 | Apply radial force, decrement quake counter, emit crack decal |
| `COOLDOWN`  | 300ms after quake           | Brief pause before next input accepted |

Quake counter displayed in HUD. When quake count reaches 0, input is locked until level restart.

---

## Level Data Format

```typescript
interface LevelData {
  id: string;
  act: 1 | 2;
  name: string;
  par: number;                    // quake par for 3 stars
  structures: StructureDef[];
  enemies: EnemyDef[];
  safeZones: SafeZoneDef[];
  clearCondition: 'all_enemies' | 'all_structures';
}

interface StructureDef {
  type: 'wooden_tower' | 'crate_stack' | 'stone_pillar' | 'stone_arch' | 'wall';
  x: number;
  y: number;
  blockCount?: number;            // for towers/stacks
  width?: number;                 // for walls
}

interface EnemyDef {
  type: 'sentinel' | 'armored';
  x: number;
  y: number;
  patrolDistance?: number;        // pixels left/right from start
}

interface SafeZoneDef {
  type: 'civilian' | 'artifact' | 'generator';
  x: number;
  y: number;
  radius: number;                 // hitbox radius in pixels
  maxHealth: number;              // tolerance hits before failure
}
```

---

## 6 Level Definitions

### Act 1 — Construction Site

**L1 — First Tremor**  
Par: 2 quakes. One wooden tower (5 blocks), 1 sentinel standing beside it, 1 civilian safe zone 120px away. Teaches: tap creates a shockwave, tower falls, sentinel knocked off. Civilian must survive.

**L2 — Chain Reaction**  
Par: 3 quakes. Two wooden towers, one crate stack between them. 2 sentinels (one on each tower platform). 1 civilian sheltering behind a wall segment. Teaches: one quake can trigger both towers to fall into each other.

**L3 — Overhead Platform**  
Par: 4 quakes. Scaffold wall + suspended platform held by 2 chain constraints above a sentinel + armored guard. 2 civilians flanking the scene. Introduces hold-to-charge: the armored guard requires a charged quake or crushing debris.

### Act 2 — Ancient Ruins

**L4 — The Archway**  
Par: 3 quakes. Stone archway (keystone joint at top — remove keystone and arch collapses). 2 sentinels patrol under the arch. 1 artifact safe zone directly behind the arch. Must topple the arch without hitting the artifact — teaches directionality.

**L5 — Temple Row**  
Par: 4 quakes. Three stone columns in a row, artifacts placed between each column. Sentinels patrol in front. Must collapse all columns while the artifacts between them survive. Tight spacing forces precise tap placement.

**L6 — The Generator**  
Par: 3 quakes. Two stone structures flanking a central generator (safe zone). 2 armored guards patrol. A third sentinel is on a raised platform. Quaking the platform drops the sentinel — teaches using the environment against enemies.

---

## Entity Design

### Structure

`Structure.ts` builds a compound body from `StructureDef`:
- Creates individual blocks as Matter bodies
- Positions them in a stack/row based on type
- Creates constraints between adjacent blocks
- Exposes `isDestroyed(): boolean` (all blocks below ground threshold or moving < 0.5 velocity for 2s)
- Emits `'structureDestroyed'` event on scene event emitter

### Enemy — Sentinel

Simple patrol AI: moves left/right `patrolDistance` pixels from spawn, reverses on collision or at patrol boundary. Falls from platform on sufficient upward/lateral force. Removed from scene when it exits world bounds or lands in a `killedByDebris` zone (buried under rubble: body velocity < 0.1 for 1s after collision with structure body).

### Enemy — Armored Guard

Same as Sentinel but `mass: 3`, `health: 2` hits before knocked out. First quake stuns (reduces velocity to 0 briefly), second removes. Visual: flash red on first hit.

### SafeZone

`SafeZone.ts` manages:
- A static Matter body sensor (no collision response, just overlap detection)
- A pulsing glow sprite layered under the protected object
- `health: number` initialized from `maxHealth`
- On physics overlap with any high-velocity body: `health -= impactForce / damageThreshold`
- At `health <= 0`: emit `'safeZoneFailed'` → level fail
- At `health < maxHealth * 0.5`: glow pulses (tween alpha 0.5↔1.0 on loop)
- HUD shows health bar for each safe zone

---

## Scoring System

`scoring.ts` exports a pure function:

```typescript
function calculateStars(
  quakesUsed: number,
  par: number,
  safeZoneHealthPct: number,   // 0–1, worst safe zone
  chainBonus: boolean           // true if 3+ bodies fell in one quake window
): { stars: 1 | 2 | 3; failed: boolean }
```

| Condition                              | Stars |
|---------------------------------------|-------|
| `safeZoneHealthPct === 0`             | FAIL  |
| `quakesUsed <= par && health === 1.0` | 3 ★★★ |
| `quakesUsed <= par + 2 && health > 0.5` | 2 ★★☆ |
| All enemies cleared, safe zones alive | 1 ★☆☆ |
| Chain bonus                           | +1 (can offset 1 damage penalty) |

Post-level screen shows Richter Scale needle animation sweeping to magnitude corresponding to star count (1–6 Richter mapped to 1–3 stars).

---

## Game Feel

### Screen Shake
`cameras.main.shake(duration, intensity)`:
- Small tap: `shake(180, 0.004)`
- Full charge: `shake(350, 0.014)`
- Structure collapse: `shake(120, 0.006)` on `'structureDestroyed'` event

### Crack Decals
On each quake: stamp a `crack.png` sprite at epicenter, depth = 1 (below game objects), never removed. Rotation randomized ±30°. Scale proportional to charge multiplier.

### Dust Particles
Phaser particle emitter on each constraint break: 8–12 gray particles burst outward from break point, `lifespan: 600ms`, `gravity: 200`, small scale.

### Slow Motion
When ≥ 3 dynamic bodies start moving in the same 400ms window after a quake:
```typescript
this.matter.world.engine.timing.timeScale = 0.3;
this.time.delayedCall(500, () => {
  // lerp timeScale back to 1.0 over 300ms via update loop
});
```

### Charge Indicator
During hold: radial ring expands from tap point, opacity 0.3, color from white → orange → red based on charge level. Communicates impending power.

---

## Required Image Assets

Generate these before code runs with real art. Interim: procedural canvas fallbacks will be used.

| File | Size | Generation Prompt |
|------|------|------------------|
| `wood_block.png` | 64×64 | "Top-down view of a single wooden plank block, 64×64px game sprite. Warm brown wood grain, cartoon shading, dark border outline, mild wear and nail marks. Flat perspective, transparent PNG." |
| `stone_block.png` | 64×64 | "Top-down view of a square stone block, 64×64px game sprite. Cool gray rough-hewn stone, slight moss, chipped edges, dark outline. Flat perspective, transparent PNG." |
| `crate.png` | 64×64 | "Top-down view of a wooden shipping crate, 64×64px game sprite. Planks with metal corner brackets and bands, stenciled hazard markings, warm wood tone. Flat perspective, transparent PNG." |
| `sentinel.png` | 64×64 | "2D game sprite of a construction site guard, 64×64px, 3/4 top-down view. Hard hat, high-vis vest, standing alert. Simple cartoon style, bold outlines, transparent PNG." |
| `armored.png` | 64×64 | "2D game sprite of a heavily armored construction guard, 64×64px, 3/4 top-down view. Thick padded gear, helmet visor, bulky silhouette. Cartoon style, bold outlines, transparent PNG." |
| `civilian.png` | 64×64 | "2D game sprite of a construction worker civilian crouching/sheltering, 64×64px, 3/4 top-down view. Hard hat, orange vest, arms over head in defensive pose. Cartoon style, transparent PNG." |
| `stone_column.png` | 64×64 | "Top-down view of an ancient stone column drum segment, 64×64px game sprite. Carved stone, faint decorative relief, aged and cracked, off-white/tan. Flat perspective, transparent PNG." |
| `artifact.png` | 64×96 | "2D game sprite of a glowing ancient golden urn on a pedestal, 64×96px, slight top-down angle. Ornate golden urn with soft green glow aura at its base. Magical but grounded, transparent PNG." |
| `safe_zone_glow.png` | 128×128 | "Circular soft green radial glow, 128×128px. Center transparent, edges fade to gentle lime-green light halo. No hard edges. PNG with full transparency. Meant to overlay game objects as a protection indicator." |
| `crack.png` | 96×32 | "A jagged ground crack sprite, 96×32px, viewed from above. Dark gray fracture line with subtle rubble debris on edges. Irregular lightning-bolt shape. Transparent PNG, stamped on terrain after earthquake." |
| `ground_construction.png` | 64×64 | "Top-down view of a concrete construction site floor tile, 64×64px game sprite. Gray concrete with faint scuff marks and dust. Seamlessly tileable. Flat perspective, transparent PNG." |
| `ground_ruins.png` | 64×64 | "Top-down view of an ancient ruins floor tile, 64×64px game sprite. Sandy stone with worn cracks and faint carved patterns. Seamlessly tileable. Flat perspective, transparent PNG." |

---

## HUD Elements (Procedural — No Image Needed)

- Quake counter: text + small circle icons, drawn with Phaser Graphics
- Safe zone health bars: thin rectangles above each safe zone, fill color green→red
- Star display (post-level): Phaser Graphics drawn stars, animated fill
- Richter scale needle: Phaser Graphics arc + rotating needle tween

---

## Integration with Existing Project

`src/lib/games.ts` — add entry:
```typescript
{
  id: 'fault-line',
  title: 'Fault Line',
  description: 'Tap to quake. Destroy the targets. Don\'t touch the green.',
  path: '/games/fault-line',
  players: '1 Player',
  tags: ['physics', 'puzzle', 'destruction']
}
```

No other files outside the fault-line directory are modified except `games.ts`.
