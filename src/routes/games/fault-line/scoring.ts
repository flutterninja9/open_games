export interface StarResult {
	stars: 1 | 2 | 3;
	failed: boolean;
}

export function calculateStars(
	quakesUsed: number,
	par: number,
	safeZoneHealthPct: number,
	chainBonus: boolean
): StarResult {
	if (safeZoneHealthPct <= 0) {
		return { stars: 1, failed: true };
	}

	let stars: 1 | 2 | 3 = 1;

	if (quakesUsed <= par && safeZoneHealthPct >= 1) {
		stars = 3;
	} else if (quakesUsed <= par + 2 && safeZoneHealthPct > 0.5) {
		stars = 2;
	}

	if (chainBonus && stars > 1) {
		// Chain bonus can offset one damage penalty — bump if health dipped but still alive
		if (safeZoneHealthPct < 1 && safeZoneHealthPct > 0.5 && stars === 2) {
			stars = 3;
		}
	}

	return { stars, failed: false };
}

export function richterMagnitude(stars: 1 | 2 | 3): number {
	return stars === 3 ? 6 : stars === 2 ? 4 : 2;
}
