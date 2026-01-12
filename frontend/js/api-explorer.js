const BASE_URL = "http://localhost:3001";

// ELEMENTS
const apiKeyInput = document.getElementById("api-key-input");
const endpointButtons = document.querySelectorAll(".test-endpoint-btn");
const endpointText = document.getElementById("test-endpoint");
const testBtn = document.getElementById("test-api-btn");

const callUrlBox = document.getElementById("call-url");
const callUrlText = document.getElementById("call-url-text");
const callApiKeyText = document.getElementById("call-api-key");
const responseBody = document.getElementById("response-body");

// STATE
let currentEndpoint = "/api/games";

// SWITCH ENDPOINT
endpointButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    endpointButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    currentEndpoint = btn.dataset.endpoint;
    endpointText.textContent = currentEndpoint;
  });
});

// TEST API
testBtn.addEventListener("click", async () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    alert("API Key wajib diisi");
    return;
  }

  const finalUrl = BASE_URL + currentEndpoint;

  // SHOW CALL INFO
  callUrlBox.style.display = "block";
  callUrlText.textContent = finalUrl;
  callApiKeyText.textContent = apiKey;

  // LOADING STATE
  responseBody.className = "test-response-loading";
  responseBody.innerHTML = `
    <div class="spinner"></div>
    <p>Fetching API...</p>
  `;

  const start = performance.now();

  try {
    // 🔥 INI KUNCI UTAMANYA
    const res = await fetch(finalUrl, {
      headers: {
        "x-api-key": apiKey
      }
    });

    const data = await res.json();
    const time = Math.round(performance.now() - start);

    // 🔥 UI ERROR-STYLE, DATA APA ADANYA
    responseBody.className = "";
    responseBody.innerHTML = `
      <div class="test-response-status">
        <span class="status-code ${res.ok ? "success" : "error"}">
          ${res.status}
        </span>
        <span class="status-text">
          ${res.ok ? "Success" : "Forbidden"}
        </span>
        <span class="response-time">${time} ms</span>
      </div>

      <pre class="test-response-body">
${JSON.stringify(data, null, 2)}
      </pre>
    `;
  } catch (err) {
    responseBody.className = "";
    responseBody.innerHTML = `
      <div class="test-response-status">
        <span class="status-code error">ERROR</span>
        <span class="status-text">Network Error</span>
      </div>
    `;
  }
});
