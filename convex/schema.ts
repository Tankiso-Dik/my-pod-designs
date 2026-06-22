import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    number: v.number(),
    imageStorageId: v.optional(v.id("_storage")),
    marketplaces: v.array(
      v.object({
        name: v.string(),
        details: v.string(),
        uploaded: v.boolean(),
      })
    ),
  }),
});
