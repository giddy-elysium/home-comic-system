import { NextResponse } from "next/server";
import { mergeImportedIssues } from "../../../../lib/collection";
import { importLeaguePullList } from "../../../../lib/league";
import { readCollectionStore, writeCollectionStore } from "../../../../lib/storage";

export async function POST(request: Request) {
  const payload = (await request.json()) as { url?: string };

  if (!payload.url) {
    return NextResponse.json({ error: "A League pull-list URL is required." }, { status: 400 });
  }

  try {
    const { issues, warnings } = await importLeaguePullList(payload.url);
    const store = await readCollectionStore();
    const nextStore = mergeImportedIssues(store, issues, payload.url, warnings);
    await writeCollectionStore(nextStore);

    return NextResponse.json({
      store: nextStore,
      warnings
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "League import failed." },
      { status: 500 }
    );
  }
}
