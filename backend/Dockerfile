# Dockerfile

# Multi-stage build for optimized image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# *** THE FIX: Ensure /app/db exists in the builder stage for copying later ***
RUN mkdir -p /app/db

# Production stage
FROM node:18-alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application code from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.js ./
COPY --from=builder /app/seed.js ./
COPY --from=builder /app/import-data.js ./

# Copy backup data folder for auto-import (Now guaranteed to work)
COPY --from=builder /app/db ./db

# Create uploads directory
RUN mkdir -p /app/uploads

# Set proper permissions
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start application
CMD ["node", "server.js"]