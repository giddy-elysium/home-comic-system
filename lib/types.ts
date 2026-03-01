export type CollectionSeries = {
  id: string;
  title: string;
  publisher: string;
  volume: string;
  ownedIssues: number[];
  plannedIssues: number[];
  targetIssues: number[];
  notes: string;
};

export type CollectionStore = {
  marketplaces: string[];
  stagedProfileUrl: string;
  series: CollectionSeries[];
  lastImport: {
    source: string;
    importedAt: string;
    itemCount: number;
    warnings: string[];
  } | null;
};

export type ImportedIssue = {
  title: string;
  issueNumber: number;
  publisher: string;
  coverUrl?: string;
  releaseDate?: string;
  price?: string;
};

export type EbayListing = {
  title: string;
  itemWebUrl: string;
  imageUrl: string | null;
  price: string | null;
  shipping: string | null;
  condition: string | null;
  seller: string | null;
  sellerFeedback: string | null;
  buyingOptions: string[];
};

export type MissingIssue = {
  seriesId: string;
  title: string;
  volume: string;
  publisher: string;
  issueNumber: number;
  notes: string;
  rarity: string;
  rarityReason: string;
  priceSignal: string;
  externalSearches: {
    label: string;
    href: string;
  }[];
  ebayListings: EbayListing[];
};
