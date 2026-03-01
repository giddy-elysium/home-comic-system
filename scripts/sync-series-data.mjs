import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import * as cheerio from "cheerio";

const outputDir = path.join(process.cwd(), "data");

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BackIssueRadar/0.1; +https://localhost)"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

function absoluteMarvelUrl(relativeUrl) {
  return relativeUrl.startsWith("http") ? relativeUrl : `https://www.marvel.com${relativeUrl}`;
}

function absoluteImageUrl(url) {
  return url.startsWith("http") ? url : `https://imagecomics.com${url}`;
}

function parseMarvelRunFromIssuePage(html, seriesPrefix) {
  const issuePattern =
    /\{"id":"(?<id>\d+)","image":\{"filename":"(?<image>[^"]+)","alt":"[^"]*"\},"link":\{"link":"(?<link>[^"]+)"\}.*?"headline":"(?<headline>[^"]+)".*?"isVariant":(?<variant>[01]).*?"releaseDate":"(?<releaseDate>[^"]+)"/g;
  const issues = [];

  for (const match of html.matchAll(issuePattern)) {
    const groups = match.groups;

    if (!groups) {
      continue;
    }

    const issueNumberMatch = groups.headline.match(/#(\d+)/);

    if (!issueNumberMatch) {
      continue;
    }

    if (!groups.headline.startsWith(seriesPrefix) || groups.variant !== "0") {
      continue;
    }

    issues.push({
      issueNumber: Number.parseInt(issueNumberMatch[1], 10),
      title: groups.headline,
      releaseDate: groups.releaseDate,
      imageUrl: groups.image,
      issueUrl: absoluteMarvelUrl(groups.link)
    });
  }

  return dedupeAndSortIssues(issues);
}

function parseImageIssuePage(html, issueUrl) {
  const $ = cheerio.load(html);
  const title = $('meta[property="og:title"]').attr("content")?.trim() ?? "";
  const imageUrl = $('meta[property="og:image"]').attr("content")?.trim() ?? "";
  const publishedText = $(".entry-meta p")
    .text()
    .match(/Published:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/)?.[1] ?? "";
  const issueNumber = Number.parseInt(title.match(/#(\d+)/)?.[1] ?? "", 10);

  if (!title || !imageUrl || Number.isNaN(issueNumber)) {
    throw new Error(`Could not parse image issue page: ${issueUrl}`);
  }

  return {
    issueNumber,
    title,
    releaseDate: publishedText,
    imageUrl: absoluteImageUrl(imageUrl),
    issueUrl
  };
}

function dedupeAndSortIssues(issues) {
  const byNumber = new Map();

  for (const issue of issues) {
    byNumber.set(issue.issueNumber, issue);
  }

  return [...byNumber.values()].sort((left, right) => left.issueNumber - right.issueNumber);
}

async function syncStrangeAcademy() {
  const html = await fetchText("https://www.marvel.com/comics/issue/79798/strange_academy_2020_1");
  const issues = parseMarvelRunFromIssuePage(html, "Strange Academy (2020)");
  return {
    fileName: "strange-academy-issues.json",
    issues
  };
}

async function syncAManAmongYe() {
  const html = await fetchText("https://imagecomics.com/comics/series/a-man-among-ye");
  const $ = cheerio.load(html);
  const releaseUrls = [
    ...new Set(
      $('a[href*="/comics/releases/a-man-among-ye-"]')
        .map((_, element) => $(element).attr("href"))
        .get()
        .filter(Boolean)
        .map((href) => absoluteImageUrl(href))
        .filter((href) => !href.includes("-tp"))
    )
  ];

  const issues = [];

  for (const releaseUrl of releaseUrls) {
    const releaseHtml = await fetchText(releaseUrl);
    issues.push(parseImageIssuePage(releaseHtml, releaseUrl));
  }

  return {
    fileName: "a-man-among-ye-issues.json",
    issues: dedupeAndSortIssues(issues)
  };
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const datasets = await Promise.all([syncStrangeAcademy(), syncAManAmongYe()]);

  for (const dataset of datasets) {
    const targetFile = path.join(outputDir, dataset.fileName);
    await writeFile(targetFile, `${JSON.stringify(dataset.issues, null, 2)}\n`, "utf8");
    console.log(`Wrote ${dataset.fileName} with ${dataset.issues.length} issues.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
