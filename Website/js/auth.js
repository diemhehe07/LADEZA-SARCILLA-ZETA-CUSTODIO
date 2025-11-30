// /Website/js/auth-manager.js
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this.init();
  }

  init() {
    // Listen for auth state changes
    FirebaseService.onAuthChange(async (user) => {
      this.currentUser = user;

      if (user) {
        this.userProfile = await FirebaseService.getUserProfile(user.uid);
        this.handleAuthentication();
      } else {
        this.userProfile = null;
        this.handleLogout();
      }
    });
  }

  handleAuthentication() {
    const currentPage = window.location.pathname.split("/").pop().toLowerCase();

    // If user is on login page, redirect to appropriate dashboard
    if (currentPage === "login.html") {
      if (this.userProfile?.role === "therapist") {
        window.location.href = "/Website/html/therapist-dashboard.html";
      } else {
        // students → profile dashboard
        window.location.href = "/Website/html/profile.html";
      }
      return;
    }

    // Update navigation in main pages
    this.updateNavigation();
  }

  handleLogout() {
    const currentPage = window.location.pathname.split("/").pop().toLowerCase();

    // Only pages that can be opened without login:
    const publicPages = [
      "login.html",
      "privacy.html",
      "terms.html",
      "accessibility.html"
    ];

    // If user is on a protected page, redirect to login
    if (!publicPages.includes(currentPage)) {
      window.location.href = "/Website/html/login.html";
    } else {
      this.updateNavigation();
    }
  }

  updateNavigation() {
    // Update navigation in main pages to show profile instead of login
    const loginNavBtn = document.getElementById("loginNavBtn");
    const profileNavIcon = document.getElementById("profileNavIcon");
    const userMenu = document.getElementById("userMenu");

    if (this.currentUser) {
      if (loginNavBtn) loginNavBtn.style.display = "none";
      if (userMenu) userMenu.style.display = "flex";
      if (profileNavIcon) profileNavIcon.style.display = "flex";
    } else {
      if (loginNavBtn) loginNavBtn.style.display = "inline-flex";
      if (userMenu) userMenu.style.display = "none";
      if (profileNavIcon) profileNavIcon.style.display = "none";
    }
  }
}

// Initialize auth manager
const authManager = new AuthManager();
