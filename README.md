<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
3. Open the app and set your Gemini API key:
   `/#/settings`

## Gemini API Key

This app is deployed as a public static site, so the API key is stored only in the user's browser.
It is not embedded in the build or stored on any server.

## Backend (Dynamic Website)

**Prerequisites:** Docker (for Postgres), Node.js

1. Start Postgres:
   `docker compose up -d`
2. Setup backend env:
   copy `server/.env.example` -> `server/.env`
3. Install backend deps:
   `cd server && npm install`
4. Initialize database:
   `cd server && npx prisma migrate dev --name init`
5. Run API server:
   `cd server && npm run dev`

API default URL: `http://localhost:4000`

### Frontend API URL

If you need a different API base URL, set:
`VITE_API_BASE_URL` in `.env.example` (copy to `.env`).

## Deploy to GitHub Pages (Project Site)

1. Push to `main`.
2. In GitHub repo settings, go to `Pages` and set `Source` to `GitHub Actions`.
3. The site will be available at:
   `https://<owner>.github.io/ai-financial-analyst/`

Notes:
- `vite.config.ts` uses `base: '/ai-financial-analyst/'` for production.
- The router uses `HashRouter` to avoid refresh 404s on static hosting.
