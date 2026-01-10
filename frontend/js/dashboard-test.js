// Dashboard Quick API Test
const API_BASE = "http://localhost:3001";

document.addEventListener("DOMContentLoaded", () => {
    // Wait for user.js to load first
    setTimeout(() => {
        initDashboardTest();
    }, 100);
});

function initDashboardTest() {
    const testBtns = document.querySelectorAll(".test-endpoint-btn");
    const testApiBtn = document.getElementById("test-api-btn");

    if (!testBtns.length || !testApiBtn) return;

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
          Click "Test API" to see live results
        </div>
      `;
        });
    });

    // Test API button
    testApiBtn.addEventListener("click", async () => {
        const endpoint = document.getElementById("test-endpoint").textContent;
        await testRealApi(endpoint);
    });
}

async function testRealApi(endpoint) {
    const responseEl = document.getElementById("test-response");
    const testBtn = document.getElementById("test-api-btn");

    // Show loading
    testBtn.disabled = true;
    testBtn.innerHTML = '<span>⏳</span> Loading...';

    responseEl.innerHTML = `
    <div class="test-response-loading">
      <div class="spinner"></div>
      <p>Fetching data...</p>
    </div>
  `;

    try {
        const token = localStorage.getItem("token");
        const startTime = performance.now();

        const response = await fetch(API_BASE + endpoint, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

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
  "error": "Failed to fetch",
  "message": "${error.message}"
}</pre>
      </div>
    `;
    }

    // Reset button
    testBtn.disabled = false;
    testBtn.innerHTML = '<span>▶</span> Test API';
}
