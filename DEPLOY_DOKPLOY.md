# Dokploy Deployment Guide - Contently

Panduan lengkap untuk deploy project Contently (NestJS Backend + Next.js Frontend) ke VPS menggunakan Dokploy.

## 📋 Daftar Isi

- [Prasyarat](#prasyarat)
- [Struktur Project](#struktur-project)
- [Setup VPS & Install Dokploy](#setup-vps--install-dokploy)
- [Konfigurasi Database](#konfigurasi-database)
- [Deploy Backend](#deploy-backend)
- [Deploy Frontend](#deploy-frontend)
- [Konfigurasi Domain & SSL](#konfigurasi-domain--ssl)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Prasyarat

Sebelum memulai, pastikan Anda memiliki:

- [ ] VPS dengan OS Ubuntu 20.04/22.04 (minimal 2 vCPU, 4GB RAM)
- [ ] Domain yang sudah pointing ke IP VPS
- [ ] Repository GitHub/GitLab dengan project Contently
- [ ] API Keys yang diperlukan:
  - OpenRouter API Key
  - Resend API Key
  - Stripe Keys (opsional)

---

## Struktur Project

```
contenly/
├── backend/
│   ├── Dockerfile
│   ├── src/
│   ├── package.json
│   └── start.sh
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   ├── next.config.ts
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Setup VPS & Install Dokploy

### 1. Update Sistem

```bash
ssh root@YOUR_VPS_IP

# Update package list
apt update && apt upgrade -y

# Install dependencies
apt install -y curl wget git nginx certbot python3-certbot-nginx
```

### 2. Install Docker

```bash
# Install Docker menggunakan official script
curl -fsSL https://get.docker.com | sh

# Add user ke docker group
usermod -aG docker root

# Verify installation
docker --version
docker-compose --version
```

### 3. Install Dokploy

```bash
# Install Dokploy
curl -sSL https://dokploy.com/install.sh | sh

# Dokploy akan otomatis berjalan di port 3000
```

### 4. Akses Dashboard Dokploy

1. Buka browser: `http://YOUR_VPS_IP:3000`
2. Buat admin account pada pertama kali akses
3. Complete setup wizard

### 5. Konfigurasi Firewall

```bash
# Allow necessary ports
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 3000/tcp    # Dokploy UI (bisa dibatasi IP)

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## Konfigurasi Database

### PostgreSQL Database

1. Di Dashboard Dokploy, klik **"Databases"** → **"Create Database"**
2. Pilih **PostgreSQL**
3. Isi konfigurasi:
   ```
   Name: contenly-postgres
   Database: contenly
   User: contenly
   Password: [generate strong password]
   Port: 5432
   ```
4. Klik **"Create"** dan tunggu sampai status **Running**
5. Catat connection string yang muncul

### Redis Database

1. Klik **"Create Database"** lagi
2. Pilih **Redis**
3. Isi konfigurasi:
   ```
   Name: contenly-redis
   Password: [generate strong password]
   Port: 6379
   ```
4. Klik **"Create"**

---

## Deploy Backend

### 1. Create Project

1. Di sidebar, klik **"Projects"** → **"Create Project"**
2. Isi:
   ```
   Name: contenly
   Description: Contently SaaS Platform
   ```
3. Klik **"Create"**

### 2. Create Backend Service

1. Masuk ke project **contenly**
2. Klik **"Create Service"** → **"Application"**
3. Isi konfigurasi umum:
   ```
   Name: contenly-backend
   Description: NestJS API Backend
   ```

### 3. Konfigurasi Build

1. Tab **"General"**:
   - **Build Type**: `Dockerfile`
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Context Path**: `./`

2. Tab **"Source"**:
   - Pilih provider: `GitHub` atau `GitLab`
   - Connect account dan authorize Dokploy
   - Pilih repository: `contenly`
   - Branch: `main`

### 4. Environment Variables Backend

Tab **"Environment"** → Tambahkan variables berikut:

```bash
# Application
NODE_ENV=production
PORT=3001

# Database (copy dari Dokploy database)
DATABASE_URL=postgresql://contenly:PASSWORD@contenly-postgres:5432/contenly

# Redis
REDIS_HOST=contenly-redis
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# Security (generate dengan: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your_64_character_hex_key_here
BETTER_AUTH_SECRET=your_64_character_hex_secret_here

# AI Service
OPENROUTER_API_KEY=sk-or-v1-your_api_key

# Email
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com

# URLs
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com

# Payments (opsional)
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# OAuth (opsional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_secret
```

### 5. Domain & SSL

1. Tab **"Domains"** → **"Add Domain"**
2. Isi:
   ```
   Host: api.yourdomain.com
   HTTPS: Enable (checked)
   Port: 3001
   ```
3. Klik **"Save"**

### 6. Deploy Backend

1. Tab **"General"** → Klik tombol **"Deploy"**
2. Tunggu build dan deploy selesai (lihat progress di logs)
3. Verify dengan akses: `https://api.yourdomain.com/health`

---

## Deploy Frontend

### 1. Create Frontend Service

1. Di project **contenly**, klik **"Create Service"** → **"Application"**
2. Isi:
   ```
   Name: contenly-frontend
   Description: Next.js Frontend
   ```

### 2. Konfigurasi Build

1. Tab **"General"**:
   - **Build Type**: `Dockerfile`
   - **Dockerfile Path**: `./frontend/Dockerfile`
   - **Context Path**: `./`

2. Tab **"Source"**:
   - Repository: `contenly`
   - Branch: `main`

### 3. Environment Variables Frontend

Tab **"Environment"**:

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

### 4. Domain & SSL

1. Tab **"Domains"** → **"Add Domain"**
2. Isi:
   ```
   Host: yourdomain.com
   HTTPS: Enable (checked)
   Port: 3000
   ```
3. Tambahkan domain tambahan (opsional):
   ```
   Host: www.yourdomain.com
   HTTPS: Enable
   Port: 3000
   ```

### 5. Deploy Frontend

1. Tab **"General"** → Klik **"Deploy"**
2. Tunggu build selesai
3. Verify: `https://yourdomain.com`

---

## Konfigurasi Domain & SSL

### Cloudflare (Recommended)

1. Login ke Cloudflare dashboard
2. Add site: `yourdomain.com`
3. Update nameserver di domain registrar ke Cloudflare
4. Setup DNS records:

| Type | Name | Target | Proxy Status |
|------|------|--------|--------------|
| A | @ | YOUR_VPS_IP | Proxied |
| A | api | YOUR_VPS_IP | DNS Only |
| A | www | YOUR_VPS_IP | Proxied |

5. SSL/TLS Settings:
   - Mode: **Full (strict)**
   - Always Use HTTPS: **ON**

### Dokploy Traefik SSL

Dokploy menggunakan Traefik reverse proxy dengan Let's Encrypt otomatis. Pastikan:

1. Domain sudah pointing ke VPS IP
2. Port 80 dan 443 terbuka di firewall
3. Dokploy akan otomatis generate SSL certificate

---

## Environment Variables

### Generate Security Keys

```bash
# Jalankan di local terminal untuk generate keys
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Contoh output:
# a3f5c8e9d2b1a7f4e6c9d8b2a5f3e7c1d4b6a8f2e5c9d1b7a3f6e8c2d4b5a7f1
```

### Semua Variables yang Diperlukan

| Variable | Source | Required |
|----------|--------|----------|
| `DATABASE_URL` | Dokploy PostgreSQL | Yes |
| `REDIS_HOST` | Dokploy Redis | Yes |
| `REDIS_PASSWORD` | Dokploy Redis | Yes |
| `ENCRYPTION_KEY` | Generate | Yes |
| `BETTER_AUTH_SECRET` | Generate | Yes |
| `OPENROUTER_API_KEY` | openrouter.ai | Yes |
| `RESEND_API_KEY` | resend.com | Yes |
| `EMAIL_FROM` | Your domain | Yes |
| `STRIPE_SECRET_KEY` | stripe.com | Optional |
| `FRONTEND_URL` | Your domain | Yes |
| `API_URL` | Your domain | Yes |

---

## Monitoring & Logs

### View Logs

1. Di Dokploy Dashboard → pilih Service
2. Tab **"Logs"** untuk melihat:
   - Build logs
   - Application logs
   - Error logs

### Health Check

Backend memiliki endpoint health check:
```
GET https://api.yourdomain.com/health
```

Response yang diharapkan:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Auto Deploy

Enable auto deploy untuk deployment otomatis:
1. Service → Settings → Git
2. Enable **"Auto Deploy"**
3. Setiap push ke branch main akan trigger deploy baru

---

## Troubleshooting

### 1. Build Failed

**Error**: `Dockerfile not found`
- Pastikan path Dockerfile benar: `./backend/Dockerfile`
- Check repository sudah ter-pull dengan benar

**Error**: `npm install failed`
- Check package.json valid
- Clear build cache: Service → Settings → Clear Build Cache

### 2. Database Connection Error

**Error**: `connection refused`
- Verify DATABASE_URL format
- Check database container running
- Pastikan password tidak mengandung special characters yang perlu di-encode

### 3. Migration Failed

**Error**: `drizzle-kit push failed`
- Check logs untuk detail error
- Verify database user memiliki permission CREATE TABLE
- Jalankan manual di console untuk debug

### 4. 502 Bad Gateway

**Error**: `502 Bad Gateway` saat akses domain
- Check backend container status: harus `running`
- Verify healthcheck endpoint berjalan
- Check port mapping (3001 untuk backend)

### 5. SSL Certificate Error

**Error**: `certificate not valid`
- Pastikan domain sudah pointing ke VPS
- Check Traefik logs di Dokploy server
- Tunggu 1-2 menit untuk Let's Encrypt provisioning

### 6. CORS Error

**Error**: `CORS policy` di browser
- Verify FRONTEND_URL di backend environment
- Pastikan API_URL di frontend benar
- Check CORS configuration di backend

### 7. Memory Issues

**Error**: `JavaScript heap out of memory`
- Upgrade VPS RAM
- Atau tambahkan swap:
```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

---

## Update & Maintenance

### Update Aplikasi

1. Push code baru ke repository
2. Dokploy akan auto deploy (jika enabled)
3. Atau manual deploy: Service → Deploy

### Backup Database

```bash
# Backup PostgreSQL
docker exec contenly-postgres pg_dump -U contenly contenly > backup.sql

# Restore
docker exec -i contenly-postgres psql -U contenly contenly < backup.sql
```

### Restart Services

Dokploy Dashboard → Service → Settings → Restart

---

## Command Reference

### Dokploy CLI

```bash
# Cek status Dokploy
docker ps | grep dokploy

# Restart Dokploy
docker restart dokploy

# View Dokploy logs
docker logs dokploy

# Update Dokploy
curl -sSL https://dokploy.com/install.sh | sh
```

### Docker Commands

```bash
# List containers
docker ps

# View logs container
docker logs -f CONTAINER_ID

# Restart container
docker restart CONTAINER_ID

# Exec into container
docker exec -it CONTAINER_ID sh

# Clean unused images
docker image prune -a
```

---

## Support & Resources

- **Dokploy Docs**: https://docs.dokploy.com
- **Traefik Docs**: https://doc.traefik.io
- **Docker Docs**: https://docs.docker.com
- **Project Issues**: GitHub Issues repository

---

## Cheatsheet

| Task | Command/Action |
|------|----------------|
| Deploy Backend | Service → Deploy |
| View Logs | Service → Logs |
| Add Domain | Service → Domains → Add |
| Update Env | Service → Environment → Save → Redeploy |
| Restart | Service → Settings → Restart |
| Clear Cache | Service → Settings → Clear Build Cache |
| Scale | Service → Settings → Replicas |

---

**Last Updated**: 2024
**Version**: 1.0
