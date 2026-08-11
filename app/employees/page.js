"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import TopNav from "../../components/TopNav";

const BLANK = { name: "", employee_id: "", phone: "", email: "" };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (!error && data) setEmployees(data);
  }

  function startEdit(emp) {
    setEditingId(emp.id);
    setForm({
      name: emp.name || "",
      employee_id: emp.employee_id || "",
      phone: emp.phone || "",
      email: emp.email || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(BLANK);
  }

  async function saveEmployee(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setStatus("Name is required.");
      return;
    }
    setLoading(true);
    setStatus("");
    let error;
    if (editingId) {
      ({ error } = await supabase.from("staff").update(form).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("staff").insert({ ...form, sort_order: employees.length + 1 }));
    }
    setLoading(false);
    if (error) {
      setStatus(`Save failed: ${error.message}`);
    } else {
      setStatus(editingId ? "Employee updated." : "Employee added.");
      cancelEdit();
      load();
    }
  }

  async function removeEmployee(id) {
    if (!confirm("Remove this employee from the active staff list?")) return;
    await supabase.from("staff").update({ active: false }).eq("id", id);
    if (editingId === id) cancelEdit();
    load();
  }

  const filtered = employees.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      e.name?.toLowerCase().includes(q) ||
      e.employee_id?.toLowerCase().includes(q) ||
      e.phone?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="shell">
      <TopNav />
      <main className="app">
        <section className="panel">
          <div className="panel-head">
            <h2>{editingId ? "Edit employee" : "Add employee"}</h2>
          </div>
          <form onSubmit={saveEmployee}>
            <div className="controls-row">
              <div className="field grow">
                <label>Employee name *</label>
                <input type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              </div>
              <div className="field">
                <label>Employee ID</label>
                <input type="text" value={form.employee_id}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })} placeholder="e.g. EMP-014" />
              </div>
            </div>
            <div className="controls-row" style={{ marginTop: 12 }}>
              <div className="field grow">
                <label>Phone number</label>
                <input type="text" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="07X XXX XXXX" />
              </div>
              <div className="field grow">
                <label>Email</label>
                <input type="text" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" />
              </div>
            </div>
            <div className="controls-row" style={{ marginTop: 14 }}>
              <button type="submit" disabled={loading}>
                {editingId ? "Update employee" : "Add employee"}
              </button>
              {editingId && (
                <button type="button" className="secondary" onClick={cancelEdit}>Cancel</button>
              )}
              {status && <span className="hint" style={{ alignSelf: "center" }}>{status}</span>}
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Employee master</h2>
            <span className="hint">{filtered.length} of {employees.length}</span>
          </div>
          <div className="field grow" style={{ marginBottom: 14 }}>
            <label>Search</label>
            <input type="text" placeholder="Search by name, ID, phone, or email"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="table-wrap">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id}>
                    <td className="strong">{emp.name}</td>
                    <td>{emp.employee_id || "-"}</td>
                    <td>{emp.phone || "-"}</td>
                    <td>{emp.email || "-"}</td>
                    <td className="row-actions">
                      <button className="secondary" onClick={() => startEdit(emp)}>Edit</button>
                      <button className="danger" onClick={() => removeEmployee(emp.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={5} className="hint" style={{ padding: 16 }}>No employees found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
