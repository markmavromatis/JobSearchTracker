import { anthropic, MODEL, extractJsonBlock } from "./anthropic.js";

export interface ExtractedJobFields {
  companyName: string;
  companyUrl: string;
  jobTitle: string;
  jobDescription: string;
}

export async function extractJobFields(pageText: string, url: string): Promise<ExtractedJobFields> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Extract job posting details from the following page text. Return ONLY a JSON object (no prose, no markdown fences) with these exact keys:
- "companyName": string
- "companyUrl": string (the company's main website/homepage URL if you can determine or reasonably infer it, otherwise empty string)
- "jobTitle": string
- "jobDescription": string (the full job description text, cleaned up and reasonably concise, preserving key responsibilities/requirements)

Page URL: ${url}

Page text:
"""
${pageText}
"""`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from model");
  }

  const parsed = extractJsonBlock(textBlock.text) as Partial<ExtractedJobFields>;
  return {
    companyName: parsed.companyName ?? "",
    companyUrl: parsed.companyUrl ?? "",
    jobTitle: parsed.jobTitle ?? "",
    jobDescription: parsed.jobDescription ?? "",
  };
}

export interface ScoreResult {
  score: number | null;
  rationale: string;
}

export async function scoreApplication(params: {
  jobDescription: string;
  jobTitle: string;
  companyName: string;
  background: string;
}): Promise<ScoreResult> {
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
${params.background}
"""

Job title: ${params.jobTitle || "Unknown"}
Company: ${params.companyName || "Unknown"}
Job description:
"""
${params.jobDescription}
"""`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from model");
  }

  const parsed = extractJsonBlock(textBlock.text) as { score?: number; rationale?: string };
  return {
    score: typeof parsed.score === "number" ? parsed.score : null,
    rationale: parsed.rationale ?? "",
  };
}

export async function generateCoverLetterText(params: {
  jobDescription: string;
  jobTitle: string;
  companyName: string;
  background: string;
}): Promise<string> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1200,
    messages: [
      {
        role: "user",
        content: `Write a cover letter body for the job below, tailored to the candidate's background. Output ONLY the cover letter body text (no subject line, no address block, no markdown, no surrounding commentary) so it can be pasted directly into a job application text box. Keep it to 3-4 concise paragraphs, professional but not generic, referencing specific relevant experience from the background and specific requirements from the job description.

Candidate background:
"""
${params.background}
"""

Job title: ${params.jobTitle || "Unknown"}
Company: ${params.companyName || "Unknown"}
Job description:
"""
${params.jobDescription}
"""`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from model");
  }
  return textBlock.text.trim();
}
