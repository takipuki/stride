import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const get = query({
  args: { id: v.id('posts') },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) return null;
    const postTags = await ctx.db
      .query('postTags')
      .withIndex('by_post', (q) => q.eq('postId', args.id))
      .collect();
    const tags = await Promise.all(postTags.map((pt) => ctx.db.get(pt.tagId)));
    return { ...post, tags };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('posts').order('desc').collect();
  },
});

export const listByAuthor = query({
  args: { authorId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('posts')
      .withIndex('by_author', (q) => q.eq('authorId', args.authorId))
      .order('desc')
      .collect();
  },
});

export const listByTag = query({
  args: { tagId: v.id('tags') },
  handler: async (ctx, args) => {
    const postTags = await ctx.db
      .query('postTags')
      .withIndex('by_tag', (q) => q.eq('tagId', args.tagId))
      .collect();
    return Promise.all(postTags.map((pt) => ctx.db.get(pt.postId)));
  },
});

export const create = mutation({
  args: {
    authorId: v.id('users'),
    contentMd: v.string(),
    tagIds: v.optional(v.array(v.id('tags'))),
  },
  handler: async (ctx, { tagIds, ...args }) => {
    const postId = await ctx.db.insert('posts', args);
    if (tagIds?.length) {
      await Promise.all(tagIds.map((tagId) => ctx.db.insert('postTags', { postId, tagId })));
    }
    return postId;
  },
});

export const update = mutation({
  args: {
    id: v.id('posts'),
    contentMd: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id('posts') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// --- Tags ---

export const createTag = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('tags')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert('tags', { name: args.name });
  },
});

export const listTags = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('tags').collect();
  },
});

export const addTag = mutation({
  args: {
    postId: v.id('posts'),
    tagId: v.id('tags'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('postTags')
      .withIndex('by_post', (q) => q.eq('postId', args.postId))
      .filter((q) => q.eq(q.field('tagId'), args.tagId))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert('postTags', args);
  },
});

export const removeTag = mutation({
  args: {
    postId: v.id('posts'),
    tagId: v.id('tags'),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('postTags')
      .withIndex('by_post', (q) => q.eq('postId', args.postId))
      .filter((q) => q.eq(q.field('tagId'), args.tagId))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});
