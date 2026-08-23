import { readFile, writeFile } from "node:fs/promises";
import { GitHubClient } from "../src/github-client.ts";
import type { BeginnerGuide, CategoryId, Difficulty, GuideType, Platform, Repository, UsageType } from "../src/domain.ts";
import { validateRepositories } from "../src/validation.ts";
import { appendSnapshot, calculateTrend, type StarSnapshot } from "../src/trending.ts";

interface EditorialEntry {
  id: string;
  category: CategoryId;
  summary: string;
  whatItIs: string;
  problemSolved: string;
  recommendedFor: string[];
  keyFeatures: string[];
  useCases: string[];
  tags: string[];
  difficulty: Difficulty;
  usageType: UsageType;
  guideType: GuideType;
  costSummary: string;
  apiKeyRequired: boolean | "unknown";
  platforms: Platform[];
  dailyStarGrowth?: number;
  trendScore?: number;
  guide: BeginnerGuide;
}

const editorialUrl = new URL("../data/editorial.json", import.meta.url);
const additionsUrl = new URL("../data/editorial-additions.json", import.meta.url);
const outputUrl = new URL("../data/repositories.json", import.meta.url);
const historyUrl = new URL("../data/star-history.json", import.meta.url);
const editorial = [
  ...(JSON.parse(await readFile(editorialUrl, "utf8")) as EditorialEntry[]),
  ...(JSON.parse(await readFile(additionsUrl, "utf8")) as EditorialEntry[]),
];
const client = new GitHubClient();
const collected: Repository[] = [];
const snapshots = JSON.parse(await readFile(historyUrl, "utf8")) as StarSnapshot[];
const collectedAt = new Date();

for (const entry of editorial) {
  const [owner, name] = entry.id.split("/");
  if (!owner || !name) throw new Error(`Invalid repository id: ${entry.id}`);
  console.log(`Collecting ${entry.id}...`);
  const metadata = await client.getRepository(owner, name);
  if (metadata.archived) {
    console.warn(`Skipping archived repository ${entry.id}`);
    continue;
  }

  collected.push({
    ...entry,
    id: metadata.full_name,
    owner: metadata.owner.login,
    name: metadata.name,
    githubUrl: metadata.html_url,
    homepageUrl: metadata.homepage || undefined,
    license: metadata.license?.spdx_id,
    stars: metadata.stargazers_count,
    forks: metadata.forks_count,
    lastPushedAt: metadata.pushed_at,
    maintenanceStatus:
      Date.now() - Date.parse(metadata.pushed_at) < 1000 * 60 * 60 * 24 * 180 ? "active" : "caution",
    ...calculateTrend(metadata.full_name, metadata.stargazers_count, metadata.pushed_at, snapshots, collectedAt),
    sourceUrls: [metadata.html_url, entry.guide.officialDocsUrl],
    collectedAt: collectedAt.toISOString(),
  });
}

const issues = validateRepositories(collected);
if (issues.length) {
  for (const issue of issues) console.error(`${issue.repositoryId} ${issue.path}: ${issue.message}`);
  throw new Error(`Collection failed validation with ${issues.length} issue(s)`);
}

await writeFile(outputUrl, `${JSON.stringify(collected, null, 2)}\n`, "utf8");
const nextSnapshot = appendSnapshot(snapshots, {
  capturedAt: collectedAt.toISOString(),
  stars: Object.fromEntries(collected.map((repository) => [repository.id, repository.stars])),
});
await writeFile(historyUrl, `${JSON.stringify(nextSnapshot, null, 2)}\n`, "utf8");
console.log(`Saved ${collected.length} repositories to ${outputUrl.pathname}`);
