# Docker Usage Examples

This document provides examples for running the joinery-web Docker container in different environments.

## Option 1: Production with Capabilities (Recommended)

For production deployment where the container needs to bind to port 80:

```bash
# Build the image
docker build -t chz160/joinery-web:latest .

# Run with NET_BIND_SERVICE capability to allow binding to port 80 as non-root
docker run -p 80:80 \
  --cap-add=NET_BIND_SERVICE \
  -e API_URL=https://api.joinery.com \
  chz160/joinery-web:latest
```

## Option 2: Development with Port Mapping

For development or when running behind a reverse proxy:

```bash
# Run on higher port (no special privileges needed)
docker run -p 8080:80 \
  -e API_URL=http://localhost:3000 \
  chz160/joinery-web:latest
```

## Option 3: Docker Compose with Reverse Proxy

For production with nginx reverse proxy:

```yaml
version: '3.8'
services:
  web:
    image: chz160/joinery-web:latest
    expose:
      - "80"
    environment:
      - API_URL=http://api:5256
    networks:
      - joinery-network

  proxy:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./proxy.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - web
    networks:
      - joinery-network

networks:
  joinery-network:
```

## Troubleshooting

### Fixed: Permission Denied on /run/nginx.pid

✅ **This issue has been resolved**. The container now uses `/tmp/nginx.pid` which is writable by the nginx user.

**Previous error:**
```
nginx: [emerg] open() "/run/nginx.pid" failed (13: Permission denied)
```

**Solution implemented:**
- Changed PID file location to `/tmp/nginx.pid` 
- Updated all temp directory paths to user-writable locations
- Set proper ownership on all required directories

### Port 80 Permission Denied

Non-root users cannot bind to ports below 1024. Use one of these solutions:

1. Add `--cap-add=NET_BIND_SERVICE` to your docker run command
2. Map to a higher port: `-p 8080:80`  
3. Run behind a reverse proxy