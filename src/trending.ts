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
  const activityScore = pushedDaysAgo <= 7 ? 20 : pushedDaysAgo <= 30 ? 8 : pushedDaysAgo <= 180 ? 2 : 0;
  // 최근 관심도를 순위의 본체로 두고, 코드 활동은 같은 증가량 안에서만 순서를 보정한다.
  // 누적 스타 수는 이 점수에 넣지 않고 repository-service의 최종 동점 처리에만 사용한다.
  const trendScore = starGrowth * 100 + activityScore;
  return { dailyStarGrowth: starGrowth, trendScore };
}

export function appendSnapshot(snapshots: StarSnapshot[], snapshot: StarSnapshot, keep = 12) {
  return [...snapshots, snapshot]
    .sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt))
    .slice(-keep);
}
