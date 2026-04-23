import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { id: v.id("sections") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sections").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    aboutMd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sections", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("sections"),
    name: v.optional(v.string()),
    aboutMd: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const patch = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("sections") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// --- Teachers ---

export const addTeacher = mutation({
  args: {
    sectionId: v.id("sections"),
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sectionTeachers")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
      .filter((q) => q.eq(q.field("teacherId"), args.teacherId))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("sectionTeachers", {
      sectionId: args.sectionId,
      teacherId: args.teacherId,
    });
  },
});

export const removeTeacher = mutation({
  args: {
    sectionId: v.id("sections"),
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("sectionTeachers")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
      .filter((q) => q.eq(q.field("teacherId"), args.teacherId))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});

export const listTeachers = query({
  args: { sectionId: v.id("sections") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("sectionTeachers")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
      .collect();
    return Promise.all(rows.map((r) => ctx.db.get(r.teacherId)));
  },
});

export const listSectionsByTeacher = query({
  args: { teacherId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("sectionTeachers")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();
    return Promise.all(rows.map((r) => ctx.db.get(r.sectionId)));
  },
});

// --- Students ---

export const addStudent = mutation({
  args: {
    sectionId: v.id("sections"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sectionStudents")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
      .filter((q) => q.eq(q.field("studentId"), args.studentId))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("sectionStudents", {
      sectionId: args.sectionId,
      studentId: args.studentId,
    });
  },
});

export const removeStudent = mutation({
  args: {
    sectionId: v.id("sections"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("sectionStudents")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
      .filter((q) => q.eq(q.field("studentId"), args.studentId))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});

export const listStudents = query({
  args: { sectionId: v.id("sections") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("sectionStudents")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId))
      .collect();
    return Promise.all(rows.map((r) => ctx.db.get(r.studentId)));
  },
});

export const listSectionsByStudent = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("sectionStudents")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();
    return Promise.all(rows.map((r) => ctx.db.get(r.sectionId)));
  },
});
