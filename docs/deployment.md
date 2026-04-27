# Deployment Guide

This project is containerized using Docker and is optimized for deployment platforms like Dokploy.

## Prerequisites

1. **Convex Deploy Key**: Required to generate backend bindings during the build process.
   - Get it via `bunx convex deployment add` or the Convex Dashboard.

## Environment Variables

| Variable            | Description                                                    | Build/Runtime   |
| :------------------ | :------------------------------------------------------------- | :-------------- |
| `CONVEX_DEPLOY_KEY` | Secret key for Convex authentication.                          | Build           |
| `PUBLIC_CONVEX_URL` | URL of your Convex deployment.                                 | Build & Runtime |
| `ORIGIN`            | The public URL of your app (e.g., `https://stride.zurat.dev`). | Runtime         |
| `JUDGE0_URL`        | URL for the Judge0 API.                                        | Runtime         |
| `NODE_ENV`          | Set to `production`.                                           | Runtime         |

## Docker Deployment (Dokploy)

1. **Add Variables**: Add all variables above in the Dokploy dashboard.
2. **Enable Build Flag**: Ensure `CONVEX_DEPLOY_KEY` has the Build checkbox enabled.
3. **Deploy**: Dokploy will automatically use the `Dockerfile` in the root.

## Manual Build

```bash
docker build --build-arg CONVEX_DEPLOY_KEY=your_key_here -t stride-web .
```
