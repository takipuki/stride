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

// --- HELPERS ---

function avatar(email: string) {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${email}`;
}

// --- SEED DATA ---

const DEFAULT_PASS = 'pass';
const NOW = Date.now();
const ONE_DAY = 24 * 60 * 60 * 1000;

const USERS = [
  // 0: Admin
  { name: 'Stride Admin', email: 'admin@uiu.bd', passwordHash: DEFAULT_PASS, role: 'admin' as const },

  // 1-21: UIU Teachers
  { name: 'Sidratul Muntaha', email: 'sidratul@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },
  { name: 'Asnuva Tanvin', email: 'tanvin@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },
  { name: 'Tasmin Sanjida', email: 'sanjida@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },
  { name: 'A.H.M. Osama Haque', email: 'haqueosama1@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },
  {
    name: 'Sidratul Tanzila Tasmi',
    email: 'tanzila@uiu.bd',
    passwordHash: DEFAULT_PASS,
    role: 'teacher' as const,
  },
  { name: 'Humaira Anzum Neha', email: 'humaira@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },
  {
    name: 'Md. Mushfiqul Haque Omi',
    email: 'mushfiqul@uiu.bd',
    passwordHash: DEFAULT_PASS,
    role: 'teacher' as const,
  },
  {
    name: 'Charles Aunkan Gomes',
    email: 'charles@uiu.bd',
    passwordHash: DEFAULT_PASS,
    role: 'teacher' as const,
  },
  { name: 'Umama Rahman', email: 'umama@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },
  { name: 'Md. Shadman Aadeeb', email: 'shadman@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },
  {
    name: 'Md. Shafqat Talukder',
    email: 'shafqat@uiu.bd',
    passwordHash: DEFAULT_PASS,
    role: 'teacher' as const,
  },
  { name: 'Asif Ahmed Utsa', email: 'asif@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },
  { name: 'Md. Tanvir Raihan', email: 'tanvir@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },
  { name: 'Kazi Abdun Noor', email: 'abdunnoor@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },
  { name: 'Md. Tarek Hasan', email: 'tarek@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },
  { name: 'Nabila Sabrin Sworna', email: 'nabila@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },
  { name: 'Samin Sharaf Somik', email: 'samin@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },
  { name: 'Md. Romizul Islam', email: 'romizul@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },
  { name: 'Farhan Anan Himu', email: 'himu@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },
  { name: 'Shoib Ahmed Shourav', email: 'shoib@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },
  { name: 'Anika Tasnim Rodela', email: 'anika@uiu.bd', passwordHash: DEFAULT_PASS, role: 'teacher' as const },

  // 22-51: UIU Students (30 Total)
  { name: 'Rakibul Hasan', email: 'rhasan21@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  {
    name: 'Sadia Tabassum',
    email: 'stabassum22@uiu.bd',
    passwordHash: DEFAULT_PASS,
    role: 'student' as const,
  },
  { name: 'Nafis Ahmed', email: 'nahmed22@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Fahim Faisal', email: 'ffaisal23@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  {
    name: 'Jannatul Ferdous',
    email: 'jferdous23@uiu.bd',
    passwordHash: DEFAULT_PASS,
    role: 'student' as const,
  },
  { name: 'Tanmoy Das', email: 'tdas23@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Mehedi Hasan', email: 'mhasan21@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Nusrat Jahan', email: 'njahan22@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Arif Mahmud', email: 'amahmud21@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Farhan Ahmed', email: 'fahmed23@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Mehnaz Islam', email: 'mislam22@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Rafiq Uddin', email: 'ruddin21@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Nabila Rahman', email: 'nrahman23@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Tahmid Hasan', email: 'thasan22@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Ashikur Rahman', email: 'arahman21@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Sumaiya Akter', email: 'sakter23@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Kawsar Ahmed', email: 'kahmed22@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Ritu Parna', email: 'rparna21@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Shakib Al Hasan', email: 'shasan23@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Habiba Khatun', email: 'hkhatun22@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Imran Hossain', email: 'ihossain21@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Jui Barua', email: 'jbarua23@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Kamal Uddin', email: 'kuddin22@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Lamiya Haque', email: 'lhaque21@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Mahmudul Hasan', email: 'mahmudul23@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  {
    name: 'Nipa Chowdhury',
    email: 'nchowdhury22@uiu.bd',
    passwordHash: DEFAULT_PASS,
    role: 'student' as const,
  },
  { name: 'Osman Gani', email: 'ogani21@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  {
    name: 'Parveen Sultana',
    email: 'psultana23@uiu.bd',
    passwordHash: DEFAULT_PASS,
    role: 'student' as const,
  },
  { name: 'Qazi Anwar', email: 'qanwar22@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
  { name: 'Rina Begum', email: 'rbegum21@uiu.bd', passwordHash: DEFAULT_PASS, role: 'student' as const },
];

const SECTIONS = [
  { name: 'CSE 1110: Introduction to Computer Systems', aboutMd: 'Basic concepts of computer hardware and software.' }, // 0
  {
    name: 'CSE 1111: Structured Programming Language',
    aboutMd: 'Introduction to C programming, loops, arrays, and pointers.',
  }, // 1
  { name: 'CSE 1112: Structured Programming Language Laboratory', aboutMd: 'Hands-on practice for C programming.' }, // 2
  { name: 'CSE 1115: Object Oriented Programming', aboutMd: 'Deep dive into Java, inheritance, and polymorphism.' }, // 3
  { name: 'CSE 1116: Object Oriented Programming Laboratory', aboutMd: 'Hands-on OOP implementation in Java.' }, // 4
  { name: 'CSE 1325: Digital Logic Design', aboutMd: 'Logic gates, boolean algebra, and sequential circuits.' }, // 5
  { name: 'CSE 1326: Digital Logic Design Laboratory', aboutMd: 'Practical circuits and logic gates.' }, // 6
  {
    name: 'CSE 3313: Computer Architecture',
    aboutMd: 'Instruction set architecture, pipelining, and memory hierarchy.',
  }, // 7
  {
    name: 'CSE 4325: Microprocessors and Microcontrollers',
    aboutMd: '8086 architecture, assembly language, and interfacing.',
  }, // 8
  { name: 'CSE 2213: Discrete Mathematics', aboutMd: 'Logic, sets, functions, and graph theory basics.' }, // 9
  { name: 'CSE 2215: Data Structure and Algorithms I', aboutMd: 'Linked lists, trees, and basic searching/sorting.' }, // 10
  { name: 'CSE 2216: Data Structure and Algorithms I Laboratory', aboutMd: 'Implementing data structures in C++.' }, // 11
  {
    name: 'CSE 2217: Data Structure and Algorithms II',
    aboutMd: 'Advanced graphs, dynamic programming, and greedy methods.',
  }, // 12
  { name: 'CSE 2233: Theory of Computation', aboutMd: 'Automata, Turing machines, and computability.' }, // 13
  { name: 'CSE 3411: System Analysis and Design', aboutMd: 'Software lifecycles, UML, and system modeling.' }, // 14
  { name: 'CSE 3421: Software Engineering', aboutMd: 'Agile, testing, and modern software practices.' }, // 15
  { name: 'CSE 4531: Computer Security', aboutMd: 'Cryptography, network security, and secure coding.' }, // 16
  { name: 'CSE 3521: Database Management Systems', aboutMd: 'SQL, normalization, and database architecture.' }, // 17
  { name: 'CSE 4509: Operating Systems', aboutMd: 'Processes, threads, scheduling, and file systems.' }, // 18
  { name: 'CSE 3711: Computer Networks', aboutMd: 'OSI model, TCP/IP, routing, and switching.' }, // 19
  { name: 'CSE 3811: Artificial Intelligence', aboutMd: 'Search algorithms, ML basics, and neural networks.' }, // 20
];

const SECTION_TEACHERS = [
  { sectionIndex: 0, teacherIndex: 1 },
  { sectionIndex: 1, teacherIndex: 2 },
  { sectionIndex: 2, teacherIndex: 3 },
  { sectionIndex: 3, teacherIndex: 4 },
  { sectionIndex: 4, teacherIndex: 5 },
  { sectionIndex: 5, teacherIndex: 6 },
  { sectionIndex: 6, teacherIndex: 7 },
  { sectionIndex: 7, teacherIndex: 8 },
  { sectionIndex: 8, teacherIndex: 9 },
  { sectionIndex: 9, teacherIndex: 10 },
  { sectionIndex: 10, teacherIndex: 11 },
  { sectionIndex: 11, teacherIndex: 12 },
  { sectionIndex: 12, teacherIndex: 13 },
  { sectionIndex: 13, teacherIndex: 14 },
  { sectionIndex: 14, teacherIndex: 15 },
  { sectionIndex: 15, teacherIndex: 16 },
  { sectionIndex: 16, teacherIndex: 17 },
  { sectionIndex: 17, teacherIndex: 18 },
  { sectionIndex: 18, teacherIndex: 19 },
  { sectionIndex: 19, teacherIndex: 20 },
  { sectionIndex: 20, teacherIndex: 21 },
];

const SECTION_STUDENTS = Array.from({ length: 21 }).flatMap((_, secIdx) =>
  Array.from({ length: 10 }).map((_, i) => ({
    sectionIndex: secIdx,
    studentIndex: 22 + ((secIdx * 3 + i) % 30),
  })),
);

const ACTIVITIES = [
  {
    sectionIndex: 1, // CSE 1111 SPL
    title: 'Lab Assignment 01: Arrays',
    type: 'class' as const,
    startTime: NOW - ONE_DAY,
    endTime: NOW + ONE_DAY * 3,
  },
  {
    sectionIndex: 3, // CSE 1115 OOP
    title: 'Midterm Practical Exam',
    type: 'exam' as const,
    startTime: NOW - ONE_DAY * 2,
    endTime: NOW - ONE_DAY,
  },
];

const PROBLEMS = [
  {
    creatorIndex: 2, // Asnuva Tanvin
    title: 'Even/Odd Array Sorter',
    contentMd:
      'Write a C program that takes an array of N integers and prints all even numbers followed by all odd numbers.',
  },
  {
    creatorIndex: 4, // Osama Haque
    title: 'Bank Account Encapsulation',
    contentMd: 'Design a Java class BankAccount. Implement deposit and withdraw methods with bounds checking.',
  },
];

const PROBLEM_IOS = [
  { problemIndex: 0, inputData: '5\n1 2 3 4 5', outputData: '2 4\n1 3 5', ioOrder: 0 },
  { problemIndex: 1, inputData: '100\nwithdraw 150', outputData: 'Insufficient Funds', ioOrder: 0 },
];

const ACTIVITY_PROBLEMS = [
  { activityIndex: 0, problemIndex: 0, problemOrder: 0 },
  { activityIndex: 1, problemIndex: 1, problemOrder: 0 },
];

const TAGS = [{ name: 'C/C++' }, { name: 'Java' }, { name: 'Exam-Help' }];

const POSTS = [
  { authorIndex: 26, contentMd: 'What does SIGSEGV mean? Getting this error on the Array Assignment.' },
  { authorIndex: 4, contentMd: 'Welcome to CSE 1115: OOP. Please check the syllabus attached.' },
];

const POST_TAGS = [
  { postIndex: 0, tagIndex: 0 },
  { postIndex: 1, tagIndex: 1 },
];

const COMMENTS = [
  {
    authorIndex: 2,
    postIndex: 0,
    content: 'Segmentation Fault usually means you are trying to access an array index out of bounds.',
    parentCommentIndex: null,
  },
];

const CHATS = [{ name: 'CSE 1111 - General Support' }];

const CHAT_MEMBERS = [
  { chatIndex: 0, userIndex: 2 }, // Teacher
  { chatIndex: 0, userIndex: 26 }, // Student
  { chatIndex: 0, userIndex: 27 }, // Student
];

const MESSAGES = [
  { chatIndex: 0, senderIndex: 2, content: 'Welcome to the support channel for SPL. Ask your doubts here.' },
  { chatIndex: 0, senderIndex: 26, content: 'Sir, will the assignment deadline be extended?' },
];

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

    // 2. SEED USERS (WITH DYNAMIC AVATARS)
    const userIds: Id<'users'>[] = [];
    for (const u of USERS) {
      const userId = await ctx.db.insert('users', {
        ...u,
        avatarUrl: avatar(u.email),
        createdAt: now,
        updatedAt: now,
      });
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
