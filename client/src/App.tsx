import { useEffect, useState } from "react";
import "./App.css";
import type { JobApplication, NewJobApplication } from "./types";
import {
  createApplication,
  fetchApplications,
  fetchBackground,
  removeApplication,
  saveApplication,
  saveBackgroundSetting,
} from "./api";
import { ApplicationList } from "./components/ApplicationList";
import { ApplicationForm } from "./components/ApplicationForm";
import { CoverLetterModal } from "./components/CoverLetterModal";
import { SettingsPage } from "./components/SettingsPage";

type View = "list" | "settings";

function App() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [background, setBackground] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState<View>("list");

  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | undefined>(undefined);
  const [coverLetterApp, setCoverLetterApp] = useState<JobApplication | undefined>(undefined);

  useEffect(() => {
    Promise.all([fetchApplications(), fetchBackground()])
      .then(([apps, settings]) => {
        setApplications(apps);
        setBackground(settings.background);
      })
      .catch((err) => {
        setLoadError(
          err instanceof Error
            ? `Could not reach the server: ${err.message}`
            : "Could not reach the server."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  function handleAdd() {
    setEditingApp(undefined);
    setShowForm(true);
  }

  function handleEdit(app: JobApplication) {
    setEditingApp(app);
    setShowForm(true);
  }

  async function handleSave(data: NewJobApplication) {
    if (editingApp) {
      const updated = await saveApplication(editingApp.id, data);
      setApplications((prev) => prev.map((app) => (app.id === updated.id ? updated : app)));
    } else {
      const created = await createApplication(data);
      setApplications((prev) => [...prev, created]);
    }
    setShowForm(false);
    setEditingApp(undefined);
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this application?")) {
      await removeApplication(id);
      setApplications((prev) => prev.filter((app) => app.id !== id));
    }
  }

  async function handleBackgroundSave(value: string) {
    await saveBackgroundSetting(value);
    setBackground(value);
  }

  async function handleCoverLetterSave(coverLetter: string) {
    if (!coverLetterApp) return;
    const updated = await saveApplication(coverLetterApp.id, { coverLetter });
    setApplications((prev) => prev.map((app) => (app.id === updated.id ? updated : app)));
  }

  if (loading) {
    return (
      <div className="app-shell">
        <p>Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-shell">
        <div className="form-error">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Job Search Tracker</h1>
        <nav>
          <button
            className={view === "list" ? "nav-active" : ""}
            onClick={() => setView("list")}
          >
            Applications
          </button>
          <button
            className={view === "settings" ? "nav-active" : ""}
            onClick={() => setView("settings")}
          >
            Settings
          </button>
        </nav>
      </header>

      <main className="app-main">
        {view === "list" ? (
          <>
            <div className="toolbar">
              <button className="primary" onClick={handleAdd}>
                Add Application
              </button>
            </div>
            <ApplicationList
              applications={applications}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCoverLetter={setCoverLetterApp}
            />
          </>
        ) : (
          <SettingsPage background={background} onSave={handleBackgroundSave} />
        )}
      </main>

      {showForm && (
        <ApplicationForm
          existing={editingApp}
          background={background}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingApp(undefined);
          }}
        />
      )}

      {coverLetterApp && (
        <CoverLetterModal
          application={coverLetterApp}
          background={background}
          onSave={handleCoverLetterSave}
          onClose={() => setCoverLetterApp(undefined)}
        />
      )}
    </div>
  );
}

export default App;
