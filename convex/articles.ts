import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("articles")
      .withIndex("by_order")
      .filter((q) => q.eq(q.field("published"), true))
      .collect();
  },
});

// Call this from Convex dashboard to manually trigger post to Moltbook
export const triggerMoltbookPost = mutation({
  args: {
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, { title, description }) => {
    await ctx.scheduler.runAfter(0, internal.moltbook.autoPostLatest, {
      title,
      url: "https://noelclaw.fun",
      description,
    });
    return { scheduled: true };
  },
});
