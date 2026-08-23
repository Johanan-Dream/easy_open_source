export interface StarSnapshot {
  capturedAt: string;
  stars: Record<string, number>;
}

const dayMs = 24 * 60 * 60 * 1000;

export function calculateTrend(
  repositoryId: string,
  stars: number,
  pushedAt: string,
  snapshots: StarSnapshot[],
  now = new Date(),
) {
  const candidates = snapshots
    .filter((snapshot) => Number.isFinite(snapshot.stars[repositoryId]))
    .sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));
  const withinDay = candidates.filter((snapshot) => now.getTime() - Date.parse(snapshot.capturedAt) <= dayMs);
  const baseline = withinDay[0] ?? candidates.at(-1);
  const starGrowth = baseline ? Math.max(0, stars - baseline.stars[repositoryId]) : 0;
  const pushedDaysAgo = Math.max(0, (now.getTime() - Date.parse(pushedAt)) / dayMs);
  const activityScore = pushedDaysAgo <= 7 ? 15 : pushedDaysAgo <= 30 ? 8 : pushedDaysAgo <= 180 ? 2 : 0;
  const trendScore = Math.round(Math.log1p(starGrowth) * 20 + Math.log10(Math.max(stars, 1)) * 5 + activityScore);
  return { dailyStarGrowth: starGrowth, trendScore };
}

export function appendSnapshot(snapshots: StarSnapshot[], snapshot: StarSnapshot, keep = 12) {
  return [...snapshots, snapshot]
    .sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt))
    .slice(-keep);
}
