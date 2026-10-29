
import { useCallback, useEffect, useState } from "react";
import "./AuditLogs.css";

const API_URL = "https://spendflow-api-j38v.onrender.com/api";

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatAction = (action) =>
  (action || "UNKNOWN")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatEntity = (entity) => entity || "—";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("spendflow_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });

      if (action) params.set("action", action);
      if (entityType) params.set("entityType", entityType);

      const response = await fetch(
        `${API_URL}/audit-logs?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("spendflow_token");
        localStorage.removeItem("spendflow_user");
        window.location.href = "/";
        return;
      }

      if (response.status === 403) {
        throw new Error("Audit Logs sirf Manager aur Finance Approver ke liye hain.");
      }

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Audit Logs load nahi ho sake.");
      }

      setLogs(result.data || []);
      setPagination(
        result.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      setError(err.message || "Kuch galat ho gaya.");
    } finally {
      setLoading(false);
    }
  }, [action, entityType]);

  useEffect(() => {
    loadLogs(1);
  }, [loadLogs]);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("spendflow_user") || "{}");
    } catch {
      return {};
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem("spendflow_token");
    localStorage.removeItem("spendflow_user");
    window.location.href = "/";
  };

  return (
    <div className="al-layout">
      <aside className="al-sidebar">
        <a className="al-brand" href="/dashboard">
          <span className="al-brand-icon">S</span>
          <span>
            <strong>SpendFlow</strong>
            <small>Expense Management</small>
          </span>
        </a>

        <div className="al-nav-label">WORKSPACE</div>

        <nav className="al-nav">
          <a href="/dashboard" className="al-nav-link">
            <span>▦</span> Dashboard
          </a>
          <a href="/purchase-requests" className="al-nav-link">
            <span>⇧</span> Purchase Requests
          </a>
          <a href="/approvals" className="al-nav-link">
            <span>✓</span> Approvals
          </a>
          <a href="/budgets" className="al-nav-link">
            <span>◫</span> Budgets
          </a>
          <a href="/audit-logs" className="al-nav-link active">
            <span>≡</span> Audit Logs
          </a>
        </nav>

        <div className="al-sidebar-bottom">
          <div className="al-user">
            <div className="al-avatar">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="al-user-info">
              <strong>{user.name || "SpendFlow User"}</strong>
              <small>
                {Array.isArray(user.roles) ? user.roles[0] : "User"}
              </small>
            </div>
          </div>
          <button className="al-logout" onClick={handleLogout}>
            ↪ Log out
          </button>
        </div>
      </aside>

      <main className="al-main">
        <header className="al-header">
          <div>
            <div className="al-breadcrumb">Workspace / Audit Logs</div>
            <h1>Audit Logs</h1>
            <p>Track important actions performed across SpendFlow.</p>
          </div>
          <button
            className="al-refresh"
            onClick={() => loadLogs(1)}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </header>

        {error && (
          <div className="al-alert">
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        <section className="al-summary">
          <div>
            <span>Total matching events</span>
            <strong>{pagination.total}</strong>
          </div>
          <div>
            <span>Current page</span>
            <strong>
              {pagination.totalPages
                ? `${pagination.page} / ${pagination.totalPages}`
                : "0 / 0"}
            </strong>
          </div>
        </section>

        <section className="al-table-card">
          <div className="al-table-heading">
            <div>
              <h2>Activity History</h2>
              <p>Newest events appear first.</p>
            </div>
          </div>

          <div className="al-filters">
            <label>
              <span>Action</span>
              <select
                value={action}
                onChange={(event) => setAction(event.target.value)}
              >
                <option value="">All actions</option>
                <option value="REQUEST_CREATED">Request created</option>
                <option value="REQUEST_UPDATED">Request updated</option>
                <option value="REQUEST_SUBMITTED">Request submitted</option>
                <option value="REQUEST_WITHDRAWN">Request withdrawn</option>
                <option value="REQUEST_APPROVED">Request approved</option>
                <option value="REQUEST_REJECTED">Request rejected</option>
                <option value="REQUEST_RESUBMITTED">Request resubmitted</option>
                <option value="BUDGET_RESERVED">Budget reserved</option>
                <option value="BUDGET_UPDATED">Budget updated</option>
                <option value="POLICY_CREATED">Policy created</option>
                <option value="POLICY_UPDATED">Policy updated</option>
                <option value="USER_CREATED">User created</option>
                <option value="USER_UPDATED">User updated</option>
                <option value="USER_DEACTIVATED">User deactivated</option>
                <option value="DEPARTMENT_CREATED">Department created</option>
                <option value="DEPARTMENT_UPDATED">Department updated</option>
                <option value="LOGIN_SUCCESS">Login success</option>
                <option value="LOGIN_FAILED">Login failed</option>
              </select>
            </label>

            <label>
              <span>Entity type</span>
              <select
                value={entityType}
                onChange={(event) => setEntityType(event.target.value)}
              >
                <option value="">All entities</option>
                <option value="User">User</option>
                <option value="Department">Department</option>
                <option value="Budget">Budget</option>
                <option value="ApprovalPolicy">Approval Policy</option>
                <option value="PurchaseRequest">Purchase Request</option>
                <option value="Authentication">Authentication</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="al-state">Loading audit history...</div>
          ) : logs.length === 0 ? (
            <div className="al-state">
              <h3>No audit events found</h3>
              <p>Try changing the filters or check again later.</p>
            </div>
          ) : (
            <div className="al-table-scroll">
              <table className="al-table">
                <thead>
                  <tr>
                    <th>DATE & TIME</th>
                    <th>ACTION</th>
                    <th>PERFORMED BY</th>
                    <th>ENTITY</th>
                    <th>DETAILS</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td className="al-date">{formatDate(log.createdAt)}</td>
                      <td>
                        <span className="al-action">
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td>
                        <strong>{log.actorId?.name || "System / Unknown"}</strong>
                        <small className="al-email">
                          {log.actorId?.email || "—"}
                        </small>
                      </td>
                      <td>
                        <strong>{formatEntity(log.entityType)}</strong>
                        <small className="al-id">
                          {log.entityId
                            ? String(log.entityId).slice(-8)
                            : "No entity ID"}
                        </small>
                      </td>
                      <td>
                        <details className="al-details">
                          <summary>View details</summary>
                          <pre>
                            {JSON.stringify(log.metadata || {}, null, 2)}
                          </pre>
                          {log.requestId && (
                            <p>Request ID: {String(log.requestId)}</p>
                          )}
                          {log.cycleNumber && (
                            <p>Approval cycle: {log.cycleNumber}</p>
                          )}
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="al-footer">
            <span>
              {pagination.total === 0
                ? "No records"
                : `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )} of ${pagination.total}`}
            </span>
            <div className="al-pagination">
              <button
                disabled={loading || pagination.page <= 1}
                onClick={() => loadLogs(pagination.page - 1)}
              >
                ← Previous
              </button>
              <button
                disabled={
                  loading ||
                  pagination.totalPages === 0 ||
                  pagination.page >= pagination.totalPages
                }
                onClick={() => loadLogs(pagination.page + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AuditLogs;
