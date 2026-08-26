# RekaKarbon Backend — Bare-Metal Deployment Guide

This document describes how to bootstrap and maintain the **RekaKarbon NestJS backend** running directly on a Linux host machine without Docker, using **PM2** as the process manager and **native PostgreSQL**.

> **Audience**: DevOps / server admin performing the one-time bootstrap. After bootstrap, day-to-day deploys are fully automated via GitHub Actions.

---

## Architecture Overview

```
GitHub Actions (CI)
    │  git pull + pnpm build + pm2 reload
    ▼
Linux Host Machine
├── Node.js 24.15.0 (nvm)
├── pnpm 11.22.0 (corepack)
├── PostgreSQL 18 (systemd service)
└── PM2 (cluster mode, systemd-persisted)
        └── rekakarbon-backend (NestJS, port 3000)
```

---

## 1. One-Time Server Bootstrap

Run all steps below **once** on a fresh server before triggering any CI deploy.

### 1.1 Node.js (via nvm)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc   # or ~/.zshrc

# Install and pin project Node version
nvm install 24.15.0
nvm use 24.15.0
nvm alias default 24.15.0

# Verify
node -v   # should print v24.15.0
```

### 1.2 pnpm (via corepack)

```bash
corepack enable
corepack prepare pnpm@11.22.0 --activate

# Verify
pnpm -v   # should print 11.22.0
```

### 1.3 PM2

```bash
npm install -g pm2

# Enable PM2 auto-start on system reboot
pm2 startup
# ↑ This prints a command — copy and run it as root, e.g.:
#   sudo env PATH=$PATH:/home/user/.nvm/versions/node/v24.15.0/bin pm2 startup systemd -u user --hp /home/user

pm2 -v   # verify
```

### 1.4 PostgreSQL 18

```bash
# Debian / Ubuntu
sudo apt-get update
sudo apt-get install -y postgresql-18

# Enable and start the service
sudo systemctl enable --now postgresql

# Create the database user and database
sudo -u postgres psql << 'SQL'
CREATE USER rekakarbon WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
CREATE DATABASE rekakarbon OWNER rekakarbon;
SQL
```

> **Security**: Replace `CHANGE_ME_STRONG_PASSWORD` with a strong secret. Store it in the `SERVER_ENV` GitHub secret (see section 3).

### 1.5 Clone the Repository

```bash
git clone https://github.com/FarrelAD/RekaKarbon.git ~/RekaKarbon-Backend
```

---

## 2. First-Time Application Start

```bash
cd ~/RekaKarbon-Backend

# Copy and fill in the production environment file
cp server/.env.example server/.env
nano server/.env   # update DATABASE_URL, JWT_SECRET, BESU_*, etc.

# Install all dependencies
pnpm install --frozen-lockfile

# Compile TypeScript
pnpm server:build

# Run all pending database migrations
pnpm --filter ./server prisma:migrate:deploy

# Start PM2 with the production environment
pm2 start ecosystem.config.cjs --env production

# Persist the PM2 process list so it survives reboots
pm2 save

# Check that the process is running
pm2 list
```

**Verify the server is healthy:**

```bash
curl http://localhost:3000/health
# Expected: HTTP 200 {"status":"ok",...}
```

Swagger UI is available at: `http://<host-ip>:3000/api/docs`

---

## 3. GitHub Secrets Configuration

Add the following secrets in **GitHub → Settings → Secrets and Variables → Actions**:

| Secret name    | Value                                              |
| -------------- | -------------------------------------------------- |
| `SSH_HOST`     | Tailscale IP or hostname of this server            |
| `SSH_USERNAME` | Linux user running the app (e.g. `ubuntu`)         |
| `SSH_KEY`      | Private SSH key (PEM format) for the above user    |
| `TS_AUTHKEY`   | Tailscale ephemeral auth key                       |
| `SERVER_ENV`   | Full contents of `server/.env` (production values) |

> The `SERVER_ENV` secret is written to `~/RekaKarbon-Backend/server/.env` on every deploy, so any changes to env vars take effect on the next CI run.

---

## 4. Ongoing CI Deploys

After bootstrap, every deploy is triggered via:

**GitHub → Actions → "Deploy NestJS Backend to Host (Bare-Metal / PM2)" → Run workflow**

The workflow automatically:

1. Runs lint, typecheck, and unit tests.
2. SSHs into the host.
3. Pulls the latest `main` branch.
4. Installs dependencies and recompiles TypeScript.
5. Runs pending database migrations (`prisma migrate deploy` — safe, no data loss).
6. Performs a **zero-downtime PM2 reload** (new workers start before old ones stop).
7. Verifies `GET /health` returns `HTTP 200`.
8. Optionally runs the database seeder (opt-in checkbox).

---

## 5. Rollback Procedure

If a deploy breaks production, roll back to a known-good commit directly on the host:

```bash
cd ~/RekaKarbon-Backend

# List recent commits
git log --oneline -10

# Hard-reset to a previous commit
git reset --hard <COMMIT_SHA>

# Rebuild and reload
pnpm server:build
pm2 reload rekakarbon-backend --update-env

# Verify health
curl http://localhost:3000/health
```

---

## 6. Useful PM2 Commands

```bash
# Check process status
pm2 list

# View real-time logs
pm2 logs rekakarbon-backend

# View last 100 log lines (non-streaming)
pm2 logs rekakarbon-backend --lines 100 --nostream

# Restart all workers
pm2 restart rekakarbon-backend

# Zero-downtime reload (preferred in production)
pm2 reload rekakarbon-backend --update-env

# Monitor CPU / memory in real time
pm2 monit

# Show detailed process info
pm2 show rekakarbon-backend
```

---

## 7. PostgreSQL Maintenance

```bash
# Check PostgreSQL service status
sudo systemctl status postgresql

# Connect to the database as the app user
psql -U rekakarbon -d rekakarbon -h localhost

# View migration status
cd ~/RekaKarbon-Backend
pnpm db:status

# Run migrations manually (if needed)
pnpm --filter ./server prisma:migrate:deploy
```
