# Deployment Guide

This project is containerized using Docker and is optimized for deployment platforms like Dokploy.

## Prerequisites

1. **Convex Deploy Key**: Required to authenticate with Convex during the build.
   - Get it via `bunx convex deployment add` or the Convex Dashboard.

## Environment Variables

| Variable            | Description                                                    | Build/Runtime   |
| :------------------ | :------------------------------------------------------------- | :-------------- |
| `CONVEX_DEPLOY_KEY` | Secret key for Convex authentication.                          | **Build**       |
| `CONVEX_DEPLOYMENT` | Your deployment name (e.g. `enduring-sturgeon-780`).           | **Build**       |
| `CONVEX_URL`        | The deployment URL (e.g. `https://name.convex.cloud`).         | **Build**       |
| `PUBLIC_CONVEX_URL` | Same as above, used by the frontend.                           | Build & Runtime |
| `ORIGIN`            | The public URL of your app (e.g., `https://stride.zurat.dev`). | Runtime         |
| `JUDGE0_URL`        | URL for the Judge0 API.                                        | Runtime         |
| `NODE_ENV`          | Set to `production`.                                           | Runtime         |

## Docker Deployment (Dokploy)

1. **Build Arguments**: In Dokploy, go to the **Environment** tab and find the **Build Arguments** section. Add `CONVEX_DEPLOY_KEY`, `CONVEX_URL`, and `CONVEX_DEPLOYMENT` there.
2. **Environment Variables**: Add the runtime variables (like `ORIGIN` and `JUDGE0_URL`) in the standard **Environment Variables** section.
3. **Deploy**: The `Dockerfile` uses `bunx convex deploy`, which automatically:
   - Updates your backend schema and functions.
   - Generates the required `src/convex/_generated` files.
   - Builds the production frontend bundle.

## Manual Build

```bash
docker build \
  --build-arg CONVEX_DEPLOY_KEY=your_key_here \
  --build-arg CONVEX_URL=https://your-app.convex.cloud \
  -t stride-web .
```
