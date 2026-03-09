import { query } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("articles")
      .withIndex("by_order")
      .filter((q) => q.eq(q.field("published"), true))
      .collect();
  },
});
