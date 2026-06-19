// In-memory note store. State resets on process start and on seed().
const notes = new Map();
let nextId = 1;

export function seed() {
  notes.clear();
  nextId = 1;
  create({ title: "First note", body: "Hello world. This is the first note." });
  create({ title: "Second note", body: "Reproducible results matter. Verify everything." });
}

export function list() {
  return [...notes.values()];
}

export function get(id) {
  return notes.get(id) ?? null;
}

export function create({ title, body }) {
  const id = nextId++;
  const note = { id, title, body };
  notes.set(id, note);
  return note;
}

seed();
