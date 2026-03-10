"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";

const MOLTBOOK_API = "https://www.moltbook.com/api/v1";

async function solveChallenge(challenge: string, dinoikiKey: string): Promise<string> {
  const res = await fetch("https://ai.dinoiki.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${dinoikiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 20,
      messages: [
        { role: "system", content: "Extract the math problem from this obfuscated text and return ONLY the numeric answer with exactly 2 decimal places. Example: '15.00'. Nothing else." },
        { role: "user", content: challenge },
      ],
    }),
  });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() ?? "0.00";
}

async function postToMoltbookRaw(title: string, url: string, description: string, apiKey: string, dinoikiKey: string) {
  const res = await fetch(`${MOLTBOOK_API}/posts`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      submolt_name: "general",
      title,
      url,
      content: description,
      type: "link",
    }),
  });

  const data = await res.json();

  if (data.post?.verification?.verification_code) {
    const answer = await solveChallenge(data.post.verification.challenge_text, dinoikiKey);
    await fetch(`${MOLTBOOK_API}/verify`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        verification_code: data.post.verification.verification_code,
        answer,
      }),
    });
  }

  return { success: true, post: data.post };
}

// Manual post from article reader
export const postArticle = action({
  args: {
    title: v.string(),
    url: v.string(),
    description: v.string(),
  },
  handler: async (_, { title, url, description }) => {
    const apiKey = process.env.MOLTBOOK_API_KEY;
    const dinoikiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("MOLTBOOK_API_KEY not set");
    if (!dinoikiKey) throw new Error("ANTHROPIC_API_KEY not set");
    return await postToMoltbookRaw(title, url, description, apiKey, dinoikiKey);
  },
});

// Auto-post latest article (call this from Convex dashboard scheduler or manually)
export const autoPostLatest = internalAction({
  args: {
    title: v.string(),
    url: v.string(),
    description: v.string(),
  },
  handler: async (_, { title, url, description }) => {
    const apiKey = process.env.MOLTBOOK_API_KEY;
    const dinoikiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("MOLTBOOK_API_KEY not set");
    if (!dinoikiKey) throw new Error("ANTHROPIC_API_KEY not set");
    return await postToMoltbookRaw(title, url, description, apiKey, dinoikiKey);
  },
});

export const checkHome = action({
  args: {},
  handler: async () => {
    const apiKey = process.env.MOLTBOOK_API_KEY;
    if (!apiKey) throw new Error("MOLTBOOK_API_KEY not set");
    const res = await fetch(`${MOLTBOOK_API}/home`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    return await res.json();
  },
});
