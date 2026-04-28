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

const DEFAULT_PASS = 'pass';
const NOW = Date.now();
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

// --- HELPERS ---

function avatar(email: string) {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${email}`;
}

// --- DATA ---

const USERS = [
  { name: 'Stride Admin', email: 'admin@uiu.bd', role: 'admin' as const },
  { name: 'Sidratul Muntaha', email: 'sidratul@uiu.bd', role: 'teacher' as const }, // index 1
  { name: 'Asnuva Tanvin', email: 'tanvin@uiu.bd', role: 'teacher' as const }, // index 2
  { name: 'Fahim Faisal', email: 'ffaisal23@uiu.bd', role: 'student' as const }, // index 3
  { name: 'Rakibul Hasan', email: 'rhasan21@uiu.bd', role: 'student' as const }, // index 4
  { name: 'Sadia Tabassum', email: 'stabassum22@uiu.bd', role: 'student' as const },
  { name: 'Nafis Ahmed', email: 'nahmed22@uiu.bd', role: 'student' as const },
  { name: 'Jannatul Ferdous', email: 'jferdous23@uiu.bd', role: 'student' as const },
];

const SECTIONS = [
  {
    name: 'CSE 1111: Structured Programming Language',
    aboutMd: 'Introduction to C programming, loops, arrays, and pointers.',
    teacherIndices: [2], // Asnuva
    studentIndices: [3, 4, 5],
  },
  {
    name: 'CSE 1115: Object Oriented Programming',
    aboutMd: 'Deep dive into Java, inheritance, and polymorphism.',
    teacherIndices: [1], // Sidratul
    studentIndices: [3, 4, 6],
  },
  {
    name: 'CSE 2215: Data Structure and Algorithms I',
    aboutMd: 'Linked lists, trees, and basic searching/sorting.',
    teacherIndices: [2], // Asnuva
    studentIndices: [3, 5, 7],
  },
];

const PROBLEMS = [
  {
    title: 'Sum of Two Integers',
    contentMd: 'Read two integers and print their sum.',
    creatorIndex: 2,
    ios: [{ input: '5 10', output: '15' }],
  },
  {
    title: 'Palindrome Checker',
    contentMd: 'Write a program to check if a given string is a palindrome. Print "Yes" or "No".',
    creatorIndex: 2,
    ios: [
      { input: 'madam', output: 'Yes' },
      { input: 'hello', output: 'No' },
    ],
  },
  {
    title: 'Factorial Calculation',
    contentMd: 'Calculate the factorial of a given non-negative integer N.',
    creatorIndex: 2,
    ios: [{ input: '5', output: '120' }],
  },
  {
    title: 'Bank Account Class',
    contentMd:
      'Create a BankAccount class with private fields balance and accountId. Implement deposit() and withdraw().',
    creatorIndex: 1,
    ios: [{ input: 'deposit 100\nwithdraw 50', output: 'Balance: 50' }],
  },
  {
    title: 'Singly Linked List Reversal',
    contentMd: 'Given the head of a singly linked list, reverse the list and return its head.',
    creatorIndex: 2,
    ios: [{ input: '1 2 3', output: '3 2 1' }],
  },
];

const ACTIVITIES = [
  {
    sectionIndex: 0, // SPL
    title: 'Lab 01: Variables and Loops',
    type: 'class' as const,
    startTime: NOW - ONE_DAY,
    endTime: NOW + ONE_DAY,
    problemIndices: [0, 2], // Sum, Factorial
  },
  {
    sectionIndex: 0, // SPL
    title: 'Midterm Exam',
    type: 'exam' as const,
    startTime: NOW + ONE_HOUR,
    endTime: NOW + 3 * ONE_HOUR,
    problemIndices: [1], // Palindrome
  },
  {
    sectionIndex: 1, // OOP
    title: 'Lab 01: Classes',
    type: 'class' as const,
    startTime: NOW - 2 * ONE_DAY,
    endTime: NOW - ONE_DAY,
    problemIndices: [3], // Bank
  },
  {
    sectionIndex: 2, // DSA
    title: 'Lab 01: Lists',
    type: 'class' as const,
    startTime: NOW - ONE_HOUR,
    endTime: NOW + 4 * ONE_HOUR,
    problemIndices: [4], // Linked List
  },
];

// --- CODE CONTENT ---

const SUM_STEPS = [
  `a, b = map(int, input().split())\n`,
  `a, b = map(int, input().split())\nresult = a + b\n`,
  `a, b = map(int, input().split())\nresult = a + b\nprint(result)\n`,
];

const REV_STEPS = [
  `class Node:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n`,
  `class Node:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse(head):\n    prev = None\n    curr = head\n`,
  `class Node:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse(head):\n    prev = None\n    curr = head\n    while curr:\n        nxt = curr.next\n        curr.next = prev\n        prev = curr\n        curr = nxt\n    return prev\n`,
];

// --- SEEDING LOGIC ---

export default internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. WIPE
    console.log('Wiping existing data...');
    for (const table of TABLES) {
      const docs = await ctx.db.query(table as TableNames).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }

    // 2. USERS
    console.log('Seeding users...');
    const userIds: Id<'users'>[] = [];
    for (const u of USERS) {
      const id = await ctx.db.insert('users', {
        ...u,
        passwordHash: DEFAULT_PASS,
        avatarUrl: avatar(u.email),
        createdAt: NOW,
        updatedAt: NOW,
      });
      userIds.push(id);
    }

    // 3. SECTIONS
    console.log('Seeding sections...');
    const sectionIds: Id<'sections'>[] = [];
    for (const s of SECTIONS) {
      const { teacherIndices, studentIndices, ...data } = s;
      const sectionId = await ctx.db.insert('sections', { ...data, createdAt: NOW, updatedAt: NOW });
      sectionIds.push(sectionId);

      for (const tIdx of teacherIndices) {
        await ctx.db.insert('sectionTeachers', { sectionId, teacherId: userIds[tIdx], createdAt: NOW });
      }
      for (const sIdx of studentIndices) {
        await ctx.db.insert('sectionStudents', { sectionId, studentId: userIds[sIdx], createdAt: NOW });
      }
    }

    // 4. PROBLEMS & IO
    console.log('Seeding problems...');
    const problemIds: Id<'problems'>[] = [];
    for (const p of PROBLEMS) {
      const { ios, creatorIndex, ...data } = p;
      const problemId = await ctx.db.insert('problems', {
        ...data,
        createdBy: userIds[creatorIndex],
        createdAt: NOW,
        updatedAt: NOW,
      });
      problemIds.push(problemId);

      for (let i = 0; i < ios.length; i++) {
        await ctx.db.insert('problemIos', {
          problemId,
          inputData: ios[i].input,
          outputData: ios[i].output,
          ioOrder: i,
        });
      }
    }

    // 5. ACTIVITIES & JOIN PROBLEMS
    console.log('Seeding activities...');
    const activityIds: Id<'activities'>[] = [];
    for (const a of ACTIVITIES) {
      const { sectionIndex, problemIndices, ...data } = a;
      const activityId = await ctx.db.insert('activities', {
        ...data,
        sectionId: sectionIds[sectionIndex],
        createdAt: NOW,
        updatedAt: NOW,
      });
      activityIds.push(activityId);

      for (let i = 0; i < problemIndices.length; i++) {
        await ctx.db.insert('activityProblems', {
          activityId,
          problemId: problemIds[problemIndices[i]],
          problemOrder: i,
          createdAt: NOW,
        });
      }
    }

    // 6. SNAPSHOTS & SUBMISSIONS (Realism for ffaisal23 and rhasan21)
    console.log('Seeding history...');
    const ffaisal = userIds[3];
    const rhasan = userIds[4];

    // ffaisal completes Sum in SPL Lab 01
    const act0 = activityIds[0];
    const prob0 = problemIds[0];
    for (let i = 0; i < SUM_STEPS.length; i++) {
      await ctx.db.insert('snapshots', {
        authorId: ffaisal,
        activityId: act0,
        problemId: prob0,
        content: SUM_STEPS[i],
        languageId: 71,
        timestamp: NOW - ONE_DAY + i * 5 * 60000,
      });
    }
    await ctx.db.insert('submissions', {
      authorId: ffaisal,
      activityId: act0,
      problemId: prob0,
      content: SUM_STEPS[2],
      languageId: 71,
      judgeVerdict: 'Accepted',
      submittedAt: NOW - ONE_DAY + 20 * 60000,
    });

    // ffaisal completes Linked List in DSA Lab 01
    const act3 = activityIds[3];
    const prob4 = problemIds[4];
    for (let i = 0; i < REV_STEPS.length; i++) {
      await ctx.db.insert('snapshots', {
        authorId: ffaisal,
        activityId: act3,
        problemId: prob4,
        content: REV_STEPS[i],
        languageId: 71,
        timestamp: NOW - 30 * 60000 + i * 10 * 60000,
      });
    }
    await ctx.db.insert('submissions', {
      authorId: ffaisal,
      activityId: act3,
      problemId: prob4,
      content: REV_STEPS[2],
      languageId: 71,
      judgeVerdict: 'Accepted',
      submittedAt: NOW,
    });

    // rhasan struggles with Sum
    await ctx.db.insert('snapshots', {
      authorId: rhasan,
      activityId: act0,
      problemId: prob0,
      content: 'print("hello")',
      languageId: 71,
      timestamp: NOW - ONE_DAY + 2 * 60000,
    });
    await ctx.db.insert('submissions', {
      authorId: rhasan,
      activityId: act0,
      problemId: prob0,
      content: 'print("hello")',
      languageId: 71,
      judgeVerdict: 'Wrong Answer',
      submittedAt: NOW - ONE_DAY + 10 * 60000,
    });

    // 7. SOCIAL
    console.log('Seeding social...');
    const tag1 = await ctx.db.insert('tags', { name: 'Python' });
    const tag2 = await ctx.db.insert('tags', { name: 'Help' });

    const post1 = await ctx.db.insert('posts', {
      authorId: rhasan,
      contentMd: 'Is it okay to use recursion for the factorial problem? Will it hit stack limits?',
      createdAt: NOW - 2 * ONE_HOUR,
      updatedAt: NOW - 2 * ONE_HOUR,
    });
    await ctx.db.insert('postTags', { postId: post1, tagId: tag1 });
    await ctx.db.insert('postTags', { postId: post1, tagId: tag2 });

    await ctx.db.insert('comments', {
      authorId: userIds[2], // Asnuva
      postId: post1,
      content:
        'For N=100, recursion is fine. For larger values, you might need to increase the limit or use iteration.',
      createdAt: NOW - ONE_HOUR,
      updatedAt: NOW - ONE_HOUR,
    });

    const chat1 = await ctx.db.insert('chats', { name: 'CSE 1111 - SPL Support', createdAt: NOW });
    await ctx.db.insert('chatMembers', { chatId: chat1, userId: userIds[2], joinedAt: NOW });
    await ctx.db.insert('chatMembers', { chatId: chat1, userId: ffaisal, joinedAt: NOW });
    await ctx.db.insert('chatMembers', { chatId: chat1, userId: rhasan, joinedAt: NOW });

    await ctx.db.insert('messages', {
      chatId: chat1,
      senderId: userIds[2],
      content: 'Welcome to the SPL support group!',
      sentAt: NOW - ONE_HOUR,
    });

    console.log('Seeding complete!');
  },
});
