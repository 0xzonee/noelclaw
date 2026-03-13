"use node";

import { action } from "./_generated/server";

const APIFY_ACTOR_ID = "muhammetakkurtt~cointelegraph-news-scraper";

export const getCryptoNews = action({
  args: {},
  handler: async () => {
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (!apifyToken) throw new Error("APIFY_API_TOKEN not set");

    // Step 1: Start the actor run
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${apifyToken}&timeout=120&memory=256`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "en", articleCount: 10 }),
      }
    );

    const startText = await startRes.text();
    console.log("Apify start status:", startRes.status, startText.slice(0, 300));

    if (!startRes.ok) throw new Error(`Apify start failed: ${startRes.status} — ${startText.slice(0,200)}`);

    const startData = JSON.parse(startText);
    const runId     = startData?.data?.id;
    const datasetId = startData?.data?.defaultDatasetId;
    console.log("Run ID:", runId, "Dataset ID:", datasetId);

    if (!runId) throw new Error("No run ID returned: " + startText.slice(0, 200));

    // Step 2: Poll until SUCCEEDED (max 60s)
    let status = "RUNNING";
    let finalDatasetId = datasetId || "";
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const pollRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`
      );
      const pollData = await pollRes.json();
      status           = pollData?.data?.status || "RUNNING";
      finalDatasetId   = pollData?.data?.defaultDatasetId || finalDatasetId;
      console.log(`Poll ${i+1}: status=${status} datasetId=${finalDatasetId}`);
      if (status === "SUCCEEDED") break;
      if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT")
        throw new Error(`Apify run ended with status: ${status}`);
    }

    if (status !== "SUCCEEDED") throw new Error(`Apify still ${status} after 60s`);
    if (!finalDatasetId) throw new Error("No dataset ID available");

    // Step 3: Fetch dataset items
    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${finalDatasetId}/items?token=${apifyToken}&limit=10`
    );
    const dataText = await dataRes.text();
    console.log("Dataset response:", dataRes.status, dataText.slice(0, 500));

    if (!dataRes.ok) throw new Error(`Dataset fetch failed: ${dataRes.status}`);

    const items: any[] = JSON.parse(dataText);
    console.log("Items count:", items.length, "First keys:", items[0] ? Object.keys(items[0]).join(",") : "none");
    console.log("First item sample:", JSON.stringify(items[0]).slice(0, 600));

    const toNews = (item: any, i: number) => {
      // Cointelegraph actor returns nested structure:
      // post_url, postTranslate.title, postTranslate.leadText, published, author.authorUrl
      const title   = item.postTranslate?.title || item.title || item.headline || "—";
      const url     = item.post_url || item.url || item.articleUrl || "#";
      const summary = item.postTranslate?.leadText || item.leadText || item.summary || "";
      const date    = item.published || item.publishedAt || item.date || new Date().toISOString();
      return {
        id:          item.id ? String(item.id) : String(i),
        title,
        url,
        source:      "Cointelegraph",
        publishedAt: date,
        currencies:  extractTickers(title),
        sentiment:   guessSentiment(title, summary),
        votes:       { positive: 0, negative: 0, important: 0 },
        summary,
        avatar:      item.postTranslate?.avatar || item.avatar || "",
      };
    };

    const all    = items.slice(0, 10).map(toNews);
    const hot    = all.slice(0, 6);
    const rising = all.slice(6, 10);

    return { success: true, hot, rising, source: "apify", fetchedAt: Date.now() };
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TICKER_RE = /\b(BTC|ETH|SOL|XRP|BNB|DOGE|ADA|AVAX|MATIC|DOT|LINK|UNI|SHIB|LTC|ATOM|ARB|OP|INJ|SUI|APT)\b/g;
function extractTickers(text: string): string[] {
  return [...new Set((text.toUpperCase().match(TICKER_RE) || []))].slice(0, 4);
}

const BULL_WORDS = ["surge","soar","rally","gain","rise","bull","pump","ath","high","record","break","up","boost","launch","approve","adopt","growth"];
const BEAR_WORDS = ["drop","fall","crash","bear","dump","low","down","sell","fear","hack","ban","risk","loss","decline","plunge","collapse","warn","death"];
function guessSentiment(title: string, summary: string): "bullish" | "bearish" | "neutral" {
  const txt = (title + " " + summary).toLowerCase();
  const b = BULL_WORDS.filter(w => txt.includes(w)).length;
  const r = BEAR_WORDS.filter(w => txt.includes(w)).length;
  return b > r ? "bullish" : r > b ? "bearish" : "neutral";
}

// ─────────────────────────────────────────────────────────────────────────────

export const getMessariMetrics = action({
  args: {},
  handler: async () => {
    const key = process.env.MESSARI_API_KEY;
    if (!key) return { success: false, global: null, topAssets: [], error: "MESSARI_API_KEY not set" };

    const headers = { "x-messari-api-key": key, "Content-Type": "application/json" };
    const [globalRes, assetsRes] = await Promise.all([
      fetch("https://data.messari.io/api/v1/global/metrics", { headers }),
      fetch("https://data.messari.io/api/v2/assets?fields=id,slug,symbol,name,metrics/market_data/price_usd,metrics/market_data/percent_change_usd_last_24_hours,metrics/market_data/volume_last_24_hours&limit=15", { headers }),
    ]);

    let globalMetrics: any = null;
    let topAssets: any[] = [];

    if (globalRes.ok) {
      const d = await globalRes.json();
      const g = d.data;
      globalMetrics = {
        totalMarketCapUsd: g?.total_market_cap_usd       ?? null,
        btcDominance:      g?.btc_dominance_percent      ?? null,
        ethDominance:      g?.eth_dominance_percent      ?? null,
        defiMarketCapUsd:  g?.defi_market_cap_usd        ?? null,
        activeCurrencies:  g?.num_active_currencies      ?? null,
        totalVolume24h:    g?.total_volume_last_24_hours ?? null,
      };
    }

    if (assetsRes.ok) {
      const d = await assetsRes.json();
      topAssets = (d.data || []).slice(0, 10).map((a: any) => ({
        symbol:    a.symbol,
        name:      a.name,
        priceUsd:  a.metrics?.market_data?.price_usd ?? null,
        change24h: a.metrics?.market_data?.percent_change_usd_last_24_hours ?? null,
        volume24h: a.metrics?.market_data?.volume_last_24_hours ?? null,
      }));
    }

    return { success: true, global: globalMetrics, topAssets, fetchedAt: Date.now() };
  },
});