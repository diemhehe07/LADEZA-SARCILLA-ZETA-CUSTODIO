// profile.js - JavaScript for profile dashboard functionality (Firebase + localStorage)

// ---------------------------
// DOM Ready
// ---------------------------
document.addEventListener('DOMContentLoaded', function () {
  // Check if user is already logged in (from localStorage)
  checkLoginStatus();

  // Initialize UI behaviors
  initializeAuthTabs();
  initializePasswordToggles();
  initializeForms();
  initializeDashboard();
  initAvatarUpload();

  // Optional: keep UI in sync with Firebase auth state
  if (window.FirebaseService && FirebaseService.isReady()) {
    FirebaseService.onAuthChange(function (user) {
      if (!user) {
        // Logged out in Firebase -> clear local user + show auth
        localStorage.removeItem('slsuUser');
        showAuthSection();
      }
    });
  }
});

// ---------------------------
// Login state
// ---------------------------
function checkLoginStatus() {
  const userDataStr = localStorage.getItem('slsuUser');
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);
      showDashboard(userData);
      return;
    } catch (e) {
      console.error('Failed to parse stored user data:', e);
      localStorage.removeItem('slsuUser');
    }
  }
  showAuthSection();
}

// ---------------------------
// Auth tabs (Login / Register)
// ---------------------------
function initializeAuthTabs() {
  const authTabs = document.querySelectorAll('.auth-tab');
  const authForms = document.querySelectorAll('.auth-form');

  if (!authTabs.length || !authForms.length) return;

  authTabs.forEach(tab => {
    tab.addEventListener('click', function () {
      const targetTab = this.getAttribute('data-tab');

      // Update active tab
      authTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      // Show corresponding form
      authForms.forEach(form => {
        form.classList.remove('active');
        if (form.id === `${targetTab}Form`) {
          form.classList.add('active');
        }
      });
    });
  });
}

// ---------------------------
// Password visibility toggles
// ---------------------------
function initializePasswordToggles() {
  const toggles = document.querySelectorAll('.password-toggle');
  toggles.forEach(toggle => {
    toggle.addEventListener('click', function () {
      const parent = this.parentElement;
      if (!parent) return;
      const passwordInput = parent.querySelector('input[type="password"], input[data-password-field="true"]');
      const icon = this.querySelector('i');

      if (!passwordInput) return;

      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        if (icon) {
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        }
      } else {
        passwordInput.type = 'password';
        if (icon) {
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      }
    });
  });
}

// ---------------------------
// Forms: login, register, edit profile
// ---------------------------
function initializeForms() {
  const loginForm = document.getElementById('loginFormData');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const registerForm = document.getElementById('registerFormData');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegistration);
  }

  const editProfileForm = document.getElementById('editProfileForm');
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', handleProfileUpdate);
  }
}

// ---------------------------
// Registration
// ---------------------------
async function handleRegistration(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  const userData = {
    firstName: formData.get('firstName') ? formData.get('firstName').trim() : '',
    lastName: formData.get('lastName') ? formData.get('lastName').trim() : '',
    studentId: formData.get('studentId') ? formData.get('studentId').trim() : '',
    email: formData.get('email') ? formData.get('email').trim() : '',
    courseYear: formData.get('courseYear') || '',
    password: formData.get('password') || '',
    confirmPassword: formData.get('confirmPassword') || ''
  };

  if (!validateRegistration(userData)) {
    return;
  }

  // Prefer Firebase Auth + Firestore if available
  if (window.FirebaseService && FirebaseService.isReady()) {
    try {
      const extraProfile = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        studentId: userData.studentId,
        courseYear: userData.courseYear
      };

      const user = await FirebaseService.registerWithEmail(
        userData.email,
        userData.password,
        extraProfile
      );

      const memberSince = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const loginData = {
        uid: user.uid,
        email: user.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        studentId: userData.studentId,
        courseYear: userData.courseYear,
        memberSince
      };

      localStorage.setItem('slsuUser', JSON.stringify(loginData));

      showMessage('Registration successful! Welcome.', 'success');
      setTimeout(() => {
        showDashboard(loginData);
      }, 1200);
    } catch (err) {
      console.error('Firebase registration error:', err);
      const msg = err && err.message ? err.message : 'Registration failed. Please try again.';
      showMessage(msg, 'error');
    }
    return;
  }

  // Fallback: local fake DB in localStorage (for offline/dev)
  if (checkUserExistsLocal(userData.email)) {
    showMessage('A user with this email already exists.', 'error');
    return;
  }

  registerUserLocal(userData);
}

