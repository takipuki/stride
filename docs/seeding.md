# Database Seeding

This project uses a custom seeding script located in `src/convex/seed.ts`. This script is designed to provide a clean state with predictable sample data for development and testing.

## Features

- **Atomic Wipe & Seed**: Every run first clears all 17 tables in the database before inserting new data.
- **Relational Mapping**: Uses array indices to maintain foreign key integrity across tables (e.g., linking a post to a specific user without knowing their database ID beforehand).
- **Comprehensive Coverage**: Handles all core entities including Users, Sections, Activities, Problems, Posts, Chats, and Comments.

## How to Run

To reset and seed the database, run the following command from the root directory:

```bash
bunx convex run seed
```

> [!IMPORTANT]
> This command will **DELETE ALL DATA** currently in your Convex database before seeding. Use it only in development environments.

## Customizing Seed Data

All seed data is defined in static arrays at the top of `src/convex/seed.ts`.

### Adding a User

Add an object to the `USERS` array:

```typescript
{
  name: 'New Student',
  email: 'student@stride.edu',
  passwordHash: '...',
  role: 'student' as const,
}
```

### Linking Data

When adding data that depends on other tables, use the index of the parent item:

- `teacherIndex: 1` refers to the second item in the `USERS` array.
- `sectionIndex: 0` refers to the first item in the `SECTIONS` array.

## Table Dependency Order

The script inserts data in a specific order to satisfy foreign key constraints:

1. Users & Sections
2. Join tables (Teachers/Students)
3. Activities & Problems
4. Posts, Tags, and Chats
5. Comments & Messages
