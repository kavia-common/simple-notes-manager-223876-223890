import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { NotesList } from "./components/NotesList";
import { NoteEditor } from "./components/NoteEditor";
import { Modal } from "./components/Modal";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { getNotesRepository, getPersistenceLabel } from "./services/notesRepository";

const THEME_KEY = "simple_notes_manager.theme.v1";

function normalize(text) {
  return (text || "").toLowerCase();
}

function noteMatches(note, q) {
  const nq = normalize(q).trim();
  if (!nq) return true;
  return (
    normalize(note.title).includes(nq) ||
    normalize(note.content).includes(nq)
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Retro-themed notes app: list/detail + create/edit/delete + search. */
  const repo = useMemo(() => getNotesRepository(), []);
  const persistenceLabel = useMemo(() => getPersistenceLabel(), []);
  const isMobile = useMediaQuery("(max-width: 860px)");

  const [theme, setTheme] = useLocalStorageState(THEME_KEY, "light");
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");

  // UI state: view/edit/create
  const [mode, setMode] = useState("view"); // "view" | "edit" | "create"
  const [error, setError] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  async function refreshNotes({ keepSelection = true } = {}) {
    setError(null);
    try {
      const list = await repo.list();
      setNotes(list);

      if (!keepSelection) return;

      if (selectedId && list.some((n) => n.id === selectedId)) return;
      setSelectedId(list[0]?.id || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notes.");
    }
  }

  useEffect(() => {
    refreshNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => noteMatches(n, search));
  }, [notes, search]);

  const selectedNote = useMemo(() => {
    return notes.find((n) => n.id === selectedId) || null;
  }, [notes, selectedId]);

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  async function handleCreate() {
    setError(null);
    try {
      const created = await repo.create({ title: "Untitled", content: "" });
      await refreshNotes({ keepSelection: false });
      setSelectedId(created.id);
      setMode("create");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create note.");
    }
  }

  async function handleSave({ title, content }) {
    if (!selectedId) return;
    setError(null);
    try {
      if (mode === "create") {
        // In local repo, create already happened; treat as update to set real title/content.
        await repo.update(selectedId, { title, content });
      } else {
        await repo.update(selectedId, { title, content });
      }
      await refreshNotes();
      setMode("view");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save note.");
    }
  }

  function handleSelect(id) {
    setSelectedId(id);
    setMode("view");
  }

  function handleRequestEdit() {
    setMode("edit");
  }

  function handleCancelEdit() {
    // If we were in create mode and cancel, remove empty note if still empty.
    if (mode === "create" && selectedId) {
      const n = notes.find((x) => x.id === selectedId);
      const isBlank = !((n?.title || "").trim()) && !((n?.content || "").trim());
      // Even if not blank, just leave it as-is; cancel returns to view.
      if (isBlank) {
        setConfirmDeleteOpen(true);
        return;
      }
    }
    setMode("view");
  }

  function handleDeleteRequest() {
    setConfirmDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!selectedId) return;
    setConfirmDeleteOpen(false);
    setError(null);
    try {
      await repo.remove(selectedId);
      setMode("view");
      setSelectedId(null);
      await refreshNotes({ keepSelection: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete note.");
    }
  }

  function handleDeleteCancel() {
    setConfirmDeleteOpen(false);
    // If cancelling from "create" cancel flow, keep editing.
    // Otherwise keep current state.
  }

  // Mobile: open editor modal when a note selected or creating
  const showEditorModal = isMobile && Boolean(selectedNote);

  return (
    <div className="App" data-theme={theme}>
      <header className="topBar">
        <div className="brand">
          <div className="brandMark" aria-hidden="true">
            SNM
          </div>
          <div className="brandText">
            <div className="brandTitle">Simple Notes Manager</div>
            <div className="brandSub">
              Retro vibes • Persistence: <span className="kbd">{persistenceLabel}</span>
            </div>
          </div>
        </div>

        <div className="topActions">
          <button
            className="btn btnGhost"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
          <button className="btn btnPrimary" onClick={handleCreate}>
            + New Note
          </button>
        </div>
      </header>

      {error ? (
        <div className="banner" role="alert">
          <div className="bannerText">{error}</div>
          <button className="btn btnGhost" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <main className={`workspace ${isMobile ? "isMobile" : ""}`}>
        <NotesList
          notes={filteredNotes}
          selectedId={selectedId}
          search={search}
          onSearchChange={setSearch}
          onSelect={handleSelect}
          onCreate={handleCreate}
        />

        {!isMobile ? (
          <NoteEditor
            note={selectedNote}
            mode={selectedNote ? mode : "view"}
            onRequestEdit={handleRequestEdit}
            onCancelEdit={handleCancelEdit}
            onSave={handleSave}
            onDelete={handleDeleteRequest}
            isMobile={false}
          />
        ) : (
          <div className="mobileHint">
            <div className="emptyState">
              <div className="emptyTitle">Tap a note to view</div>
              <div className="emptyText">Use “New Note” to create one.</div>
            </div>
          </div>
        )}

        {showEditorModal ? (
          <Modal title="Note" onClose={() => setSelectedId(null)}>
            <NoteEditor
              note={selectedNote}
              mode={mode}
              onRequestEdit={handleRequestEdit}
              onCancelEdit={handleCancelEdit}
              onSave={handleSave}
              onDelete={handleDeleteRequest}
              isMobile={true}
              onBack={() => setSelectedId(null)}
            />
          </Modal>
        ) : null}

        {confirmDeleteOpen ? (
          <Modal
            title="Delete note?"
            onClose={handleDeleteCancel}
          >
            <div className="confirm">
              <p className="confirmText">
                This will permanently remove <strong>{selectedNote?.title || "this note"}</strong>.
              </p>
              <div className="confirmActions">
                <button className="btn btnDanger" onClick={handleDeleteConfirm}>
                  Delete
                </button>
                <button className="btn btnGhost" onClick={handleDeleteCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        ) : null}
      </main>

      <footer className="footer">
        <span className="muted">
          Tip: Use search to filter by title/content. Your theme is saved locally.
        </span>
      </footer>
    </div>
  );
}

export default App;
