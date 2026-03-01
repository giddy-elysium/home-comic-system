import type { EbayListing } from "./types";

const DEFAULT_SCOPE = "https://api.ebay.com/oauth/api_scope";

let cachedToken:
  | {
      accessToken: string;
      expiresAt: number;
    }
  | undefined;

function getBaseUrls() {
  const environment = (process.env.EBAY_ENVIRONMENT ?? "production").toLowerCase();

  if (environment === "sandbox") {
    return {
      identity: "https://api.sandbox.ebay.com/identity/v1/oauth2/token",
      browse: "https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search"
    };
  }

  return {
    identity: "https://api.ebay.com/identity/v1/oauth2/token",
    browse: "https://api.ebay.com/buy/browse/v1/item_summary/search"
  };
}

export function ebayConfigured() {
  return Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);
}

export async function searchEbayIssues(queries: string[]) {
  if (!ebayConfigured()) {
    return { configured: false, results: {} as Record<string, EbayListing[]> };
  }

  const token = await getApplicationToken();
  const { browse } = getBaseUrls();
  const marketplaceId = process.env.EBAY_MARKETPLACE_ID ?? "EBAY_US";
  const results: Record<string, EbayListing[]> = {};

  for (const query of queries) {
    const url = new URL(browse);
    url.searchParams.set("q", `${query.replace("#", " ")} comic`);
    url.searchParams.set("limit", "6");
    url.searchParams.set("filter", "buyingOptions:{FIXED_PRICE|AUCTION},conditions:{NEW|LIKE_NEW|VERY_GOOD|GOOD}");

    const response = await fetch(url, {
      headers: {
        authorization: `Bearer ${token}`,
        "x-ebay-c-marketplace-id": marketplaceId,
        accept: "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`eBay search failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as {
      itemSummaries?: Array<{
        title?: string;
        itemWebUrl?: string;
        image?: { imageUrl?: string };
        price?: { value?: string; currency?: string };
        shippingOptions?: Array<{ shippingCostType?: string; shippingCost?: { value?: string; currency?: string } }>;
        condition?: string;
        seller?: { username?: string; feedbackPercentage?: string };
        buyingOptions?: string[];
      }>;
    };

    results[query] = (payload.itemSummaries ?? []).map((item) => ({
      title: item.title ?? query,
      itemWebUrl: item.itemWebUrl ?? `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`,
      imageUrl: item.image?.imageUrl ?? null,
      price: item.price?.value && item.price.currency ? `${item.price.currency} ${item.price.value}` : null,
      shipping:
        item.shippingOptions?.[0]?.shippingCost?.value && item.shippingOptions?.[0]?.shippingCost?.currency
          ? `${item.shippingOptions[0].shippingCost.currency} ${item.shippingOptions[0].shippingCost.value}`
          : item.shippingOptions?.[0]?.shippingCostType ?? null,
      condition: item.condition ?? null,
      seller: item.seller?.username ?? null,
      sellerFeedback: item.seller?.feedbackPercentage ?? null,
      buyingOptions: item.buyingOptions ?? []
    }));
  }

  return { configured: true, results };
}

async function getApplicationToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing eBay credentials.");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const { identity } = getBaseUrls();
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: DEFAULT_SCOPE
  });

  const response = await fetch(identity, {
    method: "POST",
    headers: {
      authorization: `Basic ${credentials}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`eBay token mint failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max(payload.expires_in - 60, 60) * 1000
  };

  return cachedToken.accessToken;
}
