"use client";

import { useEffect, useRef, useState, Fragment } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { TYPE_META, todayISO, addDaysISO, generateWeek, asList } from "../lib/dateUtils";
import { exportNodeAsPng } from "../lib/exportImage";
import TopNav from "../components/TopNav";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [combinedRoster, setCombinedRoster] = useState(null);
  const [extendRoster, setExtendRoster] = useState(null);
  const [eveningRoster, setEveningRoster] = useState(null);
  const combinedRef = useRef(null);
  const extendRef = useRef(null);
  const eveningRef = useRef(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    const today = todayISO();
    const earliestPossibleStart = addDaysISO(today, -6);

    const { data: candidateRosters } = await supabase
      .from("rosters")
      .select("*")
      .gte("start_date", earliestPossibleStart)
      .lte("start_date", today);

    const { count: upcomingCount } = await supabase
      .from("rosters")
      .select("id", { count: "exact", head: true })
      .gt("start_date", today);

    const { count: totalStaff } = await supabase
      .from("staff")
      .select("id", { count: "exact", head: true })
      .eq("active", true);

    const activeToday = (candidateRosters || []).filter((r) => addDaysISO(r.start_date, 6) >= today);
    const combinedToday = activeToday.filter((r) => r.roster_type === "combined");
    const extendToday = activeToday.filter((r) => r.roster_type === "shift");
    const eveningToday = activeToday.filter((r) => r.roster_type === "dedicated");

    let peopleToday = 0;
    let dedicatedPerson = "-", standby1 = "-", standby2 = "-";

    // Combined rosters carry both the Extend "Duty" row and the Evening rows
    // in one record, so a single pass covers everyone scheduled today.
    [...combinedToday, ...extendToday].forEach((r) => {
      peopleToday += asList(r.entries?.[today]?.["Duty"]).length;
    });
    [...combinedToday, ...eveningToday].forEach((r) => {
      const d = asList(r.entries?.[today]?.["Dedicated Person"]);
      const s1 = asList(r.entries?.[today]?.["Stand by Person 1"]);
      const s2 = asList(r.entries?.[today]?.["Stand by Person 2"]);
      peopleToday += d.length + s1.length + s2.length;
      if (d.length && dedicatedPerson === "-") dedicatedPerson = d.join(", ");
      if (s1.length && standby1 === "-") standby1 = s1.join(", ");
      if (s2.length && standby2 === "-") standby2 = s2.join(", ");
    });

    setStats({
      peopleToday,
      extendCount: extendToday.length + combinedToday.length,
      eveningCount: eveningToday.length + combinedToday.length,
      dedicatedPerson,
      upcomingCount: upcomingCount || 0,
      totalStaff: totalStaff || 0,
    });
    setCombinedRoster(combinedToday[0] || null);
    // Only fall back to the separate legacy cards when there's no combined
    // roster covering this week yet.
    setExtendRoster(combinedToday[0] ? null : extendToday[0] || null);
    setEveningRoster(combinedToday[0] ? null : eveningToday[0] || null);
    setLoading(false);
  }

  function fileTag(type) {
    if (type === "combined") return "weekly";
    if (type === "shift") return "extend";
    return "evening";
  }

  async function downloadMini(ref, roster) {
    await exportNodeAsPng(ref.current, `${fileTag(roster.roster_type)}-roster-${roster.start_date}.png`);
  }

  const today = todayISO();

  return (
    <div className="shell">
      <TopNav />
      <main className="app">
        <div className="dash-head">
          <h1>Today&apos;s overview</h1>
          <span className="hint">{loading ? "Loading..." : today}</span>
        </div>

        <div className="stat-grid">
          <StatCard label="People scheduled today" value={stats?.peopleToday ?? "-"} icon="👥" />
          <StatCard label="Upcoming saved rosters" value={stats?.upcomingCount ?? "-"} icon="📅" />
          <StatCard label="Active staff" value={stats?.totalStaff ?? "-"} icon="🧑‍💼" />
          <StatCard label="Dedicated person today" value={stats?.dedicatedPerson ?? "-"} icon="⭐" isName />
        </div>

        <div className={combinedRoster ? "roster-preview-grid single" : "roster-preview-grid"}>
          {combinedRoster ? (
            <RosterPreviewCard
              title="This week's Weekly Roster"
              roster={combinedRoster}
              innerRef={combinedRef}
              onDownload={() => downloadMini(combinedRef, combinedRoster)}
              today={today}
              badgeCount={stats?.peopleToday}
              badgeLabel="scheduled"
            />
          ) : (
            <>
              <RosterPreviewCard
                title="This week's Extend Roster"
                roster={extendRoster}
                innerRef={extendRef}
                onDownload={() => downloadMini(extendRef, extendRoster)}
                today={today}
                badgeCount={stats?.extendCount}
              />
              <RosterPreviewCard
                title="This week's Evening Roster"
                roster={eveningRoster}
                innerRef={eveningRef}
                onDownload={() => downloadMini(eveningRef, eveningRoster)}
                today={today}
                badgeCount={stats?.eveningCount}
              />
            </>
          )}
        </div>

        <section className="panel" style={{ marginTop: 4 }}>
          <div className="panel-head"><h2>Quick actions</h2></div>
          <div className="quick-actions">
            <Link href="/roster" className="quick-btn quick-primary">
              <span className="quick-icon">＋</span> Create Roster
            </Link>
            <Link href="/roster?view=archive" className="quick-btn">
              <span className="quick-icon">🗂</span> View Old Rosters
            </Link>
            <Link href="/employees" className="quick-btn">
              <span className="quick-icon">👥</span> Employee Master
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, isName }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value" style={isName ? { fontSize: 17 } : undefined}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function RosterPreviewCard({ title, roster, innerRef, onDownload, today, badgeCount, badgeLabel = "active" }) {
  const meta = roster ? TYPE_META[roster.roster_type] : null;
  const days = roster ? generateWeek(roster.start_date) : [];

  const renderRow = (label, toneClass) => (
    <tr key={label} className={`${toneClass || ""} ${label.startsWith("Stand by") ? "standby-row" : ""}`.trim()}>
      <th>{label}</th>
      {days.map((d) => (
        <td key={d.iso} className={d.iso === today ? "is-today" : ""}>
          {asList(roster.entries?.[d.iso]?.[label]).join(", ") || "-"}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="panel preview-card">
      <div className="panel-head">
        <h2>{title}</h2>
        {typeof badgeCount === "number" && <span className="count-badge">{badgeCount} {badgeLabel}</span>}
      </div>

      {!roster ? (
        <div className="empty-state">
          <p>No roster covers this week yet.</p>
          <Link href="/roster" className="quick-btn quick-primary" style={{ display: "inline-flex" }}>
            Create one
          </Link>
        </div>
      ) : (
        <>
          <div className="mini-export-wrap">
            <div className="mini-export-inner" ref={innerRef}>
              <div className="export-heading">
                <div className="export-heading-title">{meta.label}</div>
                <div className="export-heading-sub">
                  {roster.title} &nbsp;·&nbsp; {days[0].display} — {days[6].display}
                </div>
              </div>
              <table className="roster-table mini-table">
                <thead>
                  <tr className="date-row">
                    <th></th>
                    {days.map((d) => (
                      <th key={d.iso} className={d.iso === today ? "is-today" : ""}>{d.display}</th>
                    ))}
                  </tr>
                  <tr className="day-row">
                    <th></th>
                    {days.map((d) => (
                      <th key={d.iso} className={d.iso === today ? "is-today" : ""}>{d.weekday.slice(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {meta.sections
                    ? meta.sections.map((section) => (
                        <Fragment key={section.key}>
                          <tr className={`section-row section-${section.tone}`}>
                            <td colSpan={days.length + 1}>
                              <span className="section-dot" /> {section.label}
                            </td>
                          </tr>
                          {section.rows.map((label) => renderRow(label, `section-${section.tone}`))}
                        </Fragment>
                      ))
                    : (roster.row_labels || meta.rows).map((label) => renderRow(label))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="controls-row" style={{ marginTop: 12 }}>
            <button className="secondary" onClick={onDownload}>Download as PNG</button>
            <Link href="/roster" className="secondary-link">Edit in roster editor →</Link>
          </div>
        </>
      )}
    </div>
  );
}
