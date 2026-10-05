import { randomUUID } from "node:crypto";
import { db } from "./db.js";

export interface ApplicationRecord {
  id: string;
  appliedDate: string;
  sourceUrl: string;
  companyUrl: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  applicabilityScore: number | null;
  scoreRationale: string;
  coverLetter: string;
  createdAt: string;
}

interface Row {
  id: string;
  applied_date: string;
  source_url: string;
  company_url: string;
  company_name: string;
  job_title: string;
  job_description: string;
  applicability_score: number | null;
  score_rationale: string;
  cover_letter: string;
  created_at: string;
}

function toRecord(row: Row): ApplicationRecord {
  return {
    id: row.id,
    appliedDate: row.applied_date,
    sourceUrl: row.source_url,
    companyUrl: row.company_url,
    companyName: row.company_name,
    jobTitle: row.job_title,
    jobDescription: row.job_description,
    applicabilityScore: row.applicability_score,
    scoreRationale: row.score_rationale,
    coverLetter: row.cover_letter,
    createdAt: row.created_at,
  };
}

export function listApplications(): ApplicationRecord[] {
  const rows = db
    .prepare("SELECT * FROM applications ORDER BY applied_date DESC, created_at DESC")
    .all() as Row[];
  return rows.map(toRecord);
}

export function getApplicationById(id: string): ApplicationRecord | undefined {
  const row = db.prepare("SELECT * FROM applications WHERE id = ?").get(id) as Row | undefined;
  return row ? toRecord(row) : undefined;
}

export function getApplicationByUrl(sourceUrl: string): ApplicationRecord | undefined {
  if (!sourceUrl) return undefined;
  const row = db
    .prepare("SELECT * FROM applications WHERE source_url = ?")
    .get(sourceUrl) as Row | undefined;
  return row ? toRecord(row) : undefined;
}

export type NewApplication = Omit<ApplicationRecord, "id" | "createdAt">;

export function createApplication(data: NewApplication): ApplicationRecord {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO applications
      (id, applied_date, source_url, company_url, company_name, job_title, job_description, applicability_score, score_rationale, cover_letter, created_at)
     VALUES (@id, @appliedDate, @sourceUrl, @companyUrl, @companyName, @jobTitle, @jobDescription, @applicabilityScore, @scoreRationale, @coverLetter, @createdAt)`
  ).run({ id, createdAt, ...data });
  return getApplicationById(id)!;
}

export type ApplicationUpdate = Partial<NewApplication>;

const UPDATABLE_COLUMNS: Record<keyof NewApplication, string> = {
  appliedDate: "applied_date",
  sourceUrl: "source_url",
  companyUrl: "company_url",
  companyName: "company_name",
  jobTitle: "job_title",
  jobDescription: "job_description",
  applicabilityScore: "applicability_score",
  scoreRationale: "score_rationale",
  coverLetter: "cover_letter",
};

export function updateApplication(id: string, updates: ApplicationUpdate): ApplicationRecord | undefined {
  const keys = Object.keys(updates) as (keyof NewApplication)[];
  if (keys.length === 0) return getApplicationById(id);

  const setClause = keys.map((key) => `${UPDATABLE_COLUMNS[key]} = @${key}`).join(", ");
  db.prepare(`UPDATE applications SET ${setClause} WHERE id = @id`).run({ id, ...updates });
  return getApplicationById(id);
}

export function deleteApplication(id: string): void {
  db.prepare("DELETE FROM applications WHERE id = ?").run(id);
}
