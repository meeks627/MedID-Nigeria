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

## Deploy on Vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Connect your GitHub repo (`meeks627/MedID-Nigeria`)
2. Vercel auto-detects the `vercel.json` config
3. Set `GEMINI_API_KEY` as an environment variable (optional)
4. Deploy
