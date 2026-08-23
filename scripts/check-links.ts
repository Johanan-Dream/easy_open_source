import { loadRepositories } from "../src/data-store.ts";

const repositories = await loadRepositories();
const urls = [...new Set(repositories.flatMap((repository) => repository.sourceUrls))];
const failures: string[] = [];

for (const url of urls) {
  process.stdout.write(`Checking ${url} ... `);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "Easy-Open-Source-Link-Checker" },
    });
    if (response.ok || response.status === 405 || response.status === 429) {
      console.log(response.status);
    } else {
      failures.push(`${response.status} ${url}`);
      console.log(`FAILED (${response.status})`);
    }
  } catch (error) {
    failures.push(`${error instanceof Error ? error.message : String(error)} ${url}`);
    console.log("FAILED");
  }
}

if (failures.length) {
  console.error(`\n${failures.length} link(s) failed:\n${failures.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`\nAll ${urls.length} source links responded successfully.`);
}
