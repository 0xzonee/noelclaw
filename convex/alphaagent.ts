"use node";

import { action } from "./_generated/server";

// ─── Alpha Agent — Base Ecosystem Token Analyzer ─────────────────────────────
// Pulls GMGN Sniper + DexScreener trending data → sends to Claude → 
// returns conviction scores, entry/exit, risk level, on-chain evidence
// Env vars: APIFY_GMGN_TOKEN, ANTHROPIC_API_KEY
// ─────────────────────────────────────────────────────────────────────────────

const GMGN_SNIPER_ACTOR = "muhammetakkurtt~gmgn-sniper-new-scraper";
const DEX = "https://api.dexscreener.com";

async function fetchGMGNTokens(apifyToken: string): Promise<any[]> {
  try {
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${GMGN_SNIPER_ACTOR}/runs?token=${apifyToken}&timeout=90&memory=256`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockchainNetwork: "base", filterRisks: true, featured: false }),
      }
    );
    if (!startRes.ok) throw new Error(`GMGN start: ${startRes.status}`);
    const sd = await startRes.json();
    const runId = sd?.data?.id;
    let datasetId = sd?.data?.defaultDatasetId || "";

    let status = "RUNNING";
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const poll = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
      const pd = await poll.json();
      status = pd?.data?.status || "RUNNING";
      datasetId = pd?.data?.defaultDatasetId || datasetId;
      if (status === "SUCCEEDED") break;
      if (["FAILED","ABORTED","TIMED-OUT"].includes(status)) throw new Error(`GMGN run ${status}`);
    }

    if (status !== "SUCCEEDED") return [];
    const dataRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}&limit=15`);
    if (!dataRes.ok) return [];
    return await dataRes.json();
  } catch(e: any) {
    console.error("GMGN fetch error:", e.message);
    return [];
  }
}

async function fetchDexScreenerTrending(): Promise<any[]> {
  try {
    const res = await fetch(`${DEX}/token-profiles/latest/v1`);
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : [])
      .filter((t: any) => t.chainId === "base")
      .slice(0, 10);
  } catch { return []; }
}

async function fetchTokenDetails(address: string): Promise<any> {
  try {
    const res = await fetch(`${DEX}/tokens/v1/base/${address}`);
    if (!res.ok) return null;
    const data = await res.json();
    const pairs = Array.isArray(data) ? data : data.pairs;
    return pairs?.[0] || null;
  } catch { return null; }
}

