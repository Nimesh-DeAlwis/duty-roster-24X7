// Deterministic "initials + colour" avatar for a staff name, so the same
// person always gets the same colour chip across the whole app without
// needing to store anything extra in the database.

const PALETTE = [
  "#2563eb", "#7c3aed", "#db2777", "#dc2626", "#ea580c",
  "#d97706", "#65a30d", "#059669", "#0d9488", "#0891b2",
  "#4f46e5", "#c026d3",
];

export function initials(name) {
  const clean = (name || "").replace(/\(.*?\)/g, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarColor(name) {
  const clean = (name || "").replace(/\(.*?\)/g, "").trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
