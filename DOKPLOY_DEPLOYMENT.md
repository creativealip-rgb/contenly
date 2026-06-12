# Panduan Deploy Contently ke VPS dengan Dokploy

## 📋 Overview
Panduan ini akan membantu Anda deploy project Contently (NestJS Backend + Next.js Frontend) ke VPS menggunakan Dokploy.

> **Production source of truth:** `https://contenly.app` saat ini build dari branch `main` lewat Dokploy **Raw Compose**. Branch efektif ada di `/etc/dokploy/compose/contenly/code/docker-compose.yml` sebagai `https://github.com/creativealip-rgb/contenly.git#main`. Lihat detail: [`docs/live-deployment.md`](docs/live-deployment.md).

## 🏗️ Arsitektur Deployment

```
┌─────────────────┐
│   Cloudflare    │  (SSL + Domain)
│   / Domain      │
└────────┬────────┘
         │
    ┌────▼────┐
    │  VPS    │  (Ubuntu 22.04+)
    │ Dokploy │  (Port 3000 - Dokploy UI)
    └────┬────┘
         │
    ┌────▼────┐
    │ Traefik │  (Reverse Proxy + SSL)
    └────┬────┘
         │
  ┌──────┴──────┐
  │             │
┌─▼──┐      ┌───▼──┐
│FE  │      │  BE  │   (Docker Containers)
│3000│      │ 3001 │
└────┘      └──────┘
   │           │
   └─────┬─────┘
         │
    ┌────▼────┐
    │Postgres │   (Database)
    │  5432   │
    └─────────┘
         │
    ┌────▼────┐
    │  Redis  │   (Queue/Cache)
    │  6379   │
    └─────────┘
```

## 🚀 Tahap 1: Setup VPS & Dokploy

### 1.1 Siapkan VPS (Ubuntu 22.04+)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Dokploy
curl -sSL https://dokploy.com/install.sh | sh
```

### 1.2 Akses Dokploy UI
1. Buka browser: `http://YOUR_VPS_IP:3000`
2. Buat admin account pertama
3. Setup server di Dokploy panel

## 🔧 Tahap 2: Konfigurasi Project di Dokploy

### 2.1 Create Project
1. Di Dokploy Dashboard → Klik "Create Project"
2. Nama: `contenly`
3. Description: `Contently SaaS Platform`

### 2.2 Setup PostgreSQL Database
1. Pergi ke "Databases" → "Create Database"
2. Pilih: `PostgreSQL`
3. Configuration:
   - Database Name: `contenly`
   - User: `contenly`
   - Password: (generate strong password)
   - Port: `5432`
4. Save & Start

### 2.3 Setup Redis
1. Pergi ke "Databases" → "Create Database"
2. Pilih: `Redis`
3. Configuration:
   - Name: `contenly-redis`
   - Password: (generate strong password)
   - Port: `6379`
4. Save & Start

## 🐳 Tahap 3: Deploy Backend

### 3.1 Create Service - Backend
1. Pergi ke Project `contenly`
2. Klik "Create Service" → "Application"
3. Configuration:
   - Name: `contenly-backend`
   - Build Type: `Dockerfile`
   - Dockerfile Path: `./backend/Dockerfile`

### 3.2 Environment Variables Backend
Tambahkan di tab "Environment":

```env
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@postgres:5432/contenly
REDIS_HOST=contenly-redis
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
ENCRYPTION_KEY=YOUR_64_CHAR_ENCRYPTION_KEY
OPENROUTER_API_KEY=sk-or-v1-YOUR_API_KEY
BETTER_AUTH_SECRET=YOUR_AUTH_SECRET
RESEND_API_KEY=re_YOUR_API_KEY
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

### 3.3 Domain & SSL Backend
1. Tab "Domains"
2. Add Domain: `api.yourdomain.com`
3. Enable HTTPS
4. Port: `3001`

### 3.4 Deploy Backend
1. Tab "General" → "Deploy"
2. Pilih repository GitHub Anda
3. Branch: `main`
4. Klik "Deploy"

## 🎨 Tahap 4: Deploy Frontend

### 4.1 Create Service - Frontend
1. Klik "Create Service" → "Application"
2. Configuration:
   - Name: `contenly-frontend`
   - Build Type: `Dockerfile`
   - Dockerfile Path: `./frontend/Dockerfile`

### 4.2 Environment Variables Frontend
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

### 4.3 Domain & SSL Frontend
1. Tab "Domains"
2. Add Domain: `yourdomain.com`
3. Enable HTTPS
4. Port: `3000`

### 4.4 Deploy Frontend
1. Tab "General" → "Deploy"
2. Pilih repository yang sama
3. Branch: `main`
4. Klik "Deploy"

## 🔐 Tahap 5: Security & SSL

### 5.1 Cloudflare (Recommended)
1. Add domain ke Cloudflare
2. Setup DNS records:
   ```
   Type: A     Name: @       Value: YOUR_VPS_IP   Proxy: ON
   Type: A     Name: api     Value: YOUR_VPS_IP   Proxy: OFF (for API)
   ```
3. SSL/TLS Mode: Full (strict)

### 5.2 Firewall VPS
```bash
# Allow necessary ports
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

## 📊 Tahap 6: Monitoring

### 6.1 Health Checks
Backend sudah memiliki healthcheck di port 3001/health

### 6.2 Logs
Monitor logs di Dokploy Dashboard → Service → Logs

## 🔄 Tahap 7: Updates & Maintenance

### Auto Deploy
1. Di Service → Settings → Git
2. Enable "Auto Deploy" untuk deployment otomatis saat push ke main

### Manual Update
```bash
# Rebuild dan redeploy dari Dokploy UI
# Atau trigger webhook dari GitHub
```

## 🛠️ Troubleshooting

### Database Connection Failed
```bash
# Check database connection
docker exec -it CONTAINER_ID psql -U contenly -d contenly

# Check logs
docker logs contenly-backend
```

### Migration Failed
1. Check DATABASE_URL format
2. Ensure database user has proper permissions
3. Check network connectivity

### 502 Bad Gateway
1. Check backend container is running
2. Verify healthcheck endpoint
3. Check Traefik logs

## 📋 Pre-Deployment Checklist

- [ ] VPS dengan Ubuntu 22.04+
- [ ] Domain sudah pointing ke VPS
- [ ] Semua API keys sudah disiapkan:
  - [ ] OpenAI API Key
  - [ ] Resend API Key
  - [ ] Stripe Keys
  - [ ] Google OAuth (opsional)
  - [ ] GitHub OAuth (opsional)
- [ ] Encryption key 64 karakter hex
- [ ] Better Auth Secret
- [ ] Repository sudah di-push ke GitHub/GitLab

## 💰 Estimasi Biaya

| Komponen | Spesifikasi | Estimasi Bulanan |
|----------|-------------|------------------|
| VPS | 2 vCPU, 4GB RAM | $10-20 |
| Domain | .com/.net | $10-15/tahun |
| Database | Self-hosted | Included |
| Redis | Self-hosted | Included |
| **Total** | | **$10-20/bulan** |

## 📞 Support

Jika mengalami kendala:
1. Check logs di Dokploy Dashboard
2. Verifikasi environment variables
3. Pastikan database migration berhasil
4. Contact: support@yourdomain.com
