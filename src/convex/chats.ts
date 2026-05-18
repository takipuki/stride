import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
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
    const chatId = await ctx.db.insert('chats', { name: args.name, createdAt: Date.now() });
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

export const rename = mutation({
  args: { id: v.id('chats'), name: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const remove = mutation({
  args: { id: v.id('chats') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getOrCreateDirectChat = mutation({
  args: {
    userA: v.id('users'),
    userB: v.id('users'),
  },
  handler: async (ctx, args) => {
    if (args.userA === args.userB) {
      throw new Error('Cannot start a chat with yourself.');
    }

    // Fetch memberships of User A
    const membershipsA = await ctx.db
      .query('chatMembers')
      .withIndex('by_user', (q) => q.eq('userId', args.userA))
      .collect();

    // Fetch memberships of User B
    const membershipsB = await ctx.db
      .query('chatMembers')
      .withIndex('by_user', (q) => q.eq('userId', args.userB))
      .collect();

    // Find if any chatId is in both sets
    const chatIdsA = new Set(membershipsA.map((m) => m.chatId));
    let commonChatId: Id<'chats'> | null = null;

    for (const mB of membershipsB) {
      if (chatIdsA.has(mB.chatId)) {
        // Check if this chat has exactly 2 members (direct message)
        const members = await ctx.db
          .query('chatMembers')
          .withIndex('by_chat', (q) => q.eq('chatId', mB.chatId))
          .collect();
        if (members.length === 2) {
          commonChatId = mB.chatId;
          break;
        }
      }
    }

    if (commonChatId) {
      return commonChatId;
    }

    // Create new chat if not found
    const userADoc = await ctx.db.get(args.userA);
    const userBDoc = await ctx.db.get(args.userB);
    const chatName = `${userADoc?.name || 'User'} & ${userBDoc?.name || 'User'}`;

    const chatId = await ctx.db.insert('chats', { name: chatName, createdAt: Date.now() });
    await ctx.db.insert('chatMembers', { chatId, userId: args.userA, joinedAt: Date.now() });
    await ctx.db.insert('chatMembers', { chatId, userId: args.userB, joinedAt: Date.now() });

    return chatId;
  },
});
