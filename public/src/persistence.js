// Persistence adapters for the existing City Moon runtime.
// The legacy key and field names remain stable so existing player saves migrate in place.
export const SAVE_KEY = 'cityMoon3dSave';
export const SAVE_SCHEMA_VERSION = 2;

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);

export class SaveSystem {
  constructor(storage, key = SAVE_KEY) {
    this.storage = storage || null;
    this.key = key;
  }

  readRaw() {
    try {
      if (!this.storage || typeof this.storage.getItem !== 'function') return { ok: false, value: null, reason: 'unavailable' };
      const raw = this.storage.getItem(this.key);
      if (raw == null || raw === '') return { ok: true, value: null, empty: true };
      const value = JSON.parse(raw);
      if (!isRecord(value)) return { ok: false, value: null, reason: 'invalid-shape' };
      return { ok: true, value };
    } catch (error) {
      return { ok: false, value: null, reason: 'read-error', error };
    }
  }

  normalize(candidate, defaults) {
    if (!isRecord(candidate) || (Number.isInteger(candidate.schemaVersion) && candidate.schemaVersion > SAVE_SCHEMA_VERSION)) return null;
    const base = isRecord(defaults) ? defaults : {};
    const next = { ...base, ...candidate, schemaVersion: SAVE_SCHEMA_VERSION };

    next.scene = typeof candidate.scene === 'string' ? candidate.scene : base.scene;
    next.pending = typeof candidate.pending === 'string' || candidate.pending === null ? candidate.pending : base.pending;
    next.loc = typeof candidate.loc === 'string' ? candidate.loc : base.loc;
    next.trust = finite(candidate.trust) ? candidate.trust : (finite(base.trust) ? base.trust : 0);
    next.compassion = finite(candidate.compassion) ? candidate.compassion : (finite(base.compassion) ? base.compassion : 0);
    next.clues = Array.isArray(candidate.clues) ? [...new Set(candidate.clues.filter(v => typeof v === 'string'))] : [...(base.clues || [])];
    next.orbs = Array.isArray(candidate.orbs)
      ? [...new Set(candidate.orbs.filter(v => Number.isInteger(v) && v >= 0 && v <= 9))]
      : [...(base.orbs || [])];
    next.history = Array.isArray(candidate.history)
      ? candidate.history.filter(item => isRecord(item) && typeof item.id === 'string')
      : [...(base.history || [])];
    next.flags = isRecord(candidate.flags) ? { ...(base.flags || {}), ...candidate.flags } : { ...(base.flags || {}) };
    next.pos = Array.isArray(candidate.pos) && candidate.pos.length >= 2 && finite(candidate.pos[0]) && finite(candidate.pos[1])
      ? [candidate.pos[0], candidate.pos[1]]
      : [...(base.pos || [0, 18])];
    next.yaw = finite(candidate.yaw) ? candidate.yaw : (finite(base.yaw) ? base.yaw : 0);
    return next;
  }

  load(defaults) {
    const result = this.readRaw();
    if (!result.ok || !result.value) return null;
    const state = this.normalize(result.value, defaults);
    if (!state) return null;
    // Upgrade the existing legacy record in place; never switch to a new storage key.
    if (result.value.schemaVersion !== SAVE_SCHEMA_VERSION) this.save(state);
    return state;
  }

  hasSave() {
    const result = this.readRaw();
    return result.ok && !!result.value && this.normalize(result.value, {}) !== null;
  }

  save(state) {
    try {
      if (!this.storage || typeof this.storage.setItem !== 'function') return false;
      const normalized = this.normalize(state, {});
      if (!normalized) return false;
      this.storage.setItem(this.key, JSON.stringify(normalized));
      return true;
    } catch (error) {
      return false;
    }
  }

  clear() {
    try {
      if (!this.storage || typeof this.storage.removeItem !== 'function') return false;
      this.storage.removeItem(this.key);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export class MemoryManager {
  constructor(memoryIds, onProgress = () => {}) {
    this.ids = new Set(memoryIds.filter(id => Number.isInteger(id) && id >= 0));
    this.onProgress = onProgress;
  }

  sync(state) {
    if (!Array.isArray(state.orbs)) state.orbs = [];
    state.orbs = [...new Set(state.orbs.filter(id => this.ids.has(id)))];
    const progress = this.progress(state);
    this.onProgress(progress, state.orbs.length, this.ids.size);
    return progress;
  }

  progress(state) {
    return this.ids.size === 0 ? 0 : Math.min(1, state.orbs.filter(id => this.ids.has(id)).length / this.ids.size);
  }

  collect(id, state, persist, beforePersist = () => {}) {
    if (!this.ids.has(id)) return { status: 'unknown', progress: this.progress(state) };
    if (state.orbs.includes(id)) return { status: 'duplicate', progress: this.progress(state) };

    const previousOrbs = [...state.orbs];
    const previousClues = [...state.clues];
    state.orbs.push(id);
    try {
      beforePersist(state, this.progress(state));
    } catch (error) {
      state.orbs = previousOrbs;
      state.clues = previousClues;
      return { status: 'callback-error', progress: this.progress(state) };
    }
    if (typeof persist !== 'function' || persist(state) !== true) {
      state.orbs = previousOrbs;
      state.clues = previousClues;
      return { status: 'persistence-failed', progress: this.progress(state) };
    }

    const progress = this.progress(state);
    this.onProgress(progress, state.orbs.length, this.ids.size);
    return { status: 'collected', progress };
  }
}
