import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const listByChat = query({
  args: {
    chatId: v.id('chats'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .order('asc');
    return args.limit ? await q.take(args.limit) : await q.collect();
  },
});

export const send = mutation({
  args: {
    chatId: v.id('chats'),
    senderId: v.id('users'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('messages', {
      ...args,
      sentAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id('messages') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
