const STORAGE_KEY = "simple_notes_manager.notes.v1";

/**
 * @typedef {Object} Note
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * Very small, deterministic ID generator suitable for local notes.
 * Not cryptographically secure; avoids bringing in dependencies.
 */
function generateId() {
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch (_e) {
    return fallback;
  }
}

function sortNotes(notes) {
  return [...notes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

function getApiBase() {
  return (
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    ""
  ).replace(/\/$/, "");
}

function isApiEnabled() {
  // Enable API mode if feature flags include "api"
  // OR experiments enabled is truthy.
  const flags = (process.env.REACT_APP_FEATURE_FLAGS || "").toLowerCase();
  const experiments = (process.env.REACT_APP_EXPERIMENTS_ENABLED || "").toLowerCase();
  const apiBase = getApiBase();
  return Boolean(apiBase) && (flags.includes("api") || ["1", "true", "yes", "on"].includes(experiments));
}

/**
 * LocalStorage repository (default).
 */
const localRepo = {
  async list() {
    /** @type {Note[]} */
    const notes = safeJsonParse(localStorage.getItem(STORAGE_KEY) || "[]", []);
    return sortNotes(notes);
  },

  async get(id) {
    const notes = await this.list();
    return notes.find((n) => n.id === id) || null;
  },

  async create({ title, content }) {
    const now = Date.now();
    /** @type {Note} */
    const note = {
      id: generateId(),
      title: title || "Untitled",
      content: content || "",
      createdAt: now,
      updatedAt: now
    };

    const notes = await this.list();
    const next = sortNotes([note, ...notes]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return note;
  },

  async update(id, { title, content }) {
    const notes = await this.list();
    const idx = notes.findIndex((n) => n.id === id);
    if (idx === -1) return null;

    const existing = notes[idx];
    const updated = {
      ...existing,
      title: (title ?? existing.title) || "Untitled",
      content: content ?? existing.content,
      updatedAt: Date.now()
    };

    const next = [...notes];
    next[idx] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sortNotes(next)));
    return updated;
  },

  async remove(id) {
    const notes = await this.list();
    const next = notes.filter((n) => n.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sortNotes(next)));
    return next.length !== notes.length;
  }
};

/**
 * Optional REST repository. This is intentionally conservative and only used when enabled.
 * Expected endpoints (best-effort):
 *  - GET    /notes
 *  - GET    /notes/:id
 *  - POST   /notes
 *  - PUT    /notes/:id
 *  - DELETE /notes/:id
 */
const apiRepo = {
  async list() {
    const res = await fetch(`${getApiBase()}/notes`, { method: "GET" });
    if (!res.ok) throw new Error(`Failed to list notes (${res.status})`);
    const data = await res.json();
    return sortNotes(Array.isArray(data) ? data : data.notes || []);
  },

  async get(id) {
    const res = await fetch(`${getApiBase()}/notes/${encodeURIComponent(id)}`, { method: "GET" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to get note (${res.status})`);
    return await res.json();
  },

  async create({ title, content }) {
    const res = await fetch(`${getApiBase()}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    if (!res.ok) throw new Error(`Failed to create note (${res.status})`);
    return await res.json();
  },

  async update(id, { title, content }) {
    const res = await fetch(`${getApiBase()}/notes/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to update note (${res.status})`);
    return await res.json();
  },

  async remove(id) {
    const res = await fetch(`${getApiBase()}/notes/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.status === 404) return false;
    if (!res.ok) throw new Error(`Failed to delete note (${res.status})`);
    return true;
  }
};

// PUBLIC_INTERFACE
export function getNotesRepository() {
  /** Returns the active notes repository based on env flags. */
  return isApiEnabled() ? apiRepo : localRepo;
}

// PUBLIC_INTERFACE
export function getPersistenceLabel() {
  /** Returns a short label to show in the UI. */
  return isApiEnabled() ? "API" : "Local";
}
