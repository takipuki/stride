import type { Id, TableNames } from './_generated/dataModel';
import { internalMutation } from './_generated/server';

// --- CONFIGURATION ---

const TABLES = [
  'users',
  'sections',
  'sectionTeachers',
  'sectionStudents',
  'activities',
  'problems',
  'activityProblems',
  'problemIos',
  'snapshots',
  'submissions',
  'chats',
  'chatMembers',
  'messages',
  'posts',
  'tags',
  'postTags',
  'comments',
] as const;

// --- SEED DATA ---

const USERS = [
  {
    name: 'Admin User',
    email: 'admin@stride.edu',
    passwordHash: 'pass',
    role: 'admin' as const,
  },
  {
    name: 'Dr. Smith',
    email: 'smith@stride.edu',
    passwordHash: 'pass',
    role: 'teacher' as const,
  },
  {
    name: 'Jane Doe',
    email: 'jane@stride.edu',
    passwordHash: 'pass',
    role: 'student' as const,
  },
];

const SECTIONS = [
  { name: 'Computer Science 101', aboutMd: 'Introductory course to programming.' },
  { name: 'Advanced Algorithms', aboutMd: 'Deep dive into complex data structures.' },
];

const SECTION_TEACHERS = [
  { sectionIndex: 0, teacherIndex: 1 }, // Dr. Smith teaches CS101
];

const SECTION_STUDENTS = [
  { sectionIndex: 0, studentIndex: 2 }, // Jane Doe is in CS101
];

const ACTIVITIES = [
  {
    sectionIndex: 0,
    title: 'Midterm Exam',
    type: 'exam' as const,
    startTime: Date.now() + 86400000,
    endTime: Date.now() + 90000000,
  },
];

const PROBLEMS = [
  {
    creatorIndex: 1,
    title: 'Hello World',
    contentMd: 'Write a program that prints "Hello World".',
  },
];

const PROBLEM_IOS = [{ problemIndex: 0, inputData: '', outputData: 'Hello World', ioOrder: 0 }];

const ACTIVITY_PROBLEMS = [{ activityIndex: 0, problemIndex: 0, problemOrder: 0 }];

const TAGS = [{ name: 'programming' }, { name: 'intro' }];

const POSTS = [{ authorIndex: 1, contentMd: 'Welcome to the new semester!' }];

const POST_TAGS = [
  { postIndex: 0, tagIndex: 0 },
  { postIndex: 0, tagIndex: 1 },
];

const COMMENTS = [{ authorIndex: 2, postIndex: 0, content: 'Looking forward to it!', parentCommentIndex: null }];

const CHATS = [{ name: 'General Support' }];

const CHAT_MEMBERS = [
  { chatIndex: 0, userIndex: 0 },
  { chatIndex: 0, userIndex: 2 },
];

const MESSAGES = [{ chatIndex: 0, senderIndex: 0, content: 'Welcome to Stride! How can I help you today?' }];

// --- SEEDING LOGIC ---

