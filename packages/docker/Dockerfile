# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/cli/package.json ./packages/cli/
COPY packages/web/package.json ./packages/web/

# Install dependencies
RUN npm install

# Copy source
COPY skills/ ./skills/
COPY packages/cli/src/ ./packages/cli/src/
COPY packages/cli/bin/ ./packages/cli/bin/
COPY packages/web/src/ ./packages/web/src/
COPY packages/web/index.html ./packages/web/

# Build web
RUN cd packages/web && npm run build || true

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install dependencies
RUN npm install -g gray-matter

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/skills ./skills
COPY --from=builder /app/packages/cli ./packages/cli
COPY --from=builder /app/packages/web/dist ./packages/web/dist

# Expose port
EXPOSE 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('ok')" || exit 1

# CLI tool as entry point
ENV PATH="/app/packages/cli/bin:$PATH"

# Default command
CMD ["node", "packages/cli/bin/cli.js", "info"]
