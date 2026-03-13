"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const NOELCLAW_CA = "0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3";
const REQUIRED_BALANCE = 20_000_000; // 20M tokens

export const verifyHolder = action({
  args: { walletAddress: v.string() },
  handler: async (_, { walletAddress }) => {
    // Check token balance via DexScreener / direct RPC
    // Using Moralis to get wallet token balance on Base
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) throw new Error("MORALIS_API_KEY not set");

    const res = await fetch(
      `https://deep-index.moralis.io/api/v2.2/${walletAddress}/erc20?chain=base&token_addresses%5B0%5D=${NOELCLAW_CA}`,
      {
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) throw new Error(`Moralis balance error: ${res.status}`);
    const data = await res.json();

    const tokenInfo = data?.[0];
    const rawBalance = parseFloat(tokenInfo?.balance || "0");
    const decimals = parseInt(tokenInfo?.decimals || "18");
    const balance = rawBalance / Math.pow(10, decimals);
    const isHolder = balance >= REQUIRED_BALANCE;

    return {
      success: true,
      address: walletAddress,
      balance,
      balanceFormatted: balance.toLocaleString(),
      isHolder,
      requiredBalance: REQUIRED_BALANCE,
      tier: balance >= REQUIRED_BALANCE ? "premium" : "free",
    };
  },
});
