# Deployment Guide (Render + Vercel, Free Tier)

## 1) Create MongoDB Atlas (Free)
1. Create an Atlas free cluster.
2. Create a database user with strong password.
3. In Network Access, allow:
   - `0.0.0.0/0` for quick setup (less secure), or
   - Render outbound IP ranges (recommended when available).
4. Copy connection string and set `MONGODB_URI`.

## 2) Deploy Backend on Render
1. Push this project to GitHub.
2. In Render, create a **Web Service** from the repo.
3. Use:
   - Build Command: `npm install`
   - Start Command: `npm run start`
4. Add backend environment variables:
   - `NODE_ENV=production`
   - `PORT=10000` (Render default) or leave unset
   - `MONGODB_URI=...`
   - `JWT_SECRET=...` (long random secret)
   - `JWT_EXPIRES_IN=12h`
   - `JWT_REMEMBER_EXPIRES_IN=30d`
   - `COOKIE_NAME=mt_auth`
   - `COOKIE_DOMAIN=` (leave empty unless needed)
   - `CORS_ORIGINS=https://your-frontend.vercel.app`
   - `TRUST_PROXY=1`
   - `BCRYPT_SALT_ROUNDS=12`
   - `ADMIN_USERNAME=...`
   - `ADMIN_PASSWORD=...`
5. Deploy and note the backend URL, e.g. `https://your-api.onrender.com`.

## 3) Deploy Frontend on Vercel
1. Import the same repo in Vercel.
2. Framework preset: **Vite**.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add frontend environment variable:
   - `VITE_API_BASE_URL=https://your-api.onrender.com`
6. Deploy and note the frontend URL, e.g. `https://your-frontend.vercel.app`.

## 4) Final CORS Update
1. Go back to Render env vars.
2. Set `CORS_ORIGINS` to include your actual Vercel domain.
3. Redeploy backend.

## 5) Verify
1. Open frontend URL.
2. Register a test user.
3. Login as admin and approve the user.
4. Confirm login/logout and admin endpoints work.