export default internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // 1. WIPE EVERYTHING
    console.log('Wiping existing data...');
    for (const table of TABLES) {
      const docs = await ctx.db.query(table as TableNames).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }

    // 2. SEED USERS
    const userIds: Id<'users'>[] = [];
    for (const u of USERS) {
      const userId = await ctx.db.insert('users', { ...u, createdAt: now, updatedAt: now });
      userIds.push(userId);
    }

    // 3. SEED SECTIONS
    const sectionIds: Id<'sections'>[] = [];
    for (const s of SECTIONS) {
      const sectionId = await ctx.db.insert('sections', { ...s, createdAt: now, updatedAt: now });
      sectionIds.push(sectionId);
    }

    // 4. JOIN TEACHERS & STUDENTS
    for (const st of SECTION_TEACHERS) {
      await ctx.db.insert('sectionTeachers', {
        sectionId: sectionIds[st.sectionIndex],
        teacherId: userIds[st.teacherIndex],
        createdAt: now,
      });
    }
    for (const ss of SECTION_STUDENTS) {
      await ctx.db.insert('sectionStudents', {
        sectionId: sectionIds[ss.sectionIndex],
        studentId: userIds[ss.studentIndex],
        createdAt: now,
      });
    }

    // 5. SEED ACTIVITIES
    const activityIds: Id<'activities'>[] = [];
    for (const a of ACTIVITIES) {
      const { sectionIndex, ...fields } = a;
      const activityId = await ctx.db.insert('activities', {
        ...fields,
        sectionId: sectionIds[sectionIndex],
        createdAt: now,
        updatedAt: now,
      });
      activityIds.push(activityId);
    }

    // 6. SEED PROBLEMS & TEST CASES
    const problemIds: Id<'problems'>[] = [];
    for (const p of PROBLEMS) {
      const { creatorIndex, ...fields } = p;
      const problemId = await ctx.db.insert('problems', {
        ...fields,
        createdBy: userIds[creatorIndex],
        createdAt: now,
        updatedAt: now,
      });
      problemIds.push(problemId);
    }
    for (const io of PROBLEM_IOS) {
      const { problemIndex, ...fields } = io;
      await ctx.db.insert('problemIos', { ...fields, problemId: problemIds[problemIndex] });
    }

    // 7. JOIN ACTIVITIES & PROBLEMS
    for (const ap of ACTIVITY_PROBLEMS) {
      await ctx.db.insert('activityProblems', {
        activityId: activityIds[ap.activityIndex],
        problemId: problemIds[ap.problemIndex],
        problemOrder: ap.problemOrder,
        createdAt: now,
      });
    }

    // 8. SEED TAGS, POSTS & COMMENTS
    const tagIds: Id<'tags'>[] = [];
    for (const t of TAGS) {
      tagIds.push(await ctx.db.insert('tags', t));
    }

    const postIds: Id<'posts'>[] = [];
    for (const p of POSTS) {
      const { authorIndex, ...fields } = p;
      const postId = await ctx.db.insert('posts', {
        ...fields,
        authorId: userIds[authorIndex],
        createdAt: now,
        updatedAt: now,
      });
      postIds.push(postId);
    }

    for (const pt of POST_TAGS) {
      await ctx.db.insert('postTags', {
        postId: postIds[pt.postIndex],
        tagId: tagIds[pt.tagIndex],
      });
    }

    const commentIds: Id<'comments'>[] = [];
    for (const c of COMMENTS) {
      const { authorIndex, postIndex, parentCommentIndex, ...fields } = c;
      const commentId = await ctx.db.insert('comments', {
        ...fields,
        authorId: userIds[authorIndex],
        postId: postIds[postIndex],
        parentCommentId: parentCommentIndex !== null ? commentIds[parentCommentIndex] : undefined,
        createdAt: now,
        updatedAt: now,
      });
      commentIds.push(commentId);
    }

    // 9. SEED CHATS & MESSAGES
    const chatIds: Id<'chats'>[] = [];
    for (const c of CHATS) {
      chatIds.push(await ctx.db.insert('chats', { ...c, createdAt: now }));
    }

    for (const cm of CHAT_MEMBERS) {
      const { chatIndex, userIndex } = cm;
      await ctx.db.insert('chatMembers', {
        chatId: chatIds[chatIndex],
        userId: userIds[userIndex],
        joinedAt: now,
      });
    }

    for (const m of MESSAGES) {
      const { chatIndex, senderIndex, ...fields } = m;
      await ctx.db.insert('messages', {
        ...fields,
        chatId: chatIds[chatIndex],
        senderId: userIds[senderIndex],
        sentAt: now,
      });
    }

    console.log('Seeding complete!');
    return {
      status: 'success',
      recordsCreated: {
        users: userIds.length,
        sections: sectionIds.length,
        activities: activityIds.length,
        problems: problemIds.length,
        posts: postIds.length,
        chats: chatIds.length,
      },
    };
  },
});
