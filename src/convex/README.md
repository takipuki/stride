# Convex Backend — Schema & Mutations

All timestamps are epoch milliseconds (`v.number()`).

---

## users

| Field        | Type                      | Notes              |
| ------------ | ------------------------- | ------------------ |
| name         | string                    |                    |
| passwordHash | string                    |                    |
| role         | `admin\|teacher\|student` |                    |
| aboutMd      | string?                   |                    |
| avatarUrl    | string?                   |                    |
| createdAt    | number                    |                    |
| updatedAt    | number                    | set on every patch |

Indexes: `by_name`

**Mutations** — `users.ts`

- `create(name, passwordHash, role, aboutMd?, avatarUrl?)` → id
- `updateProfile(id, name?, aboutMd?, avatarUrl?)` → bumps updatedAt
- `updatePassword(id, passwordHash)` → bumps updatedAt
- `remove(id)`
- `get(id)` → user
- `getByName(name)` → user (login lookup)
- `listByRole(role)` → users[]

---

## sections

| Field     | Type    | Notes              |
| --------- | ------- | ------------------ |
| name      | string  |                    |
| aboutMd   | string? |                    |
| createdAt | number  |                    |
| updatedAt | number  | set on every patch |

**Mutations** — `sections.ts`

- `create(name, aboutMd?)` → id
- `update(id, name?, aboutMd?)` → bumps updatedAt
- `remove(id)`
- `get(id)` → section
- `list()` → sections[]

---

## sectionTeachers

| Field     | Type          | Notes |
| --------- | ------------- | ----- |
| sectionId | id → sections | FK    |
| teacherId | id → users    | FK    |
| createdAt | number        |       |

Indexes: `by_section`, `by_teacher`

**Mutations** — `sections.ts`

- `addTeacher(sectionId, teacherId)` → id (no-op if already exists)
- `removeTeacher(sectionId, teacherId)`
- `listTeachers(sectionId)` → users[]
- `listSectionsByTeacher(teacherId)` → sections[]

---

## sectionStudents

| Field     | Type          | Notes |
| --------- | ------------- | ----- |
| sectionId | id → sections | FK    |
| studentId | id → users    | FK    |
| createdAt | number        |       |

Indexes: `by_section`, `by_student`

**Mutations** — `sections.ts`

- `addStudent(sectionId, studentId)` → id (no-op if already exists)
- `removeStudent(sectionId, studentId)`
- `listStudents(sectionId)` → users[]
- `listSectionsByStudent(studentId)` → sections[]

---

## activities

| Field     | Type          | Notes              |
| --------- | ------------- | ------------------ |
| sectionId | id → sections | FK                 |
| title     | string        |                    |
| startTime | number        | epoch ms           |
| endTime   | number        | epoch ms           |
| type      | `exam\|class` |                    |
| createdAt | number        |                    |
| updatedAt | number        | set on every patch |

Indexes: `by_section`

**Mutations** — `activities.ts`

- `create(sectionId, title, startTime, endTime, type)` → id
- `update(id, title?, startTime?, endTime?, type?)` → bumps updatedAt
- `remove(id)`
- `get(id)` → activity
- `listBySection(sectionId)` → activities[]

---

## activityProblems _(join: activity ↔ problem)_

| Field        | Type            | Notes      |
| ------------ | --------------- | ---------- |
| activityId   | id → activities | FK         |
| problemId    | id → problems   | FK         |
| problemOrder | number          | sort order |
| createdAt    | number          |            |

Indexes: `by_activity`, `by_problem`

**Mutations** — `activities.ts`

- `addProblem(activityId, problemId, problemOrder)` → id (no-op if exists)
- `removeProblem(activityId, problemId)`
- `reorderProblem(activityId, problemId, problemOrder)`
- `listProblems(activityId)` → `{ ...activityProblem, problem }[]` sorted by problemOrder

---

## problems

| Field     | Type       | Notes              |
| --------- | ---------- | ------------------ |
| createdBy | id → users | FK                 |
| title     | string     |                    |
| contentMd | string     | markdown           |
| createdAt | number     |                    |
| updatedAt | number     | set on every patch |

Indexes: `by_creator`

**Mutations** — `problems.ts`

- `create(createdBy, title, contentMd)` → id
- `update(id, title?, contentMd?)` → bumps updatedAt
- `remove(id)`
- `get(id)` → problem
- `list()` → problems[]
- `listByCreator(createdBy)` → problems[]

---

## problemIos _(test cases)_

| Field      | Type          | Notes      |
| ---------- | ------------- | ---------- |
| problemId  | id → problems | FK         |
| inputData  | string        |            |
| outputData | string        |            |
| ioOrder    | number        | sort order |

Indexes: `by_problem`

**Mutations** — `problems.ts`

- `addIO(problemId, inputData, outputData, ioOrder)` → id
- `updateIO(id, inputData?, outputData?, ioOrder?)`
- `removeIO(id)`
- `listIO(problemId)` → ios[] ordered asc

---

## snapshots _(code autosave history)_

