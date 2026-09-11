import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn(
    "ANTHROPIC_API_KEY is not set. AI features (auto-populate, scoring, cover letters) will fail until it is configured in server/.env"
  );
}

export const anthropic = new Anthropic({ apiKey });

export const MODEL = "claude-sonnet-5";

export function extractJsonBlock(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  return JSON.parse(candidate.trim());
}

export function friendlyErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 401) {
      return "The server's Anthropic API key is missing or invalid. Set ANTHROPIC_API_KEY in server/.env.";
    }
    if (err.status === 429) {
      return "Anthropic API rate limit reached. Please try again shortly.";
    }
    return fallback;
  }
  if (err instanceof Error && !err.message.includes("{")) {
    return err.message;
  }
  return fallback;
}
