import { useState } from "react";
import "./App.css";
import type { JobApplication, NewJobApplication } from "./types";
import {
  addApplication,
  deleteApplication,
  loadApplications,
  loadBackground,
  saveBackground,
  updateApplication,
} from "./storage";
import { ApplicationList } from "./components/ApplicationList";
import { ApplicationForm } from "./components/ApplicationForm";
import { CoverLetterModal } from "./components/CoverLetterModal";
import { SettingsPage } from "./components/SettingsPage";

type View = "list" | "settings";

function App() {
  const [applications, setApplications] = useState<JobApplication[]>(loadApplications());
  const [background, setBackground] = useState(loadBackground());
  const [view, setView] = useState<View>("list");

  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | undefined>(undefined);
  const [coverLetterApp, setCoverLetterApp] = useState<JobApplication | undefined>(undefined);

  function handleAdd() {
    setEditingApp(undefined);
    setShowForm(true);
  }

  function handleEdit(app: JobApplication) {
    setEditingApp(app);
    setShowForm(true);
  }

  function handleSave(data: NewJobApplication) {
    if (editingApp) {
      setApplications(updateApplication(editingApp.id, data));
    } else {
      addApplication(data);
      setApplications(loadApplications());
    }
    setShowForm(false);
    setEditingApp(undefined);
  }

  function handleDelete(id: string) {
    if (confirm("Delete this application?")) {
      setApplications(deleteApplication(id));
    }
  }

  function handleBackgroundSave(value: string) {
    saveBackground(value);
    setBackground(value);
  }

  function handleCoverLetterSave(coverLetter: string) {
    if (!coverLetterApp) return;
    setApplications(updateApplication(coverLetterApp.id, { coverLetter }));
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
