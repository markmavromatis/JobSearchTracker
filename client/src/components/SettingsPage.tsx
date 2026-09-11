import { useState } from "react";

export function SettingsPage({
  background,
  onSave,
}: {
  background: string;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(background);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onSave(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="settings-page">
      <h2>Your background</h2>
      <p className="settings-hint">
        Paste a summary of your resume, skills, and experience. This is used to compute the
        applicability score for each job and to tailor generated cover letters.
      </p>
      <textarea
        rows={18}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. Senior software engineer with 8 years building backend systems in Go and TypeScript..."
      />
      <div className="form-actions">
        <button className="primary" onClick={handleSave}>
          {saved ? "Saved!" : "Save"}
        </button>
      </div>
    </div>
  );
}
