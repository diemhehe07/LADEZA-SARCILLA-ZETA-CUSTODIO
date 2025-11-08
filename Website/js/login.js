// Auth functionality for all pages
function initAuth() {
  checkAuthStatus();
  initProfileDropdown();
}

function checkAuthStatus() {
  const currentUser = getCurrentUser();
  const navAuth = document.getElementById('navAuth');
  if (!navAuth) return;
  
  const authButtons = navAuth.querySelector('.auth-buttons');
  const userProfile = navAuth.querySelector('.user-profile');
  
  if (currentUser) {
    authButtons.style.display = 'none';
    userProfile.style.display = 'block';
    
    const userName = document.getElementById('userName');
    if (userName) {
      userName.textContent = currentUser.firstName || 'User';
    }
  } else {
    authButtons.style.display = 'flex';
    userProfile.style.display = 'none';
  }
}

function getCurrentUser() {
  const localUser = localStorage.getItem('currentUser');
  const sessionUser = sessionStorage.getItem('currentUser');
  
  if (localUser) {
    return JSON.parse(localUser).user;
  } else if (sessionUser) {
    return JSON.parse(sessionUser).user;
  }
  
  return null;
}

function initProfileDropdown() {
  const profileBtn = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (profileBtn && profileDropdown) {
    profileBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      profileDropdown.classList.toggle('show');
      
      const chevron = this.querySelector('.fa-chevron-down');
      chevron.style.transform = profileDropdown.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0)';
    });
    
    document.addEventListener('click', function() {
      profileDropdown.classList.remove('show');
      const chevron = profileBtn.querySelector('.fa-chevron-down');
      chevron.style.transform = 'rotate(0)';
    });
    
    profileDropdown.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentUser');
      window.location.reload();
    });
  }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initAuth();
});