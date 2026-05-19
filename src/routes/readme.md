# Application Routing Structure

This document outlines the URL structure for the application and what each page is responsible for.

## Public Routes `(public)`

- [x] `/(public)/+page.svelte` — Landing page.
- [x] `/(public)/login/+page.svelte` — User authentication.
- [x] `/(public)/forgot-password/+page.svelte` — Password recovery.
- [x] `/(public)/disclaimer/+page.svelte` — Project disclaimer page.

## Authenticated App Routes `(app)`

### General & Profile

- [x] `/(app)/dashboard/+page.svelte` — Unified dashboard overview (upcoming exams for students, active tasks for teachers).
- [x] `/(app)/users/[userId]/+page.svelte` — Public read-only profile view (avatar, about).
- [x] `/(app)/settings/+page.svelte` — Personal account settings (profile details, password, avatar).

### Administration

- [ ] `/(app)/admin/+page.svelte` — Overview everything.
- [x] `/(app)/admin/users/+page.svelte` — Admin dashboard to manage users (create accounts, assign roles).

### Sections (Courses/Classes)

- [ ] `/(app)/sections/+page.svelte` — Grid view of sections (Students see enrolled, Teachers see assigned).
- [ ] `/(app)/sections/new/+page.svelte` — Admins create new sections.
- [ ] `/(app)/sections/[sectionId]/+page.svelte` — Section hub listing its activities and members.
- [ ] `/(app)/sections/[sectionId]/edit/+page.svelte` — Manage section details and user enrollments.
- [x] `/(app)/sections/[sectionId]/cctv/+page.svelte` — Class CCTV grid view (real-time student screen sharing monitoring).
- [x] `/(app)/sections/[sectionId]/sharescreen/+page.svelte` — Screen sharing client for students during live sessions.

### Activities (Exams & Live Classes)

- [ ] `/(app)/activities/new/+page.svelte` — Create a new exam or class.
- [x] `/(app)/activities/[activityId]/[problemId]/+page.svelte` — The live room (Exam interface or class viewer).
- [ ] `/(app)/activities/[activityId]/edit/+page.svelte` — Update activity settings, attach and reorder problems.
- [ ] `/(app)/activities/[activityId]/results/+page.svelte` — Scoreboard showing all student submissions and grades.
- [x] `/(app)/activities/[activityId]/playback/+page.svelte` — Dashboard for reviewing student code progression.
- [x] `/(app)/activities/[activityId]/playback/[problemId]/[studentId]/+page.svelte` — Playback of a student's code snapshots for a specific problem.

### Problems (Question Bank)

- [x] `/(app)/problems/+page.svelte` — Master list of coding problems.
- [x] `/(app)/problems/new/+page.svelte` — Create a new programming problem.
- [x] `/(app)/problems/[problemId]/+page.svelte` — View problem details.
- [x] `/(app)/problems/[problemId]/edit/+page.svelte` — Edit problem text and test cases (I/Os).

### Communication

- [x] `/(app)/forum/+page.svelte` — Global forum listing.
- [x] `/(app)/forum/new/+page.svelte` — Create a new forum post.
- [x] `/(app)/forum/[postId]/+page.svelte` — View a specific post and its comments.
- [x] `/(app)/chat/+page.svelte` — Full-page chat application (left sidebar for chats, right for messages).

## API Routes `(api)`

- `/(api)/api/judge0/config/+server.ts` — Get system config and parameters.
- `/(api)/api/judge0/languages/+server.ts` — Fetch available programming languages.
- `/(api)/api/judge0/languages/[id]/+server.ts` — Get details of a specific language by ID.
- `/(api)/api/judge0/languages/all/+server.ts` — Retrieve all supported programming language runtimes.
- `/(api)/api/judge0/statistics/+server.ts` — Get system statistics of the Judge0 instance.
- `/(api)/api/judge0/statuses/+server.ts` — Fetch list of Judge0 submission statuses (e.g. AC, WA, TLE, etc.).
- `/(api)/api/judge0/submissions/+server.ts` — Handle creation and management of compiler submissions.
- `/(api)/api/judge0/submissions/[token]/+server.ts` — Query the status and output of a submission using its token.
- `/(api)/api/judge0/submissions/batch/+server.ts` — Process multiple code submissions in parallel batches.
- `/(api)/api/judge0/system/+server.ts` — Check operating system and system info.
- `/(api)/api/judge0/workers/+server.ts` — View queue status and active workers.
