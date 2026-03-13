"use node";

import { action } from "./_generated/server";

// ─── GMGN Smart Degen Monitor — Base Chain ───────────────────────────────────
// Actor: muhammetakkurtt/gmgn-smart-degen-monitor-scraper
// Tracks real smart money wallets (whales, degens) on Base network
// Env var: APIFY_API_TOKEN
// ─────────────────────────────────────────────────────────────────────────────

const GMGN_ACTOR_ID = "muhammetakkurtt~gmgn-smart-degen-monitor-scraper";

export const getSmartMoney = action({
  args: {},
  handler: async () => {
    const apifyToken = process.env.APIFY_GMGN_TOKEN;
    if (!apifyToken) throw new Error("APIFY_GMGN_TOKEN not set");

    // Start actor run — Base chain, Smart Money Degens, last 24h
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${GMGN_ACTOR_ID}/runs?token=${apifyToken}&timeout=120&memory=256`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockchainNetwork: "base",
          dataType: "degens",
          timePeriod:        "Last 24 Hours",
          tradesLimit:       20,
        }),
      }
    );

    if (!startRes.ok) {
      const t = await startRes.text();
      throw new Error(`GMGN start failed: ${startRes.status} — ${t.slice(0, 200)}`);
    }

    const startData  = await startRes.json();
    const runId      = startData?.data?.id;
    let   datasetId  = startData?.data?.defaultDatasetId || "";
    if (!runId) throw new Error("No run ID from GMGN actor");

    // Poll until SUCCEEDED (max 60s)
    let status = "RUNNING";
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const poll   = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
      const pd     = await poll.json();
      status       = pd?.data?.status || "RUNNING";
      datasetId    = pd?.data?.defaultDatasetId || datasetId;
      console.log(`GMGN poll ${i+1}: ${status}`);
      if (status === "SUCCEEDED") break;
      if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT")
        throw new Error(`GMGN run ${status}`);
    }

    if (status !== "SUCCEEDED") throw new Error("GMGN timed out");

    // Fetch dataset
    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}&limit=20`
    );
    if (!dataRes.ok) throw new Error(`GMGN dataset fetch failed: ${dataRes.status}`);
    const items: any[] = await dataRes.json();

    console.log("GMGN items:", items.length, "keys:", items[0] ? Object.keys(items[0]).join(",") : "none");
    console.log("GMGN first item:", JSON.stringify(items[0]).slice(0, 400));

    // Normalise to consistent shape — GMGN actual field names from logs:
    // address, create_timestamp, open_timestamp, total_supply, liquidity,
    // initial_liquidity, quote_symbol, market_cap, price, price_change_percent,
    // volume, swaps, buys, sells, buy_volume, sell_volume, ...
    const wallets = items.slice(0, 15).map((item: any) => {
      const address    = item.address || "—";
      // GMGN returns token data not wallet — use token address on correct explorer
      const isSOL      = item.quote_symbol === "SOL" || (item.address || "").length < 44;
      const chain      = isSOL ? "solana" : "base";
      const explorerUrl = isSOL
        ? `https://solscan.io/token/${address}`
        : `https://basescan.org/address/${address}`;

      const volume     = parseFloat(item.volume     || item.buy_volume || 0);
      const buys       = parseInt(item.buys         || 0);
      const sells      = parseInt(item.sells        || 0);
      const pnl        = parseFloat(item.price_change_percent || 0);
      const liquidity  = parseFloat(item.liquidity  || 0);
      const marketCap  = parseFloat(item.market_cap || 0);
      const symbol     = item.quote_symbol || "";

      // Tier based on market cap / liquidity
      const tier =
        marketCap > 1000000 || liquidity > 500000 ? "WHALE" :
        marketCap > 100000  || liquidity > 50000  ? "SHARK" :
                                                      "DEGEN";

      const lastAction = buys >= sells ? "buy" : "sell";
      const shortAddr  = address.length > 10
        ? address.slice(0, 5) + "…" + address.slice(-4)
        : address;

      return {
        address,
        shortAddr,
        pnl,
        winRate:    buys + sells > 0 ? Math.round((buys / (buys + sells)) * 100) : 0,
        volume,
        buys,
        sells,
        lastAction,
        tier,
        tag:        symbol,
        chain,
        explorerUrl,
        liquidity,
        marketCap,
      };
    });

    return { success: true, wallets, fetchedAt: Date.now() };
  },
});

// ─── GMGN Sniper New Tokens — Base Chain ─────────────────────────────────────
// Actor: muhammetakkurtt/gmgn-sniper-new-scraper
// Tracks new/trending tokens on Base with risk filtering
// ─────────────────────────────────────────────────────────────────────────────

const SNIPER_ACTOR_ID = "muhammetakkurtt~gmgn-sniper-new-scraper";

export const getSniperTokens = action({
  args: {},
  handler: async () => {
    const apifyToken = process.env.APIFY_GMGN_TOKEN;
    if (!apifyToken) throw new Error("APIFY_GMGN_TOKEN not set");

    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${SNIPER_ACTOR_ID}/runs?token=${apifyToken}&timeout=120&memory=256`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockchainNetwork: "base",
          filterRisks:       true,
          featured:          false,
        }),
      }
    );

    if (!startRes.ok) {
      const t = await startRes.text();
      throw new Error(`Sniper start failed: ${startRes.status} — ${t.slice(0, 200)}`);
    }

    const startData = await startRes.json();
    const runId     = startData?.data?.id;
    let datasetId   = startData?.data?.defaultDatasetId || "";
    if (!runId) throw new Error("No run ID from Sniper actor");

    // Poll until SUCCEEDED (max 60s)
    let status = "RUNNING";
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const poll = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
      const pd   = await poll.json();
      status     = pd?.data?.status || "RUNNING";
      datasetId  = pd?.data?.defaultDatasetId || datasetId;
      console.log(`Sniper poll ${i+1}: ${status}`);
      if (status === "SUCCEEDED") break;
      if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT")
        throw new Error(`Sniper run ${status}`);
    }

    if (status !== "SUCCEEDED") throw new Error("Sniper timed out");

    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}&limit=20`
    );
    if (!dataRes.ok) throw new Error(`Sniper dataset fetch failed: ${dataRes.status}`);
    const items: any[] = await dataRes.json();

    console.log("Sniper items:", items.length, "keys:", items[0] ? Object.keys(items[0]).join(",") : "none");
    console.log("Sniper first item:", JSON.stringify(items[0]).slice(0, 500));

    const tokens = items.slice(0, 20).map((item: any) => ({
      address:     item.address     || item.token_address || "—",
      symbol:      item.symbol      || item.ticker        || "—",
      name:        item.name        || "",
      image:       item.image       || item.logo          || item.icon || "",
      price:       parseFloat(item.price       || item.price_usd    || 0),
      marketCap:   parseFloat(item.market_cap  || item.marketCap    || 0),
      liquidity:   parseFloat(item.liquidity   || 0),
      priceChange: parseFloat(item.price_change_percent || item.priceChange || item.change_24h || 0),
      swaps:       parseInt(item.swaps         || item.txns         || 0),
      risk:        item.risk        || item.risk_level    || "",
      url:         item.url         || "",
    }));

    return { success: true, tokens, fetchedAt: Date.now() };
  },
});