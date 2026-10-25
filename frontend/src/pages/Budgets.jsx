
import { useCallback, useEffect, useState } from "react";
import "./Budgets.css";

const API_URL = "http://localhost:5000/api";
const CURRENT_FY = "2026-27";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount ?? 0);

const getToken = () => localStorage.getItem("spendflow_token");

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [fiscalYear, setFiscalYear] = useState(CURRENT_FY);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const [form, setForm] = useState({
    departmentId: "",
    fiscalYear: CURRENT_FY,
    allocatedAmount: "",
  });

  const request = useCallback(async (path, options = {}) => {
    const token = getToken();

    if (!token) {
      throw new Error("Session nahi mila. Please login again.");
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      localStorage.removeItem("spendflow_token");
      localStorage.removeItem("spendflow_user");
      window.location.href = "/";
      throw new Error("Session expire ho gaya. Please login again.");
    }

    if (!response.ok || data.success === false) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }, []);

  
const loadData = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
    const storedUser = JSON.parse(
      localStorage.getItem("spendflow_user") || "{}"
    );

    const roles = Array.isArray(storedUser.roles)
      ? storedUser.roles
      : [];

    const canViewAllBudgets = [
      "manager",
      "departmentHead",
      "financeApprover",
    ].some((role) => roles.includes(role));

    if (canViewAllBudgets) {
      const [budgetResult, departmentResult] = await Promise.all([
        request(
          `/budgets?fiscalYear=${encodeURIComponent(fiscalYear)}`
        ),
        request("/departments"),
      ]);

      setBudgets(budgetResult.data || []);
      setDepartments(departmentResult.data || []);
    } else {
      const result = await request("/budgets/my-department");

      const myBudget = result.data;

      setBudgets([
        {
          ...myBudget,
          departmentId: myBudget.department,
        },
      ]);

      setDepartments([]);
    }
  } catch (err) {
    setError(err.message || "Budget data load nahi ho saka.");
    setBudgets([]);
    setDepartments([]);
  } finally {
    setLoading(false);
  }
}, [fiscalYear, request]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredBudgets = budgets.filter((budget) => {
    const departmentName = budget.departmentId?.name || "";
    const departmentCode = budget.departmentId?.code || "";
    const query = search.trim().toLowerCase();

    return (
      departmentName.toLowerCase().includes(query) ||
      departmentCode.toLowerCase().includes(query)
    );
  });

  const totals = filteredBudgets.reduce(
    (result, budget) => ({
      allocated: result.allocated + (budget.allocatedPaise || 0),
      committed: result.committed + (budget.committedPaise || 0),
      remaining:
        result.remaining +
        (budget.allocatedPaise || 0) -
        (budget.committedPaise || 0),
    }),
    { allocated: 0, committed: 0, remaining: 0 }
  );

  const openCreateModal = () => {
    setEditingBudget(null);
    setForm({
      departmentId: departments[0]?._id || "",
      fiscalYear,
      allocatedAmount: "",
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const openEditModal = (budget) => {
    setEditingBudget(budget);
    setForm({
      departmentId: budget.departmentId?._id || "",
      fiscalYear: budget.fiscalYear,
      allocatedAmount: String(budget.allocatedPaise / 100),
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (!saving) {
      setModalOpen(false);
      setEditingBudget(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const amount = Number(form.allocatedAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Valid positive budget amount enter karo.");
      return;
    }

    if (!editingBudget && !form.departmentId) {
      setError("Please select a department.");
      return;
    }

    setSaving(true);

    try {
      if (editingBudget) {
        await request(`/budgets/${editingBudget._id}`, {
          method: "PATCH",
          body: JSON.stringify({ allocatedAmount: amount }),
        });
        setSuccess("Budget allocation successfully update ho gaya.");
      } else {
        await request("/budgets", {
          method: "POST",
          body: JSON.stringify({
            departmentId: form.departmentId,
            fiscalYear: form.fiscalYear,
            allocatedAmount: amount,
          }),
        });
        setSuccess("New budget successfully create ho gaya.");
      }

      setModalOpen(false);
      setEditingBudget(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Budget save nahi ho saka.");
    } finally {
      setSaving(false);
    }
  };

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("spendflow_user") || "{}");
    } catch {
      return {};
    }
  })();

  const roles = Array.isArray(user.roles) ? user.roles : [];
  const canManageBudget = roles.includes("financeApprover");

  const handleLogout = () => {
    localStorage.removeItem("spendflow_token");
    localStorage.removeItem("spendflow_user");
    window.location.href = "/";
  };

  return (
    <div className="bm-layout">
      <aside className="bm-sidebar">
        <a className="bm-brand" href="/dashboard">
          <span className="bm-brand-icon">S</span>
          <span>
            <strong>SpendFlow</strong>
            <small>Expense Management</small>
          </span>
        </a>

        <div className="bm-nav-label">WORKSPACE</div>

        <nav className="bm-nav">
          <a href="/dashboard" className="bm-nav-link">
            <span>▦</span> Dashboard
          </a>
          <a href="/purchase-requests" className="bm-nav-link">
            <span>⇧</span> Purchase Requests
          </a>
          <a href="/approvals" className="bm-nav-link">
            <span>✓</span> Approvals
          </a>
          <a href="/budgets" className="bm-nav-link active">
            <span>◫</span> Budgets
          </a>
        </nav>

        <div className="bm-sidebar-bottom">
          <div className="bm-user">
            <div className="bm-avatar">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="bm-user-info">
              <strong>{user.name || "SpendFlow User"}</strong>
              <small>{roles[0] || "User"}</small>
            </div>
          </div>
          <button className="bm-logout" onClick={handleLogout}>
            ↪ Log out
          </button>
        </div>
      </aside>

      <main className="bm-main">
        <header className="bm-topbar">
          <div>
            <div className="bm-breadcrumb">Workspace / Budgets</div>
            <h1>Budget Management</h1>
            <p>Manage departmental allocations and track spending.</p>
          </div>

          {canManageBudget && (
            <button className="bm-primary-btn" onClick={openCreateModal}>
              <span>＋</span> Create Budget
            </button>
          )}
        </header>

        {error && !modalOpen && (
          <div className="bm-alert error">
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {success && (
          <div className="bm-alert success">
            <span>{success}</span>
            <button onClick={() => setSuccess("")}>×</button>
          </div>
        )}

        <section className="bm-stats">
          <article className="bm-stat-card">
            <div className="bm-stat-top">
              <span>Total Allocated</span>
              <span className="bm-stat-icon purple">₹</span>
            </div>
            <strong>{formatCurrency(totals.allocated / 100)}</strong>
            <small>Across {filteredBudgets.length} department budgets</small>
          </article>

          <article className="bm-stat-card">
            <div className="bm-stat-top">
              <span>Committed</span>
              <span className="bm-stat-icon orange">↗</span>
            </div>
            <strong>{formatCurrency(totals.committed / 100)}</strong>
            <small>Approved purchase commitments</small>
          </article>

          <article className="bm-stat-card">
            <div className="bm-stat-top">
              <span>Remaining</span>
              <span className="bm-stat-icon green">₹</span>
            </div>
            <strong>{formatCurrency(totals.remaining / 100)}</strong>
            <small>Available against allocation</small>
          </article>

          <article className="bm-stat-card">
            <div className="bm-stat-top">
              <span>Budget Utilization</span>
              <span className="bm-stat-icon blue">%</span>
            </div>
            <strong>
              {totals.allocated > 0
                ? `${((totals.committed / totals.allocated) * 100).toFixed(1)}%`
                : "0.0%"}
            </strong>
            <div className="bm-progress">
              <span
                style={{
                  width: `${
                    totals.allocated > 0
                      ? Math.min(
                          100,
                          (totals.committed / totals.allocated) * 100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </article>
        </section>

        <section className="bm-table-card">
          <div className="bm-table-heading">
            <div>
              <h2>Department Budgets</h2>
              <p>Review allocation, commitments and available funds.</p>
            </div>
            <span className="bm-count">{filteredBudgets.length} budgets</span>
          </div>

          <div className="bm-filters">
            <div className="bm-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search departments..."
              />
            </div>

            <label className="bm-year-filter">
              <span>Financial Year</span>
              <select
                value={fiscalYear}
                onChange={(event) => setFiscalYear(event.target.value)}
              >
                <option value="2026-27">FY 2026–27</option>
                <option value="2025-26">FY 2025–26</option>
                <option value="2027-28">FY 2027–28</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="bm-state">
              <div className="bm-spinner" />
              <p>Loading budget data...</p>
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="bm-state">
              <div className="bm-empty-icon">◫</div>
              <h3>No budgets found</h3>
              <p>
                {search
                  ? "Try another department name or code."
                  : `No budgets are available for FY ${fiscalYear}.`}
              </p>
              {canManageBudget && !search && (
                <button className="bm-primary-btn" onClick={openCreateModal}>
                  Create First Budget
                </button>
              )}
            </div>
          ) : (
            <div className="bm-table-scroll">
              <table className="bm-table">
                <thead>
                  <tr>
                    <th>DEPARTMENT</th>
                    <th>FINANCIAL YEAR</th>
                    <th>ALLOCATED</th>
                    <th>COMMITTED</th>
                    <th>REMAINING</th>
                    <th>UTILIZATION</th>
                    {canManageBudget && <th>ACTION</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredBudgets.map((budget) => {
                    const allocated = budget.allocatedPaise || 0;
                    const committed = budget.committedPaise || 0;
                    const remaining = allocated - committed;
                    const utilization =
                      allocated > 0 ? (committed / allocated) * 100 : 0;

                    return (
                      <tr key={budget._id}>
                        <td>
                          <div className="bm-department">
                            <div className="bm-department-icon">
                              {(budget.departmentId?.name || "D")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div>
                              <strong>
                                {budget.departmentId?.name || "Unknown"}
                              </strong>
                              <small>
                                {budget.departmentId?.code || "—"}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="bm-year-pill">
                            FY {budget.fiscalYear}
                          </span>
                        </td>
                        <td className="bm-money">
                          {formatCurrency(allocated / 100)}
                        </td>
                        <td className="bm-money">
                          {formatCurrency(committed / 100)}
                        </td>
                        <td className="bm-money">
                          <strong>{formatCurrency(remaining / 100)}</strong>
                        </td>
                        <td>
                          <div className="bm-utilization">
                            <div className="bm-progress">
                              <span
                                className={utilization >= 90 ? "warning" : ""}
                                style={{
                                  width: `${Math.min(100, utilization)}%`,
                                }}
                              />
                            </div>
                            <small>{utilization.toFixed(1)}%</small>
                          </div>
                        </td>
                        {canManageBudget && (
                          <td>
                            <button
                              className="bm-edit-btn"
                              onClick={() => openEditModal(budget)}
                              title="Edit allocation"
                            >
                              ✎ Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="bm-table-footer">
            <span>
              Showing {filteredBudgets.length} of {budgets.length} budgets
            </span>
            <button onClick={loadData} disabled={loading}>
              ↻ Refresh
            </button>
          </div>
        </section>
      </main>

      {modalOpen && (
        <div className="bm-modal-overlay" onMouseDown={closeModal}>
          <section
            className="bm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bm-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="bm-modal-header">
              <div>
                <h2 id="bm-modal-title">
                  {editingBudget ? "Edit Budget Allocation" : "Create Budget"}
                </h2>
                <p>
                  {editingBudget
                    ? "Update the total allocation for this department."
                    : "Allocate a budget to a department for a financial year."}
                </p>
              </div>
              <button
                className="bm-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bm-alert error">
                  <span>{error}</span>
                  <button type="button" onClick={() => setError("")}>
                    ×
                  </button>
                </div>
              )}

              <label className="bm-form-field">
                <span>Department *</span>
                <select
                  value={form.departmentId}
                  disabled={Boolean(editingBudget) || saving}
                  onChange={(event) =>
                    setForm({ ...form, departmentId: event.target.value })
                  }
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department._id} value={department._id}>
                      {department.name} ({department.code})
                    </option>
                  ))}
                </select>
              </label>

              <label className="bm-form-field">
                <span>Financial Year *</span>
                <select
                  value={form.fiscalYear}
                  disabled={Boolean(editingBudget) || saving}
                  onChange={(event) =>
                    setForm({ ...form, fiscalYear: event.target.value })
                  }
                  required
                >
                  <option value="2025-26">FY 2025–26</option>
                  <option value="2026-27">FY 2026–27</option>
                  <option value="2027-28">FY 2027–28</option>
                </select>
              </label>

              <label className="bm-form-field">
                <span>Total Allocation (₹) *</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 500000"
                  value={form.allocatedAmount}
                  onChange={(event) =>
                    setForm({ ...form, allocatedAmount: event.target.value })
                  }
                  disabled={saving}
                  required
                />
                <small>
                  {editingBudget
                    ? `Already committed: ${formatCurrency(
                        editingBudget.committedPaise / 100
                      )}. Allocation cannot go below this amount.`
                    : "Enter the total approved budget in Indian rupees."}
                </small>
              </label>

              <div className="bm-modal-actions">
                <button
                  type="button"
                  className="bm-secondary-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bm-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingBudget
                      ? "Save Changes"
                      : "Create Budget"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Budgets;
