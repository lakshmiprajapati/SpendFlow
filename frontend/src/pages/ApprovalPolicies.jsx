
import { useCallback, useEffect, useState } from "react";
import "./ApprovalPolicies.css";

const API_URL = "https://spendflow-api-j38v.onrender.com/api";

const formatAmount = (paise) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format((paise || 0) / 100);

function ApprovalPolicies() {
  const [policies, setPolicies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    departmentId: "",
    minAmount: "0",
    maxAmount: "",
    steps: [
      { sequence: 1, approverType: "manager", required: true },
    ],
    isActive: true,
  });

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("spendflow_user") || "{}");
    } catch {
      return {};
    }
  })();

  const roles = Array.isArray(user.roles) ? user.roles : [];
  const canManage = roles.includes("financeApprover");

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      departmentId: "",
      minAmount: "0",
      maxAmount: "",
      steps: [
        { sequence: 1, approverType: "manager", required: true },
      ],
      isActive: true,
    });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("spendflow_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [policyResponse, departmentResponse] = await Promise.all([
        fetch(`${API_URL}/approval-policies`, { headers }),
        fetch(`${API_URL}/departments`, { headers }),
      ]);

      const policyResult = await policyResponse.json().catch(() => ({}));
      const departmentResult = await departmentResponse.json().catch(() => ({}));

      console.log("Approval Policies API:", {
  policyStatus: policyResponse.status,
  departmentStatus: departmentResponse.status,
});


      if (policyResponse.status === 401 || departmentResponse.status === 401) {
        localStorage.removeItem("spendflow_token");
        localStorage.removeItem("spendflow_user");
        window.location.href = "/";
        return;
      }

      if (!policyResponse.ok || policyResult.success === false) {
        throw new Error(
          policyResult.message || "Approval policies load nahi ho sakin."
        );
      }

      if (!departmentResponse.ok || departmentResult.success === false) {
        throw new Error(
          departmentResult.message || "Departments load nahi ho sake."
        );
      }

      setPolicies(policyResult.data || []);
      setDepartments(departmentResult.data || []);
    } catch (err) {
      setError(err.message || "Kuch galat ho gaya.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const updateStep = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      steps: previous.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [field]: value } : step
      ),
    }));
  };

  const addStep = () => {
    setForm((previous) => ({
      ...previous,
      steps: [
        ...previous.steps,
        {
          sequence: previous.steps.length + 1,
          approverType: "departmentHead",
          required: true,
        },
      ],
    }));
  };

  const removeStep = (index) => {
    setForm((previous) => ({
      ...previous,
      steps: previous.steps
        .filter((_, stepIndex) => stepIndex !== index)
        .map((step, stepIndex) => ({
          ...step,
          sequence: stepIndex + 1,
        })),
    }));
  };

  const startEdit = (policy) => {
    setEditingId(policy._id);
    setError("");
    setSuccess("");

    setForm({
      name: policy.name || "",
      departmentId: policy.departmentId?._id || policy.departmentId || "",
      minAmount: String((policy.minAmountPaise || 0) / 100),
      maxAmount:
        policy.maxAmountPaise == null
          ? ""
          : String(policy.maxAmountPaise / 100),
      steps: (policy.steps || []).map((step, index) => ({
        sequence: index + 1,
        approverType: step.approverType,
        required: step.required !== false,
      })),
      isActive: policy.isActive !== false,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Policy name enter karo.");
      return;
    }

    if (!Number.isFinite(Number(form.minAmount)) || Number(form.minAmount) < 0) {
      setError("Minimum amount valid aur zero ya usse zyada hona chahiye.");
      return;
    }

    if (
      form.maxAmount !== "" &&
      (!Number.isFinite(Number(form.maxAmount)) ||
        Number(form.maxAmount) < Number(form.minAmount))
    ) {
      setError("Maximum amount minimum amount se kam nahi ho sakta.");
      return;
    }

    if (!form.steps.length) {
      setError("Kam se kam ek approval step zaroori hai.");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("spendflow_token");

      const payload = {
        name: form.name.trim(),
        departmentId: form.departmentId || null,
        minAmount: Number(form.minAmount),
        maxAmount: form.maxAmount === "" ? null : Number(form.maxAmount),
        steps: form.steps.map((step, index) => ({
          sequence: index + 1,
          approverType: step.approverType,
          required: step.required,
        })),
        isActive: form.isActive,
      };

      const response = await fetch(
        editingId
          ? `${API_URL}/approval-policies/${editingId}`
          : `${API_URL}/approval-policies`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("spendflow_token");
        localStorage.removeItem("spendflow_user");
        window.location.href = "/";
        return;
      }

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Policy save nahi ho saki.");
      }

      setSuccess(
        editingId
          ? "Approval policy successfully update ho gayi."
          : "Approval policy successfully create ho gayi."
      );

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message || "Kuch galat ho gaya.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("spendflow_token");
    localStorage.removeItem("spendflow_user");
    window.location.href = "/";
  };

  return (
    <div className="ap-layout">
      <aside className="ap-sidebar">
        <a className="ap-brand" href="/dashboard">
          <span className="ap-brand-icon">S</span>
          <span>
            <strong>SpendFlow</strong>
            <small>Expense Management</small>
          </span>
        </a>

        <div className="ap-nav-label">WORKSPACE</div>

        <nav className="ap-nav">
          <a href="/dashboard" className="ap-nav-link">▦ Dashboard</a>
          <a href="/purchase-requests" className="ap-nav-link">⇧ Purchase Requests</a>
          <a href="/approvals" className="ap-nav-link">✓ Approvals</a>
          <a href="/budgets" className="ap-nav-link">◫ Budgets</a>
          <a href="/audit-logs" className="ap-nav-link">≡ Audit Logs</a>
          <a href="/approval-policies" className="ap-nav-link active">⚙ Approval Policies</a>
        </nav>

        <div className="ap-sidebar-bottom">
          <div className="ap-user">
            <div className="ap-avatar">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="ap-user-info">
              <strong>{user.name || "SpendFlow User"}</strong>
              <small>{roles[0] || "User"}</small>
            </div>
          </div>
          <button className="ap-logout" onClick={handleLogout}>↪ Log out</button>
        </div>
      </aside>

      <main className="ap-main">
        <header className="ap-header">
          <div>
            <div className="ap-breadcrumb">Workspace / Approval Policies</div>
            <h1>Approval Policies</h1>
            <p>Configure approval steps based on request amount and department.</p>
          </div>
          <button className="ap-refresh" onClick={loadData} disabled={loading}>
            ↻ Refresh
          </button>
        </header>

        {error && (
          <div className="ap-alert ap-error">
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {success && (
          <div className="ap-alert ap-success">
            <span>{success}</span>
            <button onClick={() => setSuccess("")}>×</button>
          </div>
        )}

        {canManage && (
          <section className="ap-card">
            <div className="ap-card-heading">
              <div>
                <h2>{editingId ? "Edit Approval Policy" : "Create Approval Policy"}</h2>
                <p>Amounts are entered in Indian Rupees.</p>
              </div>
              {editingId && (
                <button type="button" className="ap-secondary" onClick={resetForm}>
                  Cancel edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ap-form-grid">
                <label>
                  Policy name
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="e.g. Standard Purchase Approval"
                    maxLength={100}
                    required
                  />
                </label>

                <label>
                  Department
                  <select
                    value={form.departmentId}
                    onChange={(event) => updateField("departmentId", event.target.value)}
                  >
                    <option value="">Organization-wide policy</option>
                    {departments.map((department) => (
                      <option key={department._id} value={department._id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Minimum amount (₹)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minAmount}
                    onChange={(event) => updateField("minAmount", event.target.value)}
                    required
                  />
                </label>

                <label>
                  Maximum amount (₹)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.maxAmount}
                    onChange={(event) => updateField("maxAmount", event.target.value)}
                    placeholder="No upper limit"
                  />
                </label>
              </div>

              <div className="ap-steps-heading">
                <div>
                  <h3>Approval steps</h3>
                  <p>Approvers act in the sequence shown.</p>
                </div>
                <button type="button" className="ap-secondary" onClick={addStep}>
                  + Add step
                </button>
              </div>

              <div className="ap-steps-list">
                {form.steps.map((step, index) => (
                  <div className="ap-step-row" key={index}>
                    <span className="ap-step-number">{index + 1}</span>

                    <label>
                      Approver role
                      <select
                        value={step.approverType}
                        onChange={(event) =>
                          updateStep(index, "approverType", event.target.value)
                        }
                      >
                        <option value="manager">Manager</option>
                        <option value="departmentHead">Department Head</option>
                        <option value="financeApprover">Finance Approver</option>
                      </select>
                    </label>

                    <label className="ap-required">
                      <input
                        type="checkbox"
                        checked={step.required}
                        onChange={(event) =>
                          updateStep(index, "required", event.target.checked)
                        }
                      />
                      Required
                    </label>

                    <button
                      type="button"
                      className="ap-remove-step"
                      disabled={form.steps.length === 1}
                      onClick={() => removeStep(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <label className="ap-active-toggle">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => updateField("isActive", event.target.checked)}
                />
                Policy is active
              </label>

              <div className="ap-form-actions">
                <button type="button" className="ap-secondary" onClick={resetForm}>
                  Clear
                </button>
                <button type="submit" className="ap-primary" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Save changes" : "Create policy"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="ap-card">
          <div className="ap-card-heading">
            <div>
              <h2>Configured policies</h2>
              <p>Department-specific policies take precedence over organization-wide policies.</p>
            </div>
            <span className="ap-count">{policies.length} policies</span>
          </div>

          {loading ? (
            <div className="ap-state">Loading approval policies...</div>
          ) : policies.length === 0 ? (
            <div className="ap-state">
              <h3>No approval policies found</h3>
              <p>Create an approval policy to define the approval workflow.</p>
            </div>
          ) : (
            <div className="ap-policy-grid">
              {policies.map((policy) => {
                const department = departments.find(
                  (item) =>
                    item._id === (policy.departmentId?._id || policy.departmentId)
                );

                return (
                  <article className="ap-policy" key={policy._id}>
                    <div className="ap-policy-top">
                      <div>
                        <h3>{policy.name}</h3>
                        <p>{department?.name || (policy.departmentId ? "Department" : "Organization-wide")}</p>
                      </div>
                      <span className={policy.isActive ? "ap-status active" : "ap-status inactive"}>
                        {policy.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="ap-amount-range">
                      <span>Amount range</span>
                      <strong>
                        {formatAmount(policy.minAmountPaise)} –{" "}
                        {policy.maxAmountPaise == null
                          ? "No limit"
                          : formatAmount(policy.maxAmountPaise)}
                      </strong>
                    </div>

                    <div className="ap-policy-steps">
                      <span>Approval workflow</span>
                      {([...policy.steps].sort((a, b) => a.sequence - b.sequence)).map((step) => (
                        <div className="ap-policy-step" key={step.sequence}>
                          <span>{step.sequence}</span>
                          <strong>
                            {step.approverType === "departmentHead"
                              ? "Department Head"
                              : step.approverType === "financeApprover"
                                ? "Finance Approver"
                                : "Manager"}
                          </strong>
                          <small>{step.required ? "Required" : "Optional"}</small>
                        </div>
                      ))}
                    </div>

                    <div className="ap-policy-footer">
                      <span>Version {policy.version || 1}</span>
                      {canManage && (
                        <button
                          className="ap-secondary"
                          onClick={() => startEdit(policy)}
                        >
                          Edit policy
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ApprovalPolicies;
