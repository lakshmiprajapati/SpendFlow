
import { useState } from "react";
import "./App.css";
import Dashboard from "./pages/Dashboard.jsx";
import Approvals from "./pages/Approvals.jsx";
import PurchaseRequests from "./pages/PurchaseRequests.jsx";
import Budgets from "./pages/Budgets.jsx";

const API_URL = "http://localhost:5000/api";

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

            {error && <p className="login-error" role="alert">{error}</p>}
          </form>

          <div className="security-note">
            <span>⌑</span>
            Your workspace is protected and secure.
          </div>
        </div>

        <footer className="panel-footer">
          © 2026 SpendFlow · Purchase management made simple
        </footer>
      </section>
    </main>
  );
}

function App() {
  const path = window.location.pathname;

  if (path === "/dashboard") {
    return <Dashboard />;
  }

  if (path === "/purchase-requests") {
    return <PurchaseRequests />;
  }

  if (path === "/approvals") {
    return <Approvals />;
  }

  if (path === "/budgets") return <Budgets />;

  return <Login />;
}



export default App;
