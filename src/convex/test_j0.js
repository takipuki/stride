import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('submissions').order('desc').collect();
  },
});

export const add = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert('submissions', { token: args.token });
  },
});
