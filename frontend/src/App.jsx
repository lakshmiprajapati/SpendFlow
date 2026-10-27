
import { useState } from "react";
import "./App.css";

import Dashboard from "./pages/Dashboard.jsx";
import Approvals from "./pages/Approvals.jsx";
import PurchaseRequests from "./pages/PurchaseRequests.jsx";
import Budgets from "./pages/Budgets.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";
import ApprovalPolicies from "./pages/ApprovalPolicies.jsx";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function LandingPage() {
  const goToLogin = () => {
    window.location.href = "/login";
  };

  const goToDemo = () => {
    window.location.href = "/demo";
  };

  return (
    <main className="sf-landing">
      <header className="sf-landing-nav">
        <a href="/" className="sf-landing-brand">
          <span className="sf-landing-logo">S</span>
          <span>SpendFlow</span>
        </a>

        <nav className="sf-landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <button
            type="button"
            className="sf-nav-signin"
            onClick={goToLogin}
          >
            Sign in
          </button>
          <button
            type="button"
            className="sf-nav-cta"
            onClick={goToDemo}
          >
            Try demo <span>→</span>
          </button>
        </nav>
      </header>

      <section className="sf-hero">
        <div className="sf-hero-content">
          <div className="sf-hero-label">
            <span className="sf-live-dot" />
            SMARTER PURCHASE MANAGEMENT
          </div>

          <h1>
            Every purchase.
            <br />
            Every approval.
            <br />
            <span>Under control.</span>
          </h1>

          <p className="sf-hero-description">
            Bring purchase requests, approval workflows and department
            budgets together in one organized workspace. Spend with
            clarity, not complexity.
          </p>

          <div className="sf-hero-actions">
            <button
              type="button"
              className="sf-primary-button"
              onClick={goToLogin}
            >
              Explore SpendFlow <span>→</span>
            </button>

            <button
              type="button"
              className="sf-secondary-button"
              onClick={goToDemo}
            >
              <span className="sf-play-icon">▶</span>
              Try interactive demo
            </button>
          </div>

          <div className="sf-hero-note">
            <span>✓</span>
            Explore role-based purchase management and approvals
          </div>
        </div>

        <div className="sf-hero-visual">
          <div className="sf-orb sf-orb-one" />
          <div className="sf-orb sf-orb-two" />

          <div className="sf-preview-card">
            <div className="sf-preview-top">
              <div>
                <span className="sf-preview-eyebrow">WORKSPACE OVERVIEW</span>
                <h3>Your spending at a glance</h3>
              </div>
              <span className="sf-preview-icon">↗</span>
            </div>

            <div className="sf-preview-stats">
              <div className="sf-preview-stat">
                <span>Budget allocation</span>
                <strong>₹5,00,000</strong>
                <small>Department budget</small>
              </div>

              <div className="sf-preview-stat">
                <span>Pending approvals</span>
                <strong>08</strong>
                <small>Awaiting decisions</small>
              </div>
            </div>

            <div className="sf-preview-section-heading">
              <strong>Approval activity</strong>
              <span>Workflow preview</span>
            </div>

            <div className="sf-preview-activity">
              <span className="sf-activity-icon sf-activity-purple">↗</span>
              <div className="sf-activity-copy">
                <strong>Purchase request submitted</strong>
                <small>Request enters the approval workflow</small>
              </div>
              <span className="sf-status sf-status-pending">Pending</span>
            </div>

            <div className="sf-preview-activity">
              <span className="sf-activity-icon sf-activity-green">✓</span>
              <div className="sf-activity-copy">
                <strong>Approval recorded</strong>
                <small>Decisions tracked in the audit log</small>
              </div>
              <span className="sf-status sf-status-approved">Approved</span>
            </div>

            <div className="sf-preview-footer">
              <span className="sf-preview-shield">✓</span>
              Structured workflows. Clear accountability.
            </div>
          </div>

          <div className="sf-floating-tag sf-floating-top">
            <span>↗</span> Budget visibility
          </div>

          <div className="sf-floating-tag sf-floating-bottom">
            <span>✓</span> Approval tracking
          </div>
        </div>
      </section>

      <section className="sf-trust-strip">
        <p>ONE WORKSPACE FOR YOUR PURCHASING WORKFLOW</p>
        <div className="sf-trust-items">
          <span>◈ Purchase requests</span>
          <span>✓ Multi-level approvals</span>
          <span>▤ Budget tracking</span>
          <span>◷ Audit history</span>
        </div>
      </section>

      <section className="sf-features" id="features">
        <div className="sf-section-heading">
          <span className="sf-section-label">BUILT FOR BETTER CONTROL</span>
          <h2>From request to approval, in one flow.</h2>
          <p>
            Keep purchasing organized with visibility into requests,
            decisions and departmental spending.
          </p>
        </div>

        <div className="sf-feature-grid">
          <article className="sf-feature-card">
            <div className="sf-feature-icon sf-feature-purple">↗</div>
            <h3>Purchase requests</h3>
            <p>
              Create and track purchase requests with clear statuses
              and a consistent process.
            </p>
          </article>

          <article className="sf-feature-card">
            <div className="sf-feature-icon sf-feature-blue">✓</div>
            <h3>Approval workflows</h3>
            <p>
              Route requests through configured approval levels
              and keep decisions accountable.
            </p>
          </article>

          <article className="sf-feature-card">
            <div className="sf-feature-icon sf-feature-green">₹</div>
            <h3>Budget visibility</h3>
            <p>
              Monitor departmental budgets and keep approved spending
              within allocated limits.
            </p>
          </article>

          <article className="sf-feature-card">
            <div className="sf-feature-icon sf-feature-orange">◷</div>
            <h3>Audit and notifications</h3>
            <p>
              Follow important updates and review recorded actions
              across the purchasing process.
            </p>
          </article>
        </div>
      </section>

      <section className="sf-how-section" id="how-it-works">
        <div className="sf-section-heading">
          <span className="sf-section-label">HOW IT WORKS</span>
          <h2>A clearer purchasing journey.</h2>
        </div>

        <div className="sf-steps">
          <div className="sf-step">
            <span className="sf-step-number">01</span>
            <h3>Submit</h3>
            <p>A requester creates a purchase request.</p>
          </div>

          <div className="sf-step">
            <span className="sf-step-number">02</span>
            <h3>Review</h3>
            <p>Assigned approvers review and decide.</p>
          </div>

          <div className="sf-step">
            <span className="sf-step-number">03</span>
            <h3>Track</h3>
            <p>Follow decisions, budgets and audit history.</p>
          </div>
        </div>
      </section>

      <section className="sf-bottom-cta">
        <span className="sf-section-label">MEET SPENDFLOW</span>
        <h2>Ready to see your purchasing workflow differently?</h2>
        <p>
          Sign in to explore the SpendFlow workspace using a demo account.
        </p>
        <button
          type="button"
          className="sf-primary-button"
          onClick={goToDemo}
        >
          Try SpendFlow <span>→</span>
        </button>
      </section>

      <footer className="sf-landing-footer">
        <a href="/" className="sf-landing-brand">
          <span className="sf-landing-logo">S</span>
          <span>SpendFlow</span>
        </a>
        <p>Smarter spending. Better control.</p>
        <span>© 2026 SpendFlow</span>
      </footer>
    </main>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed. Please try again.");
      }

      const token = data.data?.accessToken;

      if (!token) {
        throw new Error("Login response mein access token nahi mila.");
      }

      localStorage.setItem("spendflow_token", token);
      localStorage.setItem("spendflow_user", JSON.stringify(data.data.user));

      window.location.href = "/dashboard";
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Backend se connect nahi ho pa raha. Backend running hai ya nahi check karo."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="brand">
          <div className="brand-icon">S</div>
          <span>SpendFlow</span>
        </div>

        <div className="visual-content">
          <span className="eyebrow">SMARTER SPENDING. BETTER CONTROL.</span>
          <h1>Every expense.<br />Under control.</h1>
          <p>
            A smarter way to manage purchase requests, approvals,
            and departmental budgets — all in one place.
          </p>

          <div className="visual-stats">
            <div>
              <span className="stat-icon">↗</span>
              <div>
                <strong>Real-time visibility</strong>
                <small>Track spending with confidence</small>
              </div>
            </div>
            <div>
              <span className="stat-icon">✓</span>
              <div>
                <strong>Streamlined approvals</strong>
                <small>Keep every decision moving</small>
              </div>
            </div>
          </div>
        </div>

        <p className="visual-footer">Spend smarter. Work better.</p>
      </section>

      <section className="login-panel">
        <div className="mobile-brand">
          <div className="brand-icon">S</div>
          <span>SpendFlow</span>
        </div>

        <div className="login-card">
          <div className="welcome-tag">WELCOME BACK</div>
          <h2>Sign in to SpendFlow</h2>
          <p className="login-subtitle">
            Enter your credentials to access your workspace.
          </p>

          <form onSubmit={handleLogin}>
            <label htmlFor="email">Work email</label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />

            <div className="password-heading">
              <label htmlFor="password">Password</label>
            </div>

            <div className="password-input">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                className="show-password"
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <span>→</span>}
            </button>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
          </form>

          <div className="security-note">
            <span>⌑</span>
            Your workspace is protected and secure.
          </div>

          <button
            type="button"
            className="sf-back-home"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            ← Back to home
          </button>
        </div>

        <footer className="panel-footer">
          © 2026 SpendFlow · Purchase management made simple
        </footer>
      </section>
    </main>
  );
}


