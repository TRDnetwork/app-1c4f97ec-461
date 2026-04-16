# Stage 1: Build frontend assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
# Note: In a real scenario, you might run a build step here if using a bundler.
# This app uses ES modules directly, so we just copy the source.

# Stage 2: Production server
FROM nginx:1.25-alpine
# Copy built frontend files (static HTML, JS, CSS)
COPY --from=builder /app/index.html /usr/share/nginx/html/
COPY --from=builder /app/styles.css /usr/share/nginx/html/
COPY --from=builder /app/app.js /usr/share/nginx/html/
COPY --from=builder /app/realtime.js /usr/share/nginx/html/
# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodejs && \
    chown -R nodejs:nodejs /usr/share/nginx/html
USER nodejs
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1