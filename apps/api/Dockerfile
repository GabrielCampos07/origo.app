# Multi-stage build for Origo API
# Build context: repo root
# Usage: fly deploy --config apps/api/fly.toml --dockerfile apps/api/Dockerfile -a beorigo-api

# Stage 1: Dependencies and build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root package files
COPY package.json package-lock.json ./

# Copy API workspace
COPY apps/api ./apps/api

# Copy libs if present (shared packages)
COPY libs ./libs 2>/dev/null || true

# Install dependencies for @origo/api workspace
RUN npm ci --workspace=@origo/api --include-workspace-root

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build API
RUN npm run build --workspace=apps/api

# Stage 2: Production runtime
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy workspace root package files
COPY package.json package-lock.json ./

# Copy API workspace package.json
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN npm ci --workspace=@origo/api --omit=dev --include-workspace-root

# Copy Prisma schema and generated client from builder
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Environment defaults (override via fly secrets set)
ENV NODE_ENV=production \
    PORT=3001 \
    HOST=0.0.0.0

EXPOSE 3001

# Start the API server
CMD ["node", "apps/api/dist/index.js"]