const demoRoles = [
  {
    role: "employee",
    title: "Employee",
    description: "Create and track purchase requests.",
    icon: "👤",
  },
  {
    role: "manager",
    title: "Manager",
    description: "Review and decide assigned requests.",
    icon: "📋",
  },
  {
    role: "departmentHead",
    title: "Department Head",
    description: "Explore department-level approvals.",
    icon: "🏢",
  },
  {
    role: "financeApprover",
    title: "Finance Approver",
    description: "Explore the finance approval workflow.",
    icon: "💳",
  },
];

function DemoRoleSelection() {
  const [loadingRole, setLoadingRole] = useState("");
  const [error, setError] = useState("");

  const startDemo = async (role) => {
    setError("");
    setLoadingRole(role);

    try {
      const response = await fetch(`${API_URL}/auth/demo-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to start demo.");
      }

      const { accessToken, user } = result.data ?? {};

      if (!accessToken || !user) {
        throw new Error("Invalid demo login response.");
      }

      localStorage.setItem("spendflow_token", accessToken);
      localStorage.setItem("spendflow_user", JSON.stringify(user));

      window.location.href = "/dashboard";
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Backend se connect nahi ho pa raha. Please try again."
          : err.message
      );
      setLoadingRole("");
    }
  };

  return (
    <main className="sf-demo-page">
      <header className="sf-demo-header">
        <a href="/" className="sf-landing-brand">
          <span className="sf-landing-logo">S</span>
          <span>SpendFlow</span>
        </a>

        <a className="sf-demo-signin" href="/login">
          Sign in instead
        </a>
      </header>

      <section className="sf-demo-content">
        <span className="sf-section-label">INTERACTIVE PRODUCT TOUR</span>
        <h1>Explore SpendFlow</h1>

        <p className="sf-demo-intro">
          Choose a demo role to experience the purchase management
          workflow from different perspectives. No credentials required.
        </p>

        <div className="sf-demo-grid">
          {demoRoles.map((item) => (
            <button
              key={item.role}
              type="button"
              className="sf-demo-role-card"
              onClick={() => startDemo(item.role)}
              disabled={Boolean(loadingRole)}
            >
              <span className="sf-demo-role-icon">{item.icon}</span>
              <span className="sf-demo-role-title">{item.title}</span>
              <span className="sf-demo-role-description">
                {item.description}
              </span>
              <span className="sf-demo-role-action">
                {loadingRole === item.role
                  ? "Starting demo..."
                  : loadingRole
                    ? "Please wait..."
                    : `Continue as ${item.title} →`}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <p className="sf-demo-error" role="alert">
            {error}
          </p>
        )}

        <p className="sf-demo-footnote">
          Demo access uses predefined accounts and their assigned permissions.
        </p>

        <a className="sf-demo-back" href="/">
          ← Back to home
        </a>
      </section>
    </main>
  );
}

function App() {
  const path = window.location.pathname;

  if (path === "/") {
    return <LandingPage />;
  }

  if (path === "/login") {
    return <Login />;
  }

  if (path === "/demo") {
    return <DemoRoleSelection />;
  }

  if (path === "/dashboard") {
    return <Dashboard />;
  }

  if (path === "/purchase-requests") {
    return <PurchaseRequests />;
  }

  if (path === "/approvals") {
    return <Approvals />;
  }

  if (path === "/budgets") {
    return <Budgets />;
  }

  if (path === "/audit-logs") {
    return <AuditLogs />;
  }

  if (path === "/approval-policies") {
    return <ApprovalPolicies />;
  }

  return <LandingPage />;
}

export default App;
