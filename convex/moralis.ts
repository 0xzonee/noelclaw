"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const CA = "0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3";
const CHAIN = "base";

export const getTokenHolders = action({
  args: {},
  handler: async () => {
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) throw new Error("MORALIS_API_KEY not set");

    const res = await fetch(
      `https://deep-index.moralis.io/api/v2.2/erc20/${CA}/owners?chain=${CHAIN}&order=DESC&limit=20`,
      {
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) throw new Error(`Moralis holders error: ${res.status}`);
    const data = await res.json();

    const holders = (data.result || []).map((h: any) => ({
      address: h.owner_address,
      balance: h.balance_formatted,
      percentOwned: h.percentage_relative_to_total_supply,
      usdValue: h.usd_value ?? null,
    }));

    return {
      success: true,
      totalHolders: data.total_count ?? null,
      topHolders: holders,
      fetchedAt: Date.now(),
    };
  },
});

export const getTokenTransfers = action({
  args: { limit: v.optional(v.number()) },
  handler: async (_, { limit = 20 }) => {
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) throw new Error("MORALIS_API_KEY not set");

    const res = await fetch(
      `https://deep-index.moralis.io/api/v2.2/erc20/${CA}/transfers?chain=${CHAIN}&order=DESC&limit=${limit}`,
      {
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) throw new Error(`Moralis transfers error: ${res.status}`);
    const data = await res.json();

    const transfers = (data.result || []).map((t: any) => ({
      from: t.from_address,
      to: t.to_address,
      value: t.value_decimal,
      txHash: t.transaction_hash,
      blockTimestamp: t.block_timestamp,
    }));

    return {
      success: true,
      transfers,
      fetchedAt: Date.now(),
    };
  },
});

export const getWalletStats = action({
  args: { address: v.string() },
  handler: async (_, { address }) => {
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) throw new Error("MORALIS_API_KEY not set");

    const [netWorthRes, activityRes] = await Promise.all([
      fetch(
        `https://deep-index.moralis.io/api/v2.2/wallets/${address}/net-worth?chains%5B0%5D=${CHAIN}&exclude_spam=true`,
        { headers: { "X-API-Key": apiKey } }
      ),
      fetch(
        `https://deep-index.moralis.io/api/v2.2/wallets/${address}/activity?chain=${CHAIN}`,
        { headers: { "X-API-Key": apiKey } }
      ),
    ]);

    if (!netWorthRes.ok) throw new Error(`Moralis net worth error: ${netWorthRes.status}`);
    const netWorth = await netWorthRes.json();

    let activity = null;
    if (activityRes.ok) {
      activity = await activityRes.json();
    }

    return {
      success: true,
      address,
      netWorthUsd: netWorth.total_networth_usd ?? null,
      chains: netWorth.chains ?? [],
      lastActivity: activity?.last_transaction?.block_timestamp ?? null,
      fetchedAt: Date.now(),
    };
  },
});
