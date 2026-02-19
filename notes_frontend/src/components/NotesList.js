import React from "react";
import "../App.css";

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

function getPreview(content) {
  const trimmed = (content || "").trim().replace(/\s+/g, " ");
  return trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed;
}

// PUBLIC_INTERFACE
export function NotesList({
  notes,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  onCreate
}) {
  /** Left rail list of notes with search and create button. */
  return (
    <section className="panel panelLeft" aria-label="Notes list">
      <div className="panelHeader">
        <div className="panelHeaderTop">
          <h2 className="panelTitle">Notes</h2>
          <button className="btn btnPrimary" onClick={onCreate}>
            + New
          </button>
        </div>

        <label className="fieldLabel" htmlFor="search">
          Search
        </label>
        <input
          id="search"
          className="input"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search title or content…"
        />
      </div>

      <div className="list" role="listbox" aria-label="Notes">
        {notes.length === 0 ? (
          <div className="emptyState">
            <div className="emptyTitle">No notes found</div>
            <div className="emptyText">Create a note to get started.</div>
          </div>
        ) : (
          notes.map((note) => {
            const active = note.id === selectedId;
            return (
              <button
                key={note.id}
                type="button"
                className={`listItem ${active ? "isActive" : ""}`}
                onClick={() => onSelect(note.id)}
                role="option"
                aria-selected={active}
              >
                <div className="listItemTitle">{note.title || "Untitled"}</div>
                <div className="listItemMeta">
                  <span className="listItemDate">{formatDate(note.updatedAt || note.createdAt)}</span>
                  <span className="listItemDot">•</span>
                  <span className="listItemPreview">{getPreview(note.content)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
