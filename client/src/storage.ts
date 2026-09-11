import type { JobApplication, NewJobApplication } from "./types";

const APPLICATIONS_KEY = "jobSearchTracker.applications";
const BACKGROUND_KEY = "jobSearchTracker.background";

export function loadApplications(): JobApplication[] {
  try {
    const raw = localStorage.getItem(APPLICATIONS_KEY);
    return raw ? (JSON.parse(raw) as JobApplication[]) : [];
  } catch {
    return [];
  }
}

function saveApplications(applications: JobApplication[]): void {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
}

export function addApplication(data: NewJobApplication): JobApplication {
  const application: JobApplication = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const applications = [...loadApplications(), application];
  saveApplications(applications);
  return application;
}

export function updateApplication(
  id: string,
  updates: Partial<Omit<JobApplication, "id" | "createdAt">>
): JobApplication[] {
  const applications = loadApplications().map((app) =>
    app.id === id ? { ...app, ...updates } : app
  );
  saveApplications(applications);
  return applications;
}

export function deleteApplication(id: string): JobApplication[] {
  const applications = loadApplications().filter((app) => app.id !== id);
  saveApplications(applications);
  return applications;
}

export function loadBackground(): string {
  return localStorage.getItem(BACKGROUND_KEY) ?? "";
}

export function saveBackground(background: string): void {
  localStorage.setItem(BACKGROUND_KEY, background);
}
