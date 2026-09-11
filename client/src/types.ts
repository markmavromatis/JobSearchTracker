export interface JobApplication {
  id: string;
  appliedDate: string; // yyyy-mm-dd
  sourceUrl: string;
  companyUrl: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  applicabilityScore: number | null;
  scoreRationale: string;
  coverLetter: string;
  createdAt: string; // ISO timestamp
}

export type NewJobApplication = Omit<JobApplication, "id" | "createdAt">;
