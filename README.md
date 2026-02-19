<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:** Node.js


1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the app:
   ```bash
   npm run dev
   ```
3. Open the app and set your Gemini API key:
   `/#/settings`

## Gemini API Key

This app is deployed as a public static site, so the API key is stored only in the user's browser.
It is not embedded in the build or stored on any server.

## Backend (Dynamic Website)

**Prerequisites:** Docker (for Postgres), Node.js

### Start Full Stack (Recommended)

Use 3 terminals.

1. Start Postgres:
   ```bash
   docker compose up -d
   ```
2. Start backend API:
   ```bash
   cd server
   cp .env.example .env
   npm install
   npx prisma migrate dev
   npm run dev
   ```
3. Start frontend:
   ```bash
   # from project root
   npm install
   npm run dev
   ```

Frontend URL: `http://localhost:3000`  
Backend URL: `http://localhost:4001`  
Backend health check: `http://localhost:4001/api/health`

### Stop Services

1. Stop frontend/backend: `Ctrl+C` in each dev terminal
2. Stop Postgres:
   ```bash
   docker compose down
   ```

For frontend opened via LAN IP (for example `http://10.53.33.100:3000`), set
`CORS_ORIGIN` in `server/.env` to allowed origins (comma-separated), for example:
`CORS_ORIGIN="http://localhost:3000,http://10.53.33.100:3000"`

### Frontend API URL

If you need a different API base URL, set:
`VITE_API_BASE_URL` in root `.env` (copy from `.env.example`), for example:

```bash
VITE_API_BASE_URL="http://localhost:4001"
```

## Deploy to GitHub Pages (Project Site)

1. Push to `main`.
2. In GitHub repo settings, go to `Pages` and set `Source` to `GitHub Actions`.
3. The site will be available at:
   `https://<owner>.github.io/ai-financial-analyst/`

Notes:
- `vite.config.ts` uses `base: '/ai-financial-analyst/'` for production.
- The router uses `HashRouter` to avoid refresh 404s on static hosting.
