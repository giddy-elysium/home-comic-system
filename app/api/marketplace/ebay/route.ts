import { NextResponse } from "next/server";
import { searchEbayIssues } from "../../../../lib/ebay";

export async function POST(request: Request) {
  const payload = (await request.json()) as { queries?: string[] };

  if (!payload.queries?.length) {
    return NextResponse.json({ error: "At least one search query is required." }, { status: 400 });
  }

  try {
    const result = await searchEbayIssues(payload.queries);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "eBay search failed." },
      { status: 500 }
    );
  }
}
