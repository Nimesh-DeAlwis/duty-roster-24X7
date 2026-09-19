"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import TopNav from "../../components/TopNav";

const ROLE_OPTIONS = ["Employee", "Team Leader", "Supervisor", "Manager", "Admin"];

const BLANK = {
  name: "", employee_id: "", designation: "", department: "",
  phone: "", email: "", role: "Employee",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from("staff").select("*").order("sort_order", { ascending: true });
    if (!error && data) setEmployees(data);
  }

  function startEdit(emp) {
    setEditingId(emp.id);
    setForm({
      name: emp.name || "",
      employee_id: emp.employee_id || "",
      designation: emp.designation || "",
      department: emp.department || "",
      phone: emp.phone || "",
      email: emp.email || "",
      role: emp.role || "Employee",
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
      ({ error } = await supabase.from("staff").insert({ ...form, active: true, sort_order: employees.length + 1 }));
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

  async function toggleActive(emp) {
    await supabase.from("staff").update({ active: !emp.active }).eq("id", emp.id);
    load();
  }

  async function removeEmployee(id) {
    if (!confirm("Permanently delete this employee record? This cannot be undone.")) return;
    await supabase.from("staff").delete().eq("id", id);
    if (editingId === id) cancelEdit();
    load();
  }

  const filtered = employees.filter((e) => {
    if (statusFilter === "active" && !e.active) return false;
    if (statusFilter === "inactive" && e.active) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      e.name?.toLowerCase().includes(q) ||
      e.employee_id?.toLowerCase().includes(q) ||
      e.designation?.toLowerCase().includes(q) ||
      e.department?.toLowerCase().includes(q) ||
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
              <div className="field">
                <label>Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="controls-row" style={{ marginTop: 12 }}>
              <div className="field grow">
                <label>Designation</label>
                <input type="text" value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Support Executive" />
              </div>
              <div className="field grow">
                <label>Department / Team</label>
                <input type="text" value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Wing24x7 Support" />
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
          <p className="hint">
            The Role field is a label for reference only — it doesn&apos;t create a separate
            login. Everyone signs in with the shared Admin or Staff-viewer account.
          </p>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Employee master</h2>
            <span className="hint">{filtered.length} of {employees.length}</span>
          </div>
          <div className="controls-row" style={{ marginBottom: 14 }}>
            <div className="field grow">
              <label>Search</label>
              <input type="text" placeholder="Search by name, ID, designation, department, phone, or email"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="field">
              <label>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
          <div className="table-wrap">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Role</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className={!emp.active ? "row-inactive" : ""}>
                    <td className="strong">{emp.name}</td>
                    <td>{emp.employee_id || "-"}</td>
                    <td>{emp.role || "Employee"}</td>
                    <td>{emp.designation || "-"}</td>
                    <td>{emp.department || "-"}</td>
                    <td>{emp.phone || "-"}</td>
                    <td>{emp.email || "-"}</td>
                    <td>
                      <span className={`status-pill ${emp.active ? "status-active" : "status-inactive"}`}>
                        {emp.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button className="secondary" onClick={() => startEdit(emp)}>Edit</button>
                      <button className="secondary" onClick={() => toggleActive(emp)}>
                        {emp.active ? "Deactivate" : "Activate"}
                      </button>
                      <button className="danger" onClick={() => removeEmployee(emp.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={9} className="hint" style={{ padding: 16 }}>No employees found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
