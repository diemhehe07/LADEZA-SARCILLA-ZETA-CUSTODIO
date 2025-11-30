// /Website/js/profile-dashboard.js
document.addEventListener('DOMContentLoaded', function() {
  // If FirebaseService is missing, abort gracefully.
  if (typeof FirebaseService === 'undefined') {
    console.warn('FirebaseService not found. Profile features will not work until firebase.js is loaded.');
    return;
  }

  const currentUser = FirebaseService.getCurrentUser?.();
  // If user not authenticated, show overlay (do not redirect away)
  if (!currentUser) {
    // If overlay present, show it; otherwise fallback to login page
    const ov = document.getElementById('authOverlay');
    if (ov && typeof window.OverlayAuth !== 'undefined') {
      window.OverlayAuth.show();
    } else if (ov) {
      ov.classList.add('show');
      ov.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('auth-open');
    } else {
      window.location.href = '/Website/html/login.html';
    }
    return;
  }

  // Load profile info for dashboard (if this script used on profile page)
  loadUserProfile();

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await FirebaseService.logout();
        // show overlay on logout
        if (typeof window.OverlayAuth !== 'undefined') {
          window.OverlayAuth.show();
        } else {
          const ov = document.getElementById('authOverlay');
          if (ov) {
            ov.classList.add('show');
            ov.setAttribute('aria-hidden', 'false');
            document.documentElement.classList.add('auth-open');
          } else {
            window.location.href = '/Website/html/login.html';
          }
        }
      } catch (err) {
        console.error('Logout error:', err);
        alert('Logout failed. Please try again.');
      }
    });
  }

  // Edit profile placeholder
  const editProfileBtn = document.getElementById('editProfile');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      alert('Edit profile feature — implement form/modal here.');
    });
  }

  // Load and populate profile info
  async function loadUserProfile() {
    try {
      const profile = await FirebaseService.getUserProfile();
      if (profile) updateDashboardUI(profile);
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  }

  function updateDashboardUI(profile) {
    const greeting = document.getElementById('userGreeting');
    if (greeting) {
      const name = profile.firstName || 'User';
      greeting.textContent = `Welcome back, ${name}!`;
    }

    const userRole = document.getElementById('userRole');
    if (userRole) userRole.textContent = profile.role === 'therapist' ? 'Counselor' : 'Student';

    if (profile.role === 'student') {
      const studentId = document.getElementById('userStudentId');
      const userCourse = document.getElementById('userCourse');
      if (studentId && profile.studentId) studentId.textContent = profile.studentId;
      if (userCourse && profile.courseYear) userCourse.textContent = profile.courseYear;

      const studentDash = document.getElementById('studentDashboard');
      const therapistDash = document.getElementById('therapistDashboard');
      if (studentDash) studentDash.style.display = 'block';
      if (therapistDash) therapistDash.style.display = 'none';

    } else if (profile.role === 'therapist') {
      const userSpecialization = document.getElementById('userSpecialization');
      if (userSpecialization && profile.specialization) userSpecialization.textContent = profile.specialization;

      const studentDash = document.getElementById('studentDashboard');
      const therapistDash = document.getElementById('therapistDashboard');
      if (studentDash) studentDash.style.display = 'none';
      if (therapistDash) therapistDash.style.display = 'block';
    }

    // Ensure header profile icon visible
    const loginBtn = document.getElementById('loginNavBtn');
    const userMenu = document.getElementById('userMenu');
    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'inline-flex';
  }
});
