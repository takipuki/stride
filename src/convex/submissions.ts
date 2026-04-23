import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { id: v.id("submissions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// All submissions for an activity (teacher/admin view)
export const listByActivity = query({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("submissions")
      .withIndex("by_activity", (q) => q.eq("activityId", args.activityId))
      .collect();
  },
});

// All submissions for a specific problem in an activity
export const listByActivityProblem = query({
  args: {
    activityId: v.id("activities"),
    problemId: v.id("problems"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("submissions")
      .withIndex("by_activity_problem", (q) =>
        q.eq("activityId", args.activityId).eq("problemId", args.problemId)
      )
      .collect();
  },
});

// One student's submissions for a problem in an activity
export const listByAuthor = query({
  args: {
    authorId: v.id("users"),
    activityId: v.id("activities"),
    problemId: v.id("problems"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("submissions")
      .withIndex("by_author_activity_problem", (q) =>
        q
          .eq("authorId", args.authorId)
          .eq("activityId", args.activityId)
          .eq("problemId", args.problemId)
      )
      .order("desc")
      .collect();
  },
});

// Latest submission per student per problem — scoreboard use
export const latestByActivityProblem = query({
  args: {
    activityId: v.id("activities"),
    problemId: v.id("problems"),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("submissions")
      .withIndex("by_activity_problem", (q) =>
        q.eq("activityId", args.activityId).eq("problemId", args.problemId)
      )
      .collect();

    // Keep latest per author
    const latestMap = new Map<string, typeof all[number]>();
    for (const sub of all) {
      const key = sub.authorId;
      const existing = latestMap.get(key);
      if (!existing || sub.submittedAt > existing.submittedAt) {
        latestMap.set(key, sub);
      }
    }
    return Array.from(latestMap.values());
  },
});

export const submit = mutation({
  args: {
    authorId: v.id("users"),
    problemId: v.id("problems"),
    activityId: v.id("activities"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("submissions", {
      ...args,
      submittedAt: Date.now(),
      judgeVerdict: undefined,
    });
  },
});

// Judge updates verdict after evaluation
export const setVerdict = mutation({
  args: {
    id: v.id("submissions"),
    judgeVerdict: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { judgeVerdict: args.judgeVerdict });
  },
});
