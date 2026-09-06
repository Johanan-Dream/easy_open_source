import type { Repository } from "./domain.ts";

export interface ValidationIssue {
  repositoryId: string;
  path: string;
  message: string;
}

const dangerousCommandPatterns = [
  { pattern: /\brm\s+-rf\b/i, message: "재귀 강제 삭제 명령은 가이드에 포함할 수 없습니다." },
  { pattern: /\bsudo\b/i, message: "관리자 권한 명령은 별도 검수 없이 포함할 수 없습니다." },
  { pattern: /curl\b[^|]*\|\s*(?:sh|bash)\b/i, message: "다운로드한 스크립트를 바로 실행할 수 없습니다." },
  { pattern: /\birm\b[^|]*\|\s*iex\b/i, message: "다운로드한 PowerShell 스크립트를 바로 실행할 수 없습니다." },
  { pattern: /(?:^|\s)(?:del|format)\s+/i, message: "삭제 또는 포맷 명령은 가이드에 포함할 수 없습니다." },
];
const guideTypes = new Set(["web", "desktop-installer", "release-download", "package-manager", "docker", "installer-cli"]);

export function validateRepository(repository: Repository): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (path: string, message: string) => issues.push({ repositoryId: repository.id, path, message });

  if (!repository.id.includes("/")) add("id", "저장소 ID는 owner/name 형식이어야 합니다.");
  if (!repository.summary.trim()) add("summary", "쉬운 한 줄 설명이 필요합니다.");
  if (!guideTypes.has(repository.guideType)) add("guideType", "지원하는 가이드 유형이 필요합니다.");
  if (repository.keyFeatures.length !== 3) add("keyFeatures", "핵심 기능은 정확히 3개여야 합니다.");
  if (!repository.sourceUrls.length) add("sourceUrls", "최소 하나의 근거 URL이 필요합니다.");

  const rootDomain = (hostname: string) => hostname.split(".").slice(-2).join(".");
  let homepageRoot: string | undefined;
  try { if (repository.homepageUrl) homepageRoot = rootDomain(new URL(repository.homepageUrl).hostname); } catch {}
  for (const [index, sourceUrl] of repository.sourceUrls.entries()) {
    try {
      const url = new URL(sourceUrl);
      if (url.protocol !== "https:") add(`sourceUrls.${index}`, "근거 URL은 HTTPS여야 합니다.");
      const trusted = url.hostname === "github.com" || url.hostname.endsWith(".github.com") || (homepageRoot && rootDomain(url.hostname) === homepageRoot);
      if (!trusted) {
        add(`sourceUrls.${index}`, `검수되지 않은 근거 도메인입니다: ${url.hostname}`);
      }
    } catch {
      add(`sourceUrls.${index}`, "유효한 URL이 아닙니다.");
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(repository.guide.verifiedAt)) {
    add("guide.verifiedAt", "검증일은 YYYY-MM-DD 형식이어야 합니다.");
  }
  try {
    const docsUrl = new URL(repository.guide.officialDocsUrl);
    if (docsUrl.protocol !== "https:") add("guide.officialDocsUrl", "공식 문서는 HTTPS 주소여야 합니다.");
  } catch {
    add("guide.officialDocsUrl", "유효한 공식 문서 주소가 필요합니다.");
  }
  if (!repository.guide.prerequisites.length) add("guide.prerequisites", "준비물이 필요합니다.");
  if (!repository.guide.platforms.length) add("guide.platforms", "하나 이상의 환경별 가이드가 필요합니다.");
  if (!repository.guide.firstRunResult.trim()) add("guide.firstRunResult", "첫 실행 성공 기준이 필요합니다.");
  if (!repository.guide.commonIssues.length) add("guide.commonIssues", "최소 하나의 오류 해결 항목이 필요합니다.");

  for (const [issueIndex, issue] of repository.guide.commonIssues.entries()) {
    if (!issue.problem.trim()) add(`guide.commonIssues.${issueIndex}.problem`, "문제 설명이 필요합니다.");
    if (!issue.solution.trim()) add(`guide.commonIssues.${issueIndex}.solution`, "안전한 해결 방법이 필요합니다.");
  }

  for (const [platformIndex, platform] of repository.guide.platforms.entries()) {
    if (!repository.platforms.includes(platform.name)) {
      add(`guide.platforms.${platformIndex}`, `${platform.name}이 저장소 지원 환경에 없습니다.`);
    }
    if (platform.steps.length < 2) add(`guide.platforms.${platformIndex}.steps`, "첫 실행 가이드는 최소 두 단계여야 합니다.");
    if (platform.steps.some((step) => step.command) && !platform.terminalHelp?.length) {
      add(`guide.platforms.${platformIndex}.terminalHelp`, "명령어가 있으면 터미널을 여는 방법이 필요합니다.");
    }
    const orders = platform.steps.map((step) => step.order);
    if (new Set(orders).size !== orders.length) add(`guide.platforms.${platformIndex}.steps`, "단계 번호가 중복됩니다.");
    if (orders.some((order, index) => order !== index + 1)) add(`guide.platforms.${platformIndex}.steps`, "단계 번호는 1부터 순서대로여야 합니다.");

    for (const [stepIndex, step] of platform.steps.entries()) {
      if (!step.title.trim()) add(`guide.platforms.${platformIndex}.steps.${stepIndex}.title`, "단계 제목이 필요합니다.");
      if (!step.description.trim()) add(`guide.platforms.${platformIndex}.steps.${stepIndex}.description`, "단계 설명이 필요합니다.");
      if (!step.command) continue;
      for (const dangerous of dangerousCommandPatterns) {
        if (dangerous.pattern.test(step.command)) {
          add(`guide.platforms.${platformIndex}.steps.${stepIndex}.command`, dangerous.message);
        }
      }
    }
  }

  return issues;
}

export function validateRepositories(repositories: Repository[]): ValidationIssue[] {
  const issues = repositories.flatMap(validateRepository);
  const ids = repositories.map((repository) => repository.id.toLocaleLowerCase("en"));
  for (const id of new Set(ids)) {
    if (ids.filter((candidate) => candidate === id).length > 1) {
      issues.push({ repositoryId: id, path: "id", message: "중복된 저장소 ID입니다." });
    }
  }
  return issues;
}
