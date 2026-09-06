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
    if (accept === "application/vnd.github.raw+json") return await response.text() as T;
    return response.json() as Promise<T>;
  }

  getRepository(owner: string, repo: string) {
    return this.request<GitHubRepositoryResponse>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  }

  async getRepositoryFromPublicPage(owner: string, repo: string): Promise<GitHubRepositoryResponse> {
    const htmlUrl = `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const response = await fetch(htmlUrl, { headers: { "User-Agent": "Easy-Open-Source-MVP" } });
    if (!response.ok) throw new GitHubApiError(`GitHub page ${response.status}: ${htmlUrl}`, response.status);
    const html = await response.text();
    const value = (pattern: RegExp) => html.match(pattern)?.[1];
    const defaultBranch = value(/"defaultBranch":"([^"]+)"/) ?? "main";
    const feed = await fetch(`${htmlUrl}/commits/${encodeURIComponent(defaultBranch)}.atom`, {
      headers: { "User-Agent": "Easy-Open-Source-MVP" },
    });
    const feedText = feed.ok ? await feed.text() : "";
    const pushedAt = feedText.match(/<updated>([^<]+)<\/updated>/)?.[1] ?? new Date().toISOString();
    const description = value(/<meta\s+name="description"\s+content="([^"]*)"/i)?.replace(/&amp;/g, "&") ?? null;

    return {
      full_name: `${owner}/${repo}`,
      name: repo,
      owner: { login: owner },
      html_url: htmlUrl,
      homepage: null,
      description,
      stargazers_count: Number(value(/"stargazerCount":(\d+)/) ?? 0),
      forks_count: Number(value(/"forksCount":(\d+)/) ?? 0),
      license: value(/"spdxId":"([^"]+)"/) ? { spdx_id: value(/"spdxId":"([^"]+)"/)! } : null,
      topics: [],
      archived: /This repository was archived by the owner/i.test(html),
      pushed_at: pushedAt,
      created_at: value(/"createdAt":"([^"]+)"/) ?? pushedAt,
      updated_at: pushedAt,
      language: null,
    };
  }

  getReadme(owner: string, repo: string) {
    return this.request<string>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
      "application/vnd.github.raw+json",
    );
  }

  async searchRepositories(query: string, perPage = 30, sort: "stars" | "updated" = "stars") {
    const params = new URLSearchParams({
      q: query,
      sort,
      order: "desc",
      per_page: String(Math.min(Math.max(perPage, 1), 100)),
    });
    return this.request<{ total_count: number; items: GitHubRepositoryResponse[] }>(
      `/search/repositories?${params}`,
    );
  }
}
