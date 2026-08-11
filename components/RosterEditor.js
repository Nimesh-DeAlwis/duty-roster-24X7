"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { TYPE_META, nextMonday, addDaysISO, generateWeek } from "../lib/dateUtils";
import TopNav from "./TopNav";

export default function RosterEditor() {
  const searchParams = useSearchParams();

  const [rosterType, setRosterType] = useState("shift");
  const [startDate, setStartDate] = useState(nextMonday());
  const [defaultTime, setDefaultTime] = useState("7.30pm - 11.00pm");
  const [title, setTitle] = useState("");
  const [entries, setEntries] = useState({});
  const [staffList, setStaffList] = useState([]);
  const [savedRosters, setSavedRosters] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [autoFillRow, setAutoFillRow] = useState(TYPE_META.shift.rows[0]);
  const [autoFillStartStaff, setAutoFillStartStaff] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("all");
  const [showArchive, setShowArchive] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState("");
  const [previewRoster, setPreviewRoster] = useState(null);
  const tableRef = useRef(null);
  const previewRef = useRef(null);

  const days = generateWeek(startDate);
  const meta = TYPE_META[rosterType];
  const rowLabels = meta.rows;

  useEffect(() => {
    if (searchParams.get("view") === "archive") setShowArchive(true);
  }, [searchParams]);

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
      .limit(80);
    if (!error && data) setSavedRosters(data);
  }

  function handleCellChange(dateISO, rowLabel, value) {
    setEntries((prev) => ({
      ...prev,
      [dateISO]: { ...prev[dateISO], [rowLabel]: value },
    }));
  }

  function autoFill() {
    if (!staffList.length) {
      setStatus("Add some staff names first (Employee Master).");
      return;
    }
    const startIdx = Math.max(0, staffList.findIndex((s) => s.name === autoFillStartStaff));
    setEntries((prev) => {
      const next = { ...prev };
      days.forEach((d, i) => {
        const staffName = staffList[(startIdx + i) % staffList.length].name;
        const value = rosterType === "shift" ? `${staffName} (${defaultTime})` : staffName;
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
      title: title.trim() || `${meta.short} Roster ${days[0].display}`,
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
        .from("rosters").insert(payload).select().single();
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

  async function loadRosterFull(id) {
    const { data, error } = await supabase.from("rosters").select("*").eq("id", id).single();
    if (error) {
      setStatus(`Could not load roster: ${error.message}`);
      return null;
    }
    return data;
  }

  async function loadRosterIntoEditor(id) {
    setLoading(true);
    const data = await loadRosterFull(id);
    setLoading(false);
    if (!data) return;
    setCurrentId(data.id);
    setTitle(data.title || "");
    setRosterType(data.roster_type);
    setStartDate(data.start_date);
    setDefaultTime(data.default_time || "7.30pm - 11.00pm");
    setEntries(data.entries || {});
    setStatus("Loaded from archive.");
    setShowArchive(false);
    setPreviewRoster(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function openPreview(id) {
    const data = await loadRosterFull(id);
    if (data) setPreviewRoster(data);
  }

  async function deleteRoster(id) {
    if (!confirm("Delete this saved roster? This cannot be undone.")) return;
    await supabase.from("rosters").delete().eq("id", id);
    if (id === currentId) newRoster();
    if (previewRoster?.id === id) setPreviewRoster(null);
    loadRosterList();
  }

  async function exportPng() {
    if (!tableRef.current) return;
    setStatus("Generating image...");
    try {
      const dataUrl = await toPng(tableRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `${rosterType === "shift" ? "extend" : "evening"}-roster-${startDate}.png`;
      link.href = dataUrl;
      link.click();
      setStatus("Downloaded.");
    } catch (err) {
      setStatus(`Export failed: ${err.message}`);
    }
  }

  async function downloadPreview() {
    if (!previewRef.current) return;
    const dataUrl = await toPng(previewRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = `${previewRoster.roster_type === "shift" ? "extend" : "evening"}-roster-${previewRoster.start_date}.png`;
    link.href = dataUrl;
    link.click();
  }

  function shiftWeek(deltaDays) {
    setStartDate(addDaysISO(startDate, deltaDays));
  }

  // ---------- Copy / Duplicate tools ----------

  async function copyLastWeek() {
    const prevStart = addDaysISO(startDate, -7);
    const { data, error } = await supabase
      .from("rosters").select("*")
      .eq("roster_type", rosterType).eq("start_date", prevStart).maybeSingle();
    if (error || !data) {
      setStatus("No saved roster found for last week to copy from.");
      return;
    }
    const prevDays = generateWeek(prevStart);
    setEntries((prev) => {
      const next = { ...prev };
      days.forEach((d, i) => {
        next[d.iso] = { ...(data.entries?.[prevDays[i].iso] || {}) };
      });
      return next;
    });
    setStatus("Copied last week's roster into this week.");
  }

  async function copyPreviousDay() {
    const prevDayISO = addDaysISO(startDate, -1);
    const prevWeekStart = addDaysISO(startDate, -7);
    const { data, error } = await supabase
      .from("rosters").select("*")
      .eq("roster_type", rosterType).eq("start_date", prevWeekStart).maybeSingle();
    if (error || !data || !data.entries?.[prevDayISO]) {
      setStatus("No roster found covering the day before this week.");
      return;
    }
    const firstDay = days[0].iso;
    setEntries((prev) => ({
      ...prev,
      [firstDay]: { ...data.entries[prevDayISO] },
    }));
    setStatus(`Copied ${prevDayISO} into ${firstDay}.`);
  }

  async function duplicateToDate() {
    if (!duplicateTarget) {
      setStatus("Pick a target start date first.");
      return;
    }
    const targetDays = generateWeek(duplicateTarget);
    const newEntries = {};
    days.forEach((d, i) => {
      newEntries[targetDays[i].iso] = { ...(entries[d.iso] || {}) };
    });
    setLoading(true);
    const { error } = await supabase.from("rosters").insert({
      title: `${meta.short} Roster ${targetDays[0].display}`,
      roster_type: rosterType,
      start_date: duplicateTarget,
      default_time: defaultTime,
      row_labels: rowLabels,
      entries: newEntries,
    });
    setLoading(false);
    if (error) {
      setStatus(`Duplicate failed: ${error.message}`);
    } else {
      setStatus(`Duplicated to week starting ${duplicateTarget}.`);
      loadRosterList();
    }
  }

  // ---------- Drag & drop ----------

  function handleStaffDragStart(e, name) {
    e.dataTransfer.setData("text/x-staff-name", name);
    e.dataTransfer.effectAllowed = "copy";
  }

  function handleCellDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleHandleDragStart(e, dateISO, rowLabel) {
    e.dataTransfer.setData("application/x-roster-move", JSON.stringify({ date: dateISO, row: rowLabel }));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleCellDrop(e, targetDate, targetRow) {
    e.preventDefault();
    const staffName = e.dataTransfer.getData("text/x-staff-name");
    const moveRaw = e.dataTransfer.getData("application/x-roster-move");

    if (staffName) {
      const value = rosterType === "shift" && targetRow === "Duty"
        ? `${staffName} (${defaultTime})`
        : staffName;
      handleCellChange(targetDate, targetRow, value);
      return;
    }
    if (moveRaw) {
      const { date: srcDate, row: srcRow } = JSON.parse(moveRaw);
      if (srcDate === targetDate && srcRow === targetRow) return;
      setEntries((prev) => {
        const next = { ...prev };
        const val = next[srcDate]?.[srcRow] || "";
        next[targetDate] = { ...next[targetDate], [targetRow]: val };
        next[srcDate] = { ...next[srcDate], [srcRow]: "" };
        return next;
      });
    }
  }

  const filteredArchive = savedRosters.filter((r) => {
    const matchesType = archiveFilter === "all" || r.roster_type === archiveFilter;
    const matchesSearch = r.title.toLowerCase().includes(archiveSearch.trim().toLowerCase());
    return matchesType && matchesSearch;
  });

  const rangeLabel = `${days[0].display} — ${days[6].display}`;

  return (
    <div className="shell">
      <TopNav />

      <main className="app">
        {showArchive ? (
          <section className="panel">
            <div className="panel-head">
              <h2>Roster archive</h2>
              <span className="hint">{filteredArchive.length} of {savedRosters.length} rosters</span>
            </div>
            <div className="controls-row" style={{ marginBottom: 14 }}>
              <div className="field grow">
                <label>Search by title</label>
                <input type="text" placeholder="Search..." value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)} />
              </div>
              <div className="field">
                <label>Type</label>
                <select value={archiveFilter} onChange={(e) => setArchiveFilter(e.target.value)}>
                  <option value="all">All types</option>
                  <option value="shift">Extend Roster</option>
                  <option value="dedicated">Evening Roster</option>
                </select>
              </div>
              <button className="secondary" onClick={() => setShowArchive(false)}>Back to editor</button>
            </div>
            <div className="roster-grid">
              {filteredArchive.map((r) => (
                <div className="roster-card" key={r.id}>
                  <div className={`type-pill ${r.roster_type === "shift" ? "pill-extend" : "pill-evening"}`}>
                    {TYPE_META[r.roster_type]?.label || r.roster_type}
                  </div>
                  <div className="roster-card-title">{r.title}</div>
                  <div className="roster-card-meta">Starts {r.start_date}</div>
                  <div className="roster-card-actions">
                    <button className="secondary" onClick={() => openPreview(r.id)}>Preview</button>
                    <button className="danger" onClick={() => deleteRoster(r.id)}>Delete</button>
                  </div>
                </div>
              ))}
              {!filteredArchive.length && <span className="hint">No rosters match that search.</span>}
            </div>
          </section>
        ) : (
          <>
            <div className="tag-toggle">
              {Object.entries(TYPE_META).map(([key, m]) => (
                <button key={key} className={rosterType === key ? "active" : ""} onClick={() => setRosterType(key)}>
                  {m.label}
                </button>
              ))}
            </div>

            <section className="panel">
              <div className="panel-head"><h2>Week setup</h2></div>
              <div className="controls-row">
                <div className="field grow">
                  <label>Roster title</label>
                  <input type="text" placeholder={`e.g. ${meta.label} - Week 31`}
                    value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="field">
                  <label>Start date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                {rosterType === "shift" && (
                  <div className="field">
                    <label>Default duty time</label>
                    <input type="text" value={defaultTime} onChange={(e) => setDefaultTime(e.target.value)} />
                  </div>
                )}
              </div>
              <div className="controls-row" style={{ marginTop: 10 }}>
                <button className="secondary" onClick={() => shiftWeek(-7)}>&laquo; Prev week</button>
                <button className="secondary" onClick={() => shiftWeek(7)}>Next week &raquo;</button>
                <button className="secondary" onClick={newRoster}>+ New roster</button>
              </div>

              <div className="controls-row" style={{ marginTop: 18 }}>
                <div className="field">
                  <label>Auto-fill row</label>
                  <select value={autoFillRow} onChange={(e) => setAutoFillRow(e.target.value)}>
                    {rowLabels.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Start rotation from</label>
                  <select value={autoFillStartStaff} onChange={(e) => setAutoFillStartStaff(e.target.value)}>
                    {staffList.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>&nbsp;</label>
                  <button onClick={autoFill}>Auto-fill week</button>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head"><h2>Copy &amp; duplicate</h2></div>
              <div className="controls-row">
                <button className="secondary" onClick={copyPreviousDay}>Copy previous day → Monday</button>
                <button className="secondary" onClick={copyLastWeek}>Copy last week&apos;s roster</button>
              </div>
              <div className="controls-row" style={{ marginTop: 12 }}>
                <div className="field">
                  <label>Duplicate this week to</label>
                  <input type="date" value={duplicateTarget} onChange={(e) => setDuplicateTarget(e.target.value)} />
                </div>
                <div className="field">
                  <label>&nbsp;</label>
                  <button className="secondary" onClick={duplicateToDate} disabled={loading}>
                    Duplicate &amp; save as new roster
                  </button>
                </div>
              </div>
              <p className="hint">Copies use the currently selected roster type ({meta.label}).</p>
            </section>

            <section className="panel">
              <div className="panel-head"><h2>Staff list</h2></div>
              <div className="staff-chip-list">
                {staffList.map((s) => (
                  <div
                    className="staff-chip draggable"
                    key={s.id}
                    draggable
                    onDragStart={(e) => handleStaffDragStart(e, s.name)}
                    title="Drag onto a roster cell"
                  >
                    {s.name}
                  </div>
                ))}
                {!staffList.length && (
                  <span className="hint">No staff yet — add employees from Employee Master.</span>
                )}
              </div>
              <p className="hint">Drag a name onto any cell below to assign it. Drag a filled cell&apos;s handle (⋮⋮) to move it to another slot or date.</p>
            </section>

            <div className="toolbar">
              <button onClick={saveRoster} disabled={loading}>
                {currentId ? "Update saved roster" : "Save roster"}
              </button>
              <button className="secondary" onClick={exportPng}>Download as PNG</button>
              {status && <span className="hint" style={{ alignSelf: "center" }}>{status}</span>}
            </div>

            <div className="export-wrap">
              <div className="export-inner" ref={tableRef}>
                <div className="export-heading">
                  <div className="export-heading-title">{meta.label}</div>
                  <div className="export-heading-sub">{title || `${meta.short} Roster`} &nbsp;·&nbsp; {rangeLabel}</div>
                </div>
                <table className="roster-table">
                  <thead>
                    <tr className="date-row">
                      <th></th>
                      {days.map((d) => <th key={d.iso}>{d.display}</th>)}
                    </tr>
                    <tr className="day-row">
                      <th></th>
                      {days.map((d) => <th key={d.iso}>{d.weekday}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rowLabels.map((label) => (
                      <tr key={label} className={label.startsWith("Stand by") ? "standby-row" : ""}>
                        <th>{label}</th>
                        {days.map((d) => {
                          const value = (entries[d.iso] && entries[d.iso][label]) || "";
                          return (
                            <td
                              key={d.iso}
                              onDragOver={handleCellDragOver}
                              onDrop={(e) => handleCellDrop(e, d.iso, label)}
                            >
                              <div className="cell-wrap">
                                {value && (
                                  <span
                                    className="drag-handle"
                                    draggable
                                    onDragStart={(e) => handleHandleDragStart(e, d.iso, label)}
                                    title="Drag to move"
                                  >⋮⋮</span>
                                )}
                                <input
                                  type="text"
                                  value={value}
                                  onChange={(e) => handleCellChange(d.iso, label, e.target.value)}
                                  placeholder="-"
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="hint">
              Type directly into any cell, drag a staff name onto a cell, or use &quot;Auto-fill week&quot;.
              The downloaded image includes the {meta.label} heading automatically.
            </p>
          </>
        )}
      </main>

      {previewRoster && (
        <div className="modal-overlay" onClick={() => setPreviewRoster(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>{TYPE_META[previewRoster.roster_type]?.label}</span>
              <button className="ghost-dark" onClick={() => setPreviewRoster(null)}>Close ✕</button>
            </div>
            <div className="export-wrap" style={{ margin: "16px 0" }}>
              <div className="export-inner" ref={previewRef}>
                <div className="export-heading">
                  <div className="export-heading-title">{TYPE_META[previewRoster.roster_type]?.label}</div>
                  <div className="export-heading-sub">
                    {previewRoster.title} &nbsp;·&nbsp;
                    {generateWeek(previewRoster.start_date)[0].display} — {generateWeek(previewRoster.start_date)[6].display}
                  </div>
                </div>
                <table className="roster-table">
                  <thead>
                    <tr className="date-row">
                      <th></th>
                      {generateWeek(previewRoster.start_date).map((d) => <th key={d.iso}>{d.display}</th>)}
                    </tr>
                    <tr className="day-row">
                      <th></th>
                      {generateWeek(previewRoster.start_date).map((d) => <th key={d.iso}>{d.weekday}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(previewRoster.row_labels || TYPE_META[previewRoster.roster_type]?.rows || []).map((label) => (
                      <tr key={label} className={label.startsWith("Stand by") ? "standby-row" : ""}>
                        <th>{label}</th>
                        {generateWeek(previewRoster.start_date).map((d) => (
                          <td key={d.iso}>{previewRoster.entries?.[d.iso]?.[label] || "-"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="controls-row">
              <button onClick={downloadPreview}>Download as PNG</button>
              <button className="secondary" onClick={() => loadRosterIntoEditor(previewRoster.id)}>
                Edit this roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
