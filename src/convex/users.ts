import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByRole = query({
  args: {
    role: v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), args.role))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
    aboutMd: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", args);
  },
});

export const updateProfile = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    aboutMd: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const patch = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, patch);
  },
});

export const updatePassword = mutation({
  args: {
    id: v.id("users"),
    passwordHash: v.string(),
  },
  handler: async (ctx, { id, passwordHash }) => {
    await ctx.db.patch(id, { passwordHash });
  },
});

export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
