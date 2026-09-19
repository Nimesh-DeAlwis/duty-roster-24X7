export const WEEKDAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

// Internal DB values stay as "shift" / "dedicated" / "combined" (matches the
// Supabase table already created) but are displayed with friendlier labels.
// "combined" merges the Extend and Evening rows into a single roster/table so
// both can be planned, dragged onto, and exported as one image. "shift" and
// "dedicated" are kept around so older saved rosters still open correctly.
export const TYPE_META = {
  combined: {
    label: "Weekly Roster",
    short: "Weekly",
    rows: ["Dedicated Person", "Stand by Person 1", "Stand by Person 2", "Duty"],
    sections: [
      {
        key: "evening",
        label: "Evening Roster",
        tone: "evening",
        timeLabel: "5:30 PM – 7:30 PM",
        rows: ["Dedicated Person", "Stand by Person 1", "Stand by Person 2"],
      },
      { key: "extend", label: "Extend Roster", tone: "extend", useDefaultTime: true, rows: ["Duty"] },
    ],
  },
  shift: { label: "Extend Roster", short: "Extend", rows: ["Duty"] },
  dedicated: {
    label: "Evening Roster",
    short: "Evening",
    rows: ["Dedicated Person", "Stand by Person 1", "Stand by Person 2"],
  },
};

// Rows that should get the default duty time appended automatically when a
// staff chip is dropped or auto-filled onto them (used to key off rosterType
// === "shift" only; now keyed off the row itself so it also works inside the
// combined roster's Extend section).
export const TIMED_ROWS = new Set(["Duty"]);

// Small display helper: the Extend section's time comes from the roster's
// own (editable) default_time field, the Evening section's time is fixed.
export function sectionTimeLabel(section, defaultTime) {
  if (!section) return "";
  if (section.useDefaultTime) return defaultTime || "";
  return section.timeLabel || "";
}

export function pad(n) {
  return String(n).padStart(2, "0");
}

export function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function displayDate(date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function nextMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return toISO(d);
}

export function addDaysISO(iso, days) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function generateWeek(startISO) {
  const start = new Date(startISO + "T00:00:00");
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      iso: toISO(d),
      display: displayDate(d),
      weekday: WEEKDAYS[d.getDay() === 0 ? 6 : d.getDay() - 1],
    });
  }
  return days;
}

export function todayISO() {
  return toISO(new Date());
}

// Cell values used to be a single string; they're now an array so a date/slot
// can hold multiple staff. This normalizes either shape for reading.
export function asList(v) {
  if (Array.isArray(v)) return v;
  return v ? [v] : [];
}
