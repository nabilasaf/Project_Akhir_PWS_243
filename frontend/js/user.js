const API_BASE = "http://localhost:3001";

// Global variables
let usageChart = null;
let allApiKeys = [];

document.addEventListener("DOMContentLoaded", () => {
    protectPage();
    loadUserInfo();
    routePage();
});

/* ========== AUTH ========== */
function protectPage() {
    const token = localStorage.getItem("token");
    if (!token) location.href = "../login.html";
}

/* ========== USER INFO ========== */
function loadUserInfo() {
    const email = localStorage.getItem("email");
    if (!email) return;

    const username = email.split("@")[0];
    const avatar = email[0].toUpperCase();

    const usernameEl = document.getElementById("username");
    const avatarEl = document.getElementById("avatar");

    if (usernameEl) usernameEl.textContent = username;
    if (avatarEl) avatarEl.textContent = avatar;
}

/* ========== ROUTER ========== */
function routePage() {
    const path = location.pathname;

    if (path.includes("dashboard.html")) loadDashboard();
    if (path.includes("api-keys.html")) loadApiKeys();
    if (path.includes("api-explorer.html")) loadApiExplorer();

    // Logout button
    const logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);
}

/* ========== DASHBOARD ========== */
async function loadDashboard() {
    try {
        const res = await authFetch("/api/user/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard");

        const data = await res.json();

        // Update stats
        set("total-requests", data.total_requests || 0);
        set("active-keys", data.active_api_keys || 0);
        set("remaining-quota", data.remaining_quota || 100000);

        // Render chart
        renderDashboardChart(data);
    } catch (error) {
        console.error("Dashboard error:", error);
        showToast("Failed to load dashboard data", "error");
    }
}

function renderDashboardChart(data) {
    const canvas = document.getElementById("usageChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Sample data - replace with actual data from backend
    const chartData = data.chartData || generateSampleChartData();

    if (usageChart) usageChart.destroy();

    usageChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: chartData.labels,
            datasets: [{
                label: "API Requests",
                data: chartData.values,
                borderColor: "#014F9D",
                backgroundColor: "rgba(97, 202, 237, 0.1)",
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#61CAED",
                pointBorderColor: "#014F9D",
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: "#014F9D" },
                    grid: { color: "rgba(1, 79, 157, 0.1)" }
                },
                x: {
                    ticks: { color: "#014F9D" },
                    grid: { display: false }
                }
            }
        }
    });
}

function generateSampleChartData() {
    const labels = [];
    const values = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
        values.push(Math.floor(Math.random() * 20) + 5);
    }

    return { labels, values };
}

/* ========== API KEYS ========== */
async function loadApiKeys() {
    try {
        const res = await authFetch("/api/user/api-keys");
        if (!res.ok) throw new Error("Failed to load API keys");

        const data = await res.json();
        allApiKeys = data.apiKeys || [];

        renderApiKeysTable(allApiKeys);

        // Setup generate button
        const generateBtn = document.getElementById("btn-generate");
        if (generateBtn) {
            generateBtn.addEventListener("click", generateApiKey);
        }
    } catch (error) {
        console.error("API Keys error:", error);
        const tbody = document.getElementById("api-keys-list");
        if (tbody) {
            tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: #ef4444; padding: 40px;">
            Failed to load API keys
          </td>
        </tr>
      `;
        }
    }
}

function renderApiKeysTable(keys) {
    const tbody = document.getElementById("api-keys-list");
    if (!tbody) return;

    if (keys.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <div class="icon">🔑</div>
            <h3>No API Keys Yet</h3>
            <p>Generate your first API key to get started</p>
          </div>
        </td>
      </tr>
    `;
        return;
    }

    tbody.innerHTML = keys.map(key => {
        const createdDate = new Date(key.created_at).toLocaleDateString();
        const lastUsed = key.last_used
            ? new Date(key.last_used).toLocaleDateString()
            : "Never";
        const status = key.is_active ? "active" : "disabled";
        const statusText = key.is_active ? "Active" : "Revoked";

        // Mask API key for security
        const maskedKey = key.api_key.substring(0, 8) + "..." + key.api_key.substring(key.api_key.length - 4);

        return `
      <tr>
        <td><code>${maskedKey}</code></td>
        <td><span class="badge ${status}">${statusText}</span></td>
        <td>${createdDate}</td>
        <td>${lastUsed}</td>
        <td>
          ${key.is_active ? `
            <a class="action-btn" onclick="copyApiKey('${key.api_key}')">📋 Copy</a>
            <a class="action-btn danger" onclick="revokeApiKey(${key.id})">🗑️ Revoke</a>
          ` : `
            <span style="color: #9ca3af;">Revoked</span>
          `}
        </td>
      </tr>
    `;
    }).join("");
}

async function generateApiKey() {
    try {
        const btn = document.getElementById("btn-generate");
        if (btn) btn.disabled = true;

        const res = await authFetch("/api/user/api-keys/generate", {
            method: "POST"
        });

        if (!res.ok) throw new Error("Failed to generate API key");

        const data = await res.json();

        showToast("API Key generated successfully!", "success");

        // Reload the keys list
        await loadApiKeys();

        // Show the full key in a modal or alert
        alert(`Your new API Key:\n\n${data.apiKey}\n\nPlease copy it now. You won't be able to see it again!`);

    } catch (error) {
        console.error("Generate API Key error:", error);
        showToast("Failed to generate API key", "error");
    } finally {
        const btn = document.getElementById("btn-generate");
        if (btn) btn.disabled = false;
    }
}

function copyApiKey(apiKey) {
    navigator.clipboard.writeText(apiKey).then(() => {
        showToast("API Key copied to clipboard!", "success");
    }).catch(err => {
        console.error("Copy failed:", err);
        showToast("Failed to copy API key", "error");
    });
}

async function revokeApiKey(keyId) {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
        return;
    }

    try {
        const res = await authFetch(`/api/user/api-keys/${keyId}/revoke`, {
            method: "PUT"
        });

        if (!res.ok) throw new Error("Failed to revoke API key");

        showToast("API Key revoked successfully", "success");
        await loadApiKeys();

    } catch (error) {
        console.error("Revoke API Key error:", error);
        showToast("Failed to revoke API key", "error");
    }
}

