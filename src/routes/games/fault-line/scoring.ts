export interface ScoreResult {
  stars: 0 | 1 | 2 | 3;
  failed: boolean;
  richterMagnitude: number;
}

export function calculateScore(
  quakesUsed: number,
  par: number,
  worstSafeZoneHealthPct: number,
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

  if (chainBonus && stars === 2) stars = 3;

  const richterMagnitude =
    stars === 3 ? 5 + Math.random() :
    stars === 2 ? 3 + Math.random() :
    1.5 + Math.random();

  return { stars, failed: false, richterMagnitude };
}
