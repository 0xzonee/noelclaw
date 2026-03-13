"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

export const runAgent = action({
  args: {
    task: v.string(),
    context: v.optional(v.string()),
  },
  handler: async (_, { task, context }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const systemPrompt = `You are an autonomous AI agent running inside NoelClaw — a personal AI operating system.

Your job is to analyze tasks, reason step by step, and produce structured output.

CAPABILITIES:
- Analyze crypto/AI market trends
- Summarize on-chain data
- Generate research reports
- Answer technical questions about AI agents, Convex, React

OUTPUT FORMAT:
Always respond with valid JSON:
{
  "thought": "brief reasoning",
  "action": "what you're doing",
  "result": "main output text",
  "confidence": 0.0-1.0,
  "sources": ["optional source list"]
}

${context ? `CONTEXT:\n${context}` : ""}`;

    const response = await fetch("https://ai.dinoiki.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 800,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: task },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Agent API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const raw = data.choices[0].message.content;

    // Parse JSON response from agent
    try {
      const parsed = JSON.parse(raw);
      return {
        success: true,
        ...parsed,
        rawResponse: raw,
        executedAt: Date.now(),
      };
    } catch {
      // fallback if model doesn't return valid JSON
      return {
        success: true,
        thought: "Processing complete",
        action: "direct_response",
        result: raw,
        confidence: 0.8,
        sources: [],
        rawResponse: raw,
        executedAt: Date.now(),
      };
    }
  },
});

export const runMarketAnalysis = action({
  args: {
    tokenData: v.string(),
    question: v.optional(v.string()),
  },
  handler: async (_, { tokenData, question }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const prompt = question
      ? `Analyze this market data and answer: "${question}"\n\nDATA:\n${tokenData}`
      : `Analyze this market data and provide key insights:\n\nDATA:\n${tokenData}`;

    const response = await fetch("https://ai.dinoiki.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 600,
        messages: [
          {
            role: "system",
            content:
              "You are a crypto/AI market analyst. Be concise, data-driven, and highlight key signals. Max 3-4 bullet points.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Market analysis error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return {
      success: true,
      analysis: data.choices[0].message.content,
      analyzedAt: Date.now(),
    };
  },
});
