
import { useCallback, useEffect, useState } from "react";
import "./PurchaseRequests.css";

const API_URL = "http://localhost:5000/api";

const INITIAL_FORM = {
  title: "",
  description: "",
  justification: "",
  quantity: "1",
  unitPrice: "",
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
}

function formatStatus(status) {
  return (status || "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function PurchaseRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingId, setSubmittingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const token = localStorage.getItem("spendflow_token");

  const apiRequest = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("spendflow_token")}`,
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      localStorage.removeItem("spendflow_token");
      localStorage.removeItem("spendflow_user");
      window.location.replace("/");
      throw new Error("Your session has expired. Please sign in again.");
    }

    if (!response.ok) {
      const details = Array.isArray(data.errors)
        ? data.errors.join(". ")
        : "";

      throw new Error(
        details ||
          data.message ||
          data.error ||
          "The request could not be completed."
      );
    }

    return data;
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/requests");

      const list = Array.isArray(data)
        ? data
        : data.data?.requests ??
          data.requests ??
          data.data ??
          [];

      setRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Unable to load purchase requests.");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    if (!token) {
      window.location.replace("/");
      return;
    }

    loadRequests();
  }, [token, loadRequests]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const quantity = Number(form.quantity);
    const unitPrice = Number(form.unitPrice);

    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 100000
    ) {
      setError("Quantity must be a whole number between 1 and 100000.");
      return;
    }

    if (
      !Number.isFinite(unitPrice) ||
      unitPrice < 0 ||
      !Number.isSafeInteger(Math.round(unitPrice * 100))
    ) {
      setError("Enter a valid unit price in rupees.");
      return;
    }

    const unitPricePaise = Math.round(unitPrice * 100);
    const totalAmountPaise = quantity * unitPricePaise;

    if (!Number.isSafeInteger(totalAmountPaise)) {
      setError("The total purchase amount is too large.");
      return;
    }

    if (form.title.trim().length < 3) {
      setError("Title must contain at least 3 characters.");
      return;
    }

    if (form.justification.trim().length < 10) {
      setError("Justification must contain at least 10 characters.");
      return;
    }

    setSaving(true);

    try {
      await apiRequest("/requests", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          justification: form.justification.trim(),
          quantity,
          unitPricePaise,
        }),
      });

      setForm(INITIAL_FORM);
      setShowForm(false);
      setSuccess("Purchase request created successfully as a draft.");

      await loadRequests();
    } catch (err) {
      setError(err.message || "Unable to create purchase request.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitRequest = async (id) => {
    setError("");
    setSuccess("");
    setSubmittingId(id);

    try {
      await apiRequest(`/requests/${id}/submit`, {
        method: "POST",
      });

      setSuccess("Purchase request submitted for approval.");
      await loadRequests();
    } catch (err) {
      setError(err.message || "Unable to submit purchase request.");
    } finally {
      setSubmittingId("");
    }
  };

  const getId = (request) => request._id || request.id;

  const getAmount = (request) => {
    if (typeof request.totalAmountPaise === "number") {
      return request.totalAmountPaise / 100;
    }

    if (typeof request.amount === "number") {
      return request.amount;
    }

    if (typeof request.totalAmount === "number") {
      return request.totalAmount;
    }

    return 0;
  };

  const quantity = Number(form.quantity);
  const unitPrice = Number(form.unitPrice);

  const previewTotal =
    Number.isSafeInteger(quantity) &&
    quantity > 0 &&
    Number.isFinite(unitPrice) &&
    unitPrice >= 0
      ? quantity * unitPrice
      : null;

  return (
    <main className="pr-page">
      <header className="pr-header">
        <div>
          <span className="pr-eyebrow">WORKSPACE</span>
          <h1>Purchase Requests</h1>
          <p>Manage your spending requests from one place.</p>
        </div>

        <button
          className="pr-primary-button"
          type="button"
          onClick={() => {
            setError("");
            setSuccess("");
            setShowForm((previous) => !previous);
          }}
        >
          {showForm ? "Cancel" : "+ New Request"}
        </button>
      </header>

      {error && (
        <div className="pr-alert pr-alert-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="pr-alert pr-alert-success" role="status">
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {showForm && (
        <section className="pr-form-card">
          <h2>Create purchase request</h2>
          <p>Enter the details and save the request as a draft.</p>

          <form onSubmit={handleCreate} className="pr-form">
            <label htmlFor="title">Request title</label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Office monitor"
              minLength={3}
              maxLength={150}
              required
            />

            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the items you need"
              rows={3}
              maxLength={3000}
            />

            <label htmlFor="justification">Purchase justification</label>
            <textarea
              id="justification"
              name="justification"
              value={form.justification}
              onChange={handleChange}
              placeholder="Explain why this purchase is necessary"
              rows={3}
              minLength={10}
              maxLength={2000}
              required
            />

            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              max="100000"
              step="1"
              value={form.quantity}
              onChange={handleChange}
              required
            />

            <label htmlFor="unitPrice">Price per item (₹)</label>
            <input
              id="unitPrice"
              name="unitPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.unitPrice}
              onChange={handleChange}
              placeholder="e.g. 15000"
              required
            />

            <div className="pr-total-preview">
              <span>Total estimated amount</span>
              <strong>
                {previewTotal !== null &&
                Number.isFinite(previewTotal)
                  ? formatCurrency(previewTotal)
                  : "—"}
              </strong>
            </div>

            <button
              className="pr-primary-button"
              type="submit"
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Draft"}
            </button>
          </form>
        </section>
      )}

      <section className="pr-list-card">
        <div className="pr-list-heading">
          <div>
            <h2>Your requests</h2>
            <p>Requests you have created.</p>
          </div>

          <button
            className="pr-secondary-button"
            type="button"
            onClick={loadRequests}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p className="pr-empty">Loading purchase requests...</p>
        ) : requests.length === 0 ? (
          <div className="pr-empty">
            <div className="pr-empty-icon">▤</div>
            <h3>No purchase requests yet</h3>
            <p>Create a request to see it listed here.</p>
          </div>
        ) : (
          <div className="pr-table-wrap">
            <table className="pr-table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => {
                  const id = getId(request);
                  const status = request.status || "unknown";
                  const canSubmit =
                    status === "draft" || status === "rejected";

                  return (
                    <tr key={id}>
                      <td>
                        <strong>
                          {request.title || "Untitled request"}
                        </strong>

                        {request.description && (
                          <small>{request.description}</small>
                        )}
                      </td>

                      <td>{formatCurrency(getAmount(request))}</td>

                      <td>
                        <span
                          className={`pr-status pr-status-${status}`}
                        >
                          {formatStatus(status)}
                        </span>
                      </td>

                      <td>
                        {request.createdAt
                          ? new Date(
                              request.createdAt
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      <td>
                        {canSubmit && id ? (
                          <button
                            className="pr-submit-button"
                            type="button"
                            disabled={Boolean(submittingId)}
                            onClick={() => handleSubmitRequest(id)}
                          >
                            {submittingId === id
                              ? "Submitting..."
                              : status === "rejected"
                                ? "Resubmit"
                                : "Submit"}
                          </button>
                        ) : (
                          <span className="pr-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default PurchaseRequests;
