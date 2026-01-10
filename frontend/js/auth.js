/* ===============================
   AUTH SCRIPT (LOGIN & REGISTER)
================================ */

const API_BASE = "http://localhost:3001/api";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  if (loginForm) initLogin(loginForm);
  if (registerForm) initRegister(registerForm);
});

/* ===============================
   LOGIN
================================ */
function initLogin(form) {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      alert("Email & password required");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // ✅ SIMPAN SESSION
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("email", data.user.email);
      localStorage.setItem("user_id", data.user.user_id);

      // ✅ REDIRECT
      if (data.user.role === "admin") {
        window.location.href = "/frontend/pages/admin/dashboard.html";
      } else {
        window.location.href = "/frontend/pages/user/dashboard.html";
      }

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });
}

/* ===============================
   REGISTER
================================ */
function initRegister(form) {
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirmPassword");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (passwordInput.value !== confirmInput.value) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          password: passwordInput.value
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Register failed");
        return;
      }

      alert("Register success! Please login.");
      window.location.href = "/frontend/pages/login.html";

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });
}
