import React, { useEffect, useMemo, useState } from "react";
import "../App.css";

function computeWordCount(text) {
  const t = (text || "").trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

// PUBLIC_INTERFACE
export function NoteEditor({
  note,
  mode,
  onRequestEdit,
  onCancelEdit,
  onSave,
  onDelete,
  isMobile,
  onBack
}) {
  /**
   * Right pane for viewing/editing a note.
   * mode: "view" | "edit" | "create"
   */
  const isEditing = mode === "edit" || mode === "create";

  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");

  useEffect(() => {
    setTitle(note?.title || "");
    setContent(note?.content || "");
  }, [note?.id, note?.title, note?.content]);

  const stats = useMemo(() => {
    const words = computeWordCount(content);
    const chars = (content || "").length;
    return { words, chars };
  }, [content]);

  if (!note) {
    return (
      <section className="panel panelRight" aria-label="Note details">
        <div className="panelHeader">
          <div className="panelHeaderTop">
            <h2 className="panelTitle">Details</h2>
          </div>
        </div>
        <div className="emptyState">
          <div className="emptyTitle">Select a note</div>
          <div className="emptyText">Choose a note from the list or create a new one.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel panelRight" aria-label="Note editor">
      <div className="panelHeader">
        <div className="panelHeaderTop">
          <div className="panelTitleRow">
            {isMobile ? (
              <button className="btn btnGhost" onClick={onBack} aria-label="Back to list">
                ← Back
              </button>
            ) : null}
            <h2 className="panelTitle">{mode === "create" ? "New Note" : isEditing ? "Edit Note" : "Note"}</h2>
          </div>

          <div className="actions">
            {!isEditing ? (
              <>
                <button className="btn btnPrimary" onClick={onRequestEdit}>
                  Edit
                </button>
                <button className="btn btnDanger" onClick={onDelete}>
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btnPrimary"
                  onClick={() => onSave({ title, content })}
                  disabled={!title.trim() && !content.trim()}
                >
                  Save
                </button>
                <button className="btn btnGhost" onClick={onCancelEdit}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="statsBar" aria-label="Note statistics">
          <span className="badge">{stats.words} words</span>
          <span className="badge">{stats.chars} chars</span>
          {note.updatedAt ? <span className="muted">Updated: {new Date(note.updatedAt).toLocaleString()}</span> : null}
        </div>
      </div>

      <div className="editor">
        <label className="fieldLabel" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          className="input inputTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          disabled={!isEditing}
        />

        <label className="fieldLabel" htmlFor="content">
          Content
        </label>
        <textarea
          id="content"
          className="textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write something rad…"
          disabled={!isEditing}
          rows={isMobile ? 12 : 18}
        />
      </div>
    </section>
  );
}
