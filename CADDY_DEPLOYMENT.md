# Caddy Deployment Instructions

Since your server is already using Caddy as the reverse proxy, we'll integrate the adjunct tracker alongside your existing finley app.

## Steps to Deploy with Caddy

### 1. Find your Caddyfile

First, locate your Caddy configuration:

```bash
# Check where Caddyfile is mounted
docker inspect caddy | grep -A 5 "Mounts"

# Or view the current Caddyfile
docker exec caddy cat /etc/caddy/Caddyfile
```

### 2. Add Adjunct Tracker to Caddyfile

Add this block to your Caddyfile (wherever it's located):

```caddy
adjunct.suscholarsbowl.com {
    reverse_proxy adjunct-tracker-frontend:80

    # Optional: Add security headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
    }
}
```

**Important**: Make sure your existing finley app configs remain untouched. Just add this new block.

### 3. Configure Environment Variables

```bash
cd /var/www/adjunct-tracker
cp .env.example .env
nano .env
```

Set these values:
```env
SECRET_KEY=<generate with: python3 -c "import secrets; print(secrets.token_urlsafe(32))">
DEFAULT_ADMIN_EMAIL=admin@suscc.edu
DEFAULT_ADMIN_PASSWORD=YourSecurePassword123!
BREVO_API_KEY=your-brevo-api-key
SENDER_EMAIL=noreply@suscc.edu
```

### 4. Start Adjunct Tracker Containers

```bash
cd /var/www/adjunct-tracker

# Build and start (won't conflict with port 80 now)
docker compose up -d --build

# Verify containers are running
docker compose ps
```

### 5. Reload Caddy

```bash
# Reload Caddy configuration (no downtime)
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### 6. Verify Everything Works

- Visit https://adjunct.suscholarsbowl.com
- Caddy automatically provisions SSL certificate
- Login with your admin credentials

## Network Architecture

```
Internet (80/443)
    ↓
  Caddy (reverse proxy)
    ├── finley.yourdomain.com → finley-app:3000
    └── adjunct.suscholarsbowl.com → adjunct-tracker-frontend:80
                                            ↓
                                      adjunct-tracker-backend:8000
```

## Troubleshooting

**Can't find Caddyfile:**
```bash
# Check docker-compose.yml for finley app
find /var/www -name "docker-compose.yml" | xargs grep -l caddy

# Or check common locations
ls -la /etc/caddy/
ls -la ~/caddy/
```

**Caddy can't reach adjunct-tracker-frontend:**
```bash
# Ensure both are on same network
docker network inspect caddy_default

# If network doesn't exist, find the correct name
docker network ls | grep caddy
```

**Update the network name in docker-compose.yml if different:**
```yaml
networks:
  caddy_default:  # Change this to match your actual Caddy network name
    external: true
```

## Benefits of Caddy

- ✅ Automatic SSL certificates (Let's Encrypt)
- ✅ Automatic renewals
- ✅ Simple configuration
- ✅ Zero downtime reloads
- ✅ HTTP/2 and HTTP/3 support out of the box

Your existing finley app continues working unchanged, and adjunct tracker runs alongside it!
