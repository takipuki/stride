import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const get = query({
  args: { id: v.id('comments') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Top-level comments on a post (no parent)
export const listByPost = query({
  args: { postId: v.id('posts') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('comments')
      .withIndex('by_post', (q) => q.eq('postId', args.postId))
      .filter((q) => q.eq(q.field('parentCommentId'), undefined))
      .collect();
  },
});

// Replies to a comment
export const listReplies = query({
  args: { parentCommentId: v.id('comments') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('comments')
      .withIndex('by_parent', (q) => q.eq('parentCommentId', args.parentCommentId))
      .collect();
  },
});

export const create = mutation({
  args: {
    authorId: v.id('users'),
    postId: v.id('posts'),
    content: v.string(),
    parentCommentId: v.optional(v.id('comments')),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('comments', args);
  },
});

export const update = mutation({
  args: {
    id: v.id('comments'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { content: args.content });
  },
});

export const remove = mutation({
  args: { id: v.id('comments') },
  handler: async (ctx, args) => {
    // Recursively delete replies first
    const replies = await ctx.db
      .query('comments')
      .withIndex('by_parent', (q) => q.eq('parentCommentId', args.id))
      .collect();
    await Promise.all(replies.map((r) => ctx.db.delete(r._id)));
    await ctx.db.delete(args.id);
  },
});
