export type StructureType = 'wooden_tower' | 'crate_stack' | 'stone_pillar' | 'stone_arch' | 'stone_wall';
export type EnemyType = 'sentinel' | 'armored';
export type SafeZoneType = 'civilian' | 'artifact' | 'generator';

export interface StructureDef {
  type: StructureType;
  x: number;
  y: number;
  blockCount?: number;
  width?: number;
}

export interface EnemyDef {
  type: EnemyType;
  x: number;
  y: number;
  patrolDistance: number;
}

export interface SafeZoneDef {
  type: SafeZoneType;
  x: number;
  y: number;
  radius: number;
  maxHealth: number;
}

export interface LevelData {
  id: string;
  act: 1 | 2;
  name: string;
  par: number;
  maxQuakes: number;
  structures: StructureDef[];
  enemies: EnemyDef[];
  safeZones: SafeZoneDef[];
  groundTile: 'ground_tile' | 'ruins_tile';
}

export const LEVELS: LevelData[] = [
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
      { type: 'stone_wall', x: 200, y: 480, width: 3 },
      { type: 'stone_wall', x: 560, y: 480, width: 3 },
      { type: 'wooden_tower', x: 380, y: 480, blockCount: 3 }
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
  {
    id: 'l4',
    act: 2,
    name: 'The Archway',
    par: 3,
    maxQuakes: 8,
    groundTile: 'ruins_tile',
    structures: [
      { type: 'stone_pillar', x: 280, y: 480, blockCount: 5 },
      { type: 'stone_pillar', x: 520, y: 480, blockCount: 5 },
      { type: 'stone_arch',   x: 400, y: 280, blockCount: 1 }
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
