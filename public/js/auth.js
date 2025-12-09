// Helper to safely save to Firestore using FirebaseService
async function saveToFirestore(collection, data) {
  if (!window.FirebaseService || !window.FirebaseService.isReady()) {
    console.warn("FirebaseService not ready; skipping Firestore save for", collection);
    return;
  }

  try {
    await window.FirebaseService.saveDocument(collection, {
      ...data,
      page: window.location.pathname
    });
  } catch (err) {
    console.error("Error saving to Firestore (" + collection + "):", err);
  }
}

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadCurrentUser();
        
        // If on profile page, don't redirect (allow login/register)
        if (window.location.pathname.includes('profile.html')) {
            return;
        }
        
        // Check if user is logged in
        this.checkAuthStatus();
    }

    loadCurrentUser() {
        try {
            const userData = localStorage.getItem('slsuUser');
            if (userData) {
                this.currentUser = JSON.parse(userData);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.currentUser = null;
        }
    }

    checkAuthStatus() {
        const userData = localStorage.getItem('slsuUser');
        
        if (!userData && !this.isPublicPage()) {
            this.redirectToLogin();
            return false;
        }
        
        return true;
    }

    isPublicPage() {
        // Allow access to profile page without login (for registration/login)
        const publicPages = [
            'profile.html'
        ];
        
        const currentPage = window.location.pathname.split('/').pop();
        return publicPages.includes(currentPage);
    }

    redirectToLogin() {
        // Store the intended destination
        const currentUrl = window.location.pathname + window.location.search;
        if (currentUrl !== 'profile.html') {
            sessionStorage.setItem('redirectAfterLogin', currentUrl);
        }
        
        // Redirect to profile page
        window.location.href = 'profile.html';
    }

    isLoggedIn() {
        return !!localStorage.getItem('slsuUser');
    }

    getUserData() {
        if (this.currentUser) {
            return this.currentUser;
        }
        
        const userData = localStorage.getItem('slsuUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            return this.currentUser;
        }
        
        return null;
    }

    login(userData) {
        localStorage.setItem('slsuUser', JSON.stringify(userData));
        this.currentUser = userData;
        
        // Check for redirect URL
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
        sessionStorage.removeItem('redirectAfterLogin');
        
        return redirectUrl;
    }

    logout() {
        localStorage.removeItem('slsuUser');
        this.currentUser = null;
        window.location.href = 'profile.html';
    }

   updateUserData(updatedData) {
  const currentUser = this.getUserData();
  if (!currentUser) return false;

  const newUserData = { ...currentUser, ...updatedData };
  localStorage.setItem('slsuUser', JSON.stringify(newUserData));
  this.currentUser = newUserData;

  // Firestore (best-effort; no need to await here)
  saveToFirestore('users', {
    ...newUserData,
    updatedAtLocal: new Date().toISOString()
  });

  return true;
}


    // Check if email is valid SLSU email
    isValidSLSUEmail(email) {
        return email.endsWith('@slsu.edu.ph');
    }

    // Validate student ID format
    isValidStudentId(studentId) {
        return /^\d{2}-\d{6}$/.test(studentId);
    }
}

// Create global instance
window.Auth = new AuthSystem();

// Auto-initialize
document.addEventListener('DOMContentLoaded', function() {
    // If not on profile page and not logged in, redirect
    if (!window.location.pathname.includes('profile.html') && !window.Auth.isLoggedIn()) {
        window.Auth.redirectToLogin();
    }
    
    // Update navigation based on auth status
    updateNavigation();
});

function updateNavigation() {
    const profileIcon = document.getElementById('profileNavIcon');
    if (profileIcon) {
        if (window.Auth.isLoggedIn()) {
            profileIcon.classList.add('active');
        } else {
            profileIcon.classList.remove('active');
        }
    }
}