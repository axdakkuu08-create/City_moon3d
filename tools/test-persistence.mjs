import assert from 'node:assert/strict';
import { SaveSystem, MemoryManager, SAVE_KEY, SAVE_SCHEMA_VERSION } from '../public/src/persistence.js';

class MemoryStorage {
  constructor(initial = {}) { this.data = new Map(Object.entries(initial)); this.failRead = false; this.failWrite = false; this.failRemove = false; }
  getItem(key) { if (this.failRead) throw new Error('read blocked'); return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) { if (this.failWrite) throw new Error('quota'); this.data.set(key, String(value)); }
  removeItem(key) { if (this.failRemove) throw new Error('blocked'); this.data.delete(key); }
}
const defaults = () => ({ scene: 'opening', pending: 'opening', loc: 'home', trust: 0, clues: [], compassion: 0, orbs: [], history: [], flags: {}, pos: [0, 18], yaw: 0 });

// Existing legacy key and data shape migrate without losing story/progression fields.
{
  const legacy = { scene: 'chapter2', pending: 'station', loc: 'street', trust: 3, clues: ['old clue'], compassion: 2, orbs: [0, 2, 2, 99], history: [{ id: 'opening', title: 'Start', chapter: 1 }], flags: { metMira: true }, pos: [12, -8], yaw: 1.2 };
  const storage = new MemoryStorage({ [SAVE_KEY]: JSON.stringify(legacy) });
  const saves = new SaveSystem(storage);
  const loaded = saves.load(defaults());
  assert.equal(loaded.scene, 'chapter2');
  assert.deepEqual(loaded.orbs, [0, 2]);
  assert.deepEqual(loaded.pos, [12, -8]);
  assert.equal(loaded.flags.metMira, true);
  assert.equal(loaded.schemaVersion, SAVE_SCHEMA_VERSION);
  assert.equal(JSON.parse(storage.getItem(SAVE_KEY)).schemaVersion, SAVE_SCHEMA_VERSION);
}

// Invalid JSON, wrong top-level shapes, unsupported future versions, and storage failures never throw.
{
  const storage = new MemoryStorage({ [SAVE_KEY]: '{broken' });
  const saves = new SaveSystem(storage);
  assert.equal(saves.load(defaults()), null);
  storage.data.set(SAVE_KEY, JSON.stringify(['not', 'an object']));
  assert.equal(saves.hasSave(), false);
  storage.data.set(SAVE_KEY, JSON.stringify({ schemaVersion: SAVE_SCHEMA_VERSION + 1 }));
  assert.equal(saves.hasSave(), false);
  storage.failRead = true;
  assert.equal(saves.hasSave(), false);
  storage.failWrite = true;
  assert.equal(saves.save(defaults()), false);
  storage.failRemove = true;
  assert.equal(saves.clear(), false);
}

// Failed writes do not report success; a later successful write and clear work.
{
  const storage = new MemoryStorage();
  const saves = new SaveSystem(storage);
  storage.failWrite = true;
  assert.equal(saves.save(defaults()), false);
  storage.failWrite = false;
  assert.equal(saves.save(defaults()), true);
  assert.equal(saves.hasSave(), true);
  assert.equal(saves.clear(), true);
  assert.equal(saves.hasSave(), false);
}

// Memory collection rejects unknown/duplicate IDs and rolls back on persistence failure.
{
  const progressEvents = [];
  const manager = new MemoryManager([0, 1, 2], value => progressEvents.push(value));
  const state = defaults();
  manager.sync(state);
  assert.equal(manager.collect(99, state, () => true).status, 'unknown');
  assert.equal(manager.collect(0, state, () => false).status, 'persistence-failed');
  assert.deepEqual(state.orbs, []);
  assert.equal(manager.collect(0, state, () => true).status, 'collected');
  assert.equal(manager.collect(0, state, () => true).status, 'duplicate');
  assert.equal(manager.collect(1, state, () => true, next => next.clues.push('Moon fragments')).status, 'collected');
  assert.deepEqual(state.orbs, [0, 1]);
  assert.deepEqual(state.clues, ['Moon fragments']);
  assert.equal(progressEvents.at(-1), 2 / 3);
}

console.log('Persistence and memory tests passed.');
