import type { JobApplication, NewJobApplication } from "./types";

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

async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) {
    return undefined as T;
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Request to ${path} failed`);
  }
  return data as T;
}

export function extractJobFromUrl(url: string): Promise<ExtractedJob> {
  return request<ExtractedJob>("/api/extract-job", "POST", { url });
}

export function scoreApplicability(params: {
  jobDescription: string;
  jobTitle: string;
  companyName: string;
  background: string;
}): Promise<ScoreResult> {
  return request<ScoreResult>("/api/score", "POST", params);
}

export function generateCoverLetter(params: {
  jobDescription: string;
  jobTitle: string;
  companyName: string;
  background: string;
}): Promise<{ coverLetter: string }> {
  return request<{ coverLetter: string }>("/api/cover-letter", "POST", params);
}

export function fetchApplications(): Promise<JobApplication[]> {
  return request<JobApplication[]>("/api/applications", "GET");
}

export function createApplication(data: NewJobApplication): Promise<JobApplication> {
  return request<JobApplication>("/api/applications", "POST", data);
}

export function saveApplication(
  id: string,
  updates: Partial<NewJobApplication>
): Promise<JobApplication> {
  return request<JobApplication>(`/api/applications/${id}`, "PUT", updates);
}

export function removeApplication(id: string): Promise<void> {
  return request<void>(`/api/applications/${id}`, "DELETE");
}

export function fetchBackground(): Promise<{ background: string }> {
  return request<{ background: string }>("/api/settings", "GET");
}

export function saveBackgroundSetting(background: string): Promise<{ background: string }> {
  return request<{ background: string }>("/api/settings", "PUT", { background });
}
