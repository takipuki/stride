import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const get = query({
  args: { id: v.id('problems') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('problems').collect();
  },
});

export const listByCreator = query({
  args: { createdBy: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('problems')
      .withIndex('by_creator', (q) => q.eq('createdBy', args.createdBy))
      .collect();
  },
});

export const create = mutation({
  args: {
    createdBy: v.id('users'),
    title: v.string(),
    contentMd: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert('problems', { ...args, createdAt: now, updatedAt: now });
  },
});

export const update = mutation({
  args: {
    id: v.id('problems'),
    title: v.optional(v.string()),
    contentMd: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id('problems') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// --- Problem I/O ---

export const addIO = mutation({
  args: {
    problemId: v.id('problems'),
    inputData: v.string(),
    outputData: v.string(),
    ioOrder: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('problemIos', args);
  },
});

export const updateIO = mutation({
  args: {
    id: v.id('problemIos'),
    inputData: v.optional(v.string()),
    outputData: v.optional(v.string()),
    ioOrder: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const removeIO = mutation({
  args: { id: v.id('problemIos') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const listIO = query({
  args: { problemId: v.id('problems') },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('problemIos')
      .withIndex('by_problem', (q) => q.eq('problemId', args.problemId))
      .collect();
    return rows.sort((a, b) => a.ioOrder - b.ioOrder);
  },
});
