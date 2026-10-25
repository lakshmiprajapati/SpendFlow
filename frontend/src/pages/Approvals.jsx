
import { useCallback, useEffect, useState } from "react";
import "./Approvals.css";

const API_URL = "http://localhost:5000/api";

function formatAmount(paise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format((paise || 0) / 100);
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Approvals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [comments, setComments] = useState({});

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("spendflow_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      const response = await fetch(
        `${API_URL}/requests/pending-approval`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("spendflow_token");
        localStorage.removeItem("spendflow_user");
        window.location.href = "/";
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Could not load pending approvals."
        );
      }

      setRequests(result.data?.requests || []);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Backend se connection nahi ho pa raha."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleDecision = async (requestId, decision) => {
    const comment = (comments[requestId] || "").trim();

    if (decision === "reject" && !comment) {
      setError("Reject karne ke liye reason likhna zaroori hai.");
      return;
    }

    const confirmed = window.confirm(
      decision === "approve"
        ? "Kya aap is purchase request ko approve karna chahte hain?"
        : "Kya aap is purchase request ko reject karna chahte hain?"
    );

    if (!confirmed) return;

    setProcessingId(requestId);
    setError("");
    setNotice("");

    try {
      const token = localStorage.getItem("spendflow_token");

      const response = await fetch(
        `${API_URL}/requests/${requestId}/decision`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            decision,
            comment,
          }),
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("spendflow_token");
        localStorage.removeItem("spendflow_user");
        window.location.href = "/";
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to process this request."
        );
      }

      setNotice(
        decision === "approve"
          ? "Purchase request approved successfully."
          : "Purchase request rejected successfully."
      );

      setComments((previous) => {
        const updated = { ...previous };
        delete updated[requestId];
        return updated;
      });

      await fetchApprovals();
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Backend se connection nahi ho pa raha."
          : err.message
      );
    } finally {
      setProcessingId("");
    }
  };

  return (
    <main className="approvals-page">
      <header className="approvals-header">
        <div>
          <span className="approvals-eyebrow">WORKSPACE</span>
          <h1>Approvals</h1>
          <p>Review purchase requests assigned to you.</p>
        </div>

        <button
          className="approvals-refresh"
          onClick={fetchApprovals}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </header>

      {notice && (
        <div className="approval-message success" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="approval-message error" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <section className="approvals-card">
        <div className="approvals-card-heading">
          <div>
            <h2>Pending approvals</h2>
            <p>Requests waiting for your decision.</p>
          </div>

          <span className="approval-count">
            {requests.length} pending
          </span>
        </div>

        {loading ? (
          <div className="approvals-empty">Loading approvals...</div>
        ) : requests.length === 0 ? (
          <div className="approvals-empty">
            <div className="approvals-empty-icon">✓</div>
            <h3>No pending approvals</h3>
            <p>Requests assigned to you will appear here.</p>
          </div>
        ) : (
          <div className="approval-list">
            {requests.map((request) => (
              <article
                className="approval-request"
                key={request._id}
              >
                <div className="approval-request-top">
                  <div>
                    <h3>{request.title}</h3>
                    <p>
                      {request.description ||
                        "No additional description provided."}
                    </p>
                  </div>

                  <span className="approval-status">
                    Pending Approval
                  </span>
                </div>

                <div className="approval-details">
                  <div>
                    <span>Request amount</span>
                    <strong>
                      {formatAmount(request.totalAmountPaise)}
                    </strong>
                  </div>

                  <div>
                    <span>Quantity</span>
                    <strong>{request.quantity ?? "—"}</strong>
                  </div>

                  <div>
                    <span>Submitted</span>
                    <strong>{formatDate(request.updatedAt)}</strong>
                  </div>
                </div>

                {request.justification && (
                  <div className="approval-justification">
                    <strong>Purchase justification</strong>
                    <p>{request.justification}</p>
                  </div>
                )}

                <label
                  className="approval-comment-label"
                  htmlFor={`comment-${request._id}`}
                >
                  Comment / rejection reason
                </label>

                <textarea
                  id={`comment-${request._id}`}
                  value={comments[request._id] || ""}
                  onChange={(event) =>
                    setComments((previous) => ({
                      ...previous,
                      [request._id]: event.target.value,
                    }))
                  }
                  placeholder="Add a comment. A reason is required to reject."
                  maxLength={1000}
                  rows={3}
                  disabled={processingId === request._id}
                />

                <div className="approval-actions">
                  <button
                    className="approval-reject"
                    onClick={() =>
                      handleDecision(request._id, "reject")
                    }
                    disabled={processingId === request._id}
                  >
                    {processingId === request._id
                      ? "Processing..."
                      : "Reject"}
                  </button>

                  <button
                    className="approval-approve"
                    onClick={() =>
                      handleDecision(request._id, "approve")
                    }
                    disabled={processingId === request._id}
                  >
                    {processingId === request._id
                      ? "Processing..."
                      : "Approve request"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Approvals;

 