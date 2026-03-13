"use node";

import { action } from "./_generated/server";

const CA   = "0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3";
const PAIR = "0x9eebf6143b61a651ae4b1c9c57257510d0feb4743550fefbb9470898e5e26ac7";
const DEX  = "https://api.dexscreener.com";
const GT   = "https://api.geckoterminal.com/api/v2";

// ── Token price & stats from DexScreener ──────────────────────────────────
export const getTokenPrice = action({
  args: {},
  handler: async () => {
    const res  = await fetch(`${DEX}/tokens/v1/base/${CA}`);
    const data = await res.json();
    const pairs = Array.isArray(data) ? data : data.pairs;
    const pair  = pairs?.[0];
    if (!pair) throw new Error("No pair found");
    return {
      success: true,
      price:          pair.priceUsd,
      priceChange24h: pair.priceChange?.h24,
      priceChange1h:  pair.priceChange?.h1,
      priceChange6h:  pair.priceChange?.h6,
      volume24h:      pair.volume?.h24,
      volume6h:       pair.volume?.h6,
      volume1h:       pair.volume?.h1,
      marketCap:      pair.marketCap || pair.fdv,
      fdv:            pair.fdv,
      liquidity:      pair.liquidity?.usd,
      txns24h:        (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
      buys24h:        pair.txns?.h24?.buys,
      sells24h:       pair.txns?.h24?.sells,
      buys1h:         pair.txns?.h1?.buys,
      sells1h:        pair.txns?.h1?.sells,
      buys5m:         pair.txns?.m5?.buys,
      sells5m:        pair.txns?.m5?.sells,
      pairAddress:    pair.pairAddress,
    };
  },
});

// ── Real trades from GeckoTerminal ────────────────────────────────────────
export const getRecentTrades = action({
  args: {},
  handler: async () => {
    const [tradesRes, statsRes] = await Promise.all([
      fetch(
        `${GT}/networks/base/pools/${PAIR}/trades?trade_volume_in_usd_greater_than=0`,
        { headers: { "Accept": "application/json;version=20230302" } }
      ),
      fetch(`${DEX}/tokens/v1/base/${CA}`),
    ]);

    if (!tradesRes.ok) throw new Error(`GeckoTerminal error: ${tradesRes.status}`);

    const tradeData = await tradesRes.json();

    // Get current $NOELCLAW price from DexScreener for reference
    let currentPrice = 0;
    if (statsRes.ok) {
      const sd = await statsRes.json();
      const pair = Array.isArray(sd) ? sd[0] : sd.pairs?.[0];
      currentPrice = parseFloat(pair?.priceUsd || 0);
    }

    const trades = (tradeData.data || []).slice(0, 20).map((t: any) => {
      const a = t.attributes || {};
      const isBuy = a.kind === "buy";

      // price_from_in_usd = price of token being sold
      // price_to_in_usd   = price of token being bought
      // For a BUY of $NOELCLAW: user sells USDC/ETH to get NOELCLAW
      //   -> price_to_in_usd = price of NOELCLAW ✓
      // For a SELL of $NOELCLAW: user sells NOELCLAW to get USDC/ETH
      //   -> price_from_in_usd = price of NOELCLAW ✓
      const rawPriceTo   = parseFloat(a.price_to_in_usd   || 0);
      const rawPriceFrom = parseFloat(a.price_from_in_usd || 0);

      // Pick the smaller price — $NOELCLAW is micro-cap so price << $1
      // ETH/USDC prices are always >> $1
      let priceUsd = 0;
      if (isBuy) {
        priceUsd = rawPriceTo < 1 ? rawPriceTo : rawPriceFrom < 1 ? rawPriceFrom : currentPrice;
      } else {
        priceUsd = rawPriceFrom < 1 ? rawPriceFrom : rawPriceTo < 1 ? rawPriceTo : currentPrice;
      }
      // Final fallback to current price
      if (priceUsd === 0) priceUsd = currentPrice;

      return {
        type:      isBuy ? "buy" : "sell",
        amountUsd: parseFloat(a.volume_in_usd || 0).toFixed(2),
        priceUsd,
        timestamp: a.block_timestamp ? new Date(a.block_timestamp).getTime() : Date.now(),
        txHash:    a.tx_hash || null,
        maker:     null,
      };
    });

    // Get txn counts from DexScreener pair endpoint
    let txStats: any = {};
    try {
      const pairRes = await fetch(`${DEX}/dex/pairs/base/${PAIR}`);
      if (pairRes.ok) {
        const pd = await pairRes.json();
        const pair = pd.pair || pd.pairs?.[0];
        txStats = {
          buys5m:    pair?.txns?.m5?.buys   || 0,
          sells5m:   pair?.txns?.m5?.sells  || 0,
          buys1h:    pair?.txns?.h1?.buys   || 0,
          sells1h:   pair?.txns?.h1?.sells  || 0,
          buys24h:   pair?.txns?.h24?.buys  || 0,
          sells24h:  pair?.txns?.h24?.sells || 0,
          volume24h: pair?.volume?.h24      || 0,
        };
      }
    } catch {}

    return { success: true, trades, ...txStats };
  },
});

// ── Trending tokens on Base ───────────────────────────────────────────────
export const getTrendingBase = action({
  args: {},
  handler: async () => {
    const [boostRes, profileRes] = await Promise.all([
      fetch(`${DEX}/token-boosts/top/v1`),
      fetch(`${DEX}/token-profiles/latest/v1`),
    ]);

    let boosted:  any[] = [];
    let trending: any[] = [];

    if (boostRes.ok) {
      const bd = await boostRes.json();
      boosted = (Array.isArray(bd) ? bd : [])
        .filter((t: any) => t.chainId === "base")
        .slice(0, 8)
        .map((t: any) => ({
          address:     t.tokenAddress,
          amount:      t.amount,
          totalAmount: t.totalAmount,
          url:         t.url,
          description: t.description,
        }));
    }

    if (profileRes.ok) {
      const td = await profileRes.json();
      trending = (Array.isArray(td) ? td : [])
        .filter((t: any) => t.chainId === "base")
        .slice(0, 6)
        .map((t: any) => ({
          address: t.tokenAddress,
          name:    t.description || t.tokenAddress?.slice(0, 8),
          url:     t.url,
          icon:    t.icon,
        }));
    }

    return { success: true, boosted, trending };
  },
});

// ── OHLCV candlestick (bonus) ─────────────────────────────────────────────
export const getOHLCV = action({
  args: {},
  handler: async () => {
    const res = await fetch(
      `${GT}/networks/base/pools/${PAIR}/ohlcv/hour?limit=24&currency=usd`,
      { headers: { "Accept": "application/json;version=20230302" } }
    );
    if (!res.ok) throw new Error(`OHLCV error: ${res.status}`);
    const data = await res.json();
    const candles = (data.data?.attributes?.ohlcv_list || []).map((c: any) => ({
      time:   c[0] * 1000,
      open:   c[1],
      high:   c[2],
      low:    c[3],
      close:  c[4],
      volume: c[5],
    }));
    return { success: true, candles };
  },
});