export interface LevelData {
	id: string;
	act: 1 | 2;
	name: string;
	par: number;
	quakeBudget: number;
	structures: StructureDef[];
	enemies: EnemyDef[];
	safeZones: SafeZoneDef[];
	clearCondition: 'all_enemies' | 'all_structures';
	ground: 'construction' | 'ruins';
}

export interface StructureDef {
	type: 'wooden_tower' | 'crate_stack' | 'stone_pillar' | 'stone_arch' | 'wall' | 'platform';
	x: number;
	y: number;
	blockCount?: number;
	width?: number;
	/** Static anchor for suspended platform (L3) */
	anchorY?: number;
}

export interface EnemyDef {
	type: 'sentinel' | 'armored';
	x: number;
	y: number;
	patrolDistance?: number;
}

export interface SafeZoneDef {
	type: 'civilian' | 'artifact' | 'generator';
	x: number;
	y: number;
	radius: number;
	maxHealth: number;
}

export type InputState = 'IDLE' | 'CHARGING' | 'QUAKING' | 'COOLDOWN';

export type MaterialKind = 'wood' | 'stone' | 'crate';
