import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  articles: defineTable({
    n: v.string(),           // article number e.g. "01"
    title: v.string(),
    desc: v.string(),        // short description shown in list
    date: v.string(),        // e.g. "Mar 2026"
    read: v.string(),        // e.g. "8 min"
    tags: v.array(
      v.object({
        k: v.string(),       // tag key e.g. "ai"
        c: v.string(),       // tag color class e.g. "t-ai"
      })
    ),
    body: v.array(
      v.object({
        type: v.string(),    // "h2", "h3", "p", "bq"
        text: v.string(),
      })
    ),
    published: v.boolean(),  // true = visible, false = draft
    order: v.number(),       // for sorting
  }).index("by_order", ["order"]),
});
