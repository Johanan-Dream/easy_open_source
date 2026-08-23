import { readFile } from "node:fs/promises";
import type { Repository } from "./domain.ts";

const dataUrl = new URL("../data/repositories.json", import.meta.url);

export async function loadRepositories(): Promise<Repository[]> {
  const raw = await readFile(dataUrl, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("repositories.json must contain an array");
  return parsed as Repository[];
}