export const runAlphaAgent = action({
  args: {},
  handler: async () => {
    const apifyToken = process.env.APIFY_GMGN_TOKEN;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not set");

    console.log("Alpha Agent: fetching token data...");

    // 1. Fetch data sources in parallel
    const [gmgnItems, dexTrending] = await Promise.all([
      apifyToken ? fetchGMGNTokens(apifyToken) : Promise.resolve([]),
      fetchDexScreenerTrending(),
    ]);

    console.log(`Alpha Agent: ${gmgnItems.length} GMGN tokens, ${dexTrending.length} DEX trending`);

    // 2. Build token list — prefer GMGN, supplement with DexScreener
    const tokenMap: Record<string, any> = {};

    for (const item of gmgnItems) {
      const addr = item.address || item.token_address;
      if (!addr) continue;
      tokenMap[addr] = {
        address: addr,
        symbol: item.symbol || item.ticker || "?",
        name: item.name || "",
        price: parseFloat(item.price || item.price_usd || 0),
        marketCap: parseFloat(item.market_cap || 0),
        liquidity: parseFloat(item.liquidity || 0),
        priceChange24h: parseFloat(item.price_change_percent || 0),
        volume24h: parseFloat(item.volume || 0),
        buys: parseInt(item.buys || 0),
        sells: parseInt(item.sells || 0),
        swaps: parseInt(item.swaps || item.txns || 0),
        source: "GMGN",
      };
    }

    for (const item of dexTrending) {
      const addr = item.tokenAddress;
      if (!addr || tokenMap[addr]) continue;
      tokenMap[addr] = {
        address: addr,
        symbol: item.description || addr.slice(0,8),
        name: "",
        price: 0,
        marketCap: 0,
        liquidity: 0,
        priceChange24h: 0,
        volume24h: 0,
        buys: 0,
        sells: 0,
        swaps: 0,
        source: "DexScreener",
      };
    }

    const tokens = Object.values(tokenMap).slice(0, 12);

    // 3. Enrich top tokens with DexScreener pair data
    const enriched = await Promise.all(
      tokens.slice(0, 8).map(async (t: any) => {
        const pair = await fetchTokenDetails(t.address);
        if (pair) {
          return {
            ...t,
            price: parseFloat(pair.priceUsd || t.price || 0),
            marketCap: pair.marketCap || pair.fdv || t.marketCap,
            liquidity: pair.liquidity?.usd || t.liquidity,
            priceChange24h: pair.priceChange?.h24 ?? t.priceChange24h,
            priceChange1h: pair.priceChange?.h1 ?? 0,
            volume24h: pair.volume?.h24 || t.volume24h,
            buys24h: pair.txns?.h24?.buys || t.buys,
            sells24h: pair.txns?.h24?.sells || t.sells,
            dexUrl: pair.url || `https://dexscreener.com/base/${t.address}`,
          };
        }
        return { ...t, dexUrl: `https://dexscreener.com/base/${t.address}` };
      })
    );

    // 4. Build prompt for Claude
    const tokenSummary = enriched.map((t: any, i: number) => `
Token ${i+1}: ${t.symbol} (${t.name})
- Address: ${t.address}
- Price: $${t.price}
- Market Cap: $${(t.marketCap/1000).toFixed(0)}K
- Liquidity: $${(t.liquidity/1000).toFixed(0)}K
- 24h Change: ${t.priceChange24h}%
- 1h Change: ${t.priceChange1h || 0}%
- 24h Volume: $${(t.volume24h/1000).toFixed(0)}K
- Buys/Sells 24h: ${t.buys24h || t.buys}/${t.sells24h || t.sells}
- Source: ${t.source}
`).join("\n");

    const prompt = `You are an elite crypto alpha analyst specializing in Base ecosystem degen tokens. Analyze these tokens and identify the TOP 5 with highest potential.

CURRENT BASE ECOSYSTEM TOKENS:
${tokenSummary}

For each of the TOP 5 tokens you select, provide analysis in this EXACT JSON format (respond with JSON array only, no markdown):
[
  {
    "symbol": "TOKEN",
    "address": "0x...",
    "conviction": 8,
    "riskLevel": "degen",
    "entryPrice": 0.0000123,
    "entryNote": "Buy on dip to support",
    "exitTarget": 0.0000250,
    "exitNote": "Take profit at 2x, trailing stop after",
    "onChainEvidence": "Buy/sell ratio 3:1 with $50K volume spike in last hour. Smart money accumulating.",
    "reasoning": "Strong momentum building. Liquidity locked, low market cap with high potential. Whale wallets showing accumulation pattern.",
    "signal": "BUY",
    "priceChange24h": 45.2
  }
]

Rules:
- conviction: 1-10 (10 = highest conviction)
- riskLevel: "safe" | "mid" | "degen" 
- signal: "BUY" | "WATCH" | "AVOID"
- Be specific with on-chain evidence using actual numbers from the data
- entryPrice and exitTarget must be realistic based on current price
- Only include tokens with genuine alpha potential, skip obvious rugs`;

    console.log("Alpha Agent: calling Claude API...");

    // 5. Call Claude API
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      throw new Error(`Claude API error: ${claudeRes.status} — ${err.slice(0,200)}`);
    }

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content?.[0]?.text || "[]";

    console.log("Alpha Agent: Claude response received, parsing...");

    // 6. Parse JSON response
    let signals: any[] = [];
    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      signals = JSON.parse(clean);
    } catch(e) {
      console.error("Parse error:", e);
      // Try to extract JSON array
      const match = rawText.match(/\[[\s\S]*\]/);
      if (match) {
        try { signals = JSON.parse(match[0]); } catch {}
      }
    }

    // 7. Enrich signals with dex urls from enriched tokens
    signals = signals.map((s: any) => {
      const enrichedToken = enriched.find((t: any) => 
        t.address === s.address || t.symbol === s.symbol
      );
      return {
        ...s,
        dexUrl: enrichedToken?.dexUrl || `https://dexscreener.com/base/${s.address}`,
        price: enrichedToken?.price || s.entryPrice,
      };
    });

    console.log(`Alpha Agent: ${signals.length} signals generated`);

    return {
      success: true,
      signals,
      tokenCount: enriched.length,
      generatedAt: Date.now(),
    };
  },
});