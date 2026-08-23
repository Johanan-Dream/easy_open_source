import type { GitHubRepositoryResponse } from "./domain.ts";

const githubApi = "https://api.github.com";

export class GitHubApiError extends Error {
  readonly status: number;
  readonly remaining?: string;

  constructor(
    message: string,
    status: number,
    remaining?: string,
  ) {
    super(message);
    this.status = status;
    this.remaining = remaining;
  }
}

export class GitHubClient {
  private readonly token?: string;

  constructor(token = process.env.GITHUB_TOKEN) {
    this.token = token;
  }

  private async request<T>(path: string, accept = "application/vnd.github+json"): Promise<T> {
    const headers: Record<string, string> = {
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Easy-Open-Source-MVP",
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const response = await fetch(`${githubApi}${path}`, { headers });
    if (!response.ok) {
      const body = await response.text();
      throw new GitHubApiError(
        `GitHub API ${response.status}: ${body.slice(0, 300)}`,
        response.status,
        response.headers.get("x-ratelimit-remaining") ?? undefined,
      );
    }
    return response.json() as Promise<T>;
  }

  getRepository(owner: string, repo: string) {
    return this.request<GitHubRepositoryResponse>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  }

  getReadme(owner: string, repo: string) {
    return this.request<string>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
      "application/vnd.github.raw+json",
    );
  }

  async searchRepositories(query: string, perPage = 30) {
    const params = new URLSearchParams({
      q: query,
      sort: "stars",
      order: "desc",
      per_page: String(Math.min(Math.max(perPage, 1), 100)),
    });
    return this.request<{ total_count: number; items: GitHubRepositoryResponse[] }>(
      `/search/repositories?${params}`,
    );
  }
}
