import type { CollectionSeries, CollectionStore, ImportedIssue, MissingIssue } from "./types";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeIssueNumbers(values: number[]) {
  return [...new Set(values)].filter((value) => Number.isFinite(value)).sort((left, right) => left - right);
}

export function mergeImportedIssues(store: CollectionStore, issues: ImportedIssue[], source: string, warnings: string[]) {
  const seriesMap = new Map<string, CollectionSeries>(store.series.map((series) => [series.id, series]));

  for (const issue of issues) {
    const title = issue.title.trim();
    const id = slugify(`${title}-${issue.releaseDate?.slice(0, 4) ?? "run"}`);
    const existing = seriesMap.get(id);

    if (existing) {
      existing.plannedIssues = normalizeIssueNumbers([...existing.plannedIssues, issue.issueNumber]);
      existing.targetIssues = normalizeIssueNumbers([
        ...existing.targetIssues,
        ...buildTargetRange(existing.targetIssues, existing.ownedIssues, existing.plannedIssues, issue.issueNumber)
      ]);
      continue;
    }

    const targetIssues = buildTargetRange([], [], [issue.issueNumber], issue.issueNumber);
    seriesMap.set(id, {
      id,
      title,
      publisher: issue.publisher || "Unknown Publisher",
      volume: issue.releaseDate?.slice(0, 4) ?? "Unknown",
      ownedIssues: [],
      plannedIssues: [issue.issueNumber],
      targetIssues,
      notes: "Imported from League pull list."
    });
  }

  return {
    ...store,
    series: [...seriesMap.values()].sort((left, right) => left.title.localeCompare(right.title)),
    stagedProfileUrl: source,
    lastImport: {
      source,
      importedAt: new Date().toISOString(),
      itemCount: issues.length,
      warnings
    }
  } satisfies CollectionStore;
}

function buildTargetRange(existingTarget: number[], ownedIssues: number[], plannedIssues: number[], incomingIssue: number) {
  const maxIssue = Math.max(0, incomingIssue, ...existingTarget, ...ownedIssues, ...plannedIssues);
  return Array.from({ length: maxIssue }, (_, index) => index + 1);
}

export function toggleOwnedIssue(store: CollectionStore, seriesId: string, issueNumber: number) {
  return {
    ...store,
    series: store.series.map((series) => {
      if (series.id !== seriesId) {
        return series;
      }

      const isOwned = series.ownedIssues.includes(issueNumber);
      const ownedIssues = isOwned
        ? series.ownedIssues.filter((value) => value !== issueNumber)
        : [...series.ownedIssues, issueNumber];

      const plannedIssues = isOwned ? series.plannedIssues : series.plannedIssues.filter((value) => value !== issueNumber);
      const targetIssues = normalizeIssueNumbers([...series.targetIssues, issueNumber]);

      return {
        ...series,
        ownedIssues: normalizeIssueNumbers(ownedIssues),
        plannedIssues: normalizeIssueNumbers(plannedIssues),
        targetIssues
      };
    })
  };
}

export function addMarketplace(store: CollectionStore, marketplace: string) {
  if (!marketplace || store.marketplaces.includes(marketplace)) {
    return store;
  }

  return {
    ...store,
    marketplaces: [...store.marketplaces, marketplace]
  };
}

export function buildMissingIssues(store: CollectionStore, ebayResults: Record<string, MissingIssue["ebayListings"]> = {}) {
  return store.series.flatMap((series) => {
    const missingIssues = series.targetIssues.filter(
      (issueNumber) => !series.ownedIssues.includes(issueNumber) && !series.plannedIssues.includes(issueNumber)
    );

    return missingIssues.map((issueNumber) => {
      const ebayListings = ebayResults[buildIssueKey(series.title, issueNumber)] ?? [];
      const prices = ebayListings
        .map((listing) => listing.price?.replace(/[^0-9.]/g, ""))
        .map((value) => (value ? Number.parseFloat(value) : Number.NaN))
        .filter((value) => Number.isFinite(value));

      const avgPrice = prices.length
        ? prices.reduce((sum, value) => sum + value, 0) / prices.length
        : null;

      const rarity = deriveRarity(ebayListings.length, avgPrice);

      return {
        seriesId: series.id,
        title: series.title,
        volume: series.volume,
        publisher: series.publisher,
        issueNumber,
        notes: series.notes,
        rarity: rarity.label,
        rarityReason: rarity.reason,
        priceSignal: avgPrice ? `$${avgPrice.toFixed(2)} avg active listing` : "No active eBay pricing yet",
        externalSearches: store.marketplaces.map((marketplace) => ({
          label: marketplace,
          href:
            marketplace === "eBay"
              ? `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`${series.title} ${issueNumber} comic`)}`
              : `https://www.google.com/search?q=${encodeURIComponent(`${marketplace} ${series.title} ${issueNumber} comic`)}`
        })),
        ebayListings
      } satisfies MissingIssue;
    });
  });
}

export function buildIssueKey(title: string, issueNumber: number) {
  return `${title}#${issueNumber}`;
}

function deriveRarity(listingCount: number, averagePrice: number | null) {
  if (listingCount <= 1 && averagePrice !== null && averagePrice >= 25) {
    return { label: "Hot", reason: "Very few live listings and a high active price." };
  }

  if (listingCount <= 2) {
    return { label: "Scarce", reason: "Only a small number of live listings were found." };
  }

  if (averagePrice !== null && averagePrice >= 15) {
    return { label: "Watch", reason: "Supply exists, but active prices are elevated." };
  }

  return { label: "Available", reason: "Multiple live listings are available at normal range." };
}
