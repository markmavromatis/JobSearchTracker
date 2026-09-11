import { Router } from "express";
import { anthropic, MODEL, extractJsonBlock, friendlyErrorMessage } from "../anthropic.js";

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
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are assessing how well a candidate's background matches a job posting. Return ONLY a JSON object (no prose, no markdown fences) with these exact keys:
- "score": integer from 0 to 100 representing how applicable/qualified the candidate is for this role
- "rationale": a short (1-3 sentence) explanation of the score, mentioning key matches or gaps

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

    const parsed = extractJsonBlock(textBlock.text) as {
      score?: number;
      rationale?: string;
    };

    res.json({
      score: typeof parsed.score === "number" ? parsed.score : null,
      rationale: parsed.rationale ?? "",
    });
  } catch (err) {
    console.error("score error:", err);
    res.status(500).json({
      error: friendlyErrorMessage(err, "Failed to compute applicability score."),
    });
  }
});
