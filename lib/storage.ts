import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { seedStore } from "./seed";
import type { CollectionStore } from "./types";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "collection.json");

export async function readCollectionStore(): Promise<CollectionStore> {
  try {
    const raw = await readFile(dataFile, "utf8");
    return JSON.parse(raw) as CollectionStore;
  } catch {
    await writeCollectionStore(seedStore);
    return seedStore;
  }
}

export async function writeCollectionStore(store: CollectionStore) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(store, null, 2), "utf8");
}
