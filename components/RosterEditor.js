"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { supabase } from "../lib/supabaseClient";

const WEEKDAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

const ROW_LABELS = {
  shift: ["Shift"],
  dedicated: ["Dedicated Person", "Stand by Person 1", "Stand by Person 2"],
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function displayDate(date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function nextMonday() {
  const d = new Date();
  const day = d.getDay(); // 0 Sun ... 6 Sat
  const diff = day === 0 ? 1 : 8 - day; // days until next Monday
  d.setDate(d.getDate() + diff);
  return toISO(d);
}

function generateWeek(startISO) {
  const start = new Date(startISO + "T00:00:00");
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({ iso: toISO(d), display: displayDate(d), weekday: WEEKDAYS[d.getDay() === 0 ? 6 : d.getDay() - 1] });
  }
  return days;
}

export default function RosterEditor() {
  const [rosterType, setRosterType] = useState("shift");
  const [startDate, setStartDate] = useState(nextMonday());
  const [defaultTime, setDefaultTime] = useState("7.30pm - 11.00pm");
  const [title, setTitle] = useState("");
  const [entries, setEntries] = useState({});
  const [staffList, setStaffList] = useState([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [savedRosters, setSavedRosters] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [autoFillRow, setAutoFillRow] = useState(ROW_LABELS.shift[0]);
  const [autoFillStartStaff, setAutoFillStartStaff] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const tableRef = useRef(null);

  const days = generateWeek(startDate);
  const rowLabels = ROW_LABELS[rosterType];

  const ensureEntries = useCallback((baseDays, labels, prev) => {
    const next = {};
    for (const d of baseDays) {
      next[d.iso] = {};
      for (const label of labels) {
        next[d.iso][label] = (prev[d.iso] && prev[d.iso][label]) || "";
      }
    }
    return next;
  }, []);

  useEffect(() => {
    setEntries((prev) => ensureEntries(days, rowLabels, prev));
    setAutoFillRow(rowLabels[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, rosterType]);

  useEffect(() => {
    loadStaff();
    loadRosterList();
  }, []);

  async function loadStaff() {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (!error && data) {
      setStaffList(data);
      if (data.length && !autoFillStartStaff) setAutoFillStartStaff(data[0].name);
    }
  }

  async function loadRosterList() {
    const { data, error } = await supabase
      .from("rosters")
      .select("id, title, roster_type, start_date, updated_at")
      .order("start_date", { ascending: false })
      .limit(25);
    if (!error && data) setSavedRosters(data);
  }

  async function addStaff() {
    const name = newStaffName.trim();
    if (!name) return;
    const { error } = await supabase
      .from("staff")
      .insert({ name, sort_order: staffList.length + 1 });
    if (error) {
      setStatus(`Could not add staff: ${error.message}`);
      return;
    }
    setNewStaffName("");
    loadStaff();
  }

  async function removeStaff(id) {
    await supabase.from("staff").update({ active: false }).eq("id", id);
    loadStaff();
  }

  function handleCellChange(dateISO, rowLabel, value) {
    setEntries((prev) => ({
      ...prev,
      [dateISO]: { ...prev[dateISO], [rowLabel]: value },
    }));
  }

  function autoFill() {
    if (!staffList.length) {
      setStatus("Add some staff names first.");
      return;
    }
    const startIdx = Math.max(
      0,
      staffList.findIndex((s) => s.name === autoFillStartStaff)
    );
    setEntries((prev) => {
      const next = { ...prev };
      days.forEach((d, i) => {
        const staffName = staffList[(startIdx + i) % staffList.length].name;
        const value =
          rosterType === "shift"
            ? `${staffName} (${defaultTime})`
            : staffName;
        next[d.iso] = { ...next[d.iso], [autoFillRow]: value };
      });
      return next;
    });
  }

  function newRoster() {
    setCurrentId(null);
    setTitle("");
    setStartDate(nextMonday());
    setStatus("");
  }

  async function saveRoster() {
    setLoading(true);
    setStatus("");
    const payload = {
      title: title.trim() || `Roster ${displayDate(new Date(startDate + "T00:00:00"))}`,
      roster_type: rosterType,
      start_date: startDate,
      default_time: defaultTime,
      row_labels: rowLabels,
      entries,
    };
    let error;
    if (currentId) {
      ({ error } = await supabase.from("rosters").update(payload).eq("id", currentId));
    } else {
      const { data, error: insertError } = await supabase
        .from("rosters")
        .insert(payload)
        .select()
        .single();
      error = insertError;
      if (!error && data) setCurrentId(data.id);
    }
    setLoading(false);
    if (error) {
      setStatus(`Save failed: ${error.message}`);
    } else {
      setStatus("Saved.");
      loadRosterList();
    }
  }

  async function loadRoster(id) {
    setLoading(true);
    const { data, error } = await supabase.from("rosters").select("*").eq("id", id).single();
    setLoading(false);
    if (error || !data) {
      setStatus(`Could not load roster: ${error?.message || "not found"}`);
      return;
    }
    setCurrentId(data.id);
    setTitle(data.title || "");
    setRosterType(data.roster_type);
    setStartDate(data.start_date);
    setDefaultTime(data.default_time || "7.30pm - 11.00pm");
    setEntries(data.entries || {});
    setStatus("Loaded.");
  }

  async function deleteRoster(id) {
    if (!confirm("Delete this saved roster? This cannot be undone.")) return;
    await supabase.from("rosters").delete().eq("id", id);
    if (id === currentId) newRoster();
    loadRosterList();
  }

  async function exportPng() {
    if (!tableRef.current) return;
    setStatus("Generating image...");
    try {
      const dataUrl = await toPng(tableRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `roster-${startDate}.png`;
      link.href = dataUrl;
      link.click();
      setStatus("Downloaded.");
    } catch (err) {
      setStatus(`Export failed: ${err.message}`);
    }
  }

  function shiftWeek(deltaDays) {
    const d = new Date(startDate + "T00:00:00");
    d.setDate(d.getDate() + deltaDays);
    setStartDate(toISO(d));
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>Duty Roster</h1>
        <div className="tag-toggle">
          <button
            className={rosterType === "shift" ? "active" : ""}
            onClick={() => setRosterType("shift")}
          >
            Shift (1 row)
          </button>
          <button
            className={rosterType === "dedicated" ? "active" : ""}
            onClick={() => setRosterType("dedicated")}
          >
            Dedicated + Standby
          </button>
        </div>
      </div>

      <div className="panel">
        <h2>Week setup</h2>
        <div className="controls-row">
          <div className="field">
            <label>Roster title</label>
            <input
              type="text"
              placeholder="e.g. Support Roster - Week 31"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          {rosterType === "shift" && (
            <div className="field">
              <label>Default shift time</label>
              <input
                type="text"
                value={defaultTime}
                onChange={(e) => setDefaultTime(e.target.value)}
              />
            </div>
          )}
          <div className="field">
            <label>&nbsp;</label>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="secondary" onClick={() => shiftWeek(-7)}>&laquo; Prev week</button>
              <button className="secondary" onClick={() => shiftWeek(7)}>Next week &raquo;</button>
              <button className="secondary" onClick={newRoster}>+ New</button>
            </div>
          </div>
        </div>

        <div className="controls-row" style={{ marginTop: 14 }}>
          <div className="field">
            <label>Auto-fill row</label>
            <select value={autoFillRow} onChange={(e) => setAutoFillRow(e.target.value)}>
              {rowLabels.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Start rotation from</label>
            <select value={autoFillStartStaff} onChange={(e) => setAutoFillStartStaff(e.target.value)}>
              {staffList.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>&nbsp;</label>
            <button onClick={autoFill}>Auto-fill week (round robin)</button>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Staff list</h2>
        <div className="controls-row" style={{ marginBottom: 10 }}>
          <div className="field">
            <label>Add staff member</label>
            <input
              type="text"
              placeholder="Name"
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStaff()}
            />
          </div>
          <button className="secondary" onClick={addStaff}>Add</button>
        </div>
        <div className="staff-chip-list">
          {staffList.map((s) => (
            <div className="staff-chip" key={s.id}>
              {s.name}
              <button onClick={() => removeStaff(s.id)} title="Remove">&times;</button>
            </div>
          ))}
          {!staffList.length && <span className="hint">No staff yet — add names above so auto-fill can use them.</span>}
        </div>
      </div>

      <div className="toolbar">
        <button onClick={saveRoster} disabled={loading}>
          {currentId ? "Update saved roster" : "Save roster"}
        </button>
        <button className="secondary" onClick={exportPng}>Download as PNG</button>
        {status && <span className="hint" style={{ alignSelf: "center" }}>{status}</span>}
      </div>

      <div className="export-wrap">
        <table className="roster-table" ref={tableRef}>
          <thead>
            <tr className="date-row">
              <th></th>
              {days.map((d) => (
                <th key={d.iso}>{d.display}</th>
              ))}
            </tr>
            <tr className="day-row">
              <th></th>
              {days.map((d) => (
                <th key={d.iso}>{d.weekday}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((label) => (
              <tr key={label} className={label.startsWith("Stand by") ? "standby-row" : ""}>
                <th>{label}</th>
                {days.map((d) => (
                  <td key={d.iso}>
                    <input
                      type="text"
                      value={(entries[d.iso] && entries[d.iso][label]) || ""}
                      onChange={(e) => handleCellChange(d.iso, label, e.target.value)}
                      placeholder="-"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">
        Type directly into any cell, or use "Auto-fill week" to cycle staff names in order.
        For the shift table, auto-fill appends the default time automatically — you can still
        edit any cell by hand afterwards.
      </p>

      <div className="panel" style={{ marginTop: 24 }}>
        <h2>Saved rosters</h2>
        <div className="roster-list">
          {savedRosters.map((r) => (
            <div className="roster-list-item" key={r.id}>
              <div>
                <strong>{r.title}</strong>{" "}
                <span className="meta">
                  ({r.roster_type === "shift" ? "Shift" : "Dedicated"} · starts {r.start_date})
                </span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="secondary" onClick={() => loadRoster(r.id)}>Open</button>
                <button className="danger" onClick={() => deleteRoster(r.id)}>Delete</button>
              </div>
            </div>
          ))}
          {!savedRosters.length && <span className="hint">No saved rosters yet.</span>}
        </div>
      </div>
    </div>
  );
}
