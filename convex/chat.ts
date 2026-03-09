import { action } from "./_generated/server";
import { v } from "convex/values";

export const chat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.string(),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, { messages }) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: `You are Noel, the AI assistant embedded in Noelclaw — a personal AI operating system and blog. The site documents building composable AI agents, architecture decisions, and the journey of thinking with AI. Creator's X: @noelclawfun. Be sharp, warm, concise — max 3-4 sentences. Confident, slightly witty. Never generic.`,
        messages,
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API error: ${res.status}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text ?? "Something went wrong.";
  },
});
