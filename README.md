# Maths Tabel

Frontend-only React app (no required backend).

- Built with React 18 + Vite
- Login/auth screens disabled
- Progress stored in browser `localStorage`
- Auto-deploy to GitHub Pages using GitHub Actions

## Run Locally

```bash
npm install
npm run dev
```

App URL: `http://localhost:5173`

## Data Storage (No Server)

This version stores user progress locally in the browser:
- Table progress
- Selected settings/mode
- RRB answers/results

Clearing browser data or using another device/browser will not share that data.

## Publish Directly From GitHub (GitHub Pages)

The workflow file is already included:
- `.github/workflows/deploy-pages.yml`

### One-time GitHub setup
1. Open your GitHub repo: `SujalPyDev/maths`
2. Go to `Settings` -> `Pages`
3. Under **Build and deployment**, set:
   - `Source`: **GitHub Actions**

### Deploy
Every push to `main` will auto-deploy.

```bash
git add .
git commit -m "Switch to frontend-only GitHub Pages deployment"
git push
```

After workflow success, site URL will be:
- `https://sujalpydev.github.io/maths/`

## Notes

- `Reset Data` button clears local progress.
- If updates do not appear, hard refresh (`Ctrl + F5`).