function validateRegistration(userData) {
  // Check required fields
  if (
    !userData.firstName ||
    !userData.lastName ||
    !userData.studentId ||
    !userData.email ||
    !userData.password ||
    !userData.courseYear
  ) {
    showMessage('Please fill in all required fields.', 'error');
    return false;
  }

  // ✅ Gmail-only email requirement
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!gmailRegex.test(userData.email)) {
    showMessage('Please use a valid Gmail address (example@gmail.com).', 'error');
    return false;
  }

  // Student ID format: YY-XXXXXX (allow 5 or 6 digits for the second part)
  if (!/^\d{2}-\d{5,6}$/.test(userData.studentId)) {
    showMessage('Please enter a valid Student ID (format: YY-XXXXXX).', 'error');
    return false;
  }

  if (userData.password.length < 8) {
    showMessage('Password must be at least 8 characters long.', 'error');
    return false;
  }

  const confirmPasswordEl = document.getElementById('confirmPassword');
  const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value : '';
  if (userData.password !== confirmPassword) {
    showMessage('Passwords do not match.', 'error');
    return false;
  }

  return true;
}

// ---------------------------
// Login
// ---------------------------
async function handleLogin(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const email = formData.get('email') ? formData.get('email').trim() : '';
  const password = formData.get('password') || '';

  if (!email || !password) {
    showMessage('Please enter both email and password.', 'error');
    return;
  }

  // Prefer Firebase Auth if ready
  if (window.FirebaseService && FirebaseService.isReady()) {
    try {
      const user = await FirebaseService.loginWithEmail(email, password);

      // Fetch profile from Firestore "users" collection
      const db = firebase.firestore();
      const userDoc = await db.collection('users').doc(user.uid).get();
      const profile = userDoc.exists ? userDoc.data() : {};

      let memberSince = 'Recently';
      if (profile.createdAt && typeof profile.createdAt.toDate === 'function') {
        memberSince = profile.createdAt.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }

      const userData = {
        uid: user.uid,
        email: user.email,
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        studentId: profile.studentId || '',
        courseYear: profile.courseYear || '',
        memberSince
      };

      localStorage.setItem('slsuUser', JSON.stringify(userData));

      showMessage('Login successful!', 'success');
      setTimeout(() => {
        showDashboard(userData);
      }, 800);
    } catch (err) {
      console.error('Firebase login error:', err);
      showMessage('Invalid email or password.', 'error');
    }
    return;
  }

  // Fallback: localStorage fake DB
  const user = authenticateUserLocal({ email, password });
  if (user) {
    const memberSince = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'Recently';

    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      studentId: user.studentId,
      email: user.email,
      courseYear: user.courseYear,
      memberSince
    };

    localStorage.setItem('slsuUser', JSON.stringify(userData));
    showMessage('Login successful!', 'success');
    setTimeout(() => {
      showDashboard(userData);
    }, 800);
  } else {
    showMessage('Invalid email or password.', 'error');
  }
}

// ---------------------------
// Local fallback auth (for dev)
// ---------------------------
function checkUserExistsLocal(email) {
  const users = JSON.parse(localStorage.getItem('slsuUsers') || '[]');
  return users.some(user => user.email === email);
}

