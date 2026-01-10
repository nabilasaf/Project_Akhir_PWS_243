// API Explorer with API Key Support
// Use API_BASE from user.js if already defined via window object
window.API_BASE = window.API_BASE || "http://localhost:3001";

document.addEventListener("DOMContentLoaded", () => {
  // Wait for user.js to load first
  setTimeout(() => {
    initApiExplorer();
  }, 100);
});

function initApiExplorer() {
  const testBtns = document.querySelectorAll(".test-endpoint-btn");
  const testApiBtn = document.getElementById("test-api-btn");
  const apiKeyInput = document.getElementById("api-key-input");
  const useJwtBtn = document.getElementById("use-jwt-btn");
  const authTypeSpan = document.getElementById("auth-type");

  if (!testBtns.length || !testApiBtn) return;

  // Use JWT button
  if (useJwtBtn) {
    useJwtBtn.addEventListener("click", () => {
      apiKeyInput.value = "";
      apiKeyInput.placeholder = "Using JWT Token authentication...";
      authTypeSpan.textContent = "JWT Token";
      showToast("Switched to JWT Token authentication", "success");
    });
  }

  // API Key input change
  if (apiKeyInput) {
    apiKeyInput.addEventListener("input", (e) => {
      if (e.target.value.trim()) {
        authTypeSpan.textContent = `API Key: ${e.target.value.substring(0, 8)}...`;
      } else {
        authTypeSpan.textContent = "JWT Token";
      }
    });
  }

  // Endpoint selection
  testBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Remove active from all
      testBtns.forEach(b => b.classList.remove("active"));
      // Add active to clicked
      btn.classList.add("active");

      // Update display
      const endpoint = btn.dataset.endpoint;
      const method = btn.dataset.method;

      document.getElementById("test-method").textContent = method;
      document.getElementById("test-endpoint").textContent = endpoint;

      // Reset response
      const responseEl = document.getElementById("test-response");
      responseEl.innerHTML = `
        <div class="test-response-placeholder">
          Click "Test API" to see live results from your backend
        </div>
      `;
    });
  });

  // Test API button
  testApiBtn.addEventListener("click", async () => {
    const endpoint = document.getElementById("test-endpoint").textContent;
    const apiKey = apiKeyInput ? apiKeyInput.value.trim() : "";
    await testRealApi(endpoint, apiKey);
  });
}

async function testRealApi(endpoint, apiKey = "") {
  const responseEl = document.getElementById("test-response");
  const testBtn = document.getElementById("test-api-btn");

  // Show loading
  testBtn.disabled = true;
  testBtn.innerHTML = '<span>⏳</span> Loading...';

  responseEl.innerHTML = `
    <div class="test-response-loading">
      <div class="spinner"></div>
      <p>Fetching data from backend...</p>
    </div>
  `;

  try {
    const startTime = performance.now();
    const headers = {};

    // Use API Key if provided, otherwise use JWT token
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    } else {
      const token = localStorage.getItem("token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(window.API_BASE + endpoint, { headers });
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    const data = await response.json();

    if (response.ok) {
      // Success response
      responseEl.innerHTML = `
        <div class="test-response-success">
          <div class="test-response-status">
            <span class="status-code success">${response.status}</span>
            <span class="status-text">OK</span>
            <span class="response-time">~${responseTime}ms</span>
          </div>
          <pre class="test-response-body">${JSON.stringify(data, null, 2)}</pre>
        </div>
      `;
      showToast("API request successful!", "success");
    } else {
      // Error response
      responseEl.innerHTML = `
        <div class="test-response-error">
          <div class="test-response-status">
            <span class="status-code error">${response.status}</span>
            <span class="status-text">${response.statusText}</span>
          </div>
          <pre class="test-response-body">${JSON.stringify(data, null, 2)}</pre>
        </div>
      `;

      if (response.status === 401) {
        showToast("Authentication failed. Check your API key or JWT token.", "error");
      } else if (response.status === 403) {
        showToast("Access forbidden. You don't have permission.", "error");
      } else {
        showToast(`API request failed with status ${response.status}`, "error");
      }
    }
  } catch (error) {
    // Network error
    responseEl.innerHTML = `
      <div class="test-response-error">
        <div class="test-response-status">
          <span class="status-code error">ERR</span>
          <span class="status-text">Network Error</span>
        </div>
        <pre class="test-response-body">{
  "error": "Failed to connect to backend",
  "message": "${error.message}",
  \"hint\": \"Make sure the backend server is running on ${window.API_BASE}\"
}</pre>
      </div>
    `;
    showToast("Failed to connect to backend server", "error");
  }

  // Reset button
  testBtn.disabled = false;
  testBtn.innerHTML = '<span>▶</span> Test API';
}

// Toast notification function (reuse from user.js if available)
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
