import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    const products = await ctx.db.query("products").order("asc").collect();
    return Promise.all(
      products.map(async (p) => ({
        ...p,
        imageUrl: p.imageStorageId
          ? await ctx.storage.getUrl(p.imageStorageId)
          : null,
      }))
    );
  },
});

export const create = mutation({
  handler: async (ctx) => {
    const last = await ctx.db.query("products").order("desc").take(1);
    const nextNumber = last.length > 0 ? last[0].number + 1 : 1;
    return await ctx.db.insert("products", {
      number: nextNumber,
      marketplaces: [
        { name: "Etsy", details: "", uploaded: false },
        { name: "Redbubble", details: "", uploaded: false },
        { name: "TeePublic", details: "", uploaded: false },
      ],
    });
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) return;
    if (doc.imageStorageId) await ctx.storage.delete(doc.imageStorageId);
    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const setImage = mutation({
  args: { id: v.id("products"), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { imageStorageId: args.storageId });
  },
});

export const deleteImage = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc?.imageStorageId) return;
    await ctx.storage.delete(doc.imageStorageId);
    await ctx.db.patch(args.id, { imageStorageId: undefined });
  },
});

export const updateMarketplaces = mutation({
  args: {
    id: v.id("products"),
    marketplaces: v.array(
      v.object({
        name: v.string(),
        details: v.string(),
        uploaded: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { marketplaces: args.marketplaces });
  },
});
