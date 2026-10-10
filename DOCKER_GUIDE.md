# 🐳 IntellMeet Docker Deployment Guide

This guide walks you through building, deploying, and managing **IntellMeet** in Docker containers using **Docker Compose**.

---

## 🏗️ Architecture Overview

The containerized stack consists of 3 microservices communicating via an internal bridge network (`intellmeet-network`):

1. **`intellmeet-mongodb`** (`mongo:7`):
   - Stores user profiles, meetings, attendance, AI summaries, transcripts, and tasks.
   - Preserves state across container restarts via `mongodb_data` volume.
   - Exposed on port `27017`.
2. **`intellmeet-server`** (Node.js 20 Express):
   - REST API, WebRTC signaling, Socket.IO real-time channels, Gemini AI integrations.
   - Uploads stored in `uploads_data` volume.
   - Exposed on port `5000`.
3. **`intellmeet-client`** (Nginx + React SPA):
   - Production Vite React bundle served by lightweight NGINX Alpine.
   - Proxies `/api/` and `/socket.io/` directly to `intellmeet-server:5000`.
   - Exposed on port `80` and `5173`.

---

## 🚀 Quick Start Instructions

### Step 1: Ensure Docker Desktop is Running
Make sure Docker Desktop is launched on your Windows PC.
You can verify it by opening PowerShell and running:
```powershell
docker info
```

---

### Step 2: Build & Start All Containers
In the project root directory (`d:\inell media`), run:
```powershell
docker compose up --build -d
```
*(Or double-click `docker-run.bat`)*

This command will:
- Download the official `mongo:7` and `nginx:alpine` images.
- Build the Node.js production container for the backend API.
- Compile the Vite React client into optimized static assets and bundle it into NGINX.
- Start all three containers in detached background mode (`-d`).

---

### Step 3: Access the Application
Open your browser and navigate to:
- **Frontend Application:** [http://localhost](http://localhost) (or [http://localhost:5173](http://localhost:5173))
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **MongoDB Database:** `mongodb://localhost:27017/intellmeet`

---

## 🛠️ Management Commands

### Check Running Containers
```powershell
docker compose ps
```

### View Live Logs
```powershell
# View logs from all services
docker compose logs -f

# View backend server logs only
docker compose logs -f server

# View frontend client logs only
docker compose logs -f client
```

### Stop the Containers
```powershell
docker compose down
```
*(Or double-click `docker-stop.bat`)*

### Restart the Containers
```powershell
docker compose restart
```

### Rebuild After Making Code Changes
```powershell
docker compose up --build -d
```

### Remove Containers and Wipe Volumes (Fresh Start)
```powershell
docker compose down -v
```
*(Warning: `-v` deletes persistent database volumes)*
