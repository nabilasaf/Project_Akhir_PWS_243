const form = document.getElementById("registerForm");
const errorMsg = document.getElementById("errorMsg");
const successMsg = document.getElementById("successMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  errorMsg.textContent = "";
  successMsg.textContent = "";

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // ✅ VALIDASI PASSWORD
  if (password !== confirmPassword) {
    errorMsg.textContent = "Password and Confirm Password do not match";
    return;
  }

  if (password.length < 6) {
    errorMsg.textContent = "Password must be at least 6 characters";
    return;
  }

  try {
    const res = await fetch("http://localhost:3001/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password
      })
    });

    const data = await res.json();

    if (!res.ok) {
      errorMsg.textContent = data.message || "Registration failed";
      return;
    }

    successMsg.textContent = "Account created successfully! Redirecting...";

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);

  } catch (err) {
    errorMsg.textContent = "Server not responding";
  }
});
