# Multi-stage build for Angular application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies - using npm install to avoid the ci issue
RUN npm install

# Copy source code
COPY src/ src/
COPY angular.json ./
COPY tsconfig*.json ./
COPY public/ public/

# Build using npx to directly call Angular CLI
RUN npx --yes @angular/cli@20.3.2 build

# Production stage with nginx
FROM nginx:alpine

# Remove default nginx configuration and website
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/dist/joinery-web-temp/browser /usr/share/nginx/html

# Create nginx temp directories in user-writable locations and set permissions
RUN mkdir -p /tmp/client_temp \
    && mkdir -p /tmp/proxy_temp \
    && mkdir -p /tmp/fastcgi_temp \
    && mkdir -p /tmp/uwsgi_temp \
    && mkdir -p /tmp/scgi_temp \
    && chown -R nginx:nginx /tmp/client_temp \
    && chown -R nginx:nginx /tmp/proxy_temp \
    && chown -R nginx:nginx /tmp/fastcgi_temp \
    && chown -R nginx:nginx /tmp/uwsgi_temp \
    && chown -R nginx:nginx /tmp/scgi_temp \
    && chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/log/nginx

# Add non-root user for security
USER nginx

# Expose port 80
EXPOSE 80

# Add health check  
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]