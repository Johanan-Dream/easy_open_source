export const categories = [
  { id: "ai-automation", name: "AI·자동화" },
  { id: "developer-tools", name: "개발 도구" },
  { id: "design", name: "디자인" },
  { id: "productivity", name: "생산성" },
  { id: "data", name: "데이터" },
  { id: "security", name: "보안" },
  { id: "content-media", name: "콘텐츠·미디어" },
  { id: "education", name: "교육" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type UsageType = "web" | "desktop" | "cli" | "docker" | "source";
export type GuideType = "web" | "desktop-installer" | "release-download" | "package-manager" | "docker" | "installer-cli";
export type Platform = "Windows" | "macOS" | "Linux" | "Web";

export interface GuideStep {
  order: number;
  title: string;
  description: string;
  command?: string;
  expectedResult?: string;
  warning?: string;
}

export interface PlatformGuide {
  name: Platform;
  terminalHelp?: string[];
  steps: GuideStep[];
}

export interface CommonIssue {
  problem: string;
  solution: string;
}

export interface BeginnerGuide {
  prerequisites: string[];
  estimatedMinutes: number;
  platforms: PlatformGuide[];
  firstRunResult: string;
  stopInstructions?: string;
  uninstallInstructions?: string;
  commonIssues: CommonIssue[];
  officialDocsUrl: string;
  verifiedAt: string;
}

export interface Repository {
  id: string;
  owner: string;
  name: string;
  githubUrl: string;
  homepageUrl?: string;
  summary: string;
  whatItIs: string;
  problemSolved: string;
  recommendedFor: string[];
  keyFeatures: string[];
  useCases: string[];
  category: CategoryId;
  tags: string[];
  difficulty: Difficulty;
  usageType: UsageType;
  guideType: GuideType;
  costSummary: string;
  apiKeyRequired: boolean | "unknown";
  platforms: Platform[];
  license?: string;
  stars: number;
  forks: number;
  lastPushedAt?: string;
  maintenanceStatus: "active" | "caution" | "inactive";
  dailyStarGrowth?: number;
  trendScore?: number;
  guide: BeginnerGuide;
  sourceUrls: string[];
  collectedAt: string;
}

export interface GitHubRepositoryResponse {
  full_name: string;
  name: string;
  owner: { login: string };
  html_url: string;
  homepage: string | null;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  license: { spdx_id: string } | null;
  topics: string[];
  archived: boolean;
  pushed_at: string;
  created_at: string;
  updated_at: string;
  language: string | null;
}
