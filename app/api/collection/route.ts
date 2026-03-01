import { NextResponse } from "next/server";
import { toggleOwnedIssue } from "../../../lib/collection";
import { readCollectionStore, writeCollectionStore } from "../../../lib/storage";
import type { CollectionStore } from "../../../lib/types";

export async function GET() {
  const store = await readCollectionStore();
  return NextResponse.json(store);
}

export async function PUT(request: Request) {
  const store = (await request.json()) as CollectionStore;
  await writeCollectionStore(store);
  return NextResponse.json(store);
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as { seriesId?: string; issueNumber?: number };

  if (!payload.seriesId || typeof payload.issueNumber !== "number") {
    return NextResponse.json({ error: "seriesId and issueNumber are required." }, { status: 400 });
  }

  const store = await readCollectionStore();
  const nextStore = toggleOwnedIssue(store, payload.seriesId, payload.issueNumber);
  await writeCollectionStore(nextStore);

  return NextResponse.json(nextStore);
}
