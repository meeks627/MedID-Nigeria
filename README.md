# MedID V4 — National Healthcare Identity Platform

A National Healthcare Identity and Record Interoperability Platform for identity verification, record discovery, and AI clinical briefings.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```
   npm install
   ```
2. Set the `GEMINI_API_KEY` in `.env` to your Gemini API key (optional — runs with offline fallback)
3. Run the app:
   ```
   npm run dev
   ```
4. Visit **http://localhost:3000**

## Deploy on Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Connect your GitHub repo
2. Use **Web Service** type
3. Build command: `npm run build`
4. Start command: `node dist/server.cjs`
5. Set `NODE_ENV=production` environment variable
