# Maths Tabel

Production-ready full-stack app:
- Frontend: React 18 + Vite
- Backend: Node.js + Express + MongoDB Atlas (Mongoose)
- Auth: bcrypt + JWT + httpOnly cookies

## Project Structure

```text
.
|- src/                     # React frontend
|- server/
|  |- index.js              # backend entrypoint
|  |- src/
|     |- app.js
|     |- config/
|     |- middleware/
|     |- models/
|     |- routes/
|     |- utils/
|- .env.example
|- DEPLOYMENT.md
|- render.yaml
|- vercel.json
```

## Local Run

1. Install dependencies:
```bash
npm install
```

2. Copy env file and update values:
```bash
cp .env.example .env
```

3. Start backend + frontend:
```bash
npm run dev:all
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5174`

## Environment Variables

Use `.env.example` as the source of truth.

Important keys:
- `MONGODB_URI`
- `JWT_SECRET`
- `CORS_ORIGINS`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `VITE_API_BASE_URL`

## Upload to GitHub

Prerequisite:
- Install Git: https://git-scm.com/downloads

Recommended (safe one-command setup):

```powershell
cd "C:\Users\SUJAL\Desktop\Maths tabel"
powershell -ExecutionPolicy Bypass -File .\setup-github.ps1 `
  -RepoUrl "https://github.com/<your-username>/<your-repo>.git" `
  -UserName "SujalPyDev" `
  -UserEmail "sujaljaiswal9980@gmail.com"
```

If this folder is not already a git repo:

```bash
git init
git branch -M main
git add .
git commit -m "Initial production-ready setup"
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If this is already a git repo:

```bash
git add .
git commit -m "Prepare project for GitHub and deployment"
git push
```

## Deploy

- Backend (Render): see `DEPLOYMENT.md`
- Frontend (Vercel): see `DEPLOYMENT.md`

## Security Notes

- Never commit `.env`
- Rotate secrets if they were ever exposed
- Keep CORS restricted to trusted frontend domains only
