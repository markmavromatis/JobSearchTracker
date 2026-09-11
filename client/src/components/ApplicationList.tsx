import type { JobApplication } from "../types";

function scoreClass(score: number | null): string {
  if (score === null) return "";
  if (score >= 75) return "score-high";
  if (score >= 45) return "score-mid";
  return "score-low";
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function ApplicationList({
  applications,
  onEdit,
  onDelete,
  onCoverLetter,
}: {
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
  onCoverLetter: (app: JobApplication) => void;
}) {
  const sorted = [...applications].sort((a, b) =>
    b.appliedDate.localeCompare(a.appliedDate)
  );

  if (sorted.length === 0) {
    return (
      <div className="empty-state">
        <p>No applications yet. Click "Add Application" to get started.</p>
      </div>
    );
  }

  return (
    <table className="app-table">
      <thead>
        <tr>
          <th>Applied</th>
          <th>Company</th>
          <th>Job title</th>
          <th>Source</th>
          <th>Score</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((app) => (
          <tr key={app.id}>
            <td>{app.appliedDate}</td>
            <td>
              {app.companyUrl ? (
                <a href={app.companyUrl} target="_blank" rel="noreferrer">
                  {app.companyName}
                </a>
              ) : (
                app.companyName
              )}
            </td>
            <td className="job-title-cell" title={app.jobDescription}>
              {app.jobTitle}
            </td>
            <td>
              {app.sourceUrl ? (
                <a href={app.sourceUrl} target="_blank" rel="noreferrer">
                  {hostname(app.sourceUrl)}
                </a>
              ) : (
                "—"
              )}
            </td>
            <td>
              <span
                className={`score-badge ${scoreClass(app.applicabilityScore)}`}
                title={app.scoreRationale}
              >
                {app.applicabilityScore ?? "—"}
              </span>
            </td>
            <td className="actions-cell">
              <button onClick={() => onCoverLetter(app)}>Cover letter</button>
              <button className="secondary" onClick={() => onEdit(app)}>
                Edit
              </button>
              <button className="danger" onClick={() => onDelete(app.id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
