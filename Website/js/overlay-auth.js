// overlay-auth.js
// Controls the auth overlay modal, tabs, role choices and profile panel.
// Integrates with your existing FirebaseService wrapper (login/register/logout/getUserProfile/onAuthChange).

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    // DOM refs
    const overlay = document.getElementById('authOverlay');
    const tabs = Array.from(document.querySelectorAll('.auth-tab'));
    const forms = Array.from(document.querySelectorAll('.overlay-auth-form'));
    const closeBtn = document.getElementById('authClose');
    const loginForm = document.getElementById('overlayLoginForm');
    const registerForm = document.getElementById('overlayRegisterForm');
    const loginNavBtn = document.getElementById('loginNavBtn');

    const profilePanel = document.getElementById('profilePanel');
    const profileIcon = document.getElementById('profileNavIcon'); // header icon
    const closeProfile = document.getElementById('closeProfilePanel');

    // Utility: show/hide overlay
    function showAuthOverlay() {
      overlay.classList.add('show');
      overlay.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('auth-open');
      document.body.classList.add('auth-open');
      // block navigation to other pages while overlay is shown:
      document.querySelectorAll('a').forEach(a => a.addEventListener('click', navBlocker));
      // set focus to first field
      setTimeout(() => {
        const f = overlay.querySelector('input[type="email"]');
        if (f) f.focus();
      }, 120);
    }
    function hideAuthOverlay() {
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('auth-open');
      document.body.classList.remove('auth-open');
      document.querySelectorAll('a').forEach(a => a.removeEventListener('click', navBlocker));
    }
    function navBlocker(e) {
      const href = this.getAttribute('href') || '';
      // allow intra-page anchors, tel:, mailto:
      if (href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:')) return;
      e.preventDefault();
    }

    // Tab switching
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const tab = t.dataset.tab;
      forms.forEach(f => f.classList.remove('active'));
      document.getElementById(tab === 'login' ? 'overlayLoginForm' : 'overlayRegisterForm')
        .classList.add('active');
    }));

    // Toggle register fields when radio changes
    function initRegisterRoleToggle() {
      const registerRadios = document.querySelectorAll('input[name="registerRole"]');
      if (!registerRadios || registerRadios.length === 0) return;
      const studentFields = document.getElementById('ovStudentFields');
      const therapistFields = document.getElementById('ovTherapistFields');

      registerRadios.forEach(radio => {
        radio.addEventListener('change', () => {
          const role = document.querySelector('input[name="registerRole"]:checked')?.value || 'student';
          if (role === 'student') {
            studentFields.style.display = 'block';
            therapistFields.style.display = 'none';
          } else {
            studentFields.style.display = 'none';
            therapistFields.style.display = 'block';
          }
        });
      });

      // kickstart initial state
      const initialRole = document.querySelector('input[name="registerRole"]:checked')?.value || 'student';
      if (initialRole === 'student') {
        studentFields.style.display = 'block';
        therapistFields.style.display = 'none';
      } else {
        studentFields.style.display = 'none';
        therapistFields.style.display = 'block';
      }
    }

    initRegisterRoleToggle();

    // Close overlay (only if user is logged in). If someone clicks it while logged out, keep it open.
    closeBtn.addEventListener('click', () => {
      const user = FirebaseService.getCurrentUser?.();
      if (user) {
        hideAuthOverlay();
      } else {
        // visual feedback only
        closeBtn.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }], { duration: 220 });
      }
    });

    // Header login button opens overlay
    loginNavBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      showAuthOverlay();
    });

    // Auth change: show overlay if not authenticated, hide if authenticated
    if (typeof FirebaseService !== 'undefined' && FirebaseService.onAuthChange) {
      FirebaseService.onAuthChange(async (user) => {
        if (user) {
          // hide overlay and populate profile panel
          hideAuthOverlay();
          await populateProfilePanel();
          updateNavForAuth(true);
          // If the user was on a dedicated login page, redirect to homepage
          const path = window.location.pathname || '';
          if (path.includes('/login.html') || path.includes('/auth.html')) {
            window.location.href = '/Website/html/index.html';
          }
        } else {
          updateNavForAuth(false);
          // only show overlay by default on the homepage; if on a protected page, that page's script may redirect
          const path = window.location.pathname || '';
          // show overlay if homepage or unknown — this keeps the flow consistent
          showAuthOverlay();
        }
      });
    } else {
      // fallback - show overlay if no Firebase wrapper present
      showAuthOverlay();
    }

    // LOGIN submit handler
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('overlayLoginEmail').value.trim();
      const password = document.getElementById('overlayLoginPassword').value;
      const role = document.querySelector('input[name="loginRole"]:checked')?.value || 'student';

      try {
        // call FirebaseService.login(email, password, role)
        await FirebaseService.login(email, password, role);

        // Success => hide overlay and allow the user to interact.
        hideAuthOverlay();
        updateNavForAuth(true);

        // If current page is a separate auth page, redirect to homepage so they can use the site.
        const path = window.location.pathname || '';
        if (path.includes('/login.html') || path.includes('/auth.html')) {
          window.location.href = '/Website/html/index.html';
        }
      } catch (err) {
        // show user-friendly error
        alert(err?.message || 'Login failed. Please check your credentials.');
        console.error('Login error', err);
      }
    });

    // REGISTER submit handler
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const firstName = document.getElementById('ovFirst').value.trim();
      const lastName = document.getElementById('ovLast').value.trim();
      const email = document.getElementById('ovEmail').value.trim();
      const password = document.getElementById('ovPassword').value;
      const role = document.querySelector('input[name="registerRole"]:checked')?.value || 'student';

      const profile = {
        firstName, lastName, role,
        studentId: document.getElementById('ovStudentId')?.value || '',
        courseYear: document.getElementById('ovCourse')?.value || '',
        therapistId: document.getElementById('ovTherId')?.value || '',
        specialization: document.getElementById('ovSpec')?.value || '',
        email
      };

      try {
        // create account + profile
        await FirebaseService.register(profile, email, password);

        // registration success -> hide overlay / update nav
        hideAuthOverlay();
        updateNavForAuth(true);

        // Redirect to homepage so user can access protected pages immediately.
        window.location.href = '/Website/html/index.html';
      } catch (err) {
        alert(err?.message || 'Registration failed. Try again.');
        console.error('Registration error', err);
      }
    });

    // Profile slide-out open/populate
    if (profileIcon) {
      profileIcon.addEventListener('click', async () => {
        await populateProfilePanel();
        profilePanel.classList.add('open');
        profilePanel.setAttribute('aria-hidden', 'false');
      });
    }

    closeProfile?.addEventListener('click', () => {
      profilePanel.classList.remove('open');
      profilePanel.setAttribute('aria-hidden', 'true');
    });

    // logout in profile panel
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
      try {
        await FirebaseService.logout();
        profilePanel.classList.remove('open');
        // show overlay on logout to block protected pages
        showAuthOverlay();
      } catch (err) {
        console.error('Logout failed', err);
        alert('Logout failed. See console.');
      }
    });

    // Populate profile details from FirebaseService.getUserProfile()
    async function populateProfilePanel() {
      try {
        const profile = await FirebaseService.getUserProfile();
        if (!profile) return;
        document.getElementById('profileName').textContent = (profile.firstName || '') + ' ' + (profile.lastName || '');
        document.getElementById('profileRole').textContent = profile.role === 'therapist' ? 'Counselor' : 'Student';
        document.getElementById('profileEmail').textContent = profile.email || profile.uid || '';
        document.getElementById('profileId').textContent = profile.studentId || profile.therapistId || '—';
        document.getElementById('profileCourse').textContent = profile.courseYear || profile.specialization || '—';
        document.getElementById('profilePhone').textContent = profile.phone || '—';
        if (profile.photoURL) document.getElementById('profileAvatar').src = profile.photoURL;

        // ensure header shows profile icon
        updateNavForAuth(true);
      } catch (err) {
        console.error('Profile load error', err);
      }
    }

    function updateNavForAuth(isAuthed) {
      const loginBtn = document.getElementById('loginNavBtn');
      const userMenu = document.getElementById('userMenu');
      if (isAuthed) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userMenu) userMenu.style.display = 'inline-flex';
      } else {
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (userMenu) userMenu.style.display = 'none';
      }
    }

    // Expose functions for other scripts if needed
    window.OverlayAuth = {
      show: showAuthOverlay,
      hide: hideAuthOverlay,
      populateProfilePanel
    };
  });
})();
