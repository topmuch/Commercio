# Teranga Biz (Commercio) - Dockerfile for Coolify
FROM node:20-alpine

# Install required packages (sqlite3 for fallback migrations, git for clone)
RUN apk add --no-cache git libc6-compat sqlite

WORKDIR /app

# Clone the repository
RUN git clone https://github.com/topmuch/Commercio.git . && rm -rf .git

# Install dependencies with npm (more reliable in Docker than bun)
RUN npm install --legacy-peer-deps 2>&1

# Generate Prisma Client (ensures schema is compiled)
RUN npx prisma generate

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx next build && \
    cp -r .next/static .next/standalone/.next/ && \
    cp -r public .next/standalone/

# Copy and setup entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/commercio.db"

# Use entrypoint script (handles DB init + server start)
ENTRYPOINT ["/app/docker-entrypoint.sh"]