| Field      | Type            | Notes               |
| ---------- | --------------- | ------------------- |
| authorId   | id → users      | FK                  |
| problemId  | id → problems   | FK                  |
| activityId | id → activities | FK                  |
| timestamp  | number          | epoch ms, immutable |
| content    | string          | code content        |

Indexes: `by_author`, `by_activity_problem`, `by_author_activity_problem`

**Mutations** — `snapshots.ts`

- `save(authorId, problemId, activityId, content)` → id
- `getLatest(authorId, activityId, problemId)` → snapshot (most recent)
- `listByAuthor(authorId, activityId, problemId)` → snapshots[] asc (replay/history)
- `listByActivityProblem(activityId, problemId)` → snapshots[] (teacher view, all students)

---

## submissions

| Field        | Type            | Notes               |
| ------------ | --------------- | ------------------- |
| authorId     | id → users      | FK                  |
| problemId    | id → problems   | FK                  |
| activityId   | id → activities | FK                  |
| content      | string          | submitted code      |
| judgeVerdict | string?         | null until judged   |
| submittedAt  | number          | epoch ms, immutable |

Indexes: `by_author`, `by_activity`, `by_activity_problem`, `by_author_activity_problem`

**Mutations** — `submissions.ts`

- `submit(authorId, problemId, activityId, content)` → id
- `setVerdict(id, judgeVerdict)`
- `remove(id)`
- `get(id)` → submission
- `listByActivity(activityId)` → submissions[]
- `listByActivityProblem(activityId, problemId)` → submissions[]
- `listByAuthor(authorId, activityId, problemId)` → submissions[] desc
- `latestByActivityProblem(activityId, problemId)` → one submission per student (scoreboard)

---

## chats

| Field     | Type   | Notes |
| --------- | ------ | ----- |
| name      | string |       |
| createdAt | number |       |

**Mutations** — `chats.ts`

- `create(name, memberIds[])` → chatId (also inserts chatMembers)
- `rename(id, name)`
- `remove(id)`
- `get(id)` → chat
- `listByUser(userId)` → chats[]

---

## chatMembers _(join: chat ↔ user)_

| Field    | Type       | Notes    |
| -------- | ---------- | -------- |
| chatId   | id → chats | FK       |
| userId   | id → users | FK       |
| joinedAt | number     | epoch ms |

Indexes: `by_chat`, `by_user`

**Mutations** — `chats.ts`

- `addMember(chatId, userId)` → id (no-op if exists)
- `removeMember(chatId, userId)`
- `listMembers(chatId)` → users[]

---

## messages

| Field    | Type       | Notes               |
| -------- | ---------- | ------------------- |
| chatId   | id → chats | FK                  |
| senderId | id → users | FK                  |
| content  | string     |                     |
| sentAt   | number     | epoch ms, immutable |

Indexes: `by_chat`

**Mutations** — `messages.ts`

- `send(chatId, senderId, content)` → id
- `edit(id, content)`
- `remove(id)`
- `listByChat(chatId, limit?)` → messages[] asc

---

## posts

| Field     | Type       | Notes              |
| --------- | ---------- | ------------------ |
| authorId  | id → users | FK                 |
| contentMd | string     | markdown           |
| createdAt | number     |                    |
| updatedAt | number     | set on every patch |

Indexes: `by_author`

**Mutations** — `posts.ts`

- `create(authorId, contentMd, tagIds[]?)` → id (also inserts postTags)
- `update(id, contentMd?)` → bumps updatedAt
- `remove(id)`
- `get(id)` → `{ ...post, tags[] }`
- `list()` → posts[] desc
- `listByAuthor(authorId)` → posts[] desc
- `listByTag(tagId)` → posts[]

---

## tags

| Field | Type   | Notes            |
| ----- | ------ | ---------------- |
| name  | string | unique via index |

Indexes: `by_name`

**Mutations** — `posts.ts`

- `createTag(name)` → id (no-op if exists)
- `listTags()` → tags[]

---

## postTags _(join: post ↔ tag)_

| Field  | Type       | Notes |
| ------ | ---------- | ----- |
| postId | id → posts | FK    |
| tagId  | id → tags  | FK    |

Indexes: `by_post`, `by_tag`

**Mutations** — `posts.ts`

- `addTag(postId, tagId)` → id (no-op if exists)
- `removeTag(postId, tagId)`

---

## comments

| Field           | Type           | Notes                |
| --------------- | -------------- | -------------------- |
| authorId        | id → users     | FK                   |
| postId          | id → posts     | FK                   |
| parentCommentId | id → comments? | FK, null = top-level |
| content         | string         |                      |
| createdAt       | number         |                      |
| updatedAt       | number         | set on every patch   |

Indexes: `by_post`, `by_parent`

**Mutations** — `comments.ts`

- `create(authorId, postId, content, parentCommentId?)` → id
- `update(id, content)` → bumps updatedAt
- `remove(id)` (recursively deletes replies)
- `get(id)` → comment
- `listByPost(postId)` → top-level comments[]
- `listReplies(parentCommentId)` → replies[]
