"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const BANKR_API = "https://api.bankr.bot";
const CA = "0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3";

export const getTokenPrice = action({
  args: {},
  handler: async () => {
    const apiKey = process.env.BANKR_API_KEY;
    if (!apiKey) throw new Error("BANKR_API_KEY not set");

    // Submit job
    const jobRes = await fetch(`${BANKR_API}/agent/prompt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt: `Get token info for contract address ${CA} on Base chain. Return price in USD, market cap, 24h volume, and 24h price change percentage.`,
        read_only: true,
      }),
    });

    const jobData = await jobRes.json();
    const jobId = jobData.jobId;
    if (!jobId) throw new Error("No jobId returned");

    // Poll until complete (max 10s)
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 1000));
      
      const pollRes = await fetch(`${BANKR_API}/agent/job/${jobId}`, {
        headers: { "x-api-key": apiKey },
      });
      const pollData = await pollRes.json();

      if (pollData.status === "completed") {
        return { success: true, result: pollData.result };
      }
      if (pollData.status === "failed") {
        throw new Error("Job failed: " + pollData.error);
      }
    }

    throw new Error("Timeout waiting for Bankr response");
  },
});
