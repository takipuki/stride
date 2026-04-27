# Application Routing Structure

This document outlines the URL structure for the application and what each page is responsible for.

## Public Routes `(public)`

- `/(public)/+page.svelte` — Landing page.
- `/(public)/login/+page.svelte` — User authentication.
- `/(public)/forgot-password/+page.svelte` — Password recovery.

## Authenticated App Routes `(app)`

### General & Profile

- `/(app)/dashboard/+page.svelte` — Unified dashboard overview (upcoming exams for students, active tasks for teachers).
- `/(app)/users/[userId]/+page.svelte` — Public read-only profile view (avatar, about).
- `/(app)/settings/+page.svelte` — Personal account settings (profile details, password, avatar).

### Administration

- `/(app)/admin/+page.svelte` — Overview everything.
- `/(app)/admin/users/+page.svelte` — Admin dashboard to manage users (create accounts, assign roles).

### Sections (Courses/Classes)

- `/(app)/sections/+page.svelte` — Grid view of sections (Students see enrolled, Teachers see assigned).
- `/(app)/sections/new/+page.svelte` — Admins create new sections.
- `/(app)/sections/[sectionId]/+page.svelte` — Section hub listing its activities and members.
- `/(app)/sections/[sectionId]/edit/+page.svelte` — Manage section details and user enrollments.

### Activities (Exams & Live Classes)

- `/(app)/activities/new/+page.svelte` — Create a new exam or class.
- `/(app)/activities/[activityId]/+page.svelte` — The live room (Exam interface or class viewer).
- `/(app)/activities/[activityId]/edit/+page.svelte` — Update activity settings, attach and reorder problems.
- `/(app)/activities/[activityId]/results/+page.svelte` — Scoreboard showing all student submissions and grades.
- `/(app)/activities/[activityId]/cctv/+page.svelte` — Live grid view of all student screenshares.
- `/(app)/activities/[activityId]/playback/[studentId]/+page.svelte` — Playback of a student's code snapshots.

### Problems (Question Bank)

- `/(app)/problems/+page.svelte` — Master list of coding problems.
- `/(app)/problems/new/+page.svelte` — Create a new programming problem.
- `/(app)/problems/[problemId]/+page.svelte` — View problem details.
- `/(app)/problems/[problemId]/edit/+page.svelte` — Edit problem text and test cases (I/Os).

### Communication

- `/(app)/forum/+page.svelte` — Global forum listing.
- `/(app)/forum/new/+page.svelte` — Create a new forum post.
- `/(app)/forum/[postId]/+page.svelte` — View a specific post and its comments.
- `/(app)/chat/+page.svelte` — Full-page chat application (left sidebar for chats, right for messages).
