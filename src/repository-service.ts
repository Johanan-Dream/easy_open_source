import type { Repository } from "./domain.ts";

export type RepositorySort = "popular" | "trending" | "updated";

export interface RepositoryQuery {
  category?: string;
  search?: string;
  sort?: RepositorySort;
  limit?: number;
}

export function queryRepositories(
  repositories: Repository[],
  query: RepositoryQuery,
): Repository[] {
  const search = query.search?.trim().toLocaleLowerCase("ko") ?? "";
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);

  const matches = repositories.filter((repository) => {
    if (query.category && query.category !== "all" && repository.category !== query.category) {
      return false;
    }

    if (!search) return true;

    const haystack = [
      repository.id,
      repository.summary,
      repository.whatItIs,
      repository.problemSolved,
      ...repository.tags,
      ...repository.recommendedFor,
    ]
      .join(" ")
      .toLocaleLowerCase("ko");

    return haystack.includes(search);
  });

  const sort = query.sort ?? "popular";
  matches.sort((a, b) => {
    if (sort === "trending") {
      return (b.trendScore ?? 0) - (a.trendScore ?? 0) || b.stars - a.stars;
    }
    if (sort === "updated") {
      return Date.parse(b.lastPushedAt ?? "1970-01-01") - Date.parse(a.lastPushedAt ?? "1970-01-01");
    }
    return b.stars - a.stars;
  });

  return matches.slice(0, limit);
}

export function getTrending(repositories: Repository[], limit = 5): Repository[] {
  return queryRepositories(repositories, { sort: "trending", limit });
}

export function findRepository(repositories: Repository[], owner: string, name: string) {
  const id = `${owner}/${name}`.toLocaleLowerCase("en");
  return repositories.find((repository) => repository.id.toLocaleLowerCase("en") === id);
}
