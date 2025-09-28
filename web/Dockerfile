# Multi-stage build for Angular application
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN echo "Running npm install..." && npm install && echo "npm install completed" && ls -la node_modules/@angular/cli/ || echo "CLI not found after install"

# Copy source code (excluding node_modules via .dockerignore)
COPY src/ src/
COPY angular.json ./
COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY tsconfig.spec.json ./
COPY public/ public/
COPY build.sh ./

# Build the Angular application using custom script
RUN chmod +x build.sh && ./build.sh

# Production stage with nginx
FROM nginx:alpine

# Remove default nginx configuration and website
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage (using correct output path)
COPY --from=builder /app/dist/joinery-web-temp/browser /usr/share/nginx/html

# Create nginx cache directories
RUN mkdir -p /var/cache/nginx/client_temp \
    && mkdir -p /var/cache/nginx/proxy_temp \
    && mkdir -p /var/cache/nginx/fastcgi_temp \
    && mkdir -p /var/cache/nginx/uwsgi_temp \
    && mkdir -p /var/cache/nginx/scgi_temp

# Set proper permissions
RUN chown -R nginx:nginx /var/cache/nginx \
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