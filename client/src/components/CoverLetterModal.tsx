import { useEffect, useState } from "react";
import type { JobApplication } from "../types";
import { generateCoverLetter } from "../api";
import { Modal } from "./Modal";

export function CoverLetterModal({
  application,
  background,
  onClose,
  onSave,
}: {
  application: JobApplication;
  background: string;
  onClose: () => void;
  onSave: (coverLetter: string) => void;
}) {
  const [coverLetter, setCoverLetter] = useState(application.coverLetter);
  const [loading, setLoading] = useState(!application.coverLetter);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!background.trim()) {
      setError("Add your background in Settings before generating a cover letter.");
      setLoading(false);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await generateCoverLetter({
        jobDescription: application.jobDescription,
        jobTitle: application.jobTitle,
        companyName: application.companyName,
        background,
      });
      setCoverLetter(result.coverLetter);
      onSave(result.coverLetter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate cover letter.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!application.coverLetter) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal
      title={`Cover Letter — ${application.companyName || "Untitled"}`}
      onClose={onClose}
      wide
    >
      {error && <div className="form-error">{error}</div>}
      {loading ? (
        <p>Generating cover letter…</p>
      ) : (
        <>
          <textarea
            className="cover-letter-text"
            rows={16}
            value={coverLetter}
            onChange={(e) => {
              setCoverLetter(e.target.value);
              onSave(e.target.value);
            }}
          />
          <div className="form-actions">
            <button type="button" className="secondary" onClick={generate} disabled={loading}>
              Regenerate
            </button>
            <button type="button" className="primary" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
