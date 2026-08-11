"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import { supabase } from "../lib/supabaseClient";
import { TYPE_META, todayISO, addDaysISO, generateWeek } from "../lib/dateUtils";
import TopNav from "../components/TopNav";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [extendRoster, setExtendRoster] = useState(null);
  const [eveningRoster, setEveningRoster] = useState(null);
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
    const extendToday = activeToday.filter((r) => r.roster_type === "shift");
    const eveningToday = activeToday.filter((r) => r.roster_type === "dedicated");

    let peopleToday = 0;
    let dedicatedPerson = "-", standby1 = "-", standby2 = "-";

    extendToday.forEach((r) => {
      if (r.entries?.[today]?.["Duty"]) peopleToday += 1;
    });
    eveningToday.forEach((r) => {
      const d = r.entries?.[today]?.["Dedicated Person"];
      const s1 = r.entries?.[today]?.["Stand by Person 1"];
      const s2 = r.entries?.[today]?.["Stand by Person 2"];
      if (d) { peopleToday += 1; if (dedicatedPerson === "-") dedicatedPerson = d; }
      if (s1) { peopleToday += 1; if (standby1 === "-") standby1 = s1; }
      if (s2) { peopleToday += 1; if (standby2 === "-") standby2 = s2; }
    });

    setStats({
      peopleToday,
      extendCount: extendToday.length,
      eveningCount: eveningToday.length,
      dedicatedPerson, standby1, standby2,
      upcomingCount: upcomingCount || 0,
      totalStaff: totalStaff || 0,
    });
    setExtendRoster(extendToday[0] || null);
    setEveningRoster(eveningToday[0] || null);
    setLoading(false);
  }

  async function downloadMini(ref, roster) {
    if (!ref.current) return;
    const dataUrl = await toPng(ref.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = `${roster.roster_type === "shift" ? "extend" : "evening"}-roster-${roster.start_date}.png`;
    link.href = dataUrl;
    link.click();
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

        <div className="roster-preview-grid">
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

function RosterPreviewCard({ title, roster, innerRef, onDownload, today, badgeCount }) {
  const meta = roster ? TYPE_META[roster.roster_type] : null;
  const days = roster ? generateWeek(roster.start_date) : [];

  return (
    <div className="panel preview-card">
      <div className="panel-head">
        <h2>{title}</h2>
        {typeof badgeCount === "number" && <span className="count-badge">{badgeCount} active</span>}
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
                  {(roster.row_labels || meta.rows).map((label) => (
                    <tr key={label} className={label.startsWith("Stand by") ? "standby-row" : ""}>
                      <th>{label}</th>
                      {days.map((d) => (
                        <td key={d.iso} className={d.iso === today ? "is-today" : ""}>
                          {roster.entries?.[d.iso]?.[label] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
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
