import { Router } from "express";
import { friendlyErrorMessage } from "../anthropic.js";
import { generateCoverLetterText } from "../jobService.js";

export const coverLetterRouter = Router();

coverLetterRouter.post("/", async (req, res) => {
  const { jobDescription, jobTitle, companyName, background } = req.body ?? {};
  if (!jobDescription || typeof jobDescription !== "string") {
    return res.status(400).json({ error: "'jobDescription' is required." });
  }
  if (!background || typeof background !== "string") {
    return res.status(400).json({
      error: "No background/resume found. Add your background in Settings first.",
    });
  }

  try {
    const coverLetter = await generateCoverLetterText({
      jobDescription,
      jobTitle,
      companyName,
      background,
    });
    res.json({ coverLetter });
  } catch (err) {
    console.error("cover-letter error:", err);
    res.status(500).json({
      error: friendlyErrorMessage(err, "Failed to generate cover letter."),
    });
  }
});
