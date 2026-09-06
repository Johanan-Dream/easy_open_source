import { readFile, writeFile } from "node:fs/promises";
import { GeminiClient } from "../src/gemini-client.ts";
import { GitHubClient } from "../src/github-client.ts";
import { buildDiscoveryPrompt, discoveryAssessmentSchema, hashReadme, isTrustedDraftUrl, normalizeTerminalHelp, type DiscoveryAssessment, type GuideDraft } from "../src/guide-analysis.ts";
import type { CategoryId, Repository } from "../src/domain.ts";
import { validateRepository } from "../src/validation.ts";

interface DiscoveryState { readmeHash: string; status: "added" | "rejected"; checkedAt: string; reason: string }
const root = new URL("../", import.meta.url);
const repositoriesUrl = new URL("data/repositories.json", root);
const editorialUrl = new URL("data/editorial-discovered.json", root);
const stateUrl = new URL("data/review/discovery-state.json", root);
const repositories = JSON.parse(await readFile(repositoriesUrl, "utf8")) as Repository[];
const editorial = JSON.parse(await readFile(editorialUrl, "utf8")) as Array<GuideDraft & { id: string; category: CategoryId }>;
const state = JSON.parse(await readFile(stateUrl, "utf8")) as Record<string, DiscoveryState>;
if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required; keep it in GitHub Actions Secrets.");

const github = new GitHubClient();
const gemini = new GeminiClient();
const limit = Math.max(1, Math.min(Number(process.env.GEMINI_DISCOVERY_LIMIT ?? 2), 5));
const today = new Date().toISOString().slice(0, 10);
const recent = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
const queries = [
  `created:>=${recent} stars:>=50 archived:false`,
  `pushed:>=${recent} stars:>=500 archived:false topic:desktop-app`,
  `pushed:>=${recent} stars:>=500 archived:false topic:productivity`,
  `pushed:>=${recent} stars:>=1000 archived:false topic:self-hosted`,
];
const results = await Promise.all(queries.map((query, index) => github.searchRepositories(query, 30, index ? "updated" : "stars")));
const existing = new Set([...repositories.map((item) => item.id.toLowerCase()), ...editorial.map((item) => item.id.toLowerCase())]);
const candidates = [...new Map(results.flatMap((result) => result.items).map((item) => [item.full_name.toLowerCase(), item])).values()]
  .filter((item) => !existing.has(item.full_name.toLowerCase()) && !item.archived && item.stargazers_count >= 50)
  .filter((item) => item.license?.spdx_id && !["NOASSERTION", "OTHER"].includes(item.license.spdx_id))
  .sort((a, b) => b.stargazers_count - a.stargazers_count);
let attempted = 0;
let added = 0;

for (const metadata of candidates) {
  if (attempted >= limit) break;
  const readme = await github.getReadme(metadata.owner.login, metadata.name);
  const readmeHash = hashReadme(readme);
  if (state[metadata.full_name]?.readmeHash === readmeHash) continue;
  attempted += 1;
  try {
    const assessment = await gemini.generateStructured<DiscoveryAssessment>(buildDiscoveryPrompt(metadata.full_name, metadata.description, readme, today), discoveryAssessmentSchema);
    if (!assessment.suitable) {
      state[metadata.full_name] = { readmeHash, status: "rejected", checkedAt: today, reason: assessment.reason };
      console.log(`Rejected ${metadata.full_name}: ${assessment.reason}`);
      continue;
    }
    normalizeTerminalHelp(assessment);
    const trustedUrls = [metadata.html_url, metadata.homepage].filter((url): url is string => Boolean(url));
    if (!isTrustedDraftUrl(assessment.guide.officialDocsUrl, "", trustedUrls)) throw new Error("공식 문서 URL이 GitHub 또는 공식 홈페이지 도메인과 일치하지 않습니다.");
    const candidate: Repository = {
      ...assessment, id: metadata.full_name, owner: metadata.owner.login, name: metadata.name,
      githubUrl: metadata.html_url, homepageUrl: metadata.homepage || undefined,
      license: metadata.license?.spdx_id, stars: metadata.stargazers_count, forks: metadata.forks_count,
      lastPushedAt: metadata.pushed_at, maintenanceStatus: "active", dailyStarGrowth: 0, trendScore: 0,
      sourceUrls: [...new Set([metadata.html_url, assessment.guide.officialDocsUrl])], collectedAt: new Date().toISOString(),
    };
    const issues = validateRepository(candidate);
    if (issues.length) throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
    const { suitable, reason, ...draft } = assessment;
    editorial.push({ id: metadata.full_name, ...draft });
    state[metadata.full_name] = { readmeHash, status: "added", checkedAt: today, reason };
    added += 1;
    console.log(`Added ${metadata.full_name} to the cumulative catalog.`);
  } catch (error) {
    state[metadata.full_name] = { readmeHash, status: "rejected", checkedAt: today, reason: String(error) };
    console.error(`Rejected ${metadata.full_name}:`, error);
  }
}

await writeFile(editorialUrl, `${JSON.stringify(editorial, null, 2)}\n`);
await writeFile(stateUrl, `${JSON.stringify(state, null, 2)}\n`);
console.log(`Searched ${candidates.length} unique candidates; attempted ${attempted}; added ${added}.`);
