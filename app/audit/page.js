"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import TopNav from "../../components/TopNav";

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLogs(data || []);
    setLoading(false);
  }

  return (
    <div className="shell">
      <TopNav />
      <main className="app">
        <section className="panel">
          <div className="panel-head">
            <h2>Audit log</h2>
            <span className="hint">{loading ? "Loading..." : `${logs.length} entries`}</span>
          </div>
          <p className="hint" style={{ marginBottom: 16 }}>
            Every roster created, changed, or deleted from this app is recorded here, along with
            who made the change and exactly which assignments were replaced.
          </p>

          <div className="audit-list">
            {logs.map((log) => (
              <div className="audit-entry" key={log.id}>
                <div className="audit-entry-head">
                  <span className={`audit-action audit-${log.action}`}>{log.action}</span>
                  <span className="audit-title">{log.roster_title}</span>
                  <span className="hint">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <div className="hint">by {log.actor}</div>

                {Array.isArray(log.changes) && log.changes.length > 0 && (
                  <div className="table-wrap" style={{ marginTop: 10 }}>
                    <table className="employee-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Slot</th>
                          <th>Previous assignment</th>
                          <th>New assignment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {log.changes.map((c, i) => (
                          <tr key={i}>
                            <td>{c.date}</td>
                            <td>{c.row}</td>
                            <td>{c.previous}</td>
                            <td>{c.new}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
            {!loading && !logs.length && (
              <span className="hint">No activity recorded yet — changes will appear here as rosters are created, edited, or deleted.</span>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
