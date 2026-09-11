import { Router } from "express";
import { anthropic, MODEL, friendlyErrorMessage } from "../anthropic.js";

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
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `Write a cover letter body for the job below, tailored to the candidate's background. Output ONLY the cover letter body text (no subject line, no address block, no markdown, no surrounding commentary) so it can be pasted directly into a job application text box. Keep it to 3-4 concise paragraphs, professional but not generic, referencing specific relevant experience from the background and specific requirements from the job description.

Candidate background:
"""
${background}
"""

Job title: ${jobTitle ?? "Unknown"}
Company: ${companyName ?? "Unknown"}
Job description:
"""
${jobDescription}
"""`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from model");
    }

    res.json({ coverLetter: textBlock.text.trim() });
  } catch (err) {
    console.error("cover-letter error:", err);
    res.status(500).json({
      error: friendlyErrorMessage(err, "Failed to generate cover letter."),
    });
  }
});
