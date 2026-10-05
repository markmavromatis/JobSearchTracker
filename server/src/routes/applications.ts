import { Router } from "express";
import {
  createApplication,
  deleteApplication,
  getApplicationByUrl,
  listApplications,
  updateApplication,
  type NewApplication,
} from "../applicationsRepo.js";
import { getSetting } from "../settingsRepo.js";
import { extractJobFields, scoreApplication } from "../jobService.js";
import { friendlyErrorMessage } from "../anthropic.js";

export const applicationsRouter = Router();

function todayIsoDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

applicationsRouter.get("/", (req, res) => {
  const { url } = req.query;
  if (typeof url === "string") {
    const match = getApplicationByUrl(url);
    return res.json(match ? [match] : []);
  }
  res.json(listApplications());
});

applicationsRouter.post("/", (req, res) => {
  const data = req.body ?? {};
  if (!data.companyName || !data.jobTitle) {
    return res.status(400).json({ error: "'companyName' and 'jobTitle' are required." });
  }

  const record: NewApplication = {
    appliedDate: data.appliedDate || todayIsoDate(),
    sourceUrl: data.sourceUrl ?? "",
    companyUrl: data.companyUrl ?? "",
    companyName: data.companyName,
    jobTitle: data.jobTitle,
    jobDescription: data.jobDescription ?? "",
    applicabilityScore: data.applicabilityScore ?? null,
    scoreRationale: data.scoreRationale ?? "",
    coverLetter: data.coverLetter ?? "",
  };

  try {
    res.status(201).json(createApplication(record));
  } catch (err) {
    console.error("create application error:", err);
    res.status(500).json({ error: "Failed to save application." });
  }
});

applicationsRouter.put("/:id", (req, res) => {
  const updated = updateApplication(req.params.id, req.body ?? {});
  if (!updated) {
    return res.status(404).json({ error: "Application not found." });
  }
  res.json(updated);
});

applicationsRouter.delete("/:id", (req, res) => {
  deleteApplication(req.params.id);
  res.status(204).end();
});

applicationsRouter.post("/capture", async (req, res) => {
  const { url, pageText } = req.body ?? {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "'url' is required." });
  }
  if (!pageText || typeof pageText !== "string") {
    return res.status(400).json({ error: "'pageText' is required." });
  }

  const existing = getApplicationByUrl(url);
  if (existing) {
    return res.json({ existing: true, application: existing });
  }

  try {
    const fields = await extractJobFields(pageText, url);
    const background = getSetting("background");

    let applicabilityScore: number | null = null;
    let scoreRationale = "";
    if (background.trim()) {
      const scored = await scoreApplication({
        jobDescription: fields.jobDescription,
        jobTitle: fields.jobTitle,
        companyName: fields.companyName,
        background,
      });
      applicabilityScore = scored.score;
      scoreRationale = scored.rationale;
    }

    const application = createApplication({
      appliedDate: todayIsoDate(),
      sourceUrl: url,
      companyUrl: fields.companyUrl,
      companyName: fields.companyName,
      jobTitle: fields.jobTitle,
      jobDescription: fields.jobDescription,
      applicabilityScore,
      scoreRationale,
      coverLetter: "",
    });

    res.status(201).json({ existing: false, application });
  } catch (err) {
    console.error("capture error:", err);
    res.status(500).json({ error: friendlyErrorMessage(err, "Failed to capture job posting.") });
  }
});