function registerUserLocal(userData) {
  try {
    const users = JSON.parse(localStorage.getItem('slsuUsers') || '[]');

    const newUser = {
      id: generateUserId(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      studentId: userData.studentId,
      email: userData.email,
      courseYear: userData.courseYear,
      password: btoa(userData.password),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('slsuUsers', JSON.stringify(users));

    const memberSince = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const loginData = {
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      studentId: newUser.studentId,
      email: newUser.email,
      courseYear: newUser.courseYear,
      memberSince
    };

    localStorage.setItem('slsuUser', JSON.stringify(loginData));

    showMessage('Registration successful! Welcome.', 'success');
    setTimeout(() => {
      showDashboard(loginData);
    }, 1200);
  } catch (error) {
    console.error('Local registration error:', error);
    showMessage('Registration failed. Please try again.', 'error');
  }
}

function authenticateUserLocal(loginData) {
  try {
    const users = JSON.parse(localStorage.getItem('slsuUsers') || '[]');
    const user = users.find(
      u => u.email === loginData.email && atob(u.password) === loginData.password
    );
    return user || null;
  } catch (err) {
    console.error('Local login error:', err);
    return null;
  }
}

// ---------------------------
// Dashboard show/hide
// ---------------------------
function showDashboard(userData) {
  const authSection = document.getElementById('authSection');
  const dashboardSection = document.getElementById('dashboardSection');

  if (authSection) authSection.style.display = 'none';
  if (dashboardSection) {
    dashboardSection.style.display = 'block';
    updateDashboard(userData);
  }

  const profileIcon = document.getElementById('profileNavIcon');
  if (profileIcon) profileIcon.classList.add('active');

  loadUserAvatar(userData);
  loadUpcomingAppointments(userData);
  loadSavedResources(userData);
  loadRecentActivity(userData);
}

function showAuthSection() {
  const authSection = document.getElementById('authSection');
  const dashboardSection = document.getElementById('dashboardSection');

  if (authSection) authSection.style.display = 'flex';
  if (dashboardSection) dashboardSection.style.display = 'none';

  const profileIcon = document.getElementById('profileNavIcon');
  if (profileIcon) profileIcon.classList.remove('active');
}

// ---------------------------
// Dashboard content updates
// ---------------------------
function updateDashboard(userData) {
  const userGreeting = document.getElementById('userGreeting');
  if (userGreeting) {
    const hour = new Date().getHours();
    const greeting =
      hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const firstName = userData.firstName || '';
    userGreeting.textContent = firstName ? `${greeting}, ${firstName}!` : greeting;
  }

  const userStudentId = document.getElementById('userStudentId');
  const userCourse = document.getElementById('userCourse');
  const memberSince = document.getElementById('memberSince');

  if (userStudentId) userStudentId.textContent = userData.studentId || '-';
  if (userCourse) userCourse.textContent = formatCourseYear(userData.courseYear || '');
  if (memberSince) memberSince.textContent = userData.memberSince || '-';

  updateEditForm(userData);
}

function formatCourseYear(courseYear) {
  const courseMap = {
    'bs-psych-1': 'BS Psychology - 1st Year',
    'bs-psych-2': 'BS Psychology - 2nd Year',
    'bs-psych-3': 'BS Psychology - 3rd Year',
    'bs-psych-4': 'BS Psychology - 4th Year',
    'bs-eng-1': 'BS Engineering - 1st Year',
    'bs-eng-2': 'BS Engineering - 2nd Year',
    'bs-eng-3': 'BS Engineering - 3rd Year',
    'bs-eng-4': 'BS Engineering - 4th Year',
    'bs-ba-1': 'BS Business Admin - 1st Year',
    'bs-ba-2': 'BS Business Admin - 2nd Year',
    'bs-ba-3': 'BS Business Admin - 3rd Year',
    'bs-ba-4': 'BS Business Admin - 4th Year',
    other: 'Other Course'
  };
  return courseMap[courseYear] || courseYear || '-';
}

function updateEditForm(userData) {
  const editFirstName = document.getElementById('editFirstName');
  const editLastName = document.getElementById('editLastName');
  const editStudentId = document.getElementById('editStudentId');
  const editCourseYear = document.getElementById('editCourseYear');
  const editEmail = document.getElementById('editEmail');
  const editPhone = document.getElementById('editPhone');

  if (editFirstName) editFirstName.value = userData.firstName || '';
  if (editLastName) editLastName.value = userData.lastName || '';
  if (editStudentId) editStudentId.value = userData.studentId || '';
  if (editCourseYear) editCourseYear.value = userData.courseYear || '';
  if (editEmail) editEmail.value = userData.email || '';
  if (editPhone && userData.phone) editPhone.value = userData.phone;
}

// ---------------------------
// Dashboard initialization: buttons, modals
// ---------------------------
function initializeDashboard() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  const editProfileBtn = document.getElementById('editProfile');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', showEditProfileModal);
  }

  const cancelEditBtn = document.getElementById('cancelEdit');
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', hideEditProfileModal);
  }

  const modalCloseBtns = document.querySelectorAll('.modal .close');
  modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const modal = this.closest('.modal');
      if (modal) modal.style.display = 'none';
    });
  });

  window.addEventListener('click', function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}

