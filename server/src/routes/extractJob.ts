import { Router } from "express";
import * as cheerio from "cheerio";
import { friendlyErrorMessage } from "../anthropic.js";
import { extractJobFields } from "../jobService.js";

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
    const fields = await extractJobFields(pageText, url);
    res.json({ ...fields, sourceUrl: url });
  } catch (err) {
    console.error("extract-job error:", err);
    res.status(500).json({
      error: friendlyErrorMessage(err, "Failed to extract job details."),
    });
  }
});
