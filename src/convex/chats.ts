import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const get = query({
  args: { id: v.id('chats') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query('chatMembers')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();
    return Promise.all(memberships.map((m) => ctx.db.get(m.chatId)));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    memberIds: v.array(v.id('users')),
  },
  handler: async (ctx, args) => {
    const chatId = await ctx.db.insert('chats', { name: args.name });
    await Promise.all(
      args.memberIds.map((userId) => ctx.db.insert('chatMembers', { chatId, userId, joinedAt: Date.now() })),
    );
    return chatId;
  },
});

export const addMember = mutation({
  args: {
    chatId: v.id('chats'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('chatMembers')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert('chatMembers', {
      chatId: args.chatId,
      userId: args.userId,
      joinedAt: Date.now(),
    });
  },
});

export const removeMember = mutation({
  args: {
    chatId: v.id('chats'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('chatMembers')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});

export const listMembers = query({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('chatMembers')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .collect();
    return Promise.all(rows.map((r) => ctx.db.get(r.userId)));
  },
});

export const remove = mutation({
  args: { id: v.id('chats') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