async function handleLogout() {
  if (window.FirebaseService && FirebaseService.isReady()) {
    try {
      await FirebaseService.logout();
    } catch (err) {
      console.error('Error logging out of Firebase:', err);
    }
  }

  localStorage.removeItem('slsuUser');
  showMessage('You have been logged out successfully.', 'success');

  setTimeout(() => {
    showAuthSection();
    const loginForm = document.getElementById('loginFormData');
    if (loginForm) loginForm.reset();
  }, 800);
}

function showEditProfileModal() {
  const modal = document.getElementById('editProfileModal');
  if (modal) {
    modal.style.display = 'block';

    const currentUserStr = localStorage.getItem('slsuUser') || '{}';
    let currentUser = {};
    try {
      currentUser = JSON.parse(currentUserStr);
    } catch (e) {
      currentUser = {};
    }
    updateEditForm(currentUser);
  }
}

function hideEditProfileModal() {
  const modal = document.getElementById('editProfileModal');
  if (modal) modal.style.display = 'none';
}

// ---------------------------
// Profile update
// ---------------------------
async function handleProfileUpdate(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const updatedData = {
    firstName: formData.get('firstName') ? formData.get('firstName').trim() : '',
    lastName: formData.get('lastName') ? formData.get('lastName').trim() : '',
    studentId: formData.get('studentId') ? formData.get('studentId').trim() : '',
    courseYear: formData.get('courseYear') || '',
    email: formData.get('email') ? formData.get('email').trim() : '',
    phone: formData.get('phone') ? formData.get('phone').trim() : ''
  };

  const stored = localStorage.getItem('slsuUser') || '{}';
  let currentUser = {};
  try {
    currentUser = JSON.parse(stored);
  } catch (e) {
    currentUser = {};
  }

  const updatedUser = Object.assign({}, currentUser, updatedData);
  localStorage.setItem('slsuUser', JSON.stringify(updatedUser));

  if (window.FirebaseService && FirebaseService.isReady()) {
    const authUser = FirebaseService.getCurrentUser();
    if (authUser) {
      try {
        const profileToSave = {
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          studentId: updatedUser.studentId,
          courseYear: updatedUser.courseYear,
          email: updatedUser.email,
          phone: updatedUser.phone
        };
        await FirebaseService.saveDocument('users', profileToSave, authUser.uid);
      } catch (err) {
        console.error('Error updating Firestore profile:', err);
      }
    }
  }

  updateDashboard(updatedUser);
  hideEditProfileModal();
  showMessage('Profile updated successfully!', 'success');
}

// ---------------------------
// Avatar upload & storage
// ---------------------------
function initAvatarUpload() {
  const editAvatarBtn = document.getElementById('editAvatar');
  const avatarImg = document.getElementById('userAvatar');
  if (!editAvatarBtn || !avatarImg) return;

  let fileInput = document.getElementById('avatarFileInput');
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.id = 'avatarFileInput';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
  }

  editAvatarBtn.addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    const file = this.files && this.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('Please select a valid image file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const dataUrl = e.target.result;
      if (!dataUrl) return;

      avatarImg.src = dataUrl;
      avatarImg.classList.add('has-avatar');

      const userStr = localStorage.getItem('slsuUser') || '{}';
      let user = {};
      try {
        user = JSON.parse(userStr);
      } catch (err) {
        user = {};
      }

      const key = user && user.email ? `slsuAvatar_${user.email}` : 'slsuAvatar_default';
      try {
        localStorage.setItem(key, dataUrl);
      } catch (err) {
        console.error('Error saving avatar to localStorage:', err);
      }
    };
    reader.readAsDataURL(file);
  });
}

