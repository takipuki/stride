# Build Stage
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy dependency definitions
COPY package.json bun.lock ./

# Install dependencies using Bun
RUN bun install --frozen-lockfile

# Copy project files
COPY . .

# Generate Convex files (requires CONVEX_DEPLOY_KEY)
ARG CONVEX_DEPLOY_KEY
RUN CONVEX_DEPLOY_KEY=$CONVEX_DEPLOY_KEY bunx convex codegen

# Build the project
RUN bun run build

# Production Stage
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Copy build artifacts from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose port 3000
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["bun", "run", "build/index.js"]
