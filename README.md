# Job Search Tracker

Tracks job applications: applied date, source URL, company, job description,
and an AI-generated applicability score, plus AI-generated cover letters.

## Structure

- `client/` — React + TypeScript (Vite) frontend. Data is stored in the
  browser's localStorage.
- `server/` — Express API used for AI features (fetching/parsing a job
  posting URL, applicability scoring, cover letter generation) via the
  Anthropic API.

## Setup

1. Server: copy `server/.env.example` to `server/.env` and set
   `ANTHROPIC_API_KEY` to your Anthropic API key.
2. Install dependencies in both `client/` and `server/` (`npm install`).

## Running

In two terminals:

```bash
cd server && npm run dev   # http://localhost:3001
cd client && npm run dev   # http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to the backend, so just open
http://localhost:5173.

## Usage

1. Go to **Settings** and paste a summary of your background/resume — this
   is used for applicability scoring and cover letter generation.
2. On the **Applications** tab, click **Add Application**, paste a job
   posting URL, and click **Fetch details** to auto-populate the company,
   title, description, and applicability score.
3. Use **Cover letter** on any row to generate a tailored cover letter body
   you can copy and paste into an application.
