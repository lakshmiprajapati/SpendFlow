
import { useEffect, useState } from "react";
import "./Dashboard.css";

const API_URL = "http://localhost:5000/api";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount ?? 0);

function Dashboard() {
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(null);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);


  
  useEffect(() => {
    const token = localStorage.getItem("spendflow_token");

    if (!token) {
      window.location.replace("/");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const fetchDashboard = async () => {
      try {
        // 1. Verify the logged-in user
        const meResponse = await fetch(`${API_URL}/auth/me`, { headers });

        let meData;
        try {
          meData = await meResponse.json();
        } catch {
          throw new Error("Unable to verify your session.");
        }

        if (!meResponse.ok || !meData.success) {
          localStorage.removeItem("spendflow_token");
          localStorage.removeItem("spendflow_user");
          window.location.replace("/");
          return;
        }

        const currentUser = meData.data.user;
        setUser(currentUser);

        localStorage.setItem(
          "spendflow_user",
          JSON.stringify(currentUser)
        );

        const roles = Array.isArray(currentUser.roles)
          ? currentUser.roles
          : [];

        const isApprover = roles.some((role) =>
          ["manager", "departmentHead", "financeApprover"].includes(role)
        );

        // 2. Fetch employee summary and department budget together
        const employeePromise = fetch(
          `${API_URL}/dashboard/employee`,
          { headers }
        );

        const budgetPromise = fetch(
          `${API_URL}/budgets/my-department`,
          { headers }
        );

        // Only approver roles need the approvals endpoint
        const approverPromise = isApprover
          ? fetch(`${API_URL}/dashboard/approver`, { headers })
          : Promise.resolve(null);

        const notificationsPromise = fetch(
          `${API_URL}/notifications?limit=10`,
          { headers }
        );

        const [
          employeeResponse,
          budgetResponse,
          approverResponse,
          notificationsResponse,
        ] = await Promise.all([
          employeePromise,
          budgetPromise,
          approverPromise,
          notificationsPromise,
        ]);

        
        // 3. Purchase request summary, recent activity and budget
if (employeeResponse.ok) {
  const employeeData = await employeeResponse.json();

  setSummary(employeeData.summary ?? null);

  setRecentRequests(
    Array.isArray(employeeData.recentRequests)
      ? employeeData.recentRequests
      : []
  );

  setBudget(employeeData.budget ?? null);
} else {
  setError("Unable to load your purchase request summary.");
}

        // 4. Notifications and unread count
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json();
          setNotifications(
            Array.isArray(notificationsData.data)
              ? notificationsData.data
              : []
          );
          setUnreadCount(notificationsData.unreadCount ?? 0);
        }

        // 5. Pending approvals
        if (approverResponse) {
          if (approverResponse.ok) {
            const approverData = await approverResponse.json();
            setPendingCount(approverData.pendingCount ?? 0);
          } else if (approverResponse.status === 403) {
            setPendingCount(null);
          } else {
            setError((previous) =>
              previous || "Unable to load pending approvals."
            );
          }
        }
      } catch (error) {
        console.error("Dashboard loading error:", error);
        setError(
          "Unable to connect to the backend. Check that it is running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);


  



  const handleMarkNotificationRead = async (notificationId) => {
    const notification = notifications.find(
      (item) => item._id === notificationId
    );

    if (!notification || notification.readAt) return;

    const token = localStorage.getItem("spendflow_token");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      const updatedNotification = data.data;

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === notificationId
            ? { ...item, ...updatedNotification }
            : item
        )
      );
      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (notificationError) {
      console.error("Unable to mark notification as read:", notificationError);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (unreadCount === 0) return;

    const token = localStorage.getItem("spendflow_token");
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;

      const readAt = new Date().toISOString();
      setNotifications((previous) =>
        previous.map((item) => ({ ...item, readAt: item.readAt || readAt }))
      );
      setUnreadCount(0);
    } catch (notificationError) {
      console.error("Unable to mark all notifications as read:", notificationError);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("spendflow_token");
    localStorage.removeItem("spendflow_user");
    window.location.replace("/");
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading your workspace...</p>
      </div>
    );
  }

  const displayName = user?.name || "User";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const roleLabel = roles.join(", ") || "Employee";
  const isApprover = roles.some((role) =>
    ["manager", "departmentHead", "financeApprover"].includes(role)
  );

  const metrics = [
    {
      label: "My Requests",
      value: summary?.total ?? "—",
      caption: "Purchase requests created by you",
      icon: "▤",
      iconClass: "sf-icon-green",
      category: "REQUESTS",
    },
    {
  label: "Pending Approvals",
  value: isApprover ? pendingCount ?? "—" : summary?.pending_approval ?? "—",
  caption: isApprover
    ? "Requests awaiting your role's decision"
    : "Your requests awaiting approval",
  icon: "◷",
  iconClass: "sf-icon-amber",
  category: "IN REVIEW",
},
    {
  label: "Department Budget",
  value: budget
    ? formatCurrency(budget.allocatedAmount)
    : "—",
  caption: budget
    ? `Remaining: ${formatCurrency(budget.remainingAmount)}`
    : "No department budget available",
  icon: "₹",
  iconClass: "sf-icon-blue",
  category: "FINANCES",
},
{
  label: "Committed Budget",
  value: budget
    ? formatCurrency(budget.committedAmount)
    : "—",
  caption: "Funds reserved for approved requests",
  icon: "↗",
  iconClass: "sf-icon-amber",
  category: "COMMITTED",
},
{
  label: "Remaining Budget",
  value: budget
    ? formatCurrency(budget.remainingAmount)
    : "—",
  caption: "Available departmental funds",
  icon: "₹",
  iconClass: "sf-icon-green",
  category: "AVAILABLE",
},
    {
      label: "Approved Requests",
      value: summary?.approved ?? "—",
      caption: "Requests approved successfully",
      icon: "✓",
      iconClass: "sf-icon-purple",
      category: "COMPLETED",
    },
  ];

  const statusLabels = {
    draft: "Draft",
    pending_approval: "Pending approval",
    approved: "Approved",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  };

  return (
    <div className="sf-app">
      {sidebarOpen && (
        <button
          className="sf-sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sf-sidebar ${sidebarOpen ? "sf-sidebar-open" : ""}`}>
        <a className="sf-brand" href="/dashboard">
          <span className="sf-brand-mark">S</span>
          <span className="sf-brand-name">SpendFlow</span>
        </a>

        <div className="sf-workspace-label">WORKSPACE</div>

        <nav className="sf-nav">
          <a
            href="/dashboard"
            className="sf-nav-item sf-nav-active"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="sf-nav-icon">▦</span>
            Dashboard
          </a>

          <button
            type="button"
            className="sf-nav-item"
            onClick={() => {setSidebarOpen(false);window.location.href = "/purchase-requests";}}
          >
            <span className="sf-nav-icon">▤</span>
            Purchase Requests
          </button>

          
{isApprover && (
  <button
    type="button"
    className="sf-nav-item"
    onClick={() => {
      setSidebarOpen(false);
      window.location.href = "/approvals";
    }}
  >
    <span className="sf-nav-icon">✓</span>
    Approvals
  </button>
)}


          <button
            type="button"
            className="sf-nav-item"
            onClick={() => {window.location.href = "/budgets";}}
          >
            <span className="sf-nav-icon">◫</span>
            Budgets
          </button>
        </nav>

        <div className="sf-sidebar-bottom">
          <div className="sf-help-card">
            <div className="sf-help-icon">?</div>
            <strong>Need help?</strong>
            <p>Manage your spending with confidence.</p>
          </div>

          <button
            type="button"
            className="sf-nav-item sf-logout"
            onClick={handleLogout}
          >
            <span className="sf-nav-icon">↪</span>
            Sign out
          </button>
        </div>
      </aside>

      <main className="sf-main">
        <header className="sf-topbar">
          <button
            type="button"
            className="sf-menu-button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="sf-breadcrumb">
            Workspace <span>/</span> Dashboard
          </div>

          <div className="sf-topbar-right">
            <span className="sf-status-dot" />
            <span className="sf-online-label">Workspace active</span>

            <div className="sf-notification-wrapper">
              <button
                type="button"
                className="sf-notification-button"
                aria-label={`Notifications, ${unreadCount} unread`}
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <span aria-hidden="true">♧</span>
                {unreadCount > 0 && (
                  <span className="sf-notification-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="sf-notification-panel">
                  <div className="sf-notification-panel-heading">
                    <div>
                      <strong>Notifications</strong>
                      <span>{unreadCount} unread</span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length > 0 ? (
                    <div className="sf-notification-list">
                      {notifications.map((notification) => (
                        <button
                          type="button"
                          key={notification._id}
                          className={`sf-notification-item ${
                            notification.readAt ? "" : "sf-notification-unread"
                          }`}
                          onClick={() =>
                            handleMarkNotificationRead(notification._id)
                          }
                        >
                          <strong>{notification.title}</strong>
                          <span>{notification.message}</span>
                          <small>
                            {notification.createdAt
                              ? new Date(notification.createdAt).toLocaleString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : "Just now"}
                          </small>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="sf-notification-empty">No notifications yet.</p>
                  )}
                </div>
              )}
            </div>

            <div className="sf-avatar" title={displayName}>
              {initials}
            </div>
          </div>
        </header>

        <div className="sf-content">
          <section className="sf-page-heading">
            <div>
              <div className="sf-overline">YOUR WORKSPACE</div>
              <h1>Dashboard</h1>
              <p>Welcome back, {displayName}. Here is your spending overview.</p>
            </div>
            <div className="sf-date-label">◷ SpendFlow Overview</div>
          </section>

          {error && (
            <div className="sf-notice" role="alert">
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss">
                ×
              </button>
            </div>
          )}

          <section className="sf-welcome-banner">
            <div className="sf-welcome-copy">
              <span className="sf-banner-label">SPEND SMARTER</span>
              <h2>Your spending, all in one place.</h2>
              <p>
                Track purchase requests, follow approvals, and stay on top
                of your department's budget.
              </p>
            </div>

            <div className="sf-banner-art" aria-hidden="true">
              <div className="sf-art-circle sf-art-circle-one" />
              <div className="sf-art-circle sf-art-circle-two" />
              <div className="sf-art-card">
                <span>Budget overview</span>
                <strong>Stay in control</strong>
                <div className="sf-art-bars">
                  <i /><i /><i /><i /><i /><i /><i />
                </div>
              </div>
            </div>
          </section>

          <section className="sf-section">
            <div className="sf-section-heading">
              <div>
                <h2>Overview</h2>
                <p>Your key spending metrics at a glance.</p>
              </div>
              <span className="sf-period-chip">Current workspace</span>
            </div>

            <div className="sf-metrics-grid">
              {metrics.map((metric) => (
                <article className="sf-metric-card" key={metric.label}>
                  <div className="sf-metric-top">
                    <span className={`sf-metric-icon ${metric.iconClass}`}>
                      {metric.icon}
                    </span>
                    <span className="sf-metric-caption">
                      {metric.category}
                    </span>
                  </div>
                  <div className={`sf-metric-value ${
                    metric.label === "Department Budget" ? "sf-metric-text" : ""
                  }`}>
                    {metric.value}
                  </div>
                  <h3>{metric.label}</h3>
                  <p>{metric.caption}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="sf-lower-grid">
            <article className="sf-panel sf-activity-panel">
              <div className="sf-panel-heading">
                <div>
                  <h2>Recent Activity</h2>
                  <p>Your latest purchase requests.</p>
                </div>
                <span className="sf-panel-symbol">↗</span>
              </div>

              {recentRequests.length > 0 ? (
                <div className="sf-request-list">
                  {recentRequests.map((request) => (
                    <div
                      className="sf-request-row"
                      key={request._id}
                    >
                      <div className="sf-request-description">
                        <strong>{request.title || "Untitled request"}</strong>
                        <span>
                          {request.createdAt
                            ? new Date(request.createdAt).toLocaleDateString(
                                "en-IN",
                                { day: "numeric", month: "short", year: "numeric" }
                              )
                            : "Date unavailable"}
                        </span>
                      </div>
                      <div className="sf-request-meta">
                        <strong>{formatCurrency(request.amount)}</strong>
                        <span className={`sf-request-status sf-status-${request.status}`}>
                          {statusLabels[request.status] || request.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sf-empty-state">
                  <div className="sf-empty-icon">▤</div>
                  <strong>No purchase requests to show</strong>
                  <p>Your recent requests will appear here when available.</p>
                </div>
              )}
            </article>

            <article className="sf-panel sf-profile-panel">
              <div className="sf-panel-heading">
                <div>
                  <h2>Your Profile</h2>
                  <p>Account information</p>
                </div>
                <span className="sf-panel-symbol">◎</span>
              </div>

              <div className="sf-profile-info">
                <div className="sf-profile-avatar">{initials}</div>
                <div>
                  <strong>{displayName}</strong>
                  <span>{user?.email || "—"}</span>
                </div>
              </div>

              <div className="sf-profile-row">
                <span>Assigned role</span>
                <strong>{roleLabel}</strong>
              </div>

              <div className="sf-profile-row">
                <span>Account status</span>
                <span className="sf-active-badge"><i /> Active</span>
              </div>

              <button
                className="sf-profile-logout"
                type="button"
                onClick={handleLogout}
              >
                Sign out of SpendFlow <span>→</span>
              </button>
            </article>
          </section>

          <footer className="sf-footer">
            <span>© 2026 SpendFlow</span>
            <span>Smarter spending. Better control.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
