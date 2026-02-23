# Maths Tabel

Frontend-only maths practice app built with React + Vite.

## What Was Cleaned

- Removed backend/server files
- Removed Render/Vercel/Netlify deployment configs
- Removed login requirement (site opens directly)
- Reduced dependencies to frontend-only packages
- Split large quoted RRB question bank into a lazy-loaded module for faster first load

## Run Locally

```bash
npm install
npm run dev
```

Open: `http://localhost:5173`

## Data Storage

This app stores progress in browser `localStorage` only.

- Data stays on the same browser/device
- No server/database is required
- Use **Reset Data** button in the app header to clear local progress

## Deploy To GitHub Pages

Workflow file is already included: `.github/workflows/deploy-pages.yml`

1. Push to `main`
2. In GitHub repo: `Settings` -> `Pages`
3. Set source to **GitHub Actions**
4. Wait for workflow success in `Actions` tab

Site URL format:

`https://<github-username>.github.io/<repo-name>/`
