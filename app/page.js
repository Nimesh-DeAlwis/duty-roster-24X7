"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { todayISO, addDaysISO } from "../lib/dateUtils";
import TopNav from "../components/TopNav";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    const today = todayISO();
    // A roster "covers" today if its 7-day window (start_date .. start_date+6) includes today.
    const earliestPossibleStart = addDaysISO(today, -6);

    const { data: candidateRosters } = await supabase
      .from("rosters")
      .select("id, title, roster_type, start_date, entries")
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

    const activeToday = (candidateRosters || []).filter((r) => {
      const windowEnd = addDaysISO(r.start_date, 6);
      return windowEnd >= today;
    });

    const extendToday = activeToday.filter((r) => r.roster_type === "shift");
    const eveningToday = activeToday.filter((r) => r.roster_type === "dedicated");

    let peopleToday = 0;
    let dedicatedPerson = "-";
    let standby1 = "-";
    let standby2 = "-";
    const dutyNames = [];

    extendToday.forEach((r) => {
      const val = r.entries?.[today]?.["Duty"];
      if (val) {
        peopleToday += 1;
        dutyNames.push(val);
      }
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
      dedicatedPerson,
      standby1,
      standby2,
      dutyNames,
      upcomingCount: upcomingCount || 0,
      totalStaff: totalStaff || 0,
    });
    setLoading(false);
  }

  return (
    <div className="shell">
      <TopNav />
      <main className="app">
        <div className="panel-head" style={{ marginBottom: 6 }}>
          <h2 style={{ fontSize: 20, textTransform: "none", color: "var(--ink-900)" }}>
            Today&apos;s overview
          </h2>
        </div>
        <p className="hint" style={{ marginBottom: 18 }}>
          {loading ? "Loading..." : `As of ${todayISO()}`}
        </p>

        <div className="stat-grid">
          <StatCard label="People scheduled today" value={stats?.peopleToday ?? "-"} accent="main" />
          <StatCard label="Extend Roster count" value={stats?.extendCount ?? "-"} accent="extend" />
          <StatCard label="Evening Roster count" value={stats?.eveningCount ?? "-"} accent="evening" />
          <StatCard label="Dedicated person" value={stats?.dedicatedPerson ?? "-"} accent="evening" isName />
          <StatCard label="Stand by Person 1" value={stats?.standby1 ?? "-"} accent="amber" isName />
          <StatCard label="Stand by Person 2" value={stats?.standby2 ?? "-"} accent="amber" isName />
          <StatCard label="Upcoming saved rosters" value={stats?.upcomingCount ?? "-"} accent="main" />
          <StatCard label="Active staff" value={stats?.totalStaff ?? "-"} accent="main" />
        </div>

        {stats?.dutyNames?.length > 0 && (
          <div className="panel" style={{ marginTop: 8 }}>
            <div className="panel-head"><h2>On duty today (Extend Roster)</h2></div>
            <div className="staff-chip-list">
              {stats.dutyNames.map((n, i) => (
                <div className="staff-chip static" key={i}>{n}</div>
              ))}
            </div>
          </div>
        )}

        <div className="panel" style={{ marginTop: 18 }}>
          <div className="panel-head"><h2>Quick actions</h2></div>
          <div className="quick-actions">
            <Link href="/roster" className="quick-btn quick-primary">
              <span className="quick-icon">＋</span>
              Create Roster
            </Link>
            <Link href="/roster?view=archive" className="quick-btn">
              <span className="quick-icon">🗂</span>
              View Old Rosters
            </Link>
            <Link href="/employees" className="quick-btn">
              <span className="quick-icon">👥</span>
              Employee Master
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, accent, isName }) {
  return (
    <div className={`stat-card accent-${accent}`}>
      <div className="stat-value" style={isName ? { fontSize: 18 } : undefined}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
