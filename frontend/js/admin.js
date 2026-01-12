const API_BASE = "http://localhost:3001";

/* ================================
   FETCH HELPER (JWT)
================================ */
function adminFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
}

/* ================================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", () => {
  protectAdminPage();
  loadAdminInfo();
  bindLogout();

  if (document.getElementById("total-users")) {
    // loadDashboardStats(); // Handled by dashboard.html specific script
  }

  if (document.getElementById("users-table-body")) {
    loadUsers();
  }

  if (document.getElementById("games-table-body")) {
    loadGames();
  }
});


/* ================================
   AUTH GUARD
================================ */
function protectAdminPage() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "admin") {
    window.location.href = "../login.html";
  }
}

/* ================================
   ADMIN INFO
================================ */
function loadAdminInfo() {
  const email = localStorage.getItem("email");
  document.getElementById("username").textContent = email.split("@")[0];
  document.getElementById("avatar").textContent = email[0].toUpperCase();
}

/* ================================
   DASHBOARD STATS
================================ */
async function loadDashboardStats() {
  const res = await adminFetch("/api/admin/dashboard");
  const data = await res.json();

  document.getElementById("total-users").textContent = data.totalUsers;
  document.getElementById("active-keys").textContent = data.activeApiKeys;
  document.getElementById("today-requests").textContent = data.todayRequests;
}

/* ================================
   USERS TABLE
================================ */
async function loadUsers() {
  const res = await adminFetch("/api/admin/users");
  const users = await res.json();

  const tbody = document.getElementById("users-table-body");
  tbody.innerHTML = "";

  users.forEach(u => {
    tbody.innerHTML += `
      <tr>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${u.status || 'active'}</td>
        <td>${u.created_at}</td>
      </tr>
    `;
  });
}

/* ================================
   GAMES TABLE
================================ */
async function loadGames() {
  const res = await adminFetch("/api/admin/games");
  const games = await res.json();

  const tbody = document.getElementById("games-table-body");
  tbody.innerHTML = "";

  games.forEach(g => {
    tbody.innerHTML += `
      <tr>
        <td>${g.title}</td>
        <td>${g.genre}</td>
        <td>${g.rating}</td>
        <td>${g.created_at}</td>
      </tr>
    `;
  });
}

/* ================================
   LOGOUT
================================ */
function bindLogout() {
  document.getElementById("btn-logout").onclick = () => {
    localStorage.clear();
    window.location.href = "../login.html";
  };
}
