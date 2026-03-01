import * as cheerio from "cheerio";
import type { ImportedIssue } from "./types";

export async function importLeaguePullList(url: string) {
  const warnings: string[] = [];

  if (!/^https:\/\/(www\.)?leagueofcomicgeeks\.com\/profile\/.+\/pull-list/.test(url)) {
    throw new Error("Use a public League of Comic Geeks pull-list URL.");
  }

  const response = await fetch(url, {
    headers: {
      "user-agent": process.env.LEAGUE_IMPORT_USER_AGENT ?? "PanelVault/0.1"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`League import failed with status ${response.status}.`);
  }

  const html = await response.text();
  const issues = parseLeagueIssues(html, warnings);

  if (!issues.length) {
    warnings.push("No pull-list issues were detected from the fetched page.");
  }

  return { issues, warnings };
}

export function parseLeagueIssues(html: string, warnings: string[]) {
  const $ = cheerio.load(html);
  const extracted: ImportedIssue[] = [];

  $("a, article, li, div").each((_, element) => {
    const text = $(element).text().replace(/\s+/g, " ").trim();
    const match = text.match(/^(.*?)\s+#(\d+)\b(.*)$/);

    if (!match) {
      return;
    }

    const title = sanitizeTitle(match[1]);
    const issueNumber = Number.parseInt(match[2], 10);

    if (!title || !Number.isFinite(issueNumber)) {
      return;
    }

    const publisher = inferPublisher($(element).prevAll().first().text()) || inferPublisher(text) || "Unknown Publisher";
    const releaseDate = inferReleaseDate(text);
    const price = inferPrice(text);
    const coverUrl = $(element).find("img").attr("src") ?? $(element).find("img").attr("data-src") ?? undefined;

    extracted.push({
      title,
      issueNumber,
      publisher,
      releaseDate,
      price,
      coverUrl
    });
  });

  const deduped = dedupeIssues(extracted);

  if (!deduped.length) {
    warnings.push("League page structure did not match the parser heuristics. Adjust selectors in lib/league.ts.");
  }

  return deduped;
}

function sanitizeTitle(value: string) {
  return value
    .replace(/\s+Cover\s+[A-Z].*$/i, "")
    .replace(/\s+Variant.*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function inferPublisher(text: string) {
  const match = text.match(/\b(Marvel|DC|Image|Skybound|Dark Horse|BOOM!|IDW|Titan|DSTLRY)(?:\s+Comics)?\b/i);
  return match ? match[0].replace(/\s+/g, " ").trim() : "";
}

function inferReleaseDate(text: string) {
  const match = text.match(/\b([A-Z][a-z]{2,8}\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{4})\b/);

  if (!match) {
    return undefined;
  }

  const parsed = new Date(match[1]);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function inferPrice(text: string) {
  const match = text.match(/\$\d+(?:\.\d{2})?/);
  return match ? match[0] : undefined;
}

function dedupeIssues(issues: ImportedIssue[]) {
  const map = new Map<string, ImportedIssue>();

  for (const issue of issues) {
    map.set(`${issue.title}#${issue.issueNumber}`, issue);
  }

  return [...map.values()].sort((left, right) => {
    const titleCompare = left.title.localeCompare(right.title);
    return titleCompare !== 0 ? titleCompare : left.issueNumber - right.issueNumber;
  });
}
