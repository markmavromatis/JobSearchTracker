import { Router } from "express";
import { friendlyErrorMessage } from "../anthropic.js";
import { scoreApplication } from "../jobService.js";

export const scoreRouter = Router();

scoreRouter.post("/", async (req, res) => {
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
    const result = await scoreApplication({ jobDescription, jobTitle, companyName, background });
    res.json(result);
  } catch (err) {
    console.error("score error:", err);
    res.status(500).json({
      error: friendlyErrorMessage(err, "Failed to compute applicability score."),
    });
  }
});
