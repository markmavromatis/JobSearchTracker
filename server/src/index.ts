import "dotenv/config";
import "./db.js";
import express from "express";
import cors from "cors";
import { extractJobRouter } from "./routes/extractJob.js";
import { scoreRouter } from "./routes/score.js";
import { coverLetterRouter } from "./routes/coverLetter.js";
import { applicationsRouter } from "./routes/applications.js";
import { settingsRouter } from "./routes/settings.js";

const app = express();
const port = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api/extract-job", extractJobRouter);
app.use("/api/score", scoreRouter);
app.use("/api/cover-letter", coverLetterRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/settings", settingsRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(port, () => {
  console.log(`Job Search Tracker server listening on http://localhost:${port}`);
});
