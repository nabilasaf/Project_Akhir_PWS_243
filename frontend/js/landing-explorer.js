// Landing Page API Explorer
const API_BASE = "http://localhost:3001";

// Demo data untuk landing page (tanpa perlu auth)
const DEMO_RESPONSES = {
    "/api/games": [
        {
            id: 1,
            title: "The Witcher 3: Wild Hunt",
            genre: "RPG",
            platform: "PC, PS4, Xbox, Switch",
            rating: 9.5,
            icon: "🐉",
            apiAvailable: true
        },
        {
            id: 2,
            title: "Elden Ring",
            genre: "RPG",
            platform: "PC, PS5, Xbox Series X",
            rating: 9.7,
            icon: "🐉",
            apiAvailable: true
        },
        {
            id: 3,
            title: "God of War",
            genre: "Action",
            platform: "PS4, PS5, PC",
            rating: 9.4,
            icon: "⚔️",
            apiAvailable: true
        }
    ],
    "/api/games/1": {
        id: 1,
        title: "The Witcher 3: Wild Hunt",
        genre: "RPG",
        platform: "PC, PS4, Xbox, Switch",
        rating: 9.5,
        icon: "🐉",
        description: "The Witcher 3: Wild Hunt - RPG game available on PC, PS4, Xbox, Switch",
        apiAvailable: true,
        apiEndpoint: "/api/games/1"
    },
    "/api/games?search=RPG": [
        {
            id: 1,
            title: "The Witcher 3: Wild Hunt",
            genre: "RPG",
            platform: "PC, PS4, Xbox, Switch",
            rating: 9.5,
            icon: "🐉",
            apiAvailable: true
        },
        {
            id: 2,
            title: "Elden Ring",
            genre: "RPG",
            platform: "PC, PS5, Xbox Series X",
            rating: 9.7,
            icon: "🐉",
            apiAvailable: true
        }
    ]
};

document.addEventListener("DOMContentLoaded", () => {
    initExplorer();
});

function initExplorer() {
    const endpointBtns = document.querySelectorAll(".endpoint-btn");
    const tryBtn = document.getElementById("try-api-btn");

    // Endpoint selection
    endpointBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            // Remove active from all
            endpointBtns.forEach(b => b.classList.remove("active"));
            // Add active to clicked
            btn.classList.add("active");

            // Update request display
            const endpoint = btn.dataset.endpoint;
            const method = btn.dataset.method;

            document.getElementById("demo-method").textContent = method;
            document.getElementById("demo-endpoint").textContent = endpoint;

            // Reset response
            const responseEl = document.getElementById("demo-response");
            responseEl.innerHTML = `
        <div class="response-placeholder">
          Click "Try it now" to see the response
        </div>
      `;
        });
    });

    // Try API button
    if (tryBtn) {
        tryBtn.addEventListener("click", async () => {
            const endpoint = document.getElementById("demo-endpoint").textContent;
            await tryDemoApi(endpoint);
        });
    }
}

async function tryDemoApi(endpoint) {
    const responseEl = document.getElementById("demo-response");
    const tryBtn = document.getElementById("try-api-btn");

    // Show loading
    tryBtn.disabled = true;
    tryBtn.innerHTML = '<span class="icon">⏳</span> Loading...';

    responseEl.innerHTML = `
    <div class="response-loading">
      <div class="spinner"></div>
      <p>Fetching data...</p>
    </div>
  `;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Get demo response
    const demoData = DEMO_RESPONSES[endpoint];

    if (demoData) {
        // Success response
        responseEl.innerHTML = `
      <div class="response-success">
        <div class="response-status">
          <span class="status-code success">200</span>
          <span class="status-text">OK</span>
          <span class="response-time">~${Math.floor(Math.random() * 50) + 30}ms</span>
        </div>
        <pre class="response-body">${JSON.stringify(demoData, null, 2)}</pre>
      </div>
    `;
    } else {
        // Error response
        responseEl.innerHTML = `
      <div class="response-error">
        <div class="response-status">
          <span class="status-code error">404</span>
          <span class="status-text">Not Found</span>
        </div>
        <pre class="response-body">{
  "error": "Endpoint not found",
  "message": "This is a demo. Sign up to access all endpoints!"
}</pre>
      </div>
    `;
    }

    // Reset button
    tryBtn.disabled = false;
    tryBtn.innerHTML = '<span class="icon">▶</span> Try it now';
}
