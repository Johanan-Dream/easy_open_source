import { createServer, type ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { categories } from "./domain.ts";
import { loadRepositories } from "./data-store.ts";
import { findRepository, getTrending, queryRepositories, type RepositorySort } from "./repository-service.ts";

const port = Number(process.env.PORT ?? 4173);
const publicDir = fileURLToPath(new URL("../public", import.meta.url));

const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; upgrade-insecure-requests",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

function headers(extra: Record<string, string> = {}) {
  return { ...securityHeaders, ...extra };
}

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function json(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  }));
  response.end(JSON.stringify(body));
}

async function serveStatic(pathname: string, response: ServerResponse) {
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  let filePath = resolve(publicDir, requested);
  const pathFromPublic = relative(publicDir, filePath);
  if (pathFromPublic === ".." || pathFromPublic.startsWith(`..${sep}`) || pathFromPublic.includes(`..${sep}`)) {
    return json(response, 403, { error: "Forbidden" });
  }

  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, "index.html");
    const content = await readFile(filePath);
    response.writeHead(200, headers({
      "Content-Type": mimeTypes[extname(filePath)] ?? "application/octet-stream",
      "Cache-Control": "no-cache",
    }));
    response.end(content);
  } catch {
    const fallback = await readFile(join(publicDir, "index.html"));
    response.writeHead(200, headers({ "Content-Type": mimeTypes[".html"], "Cache-Control": "no-cache" }));
    response.end(fallback);
  }
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    const repositories = await loadRepositories();

    if (url.pathname === "/api/health") {
      return json(response, 200, { status: "ok", repositories: repositories.length });
    }
    if (url.pathname === "/api/categories") {
      return json(response, 200, { items: categories });
    }
    if (url.pathname === "/api/repositories") {
      const items = queryRepositories(repositories, {
        category: url.searchParams.get("category") ?? undefined,
        search: url.searchParams.get("search") ?? undefined,
        sort: (url.searchParams.get("sort") as RepositorySort | null) ?? undefined,
        limit: Number(url.searchParams.get("limit") ?? 20),
      });
      return json(response, 200, { items, total: items.length, nextCursor: null });
    }
    if (url.pathname === "/api/trending") {
      const limit = Number(url.searchParams.get("limit") ?? 5);
      return json(response, 200, {
        period: "daily",
        calculatedAt: new Date().toISOString(),
        items: getTrending(repositories, limit),
      });
    }

    const guideMatch = url.pathname.match(/^\/api\/repositories\/([^/]+)\/([^/]+)\/guide$/);
    if (guideMatch) {
      const repository = findRepository(repositories, decodeURIComponent(guideMatch[1]), decodeURIComponent(guideMatch[2]));
      return repository
        ? json(response, 200, { repositoryId: repository.id, ...repository.guide })
        : json(response, 404, { error: "Repository not found" });
    }

    const repositoryMatch = url.pathname.match(/^\/api\/repositories\/([^/]+)\/([^/]+)$/);
    if (repositoryMatch) {
      const repository = findRepository(
        repositories,
        decodeURIComponent(repositoryMatch[1]),
        decodeURIComponent(repositoryMatch[2]),
      );
      return repository
        ? json(response, 200, repository)
        : json(response, 404, { error: "Repository not found" });
    }

    if (url.pathname.startsWith("/api/")) return json(response, 404, { error: "Not found" });
    await serveStatic(url.pathname, response);
  } catch (error) {
    console.error(error);
    json(response, 500, { error: "Internal server error" });
  }
});

server.listen(port, () => {
  console.log(`Easy Open Source is running at http://localhost:${port}`);
});
