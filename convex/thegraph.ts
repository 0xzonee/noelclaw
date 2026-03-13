"use node";

import { action } from "./_generated/server";

const CA = "0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3";

function getGraphUrl() {
  const key = process.env.THEGRAPH_API_KEY;
  if (!key) throw new Error("THEGRAPH_API_KEY not set");
  return `https://gateway.thegraph.com/api/${key}/subgraphs/id/GqzP4Xaehti8KSfQmv3ZctFSjnSUYZ4En5NRsiTbvZpz`;
}

async function queryGraph(query: string) {
  const url = getGraphUrl();
  const key = process.env.THEGRAPH_API_KEY!;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`Graph error: ${res.status}`);
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0]?.message || "Graph query error");
  return data.data;
}

// ── Token swaps / trade history ───────────────────────────────────────────
export const getTokenSwaps = action({
  args: {},
  handler: async () => {
    const query = `{
      swaps(
        first: 20
        orderBy: timestamp
        orderDirection: desc
        where: { token0: "${CA.toLowerCase()}" }
      ) {
        id
        timestamp
        amount0
        amount1
        amountUSD
        sender
        recipient
        transaction { id }
      }
    }`;
    try {
      const data = await queryGraph(query);
      const swaps = (data.swaps || []).map((s: any) => ({
        txHash:    s.transaction?.id,
        timestamp: parseInt(s.timestamp) * 1000,
        amountUSD: parseFloat(s.amountUSD || 0).toFixed(2),
        amount0:   parseFloat(s.amount0 || 0),
        amount1:   parseFloat(s.amount1 || 0),
        type:      parseFloat(s.amount0) > 0 ? "sell" : "buy",
        sender:    s.sender,
        recipient: s.recipient,
      }));
      return { success: true, swaps };
    } catch (e: any) {
      return { success: false, swaps: [], error: e.message };
    }
  },
});

// ── Pool liquidity & volume ───────────────────────────────────────────────
export const getPoolStats = action({
  args: {},
  handler: async () => {
    const query = `{
      pools(
        first: 3
        orderBy: totalValueLockedUSD
        orderDirection: desc
        where: { token0: "${CA.toLowerCase()}" }
      ) {
        id
        token0 { symbol }
        token1 { symbol }
        feeTier
        totalValueLockedUSD
        volumeUSD
        txCount
        token1Price
      }
    }`;
    try {
      const data = await queryGraph(query);
      const pools = (data.pools || []).map((p: any) => ({
        poolId:    p.id,
        pair:      `${p.token0?.symbol}/${p.token1?.symbol}`,
        feeTier:   parseInt(p.feeTier) / 10000 + "%",
        tvlUSD:    parseFloat(p.totalValueLockedUSD || 0).toFixed(2),
        volumeUSD: parseFloat(p.volumeUSD || 0).toFixed(2),
        txCount:   parseInt(p.txCount || 0),
        price:     parseFloat(p.token1Price || 0),
      }));
      return { success: true, pools };
    } catch (e: any) {
      return { success: false, pools: [], error: e.message };
    }
  },
});

// ── Daily price & volume history (14 days) ────────────────────────────────
export const getTokenDayData = action({
  args: {},
  handler: async () => {
    const query = `{
      tokenDayDatas(
        first: 14
        orderBy: date
        orderDirection: desc
        where: { token: "${CA.toLowerCase()}" }
      ) {
        date
        priceUSD
        volumeUSD
        totalValueLockedUSD
        open
        high
        low
        close
      }
    }`;
    try {
      const data = await queryGraph(query);
      const dayData = (data.tokenDayDatas || []).map((d: any) => ({
        date:      new Date(parseInt(d.date) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        timestamp: parseInt(d.date) * 1000,
        priceUSD:  parseFloat(d.priceUSD || 0),
        volumeUSD: parseFloat(d.volumeUSD || 0),
        tvl:       parseFloat(d.totalValueLockedUSD || 0),
        open:      parseFloat(d.open || 0),
        high:      parseFloat(d.high || 0),
        low:       parseFloat(d.low || 0),
        close:     parseFloat(d.close || 0),
      })).reverse();
      return { success: true, dayData };
    } catch (e: any) {
      return { success: false, dayData: [], error: e.message };
    }
  },
});