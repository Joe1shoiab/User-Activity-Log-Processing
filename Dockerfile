
# Stage 1 Dependencies
# Install production dependencies only
FROM node:18-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force


# Stage 2 Builder
# Copy source code and prepare for production
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY . .


# Stage 3 Production
# Final slim image for running the service
FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules

COPY --chown=nodejs:nodejs . .

USER nodejs

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check for API service
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "app.js"]
