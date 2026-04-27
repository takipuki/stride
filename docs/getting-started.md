# Getting Started

Follow these steps to set up and run the project locally.

## Prerequisites

- [Bun](https://bun.sh/) installed on your machine.
- A [Convex](https://www.convex.dev/) account.

## Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/hamedzurat/stride
   cd stride
   ```

2. **Install dependencies:**

   ```bash
   bun i
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add the following:

   ```env
   # Judge0 instance URL (required for code execution)
   JUDGE0_URL=https://j0.zurat.dev/
   ```

4. **Initialize Convex:**
   The first time you run the project, you'll need to set up Convex:
   ```bash
   bun run dev
   ```
   This will prompt you to log in and create a new Convex project.

## Development Commands

| Command                | Description                                                  |
| :--------------------- | :----------------------------------------------------------- |
| `bun run dev`          | Runs both Vite (frontend) and Convex (backend) concurrently. |
| `bun run dev:frontend` | Runs only the Vite development server.                       |
| `bun run dev:backend`  | Runs only the Convex development server.                     |
| `bun run build`        | Builds the application for production.                       |
| `bun run check`        | Runs Svelte-check to verify types and syntax.                |
| `bun run format`       | Formats the codebase using Prettier.                         |
| `bun run lint`         | Lints the project using ESLint.                              |
| `bun run knip`         | Finds unused files and dependencies.                         |

## Convex & Logging

- **Viewing Logs**: When running `bun run dev`, Convex logs will appear directly in your terminal.
- **Dashboard**: You can also view logs, data, and configuration in the [Convex Dashboard](https://dashboard.convex.dev).
- **Writing Logs**: Use standard `console.log()`, `console.error()`, etc., inside your Convex functions to debug.

## Code Execution

The project integrates with **Judge0** for code execution. Ensure `JUDGE0_URL` is correctly set in your `.env.local`. If you are using a self-hosted instance, make sure it is accessible from your network.
