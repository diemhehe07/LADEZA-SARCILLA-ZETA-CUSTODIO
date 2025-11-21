// Website/js/login.js
// Handles login/register UI + Firebase (email/password + Google + Facebook)

document.addEventListener("DOMContentLoaded", () => {
  // ----- Tabs -----
  const authTabs = document.querySelectorAll(".auth-tab");
  const authForms = document.querySelectorAll(".auth-form");

  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetTab = tab.getAttribute("data-tab");

      authTabs.forEach((t) => t.classList.remove("active"));
      authForms.forEach((f) => f.classList.remove("active"));

      tab.classList.add("active");
      const targetForm = document.querySelector(`.auth-form[data-tab="${targetTab}"]`);
      if (targetForm) targetForm.classList.add("active");
    });
  });

  // ----- Forms -----
  const loginForm = document.getElementById("loginFormElement");
  const registerForm = document.getElementById("registerFormElement");

  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (registerForm) registerForm.addEventListener("submit", handleRegister);

  // ----- Password toggles -----
  const loginPassword = document.getElementById("loginPassword");
  const loginPasswordToggle = document.getElementById("loginPasswordToggle");
  const registerPassword = document.getElementById("registerPassword");
  const registerPasswordToggle = document.getElementById("registerPasswordToggle");
  const registerConfirmPassword = document.getElementById("registerConfirmPassword");
  const registerConfirmToggle = document.getElementById("registerConfirmPasswordToggle");

  setupPasswordToggle(loginPassword, loginPasswordToggle);
  setupPasswordToggle(registerPassword, registerPasswordToggle);
  setupPasswordToggle(registerConfirmPassword, registerConfirmToggle);

  // ----- Password strength meter -----
  const strengthFill = document.getElementById("strengthFill");
  const strengthText = document.getElementById("strengthText");

  if (registerPassword) {
    registerPassword.addEventListener("input", () => {
      const { score, label } = evaluatePassword(registerPassword.value);
      if (!strengthFill || !strengthText) return;

      strengthFill.style.width = `${score}%`;
      strengthText.textContent = label;
    });
  }

  // ----- Social login buttons -----
  const googleBtn = document.getElementById("googleLoginBtn");
  const facebookBtn = document.getElementById("facebookLoginBtn");

  if (googleBtn) {
    googleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleProviderLogin("google");
    });
  }

  if (facebookBtn) {
    facebookBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleProviderLogin("facebook");
    });
  }

  // ----- Notifications -----
  function showNotification(message, type = "info") {
    const existing = document.querySelector(".toast-notification");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => toast.classList.remove("show"), 3000);
    setTimeout(() => toast.remove(), 3400);
  }

  // ----- Email/password LOGIN handler -----
  async function handleLogin(e) {
    e.preventDefault();
    if (!loginForm) return;

    const formData = new FormData(loginForm);
    const email = formData.get("email");
    const password = formData.get("password");
    const rememberMe = formData.get("rememberMe");

    if (!email || !password) {
      showNotification("Please fill in all required fields", "error");
      return;
    }

    const submitBtn = loginForm.querySelector(".auth-btn");
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.textContent = "Signing in...";
      submitBtn.disabled = true;
    }

    try {
      if (window.FirebaseService && typeof FirebaseService.isReady === "function" && FirebaseService.isReady()) {
        await FirebaseService.loginWithEmail(email, password);
        showNotification("Login successful! Redirecting...", "success");
      } else {
        // Fallback to localStorage-only login
        const users = JSON.parse(localStorage.getItem("slsUsers") || "[]");
        const user = users.find((u) => u.email === email && u.password === password);

        if (!user) {
          showNotification("Invalid email or password", "error");
          resetButton();
          return;
        }

        const sessionData = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isLoggedIn: true
        };

        if (rememberMe) {
          localStorage.setItem("slsUserSession", JSON.stringify(sessionData));
        } else {
          sessionStorage.setItem("slsUserSession", JSON.stringify(sessionData));
        }
        showNotification("Login successful! Redirecting...", "success");
      }

      setTimeout(() => {
        window.location.href = "/Website/html/profile.html";
      }, 1200);
    } catch (err) {
      console.error("Login error:", err);
      showNotification(err.message || "Login failed. Please try again.", "error");
    } finally {
      resetButton();
    }

    function resetButton() {
      if (!submitBtn) return;
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  // ----- Email/password REGISTER handler -----
  async function handleRegister(e) {
    e.preventDefault();
    if (!registerForm) return;

    const formData = new FormData(registerForm);
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");
    const userType = formData.get("userType");
    const termsAgreement = formData.get("termsAgreement");

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      showNotification("Please fill in all required fields", "error");
      return;
    }

    if (password !== confirmPassword) {
      showNotification("Passwords do not match", "error");
      return;
    }

    if (!termsAgreement) {
      showNotification("Please agree to the terms and conditions", "error");
      return;
    }

    const submitBtn = registerForm.querySelector(".auth-btn");
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.textContent = "Creating account...";
      submitBtn.disabled = true;
    }

    try {
      // Local fallback user store
      const users = JSON.parse(localStorage.getItem("slsUsers") || "[]");
      const existingUser = users.find((u) => u.email === email);

      if (existingUser) {
        showNotification("An account with this email already exists", "error");
        resetButton();
        return;
      }

      const newUser = {
        id: `U${Date.now()}`,
        firstName,
        lastName,
        email,
        phone,
        password, // plain text only for fallback
        userType,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem("slsUsers", JSON.stringify(users));

      // Also register with Firebase if available
      if (window.FirebaseService && typeof FirebaseService.isReady === "function" && FirebaseService.isReady()) {
        await FirebaseService.registerWithEmail(email, password, {
          firstName,
          lastName,
          phone,
          userType
        });
      }

      showNotification("Account created! You can now log in.", "success");

      // Switch to Login tab after a brief delay
      setTimeout(() => {
        authTabs.forEach((t) => t.classList.remove("active"));
        authForms.forEach((f) => f.classList.remove("active"));

        const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
        const loginFormContainer = document.querySelector('.auth-form[data-tab="login"]');

        if (loginTab) loginTab.classList.add("active");
        if (loginFormContainer) loginFormContainer.classList.add("active");
      }, 800);

      registerForm.reset();
    } catch (err) {
      console.error("Registration error:", err);
      showNotification(err.message || "Registration failed. Please try again.", "error");
    } finally {
      resetButton();
    }

    function resetButton() {
      if (!submitBtn) return;
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  // ----- Social login handler -----
  async function handleProviderLogin(providerName) {
    try {
      if (!(window.FirebaseService && typeof FirebaseService.isReady === "function" && FirebaseService.isReady())) {
        alert("Social login is not available right now. Please try email/password.");
        return;
      }

      const user = await FirebaseService.loginWithProvider(providerName);
      console.log("Logged in with provider:", providerName, user.uid);
      showNotification("Login successful! Redirecting...", "success");

      setTimeout(() => {
        window.location.href = "/Website/html/profile.html";
      }, 1000);
    } catch (err) {
      console.error(`Error with ${providerName} login:`, err);
      showNotification(err.message || "Social login failed. Please try again.", "error");
    }
  }

  // ----- Helpers -----
  function setupPasswordToggle(input, button) {
    if (!input || !button) return;
    button.addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      const icon = button.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-eye");
        icon.classList.toggle("fa-eye-slash");
      }
    });
  }

  function evaluatePassword(password) {
    if (!password) return { score: 0, label: "Password strength" };
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;

    let label = "Weak";
    if (score >= 75) label = "Strong";
    else if (score >= 50) label = "Medium";

    return { score, label };
  }
});