/* ========== API EXPLORER ========== */
async function loadApiExplorer() {
    try {
        const res = await authFetch("/api/user/explore");
        if (!res.ok) throw new Error("Failed to load APIs");

        const data = await res.json();
        renderApiExplorer(data);

        // Setup search
        const searchInput = document.getElementById("search-api");
        if (searchInput) {
            searchInput.addEventListener("input", filterApiCards);
        }
    } catch (error) {
        console.error("API Explorer error:", error);
        const container = document.getElementById("api-explore");
        if (container) {
            container.innerHTML = `
        <div class="loading" style="color: #ef4444;">
          Failed to load APIs
        </div>
      `;
        }
    }
}

function renderApiExplorer(apis) {
    const container = document.getElementById("api-explore");
    if (!container) return;

    if (apis.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <h3>No APIs Available</h3>
      </div>
    `;
        return;
    }

    container.innerHTML = apis.map(api => `
    <div class="api-card" data-search="${api.title} ${api.genre} ${api.platform}">
      <h4>${api.title}</h4>
      <code>${api.api_endpoint}</code>
      <small class="api-meta">${api.genre} • ${api.platform}</small>
      <button class="action-btn" onclick="openApiExplorer('${api.api_endpoint}', '${api.title}')">
        ▶ Try API
      </button>
    </div>
  `).join("");
}

function filterApiCards(e) {
    const query = e.target.value.toLowerCase();
    const cards = document.querySelectorAll(".api-card");

    cards.forEach(card => {
        const searchText = card.getAttribute("data-search").toLowerCase();
        card.style.display = searchText.includes(query) ? "block" : "none";
    });
}

function openApiExplorer(endpoint, title) {
    const modal = document.getElementById("apiModal");
    if (!modal) return;

    document.getElementById("api-endpoint").textContent = endpoint;
    document.getElementById("api-response").textContent = "// Click 'Try API' to test this endpoint";

    modal.classList.add("show");

    // Setup try button
    const tryBtn = document.getElementById("btn-try-api");
    if (tryBtn) {
        tryBtn.onclick = () => callApi(endpoint);
    }
}

function closeApiModal() {
    const modal = document.getElementById("apiModal");
    if (modal) modal.classList.remove("show");
}

async function callApi(endpoint) {
    try {
        const responseEl = document.getElementById("api-response");
        responseEl.textContent = "// Loading...";

        // Fetch user's active API key from backend
        const keysRes = await authFetch("/api/user/api-keys");
        if (!keysRes.ok) throw new Error("Failed to fetch API keys");

        const keysData = await keysRes.json();
        const activeKey = keysData.apiKeys?.find(k => k.is_active);

        if (!activeKey) {
            responseEl.textContent = "// Error: No active API key found. Please generate one first from the API Keys page.";
            return;
        }

        // Make the API call with the active key
        const res = await fetch(API_BASE + endpoint, {
            headers: { "x-api-key": activeKey.api_key }
        });

        const data = await res.json();
        responseEl.textContent = JSON.stringify(data, null, 2);

    } catch (error) {
        console.error("API Call error:", error);
        document.getElementById("api-response").textContent =
            `// Error: ${error.message}`;
    }
}

/* ========== UTILITIES ========== */
function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? 0;
}

function authFetch(path, options = {}) {
    return fetch(API_BASE + path, {
        ...options,
        headers: {
            ...options.headers,
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    });
}

function logout() {
    localStorage.clear();
    location.href = "../login.html";
}

function showToast(message, type = "info") {
    // Create toast container if it doesn't exist
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
    `;
        document.body.appendChild(container);
    }

    // Create toast
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
    background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
    font-weight: 500;
  `;
    toast.textContent = message;

    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = "slideOut 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
