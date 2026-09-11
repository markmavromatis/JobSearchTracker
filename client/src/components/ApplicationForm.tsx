import { useState } from "react";
import type { JobApplication, NewJobApplication } from "../types";
import { extractJobFromUrl, scoreApplicability } from "../api";
import { Modal } from "./Modal";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ApplicationForm({
  existing,
  background,
  onSave,
  onClose,
}: {
  existing?: JobApplication;
  background: string;
  onSave: (data: NewJobApplication) => void;
  onClose: () => void;
}) {
  const [sourceUrl, setSourceUrl] = useState(existing?.sourceUrl ?? "");
  const [appliedDate, setAppliedDate] = useState(existing?.appliedDate ?? today());
  const [companyName, setCompanyName] = useState(existing?.companyName ?? "");
  const [companyUrl, setCompanyUrl] = useState(existing?.companyUrl ?? "");
  const [jobTitle, setJobTitle] = useState(existing?.jobTitle ?? "");
  const [jobDescription, setJobDescription] = useState(existing?.jobDescription ?? "");
  const [applicabilityScore, setApplicabilityScore] = useState<number | null>(
    existing?.applicabilityScore ?? null
  );
  const [scoreRationale, setScoreRationale] = useState(existing?.scoreRationale ?? "");
  const [coverLetter] = useState(existing?.coverLetter ?? "");

  const [fetching, setFetching] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState("");

  async function handleFetchFromUrl() {
    if (!sourceUrl.trim()) {
      setError("Enter a job posting URL first.");
      return;
    }
    setError("");
    setFetching(true);
    try {
      const extracted = await extractJobFromUrl(sourceUrl.trim());
      setCompanyName(extracted.companyName);
      setCompanyUrl(extracted.companyUrl);
      setJobTitle(extracted.jobTitle);
      setJobDescription(extracted.jobDescription);

      if (background.trim()) {
        setScoring(true);
        try {
          const result = await scoreApplicability({
            jobDescription: extracted.jobDescription,
            jobTitle: extracted.jobTitle,
            companyName: extracted.companyName,
            background,
          });
          setApplicabilityScore(result.score);
          setScoreRationale(result.rationale);
        } finally {
          setScoring(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch job details.");
    } finally {
      setFetching(false);
    }
  }

  async function handleRescore() {
    if (!jobDescription.trim()) {
      setError("Add a job description before scoring.");
      return;
    }
    if (!background.trim()) {
      setError("Add your background in Settings before scoring.");
      return;
    }
    setError("");
    setScoring(true);
    try {
      const result = await scoreApplicability({
        jobDescription,
        jobTitle,
        companyName,
        background,
      });
      setApplicabilityScore(result.score);
      setScoreRationale(result.rationale);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to score applicability.");
    } finally {
      setScoring(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !jobTitle.trim()) {
      setError("Company name and job title are required.");
      return;
    }
    onSave({
      appliedDate,
      sourceUrl,
      companyUrl,
      companyName,
      jobTitle,
      jobDescription,
      applicabilityScore,
      scoreRationale,
      coverLetter,
    });
  }

  return (
    <Modal title={existing ? "Edit Application" : "Add Application"} onClose={onClose} wide>
      <form className="app-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Job posting URL</label>
          <div className="url-row">
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://example.com/careers/job/123"
            />
            <button type="button" onClick={handleFetchFromUrl} disabled={fetching}>
              {fetching ? "Fetching…" : "Fetch details"}
            </button>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-row">
          <label>Applied date</label>
          <input
            type="date"
            value={appliedDate}
            onChange={(e) => setAppliedDate(e.target.value)}
            required
          />
        </div>

        <div className="form-grid">
          <div className="form-row">
            <label>Company name</label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Company URL</label>
            <input
              type="url"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <label>Job title</label>
          <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
        </div>

        <div className="form-row">
          <label>Job description</label>
          <textarea
            rows={8}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <div className="form-row">
          <label>Applicability score</label>
          <div className="score-row">
            <input
              type="number"
              min={0}
              max={100}
              value={applicabilityScore ?? ""}
              onChange={(e) =>
                setApplicabilityScore(e.target.value === "" ? null : Number(e.target.value))
              }
            />
            <button type="button" onClick={handleRescore} disabled={scoring}>
              {scoring ? "Scoring…" : "Re-score"}
            </button>
          </div>
          {scoreRationale && <p className="score-rationale">{scoreRationale}</p>}
        </div>

        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
