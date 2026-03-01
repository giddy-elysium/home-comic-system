import aManAmongYeIssues from "../data/a-man-among-ye-issues.json";
import newMutantsIssues from "../data/new-mutants-issues.json";

export type CatalogIssue = {
  issueNumber: number;
  title: string;
  releaseDate: string;
  imageUrl: string;
  issueUrl: string;
};

export type CatalogSeries = {
  id: string;
  title: string;
  rangeLabel: string;
  publisher: string;
  issueCount: number;
  verifiedIssueCount: number;
  planningNote: string;
  sourceNote: string;
  heroImage: string;
  issues: CatalogIssue[];
};

export const catalog: CatalogSeries[] = [
  {
    id: "new-mutants",
    title: "New Mutants",
    rangeLabel: "2019-2022",
    publisher: "Marvel",
    issueCount: 33,
    verifiedIssueCount: 33,
    planningNote: "Fully loaded with official primary issue covers for the run.",
    sourceNote: "Verified from Marvel's official issue pages.",
    heroImage: newMutantsIssues[0].imageUrl,
    issues: newMutantsIssues
  },
  {
    id: "a-man-among-ye",
    title: "A Man Among Ye",
    rangeLabel: "2020-2022",
    publisher: "Image",
    issueCount: 8,
    verifiedIssueCount: 8,
    planningNote: "Fully loaded with official release covers and published dates.",
    sourceNote: "Verified from Image Comics release pages.",
    heroImage: aManAmongYeIssues[0].imageUrl,
    issues: aManAmongYeIssues
  }
];
