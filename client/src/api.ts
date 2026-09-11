export interface ExtractedJob {
  companyName: string;
  companyUrl: string;
  jobTitle: string;
  jobDescription: string;
  sourceUrl: string;
}

export interface ScoreResult {
  score: number | null;
  rationale: string;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Request to ${path} failed`);
  }
  return data as T;
}

export function extractJobFromUrl(url: string): Promise<ExtractedJob> {
  return postJson<ExtractedJob>("/api/extract-job", { url });
}

export function scoreApplicability(params: {
  jobDescription: string;
  jobTitle: string;
  companyName: string;
  background: string;
}): Promise<ScoreResult> {
  return postJson<ScoreResult>("/api/score", params);
}

export function generateCoverLetter(params: {
  jobDescription: string;
  jobTitle: string;
  companyName: string;
  background: string;
}): Promise<{ coverLetter: string }> {
  return postJson<{ coverLetter: string }>("/api/cover-letter", params);
}
