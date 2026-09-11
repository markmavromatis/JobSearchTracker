import { Router } from "express";
import * as cheerio from "cheerio";
import { anthropic, MODEL, extractJsonBlock, friendlyErrorMessage } from "../anthropic.js";

export const extractJobRouter = Router();

async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch job page (${res.status} ${res.statusText})`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, nav, footer, header").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  return text.slice(0, 20000);
}

extractJobRouter.post("/", async (req, res) => {
  const { url } = req.body ?? {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "A job posting 'url' is required." });
  }

  try {
    const pageText = await fetchPageText(url);

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

    const parsed = extractJsonBlock(textBlock.text) as {
      companyName?: string;
      companyUrl?: string;
      jobTitle?: string;
      jobDescription?: string;
    };

    res.json({
      companyName: parsed.companyName ?? "",
      companyUrl: parsed.companyUrl ?? "",
      jobTitle: parsed.jobTitle ?? "",
      jobDescription: parsed.jobDescription ?? "",
      sourceUrl: url,
    });
  } catch (err) {
    console.error("extract-job error:", err);
    res.status(500).json({
      error: friendlyErrorMessage(err, "Failed to extract job details."),
    });
  }
});