function loadUserAvatar(userData) {
  const avatarImg = document.getElementById('userAvatar');
  if (!avatarImg) return;

  const email = userData && userData.email ? userData.email : null;
  const key = email ? `slsuAvatar_${email}` : 'slsuAvatar_default';
  const savedAvatar = localStorage.getItem(key);

  if (savedAvatar) {
    avatarImg.src = savedAvatar;
    avatarImg.classList.add('has-avatar');
  } else {
    avatarImg.src = '/Website/images/default-avatar.jpg';
    avatarImg.classList.remove('has-avatar');
  }
}

// ---------------------------
// Upcoming appointments (from localStorage bookings)
// ---------------------------
function loadUpcomingAppointments() {
  const listEl = document.getElementById('appointmentsList');
  if (!listEl) return;

  const raw = localStorage.getItem('therapyBookings');
  let bookings = [];
  if (raw) {
    try {
      bookings = JSON.parse(raw) || [];
    } catch (e) {
      console.error('Error parsing therapyBookings:', e);
      bookings = [];
    }
  }

  const now = new Date();

  const upcoming = bookings
    .filter(b => {
      if (!b.date) return false;
      try {
        const d = new Date(b.date);
        if (b.time) {
          const [h, m] = b.time.split(':');
          d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
        }
        return d >= now && (b.status ? b.status === 'confirmed' : true);
      } catch (e) {
        return false;
      }
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  if (!upcoming.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-calendar-plus"></i>
        <p>No upcoming appointments</p>
        <a href="/Website/html/booking.html" class="primary-btn small">Book Your First Session</a>
      </div>
    `;
    return;
  }

  const SERVICE_LABELS = {
    academic: 'Academic Stress Counseling',
    career: 'Career & Future Planning',
    adjustment: 'College Adjustment Support',
    social: 'Social Skills & Relationships',
    crisis: 'Crisis Intervention'
  };

  const THERAPIST_LABELS = {
    maria: 'Dr. Maria Santos',
    james: 'Prof. James Reyes',
    andrea: 'Dr. Andrea Cruz',
    carlos: 'Dr. Carlos Lim'
  };

  listEl.innerHTML = '';

  upcoming.forEach(b => {
    const dateObj = new Date(b.date);
    const dateStr = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    let timeStr = '';
    if (b.time) {
      const [hh, mm] = b.time.split(':');
      const hour = parseInt(hh, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour;
      timeStr = `${displayHour}:${mm} ${period}`;
    }

    const serviceName = SERVICE_LABELS[b.service] || 'Counseling Session';
    const therapistName = THERAPIST_LABELS[b.therapist] || 'Campus Counselor';

    const item = document.createElement('div');
    item.className = 'appointment-item';
    item.innerHTML = `
      <div class="appointment-main">
        <h4>${serviceName}</h4>
        <p>With ${therapistName}</p>
      </div>
      <div class="appointment-meta">
        <span><i class="fas fa-calendar-day"></i> ${dateStr}</span>
        ${timeStr ? `<span><i class="fas fa-clock"></i> ${timeStr}</span>` : ''}
        <span class="status-label status-${(b.status || 'confirmed').toLowerCase()}">
          ${(b.status || 'Confirmed')}
        </span>
      </div>
    `;
    listEl.appendChild(item);
  });
}

// ---------------------------
// Saved resources (from localStorage)
// ---------------------------
function loadSavedResources() {
  const container = document.getElementById('savedResources');
  if (!container) return;

  const raw = localStorage.getItem('savedResources');
  let saved = [];
  if (raw) {
    try {
      saved = JSON.parse(raw) || [];
    } catch (e) {
      console.error('Error parsing savedResources:', e);
      saved = [];
    }
  }

  if (!saved.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-bookmark"></i>
        <p>No saved resources yet</p>
        <a href="/Website/html/resources.html" class="secondary-btn small">Explore Resources</a>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  saved.slice(-5).reverse().forEach(res => {
    const date = res.savedDate ? new Date(res.savedDate) : null;
    const dateStr = date
      ? date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      : '';

    const item = document.createElement('div');
    item.className = 'saved-resource-item';
    item.innerHTML = `
      <div class="saved-resource-main">
        <strong>${res.name || 'Resource'}</strong>
        ${dateStr ? `<p class="saved-date">Saved on ${dateStr}</p>` : ''}
      </div>
      <a href="/Website/html/resources.html" class="secondary-btn small">Open</a>
    `;
    container.appendChild(item);
  });
}

// ---------------------------
// Recent activity (bookings + resources)
// ---------------------------
function loadRecentActivity() {
  const container = document.getElementById('activityList');
  if (!container) return;

  const bookingsRaw = localStorage.getItem('therapyBookings');
  const resourcesRaw = localStorage.getItem('resourceActivity');

  let bookings = [];
  let resources = [];

  if (bookingsRaw) {
    try {
      bookings = JSON.parse(bookingsRaw) || [];
    } catch (e) {
      console.error('Error parsing therapyBookings:', e);
    }
  }

  if (resourcesRaw) {
    try {
      resources = JSON.parse(resourcesRaw) || [];
    } catch (e) {
      console.error('Error parsing resourceActivity:', e);
    }
  }

  const activities = [];

  bookings.forEach(b => {
    if (!b.bookedAt) return;
    const date = new Date(b.bookedAt);
    activities.push({
      type: 'booking',
      label: 'Booked a counseling session',
      detail: b.service || 'Counseling session',
      date
    });
  });

  resources.forEach(r => {
    if (!r.date) return;
    const date = new Date(r.date);
    activities.push({
      type: 'resource',
      label: 'Viewed a resource',
      detail: r.name || 'Resource',
      date
    });
  });

  if (!activities.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-history"></i>
        <p>No recent activity</p>
        <p class="small">Your activity will appear here after you book sessions or use resources.</p>
      </div>
    `;
    return;
  }

  activities.sort((a, b) => b.date - a.date);

  container.innerHTML = '';
  activities.slice(0, 6).forEach(act => {
    const dateStr = act.date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="activity-icon">
        <i class="fas ${act.type === 'booking' ? 'fa-calendar-check' : 'fa-book-open'}"></i>
      </div>
      <div class="activity-info">
        <p class="activity-label">${act.label}</p>
        <p class="activity-detail">${act.detail}</p>
        <span class="activity-date">${dateStr}</span>
      </div>
    `;
    container.appendChild(item);
  });
}

// ---------------------------
// Utility: toast-style message
// ---------------------------
function showMessage(message, type = 'info') {
  const existing = document.querySelectorAll('.user-message');
  existing.forEach(msg => msg.remove());

  const el = document.createElement('div');
  el.className = `user-message user-message-${type}`;
  el.innerHTML = `
    <span>${message}</span>
    <button class="message-close">&times;</button>
  `;

  const bg =
    type === 'success'
      ? '#d4edda'
      : type === 'error'
      ? '#f8d7da'
      : '#d1ecf1';
  const color =
    type === 'success'
      ? '#155724'
      : type === 'error'
      ? '#721c24'
      : '#0c5460';
  const border =
    type === 'success'
      ? '#28a745'
      : type === 'error'
      ? '#dc3545'
      : '#17a2b8';

  el.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bg};
    color: ${color};
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 15px;
    max-width: 400px;
    border-left: 4px solid ${border};
  `;

  const closeBtn = el.querySelector('.message-close');
  if (closeBtn) {
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeBtn.addEventListener('click', () => el.remove());
  }

  setTimeout(() => {
    if (el.parentElement) el.remove();
  }, 5000);

  document.body.appendChild(el);
}

// ---------------------------
// Utility: generate user ID for local fallback
// ---------------------------
function generateUserId() {
  return (
    'user_' +
    Math.random().toString(36).substr(2, 9) +
    '_' +
    Date.now().toString(36)
  );
}
