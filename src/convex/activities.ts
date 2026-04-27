import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const get = query({
  args: { id: v.id('activities') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listBySection = query({
  args: { sectionId: v.id('sections') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('activities')
      .withIndex('by_section', (q) => q.eq('sectionId', args.sectionId))
      .collect();
  },
});

export const create = mutation({
  args: {
    sectionId: v.id('sections'),
    title: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    type: v.union(v.literal('exam'), v.literal('class')),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert('activities', { ...args, createdAt: now, updatedAt: now });
  },
});

export const update = mutation({
  args: {
    id: v.id('activities'),
    title: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    type: v.optional(v.union(v.literal('exam'), v.literal('class'))),
  },
  handler: async (ctx, { id, ...fields }) => {
    const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id('activities') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// --- Activity Problems ---

export const addProblem = mutation({
  args: {
    activityId: v.id('activities'),
    problemId: v.id('problems'),
    problemOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('activityProblems')
      .withIndex('by_activity', (q) => q.eq('activityId', args.activityId))
      .filter((q) => q.eq(q.field('problemId'), args.problemId))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert('activityProblems', { ...args, createdAt: Date.now() });
  },
});

export const removeProblem = mutation({
  args: {
    activityId: v.id('activities'),
    problemId: v.id('problems'),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('activityProblems')
      .withIndex('by_activity', (q) => q.eq('activityId', args.activityId))
      .filter((q) => q.eq(q.field('problemId'), args.problemId))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});

export const reorderProblem = mutation({
  args: {
    activityId: v.id('activities'),
    problemId: v.id('problems'),
    problemOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('activityProblems')
      .withIndex('by_activity', (q) => q.eq('activityId', args.activityId))
      .filter((q) => q.eq(q.field('problemId'), args.problemId))
      .first();
    if (!row) throw new Error('Activity problem not found');
    await ctx.db.patch(row._id, { problemOrder: args.problemOrder });
  },
});

export const listProblems = query({
  args: { activityId: v.id('activities') },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('activityProblems')
      .withIndex('by_activity', (q) => q.eq('activityId', args.activityId))
      .collect();
    const sorted = rows.sort((a, b) => a.problemOrder - b.problemOrder);
    return Promise.all(
      sorted.map(async (r) => ({
        ...r,
        problem: await ctx.db.get(r.problemId),
      })),
    );
  },
});
