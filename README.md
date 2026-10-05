# Job Search Tracker

Tracks job applications: applied date, source URL, company, job description,
and an AI-generated applicability score, plus AI-generated cover letters.

## Structure

- `client/` — React + TypeScript (Vite) frontend. Reads/writes applications
  through the backend API.
- `server/` — Express API backed by a local SQLite database
  (`server/data/jobsearch.db`). Handles persistence plus AI features
  (parsing a job posting, applicability scoring, cover letter generation)
  via the Anthropic API.
- `extension/` — Chrome extension (Manifest V3) that captures the job
  posting on the page you're viewing directly into the tracker, with no
  need to open the app.

## Setup

1. Server: copy `server/.env.example` to `server/.env` and set
   `ANTHROPIC_API_KEY` to your Anthropic API key.
2. Install dependencies in both `client/` and `server/` (`npm install`).
3. Load the Chrome extension: go to `chrome://extensions`, enable
   **Developer mode**, click **Load unpacked**, and select the
   `extension/` folder.

## Running

In two terminals:

```bash
cd server && npm run dev   # http://localhost:3001
cd client && npm run dev   # http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to the backend, so just open
http://localhost:5173. The server must be running for the extension to
capture jobs, since that's where data is persisted.

## Usage

1. Go to **Settings** and paste a summary of your background/resume — this
   is used for applicability scoring and cover letter generation. It's
   stored server-side so the extension can score jobs at capture time
   without the app being open.
2. **Capture from the extension:** while viewing a job posting in your
   browser, click the extension icon and press **Capture Job**. It reads
   the fully-rendered page (so it works even on JavaScript-heavy career
   sites), sends it to the server to extract company/title/description and
   compute an applicability score, and saves it — no need to open the app.
   Click **Open in Job Search Tracker** to see it in the list.
3. **Or add manually in the app:** on the **Applications** tab, click
   **Add Application**, paste a job posting URL, and click **Fetch
   details** to auto-populate fields (works for server-renderable pages;
   for JS-heavy sites, use the extension instead).
4. Use **Cover letter** on any row to generate a tailored cover letter body
   you can copy and paste into an application.
