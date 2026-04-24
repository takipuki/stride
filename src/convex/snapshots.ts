import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

// Latest snapshot for a student on a problem in an activity
export const getLatest = query({
  args: {
    authorId: v.id('users'),
    activityId: v.id('activities'),
    problemId: v.id('problems'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('snapshots')
      .withIndex('by_author_activity_problem', (q) =>
        q.eq('authorId', args.authorId).eq('activityId', args.activityId).eq('problemId', args.problemId),
      )
      .order('desc')
      .first();
  },
});

// All snapshots for a student on a problem — history/replay
export const listByAuthor = query({
  args: {
    authorId: v.id('users'),
    activityId: v.id('activities'),
    problemId: v.id('problems'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('snapshots')
      .withIndex('by_author_activity_problem', (q) =>
        q.eq('authorId', args.authorId).eq('activityId', args.activityId).eq('problemId', args.problemId),
      )
      .order('asc')
      .collect();
  },
});

// All snapshots for a problem in an activity (teacher view)
export const listByActivityProblem = query({
  args: {
    activityId: v.id('activities'),
    problemId: v.id('problems'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('snapshots')
      .withIndex('by_activity_problem', (q) => q.eq('activityId', args.activityId).eq('problemId', args.problemId))
      .collect();
  },
});

export const save = mutation({
  args: {
    authorId: v.id('users'),
    problemId: v.id('problems'),
    activityId: v.id('activities'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('snapshots', {
      ...args,
      timestamp: Date.now(),
    });
  },
});
