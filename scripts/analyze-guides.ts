import { mkdir, readFile, writeFile } from "node:fs/promises";
import { GitHubClient } from "../src/github-client.ts";
import { GeminiClient } from "../src/gemini-client.ts";
import { buildGuidePrompt, guideDraftSchema, hashReadme, isTrustedDraftUrl, normalizeTerminalHelp, type GuideDraft, type ReviewProposal } from "../src/guide-analysis.ts";
import type { Repository } from "../src/domain.ts";
import { validateRepository } from "../src/validation.ts";

const root = new URL("../", import.meta.url);
const repositories = JSON.parse(await readFile(new URL("data/repositories.json", root), "utf8")) as Repository[];
const stateUrl = new URL("data/review/readme-state.json", root);
const pendingUrl = new URL("data/review/pending-guides.json", root);
const readJson = async <T>(url: URL, fallback: T) => {
  try { return JSON.parse(await readFile(url, "utf8")) as T; } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw error;
  }
};

if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required; keep it in GitHub Actions Secrets.");
const limit = Math.max(1, Math.min(Number(process.env.GEMINI_DAILY_LIMIT ?? 3), 10));
const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const github = new GitHubClient();
const gemini = new GeminiClient(undefined, model);
const state = await readJson<Record<string, string>>(stateUrl, {});
const pending = await readJson<ReviewProposal[]>(pendingUrl, []);
const pendingById = new Map(pending.map((proposal) => [proposal.repositoryId.toLowerCase(), proposal]));
const today = new Date().toISOString().slice(0, 10);
let attempted = 0;
let analyzed = 0;

for (const repository of repositories) {
  if (attempted >= limit) break;
  const [owner, name] = repository.id.split("/");
  const readme = await github.getReadme(owner, name);
  const readmeHash = hashReadme(readme);
  if (state[repository.id] === readmeHash) continue;
  attempted += 1;
  try {
    const draft = normalizeTerminalHelp(await gemini.generateStructured<GuideDraft>(buildGuidePrompt(repository.id, repository.category, readme, today), guideDraftSchema));
    const trustedUrls = [...repository.sourceUrls, repository.githubUrl, repository.homepageUrl].filter((url): url is string => Boolean(url));
    if (!isTrustedDraftUrl(draft.guide.officialDocsUrl, readme, trustedUrls)) throw new Error("AI가 제안한 공식 문서 URL을 README 또는 기존 공식 도메인에서 확인할 수 없습니다.");
    const candidate: Repository = { ...repository, ...draft, sourceUrls: repository.sourceUrls };
    const issues = validateRepository(candidate);
    if (issues.length) throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
    pendingById.set(repository.id.toLowerCase(), {
      repositoryId: repository.id, readmeHash, generatedAt: new Date().toISOString(), model,
      status: "pending", sourceUrls: [...new Set([...repository.sourceUrls, draft.guide.officialDocsUrl])], draft,
    });
    state[repository.id] = readmeHash;
    analyzed += 1;
    console.log(`Queued ${repository.id} for human review.`);
  } catch (error) {
    console.error(`Keeping published data for ${repository.id}:`, error);
  }
}

await mkdir(new URL("data/review/", root), { recursive: true });
await writeFile(stateUrl, `${JSON.stringify(state, null, 2)}\n`);
await writeFile(pendingUrl, `${JSON.stringify([...pendingById.values()], null, 2)}\n`);
console.log(`Created ${analyzed} review proposal(s); published data was not changed.`);
