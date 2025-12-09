// profile.js - JavaScript for profile dashboard functionality
// Updated to integrate with central Auth system + Firestore logging

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

document.addEventListener('DOMContentLoaded', function() {
  // FIRST: Check login status immediately
  const isLoggedIn = checkLoginStatus();
  
  // Only initialize auth forms if user is NOT logged in
  if (!isLoggedIn) {
    initializeAuthTabs();
    initializePasswordToggles();
    initializeForms();
  }
  
  // Always initialize dashboard functionality (for logout, etc.)
  initializeDashboard();
});

// Check if user is logged in - returns boolean
function checkLoginStatus() {
  let userData = null;
  
  // Try to get user data from Auth system first
  if (window.Auth && window.Auth.isLoggedIn()) {
    userData = window.Auth.getUserData();
  } else {
    // Fallback to localStorage directly
    const storedUser = localStorage.getItem('slsuUser');
    if (storedUser) {
      try {
        userData = JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }
  
  if (userData) {
    // User is logged in - show dashboard immediately
    showDashboard(userData);
    return true;
  } else {
    // User is not logged in - show auth section
    showAuthSection();
    return false;
  }
}

// Initialize authentication tabs
function initializeAuthTabs() {
  const authTabs = document.querySelectorAll('.auth-tab');
  const authForms = document.querySelectorAll('.auth-form');
  
  // Default to login tab
  const defaultTab = 'login';
  
  authTabs.forEach(tab => {
    tab.addEventListener('click', function() {
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
    
    // Activate default tab
    if (tab.getAttribute('data-tab') === defaultTab) {
      tab.classList.add('active');
    }
  });
  
  // Show default form
  authForms.forEach(form => {
    form.classList.remove('active');
    if (form.id === `${defaultTab}Form`) {
      form.classList.add('active');
    }
  });
}

// Initialize password visibility toggles
function initializePasswordToggles() {
  const passwordToggles = document.querySelectorAll('.password-toggle');
  
  passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      const passwordInput = this.parentElement.querySelector('input[type="password"]');
      const icon = this.querySelector('i');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });
}

// Initialize form submissions
function initializeForms() {
  // Login form
  const loginForm = document.getElementById('loginFormData');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Registration form
  const registerForm = document.getElementById('registerFormData');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegistration);
  }
  
  // Edit profile form
  const editProfileForm = document.getElementById('editProfileForm');
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', handleProfileUpdate);
  }
}

// Handle user registration
function handleRegistration(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const userData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    studentId: formData.get('studentId'),
    email: formData.get('email'),
    courseYear: formData.get('courseYear'),
    password: formData.get('password'),
    createdAt: new Date().toISOString()
  };
  
  // Validate form data
  if (!validateRegistration(userData)) {
    return;
  }
  
  // Check if user already exists
  if (checkUserExists(userData.email)) {
    showMessage('A user with this email already exists.', 'error');
    return;
  }
  
  // Register user (local + Firestore)
  registerUser(userData);
}

// Validate registration data
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
  
  // Validate SLSU email format
  if (!userData.email.endsWith('@slsu.edu.ph')) {
    showMessage('Please use your SLSU email address (@slsu.edu.ph).', 'error');
    return false;
  }
  
  // Validate student ID format (basic validation)
  if (!/^\d{2}-\d{6}$/.test(userData.studentId)) {
    showMessage('Please enter a valid Student ID (format: YY-XXXXXX).', 'error');
    return false;
  }
  
  // Validate password strength
  if (userData.password.length < 8) {
    showMessage('Password must be at least 8 characters long.', 'error');
    return false;
  }
  
  // Check password confirmation
  const confirmPassword = document.getElementById('confirmPassword').value;
  if (userData.password !== confirmPassword) {
    showMessage('Passwords do not match.', 'error');
    return false;
  }
  
  return true;
}

// Check if user already exists
function checkUserExists(email) {
  const users = JSON.parse(localStorage.getItem('slsuUsers') || '[]');
  return users.some(user => user.email === email);
}

// Register new user
function registerUser(userData) {
  try {
    // Get existing users or initialize empty array
    const users = JSON.parse(localStorage.getItem('slsuUsers') || '[]');
    
    // Add new user to local store
    const newUser = {
      ...userData,
      id: generateUserId(),
      password: btoa(userData.password) // Simple encoding (not secure for production)
    };
    
    users.push(newUser);
    localStorage.setItem('slsuUsers', JSON.stringify(users));
    
    // Also save to Firestore (best-effort)
    saveToFirestore('users', {
      firstName: userData.firstName,
      lastName: userData.lastName,
      studentId: userData.studentId,
      email: userData.email,
      courseYear: userData.courseYear,
      createdAtLocal: userData.createdAt
    });
    
    // Prepare login data
    const loginData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      studentId: userData.studentId,
      email: userData.email,
      courseYear: userData.courseYear,
      memberSince: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    };
    
    // Use central Auth system to login
    if (window.Auth) {
      const redirectUrl = window.Auth.login(loginData);
      
      // Show success message
      showMessage('Registration successful! Welcome to SLSU-U Matter.', 'success');
      
      // Check if we should stay on profile page or redirect
      setTimeout(() => {
        if (redirectUrl) {
          // Redirect to another page
          window.location.href = redirectUrl;
        } else {
          // Stay on profile page and show dashboard
          showDashboard(loginData);
        }
      }, 1500);
    } else {
      // Fallback to old system
      localStorage.setItem('slsuUser', JSON.stringify(loginData));
      showMessage('Registration successful! Welcome to SLSU-U Matter.', 'success');
      setTimeout(() => {
        showDashboard(loginData);
      }, 1500);
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    showMessage('Registration failed. Please try again.', 'error');
  }
}

// Handle user login
function handleLogin(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const loginData = {
    email: formData.get('email'),
    password: formData.get('password')
  };
  
  // Validate login data
  if (!loginData.email || !loginData.password) {
    showMessage('Please enter both email and password.', 'error');
    return;
  }
  
  // Authenticate user
  authenticateUser(loginData);
}

// Authenticate user
function authenticateUser(loginData) {
  try {
    const users = JSON.parse(localStorage.getItem('slsuUsers') || '[]');
    const user = users.find(u => u.email === loginData.email && atob(u.password) === loginData.password);
    
    if (user) {
      // Successful login
      const userData = {
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
        email: user.email,
        courseYear: user.courseYear,
        memberSince: user.createdAt
          ? new Date(user.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })
          : 'Recently'
      };

      // Log successful login to Firestore (best-effort)
      saveToFirestore('loginEvents', {
        email: loginData.email,
        success: true,
        loggedInAt: new Date().toISOString()
      });
      
      // Use central Auth system
      if (window.Auth) {
        const redirectUrl = window.Auth.login(userData);
        showMessage('Login successful!', 'success');
        
        setTimeout(() => {
          if (redirectUrl) {
            // Redirect to another page
            window.location.href = redirectUrl;
          } else {
            // Stay on profile page and show dashboard
            showDashboard(userData);
          }
        }, 1000);
      } else {
        // Fallback
        localStorage.setItem('slsuUser', JSON.stringify(userData));
        showMessage('Login successful!', 'success');
        setTimeout(() => {
          showDashboard(userData);
        }, 1000);
      }
      
    } else {
      // Failed login attempt
      saveToFirestore('loginEvents', {
        email: loginData.email,
        success: false,
        loggedInAt: new Date().toISOString()
      });

      showMessage('Invalid email or password.', 'error');
    }
    
  } catch (error) {
    console.error('Login error:', error);
    showMessage('Login failed. Please try again.', 'error');
  }
}

// Show dashboard - MAKE SURE THIS HIDES THE AUTH SECTION
function showDashboard(userData) {
  const authSection = document.getElementById('authSection');
  const dashboardSection = document.getElementById('dashboardSection');
  
  if (authSection) {
    authSection.style.display = 'none';
    authSection.classList.remove('active');
  }
  
  if (dashboardSection) {
    dashboardSection.style.display = 'block';
    dashboardSection.classList.add('active');
    updateDashboard(userData);
  }
  
  // Update profile icon in nav
  const profileIcon = document.getElementById('profileNavIcon');
  if (profileIcon) {
    profileIcon.classList.add('active');
  }
  
  // Also update page title if on profile page
  if (window.location.pathname.includes('profile.html')) {
    document.title = `My Profile | ${userData.firstName} ${userData.lastName} | SLS-U Matter`;
  }
}

// Show authentication section - MAKE SURE THIS HIDES THE DASHBOARD
function showAuthSection() {
  const authSection = document.getElementById('authSection');
  const dashboardSection = document.getElementById('dashboardSection');
  
  if (authSection) {
    authSection.style.display = 'flex';
    authSection.classList.add('active');
  }
  
  if (dashboardSection) {
    dashboardSection.style.display = 'none';
    dashboardSection.classList.remove('active');
  }
  
  // Reset profile icon in nav
  const profileIcon = document.getElementById('profileNavIcon');
  if (profileIcon) {
    profileIcon.classList.remove('active');
  }
}

// Update dashboard with user data
function updateDashboard(userData) {
  // Update user greeting
  const userGreeting = document.getElementById('userGreeting');
  if (userGreeting) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    userGreeting.textContent = `${greeting}, ${userData.firstName}!`;
  }
  
  // Update user info
  const userStudentId = document.getElementById('userStudentId');
  const userCourse = document.getElementById('userCourse');
  const memberSince = document.getElementById('memberSince');
  
  if (userStudentId) userStudentId.textContent = userData.studentId;
  if (userCourse) userCourse.textContent = formatCourseYear(userData.courseYear);
  if (memberSince) memberSince.textContent = userData.memberSince;
  
  // Update edit form fields
  updateEditForm(userData);
  
  // Update avatar with initials if needed
  updateUserAvatar(userData);
}

// Format course year for display
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
    'other': 'Other Course'
  };
  
  return courseMap[courseYear] || courseYear;
}

// Update edit form with current user data
function updateEditForm(userData) {
  const editFirstName = document.getElementById('editFirstName');
  const editLastName = document.getElementById('editLastName');
  const editStudentId = document.getElementById('editStudentId');
  const editCourseYear = document.getElementById('editCourseYear');
  const editEmail = document.getElementById('editEmail');
  
  if (editFirstName) editFirstName.value = userData.firstName || '';
  if (editLastName) editLastName.value = userData.lastName || '';
  if (editStudentId) editStudentId.value = userData.studentId || '';
  if (editCourseYear) editCourseYear.value = userData.courseYear || '';
  if (editEmail) editEmail.value = userData.email || '';
}

// Update user avatar with initials
function updateUserAvatar(userData) {
  const avatarImg = document.getElementById('userAvatar');
  if (!avatarImg) return;
  
  // If no avatar image exists or default image is shown, create initials
  if (avatarImg.src.includes('default-avatar.jpg') || !avatarImg.src) {
    const initials = (userData.firstName?.charAt(0) || '') + (userData.lastName?.charAt(0) || '');
    if (initials) {
      // Create a colored background with initials
      const avatarContainer = avatarImg.parentElement;
      if (avatarContainer) {
        // Create initials div
        const initialsDiv = document.createElement('div');
        initialsDiv.className = 'avatar-initials';
        initialsDiv.textContent = initials;
        initialsDiv.style.cssText = `
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
        `;
        
        // Replace or hide the image
        avatarImg.style.display = 'none';
        avatarContainer.insertBefore(initialsDiv, avatarImg);
      }
    }
  }
}

// Initialize dashboard functionality
function initializeDashboard() {
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Edit profile button
  const editProfileBtn = document.getElementById('editProfile');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', showEditProfileModal);
  }
  
  // Cancel edit button
  const cancelEditBtn = document.getElementById('cancelEdit');
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', hideEditProfileModal);
  }
  
  // Modal close buttons
  const modalCloseBtns = document.querySelectorAll('.modal .close');
  modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      this.closest('.modal').style.display = 'none';
    });
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}

// Handle logout
function handleLogout() {
  // Log logout event (best-effort)
  const currentUser = window.Auth && window.Auth.isLoggedIn()
    ? window.Auth.getUserData()
    : JSON.parse(localStorage.getItem('slsuUser') || 'null');

  if (currentUser) {
    saveToFirestore('logoutEvents', {
      email: currentUser.email,
      loggedOutAt: new Date().toISOString()
    });
  }

  if (window.Auth) {
    window.Auth.logout();
  } else {
    // Fallback to old system
    localStorage.removeItem('slsuUser');
    showMessage('You have been logged out successfully.', 'success');
    setTimeout(() => {
      showAuthSection();
      // Reset login form
      const loginForm = document.getElementById('loginFormData');
      if (loginForm) loginForm.reset();
      // Reset registration form
      const registerForm = document.getElementById('registerFormData');
      if (registerForm) registerForm.reset();
    }, 1000);
  }
}

// Show edit profile modal
function showEditProfileModal() {
  const modal = document.getElementById('editProfileModal');
  if (modal) {
    modal.style.display = 'block';
    
    // Populate form with current user data
    const userData = window.Auth
      ? window.Auth.getUserData()
      : JSON.parse(localStorage.getItem('slsuUser') || '{}');
    updateEditForm(userData);
  }
}

// Hide edit profile modal
function hideEditProfileModal() {
  const modal = document.getElementById('editProfileModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Handle profile update
function handleProfileUpdate(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const updatedData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    studentId: formData.get('studentId'),
    courseYear: formData.get('courseYear'),
    email: formData.get('email')
  };
  
  // Update user data using Auth system
  if (window.Auth) {
    if (window.Auth.updateUserData(updatedData)) {
      // Update users list if email changed
      const currentUser = window.Auth.getUserData();
      if (currentUser.email !== updatedData.email) {
        updateUsersEmail(currentUser.email, updatedData.email);
      }
      
      const newUserData = window.Auth.getUserData();
      // Update dashboard with new data
      updateDashboard(newUserData);

      // Save updated profile to Firestore
      saveToFirestore('users', {
        ...newUserData,
        updatedAtLocal: new Date().toISOString()
      });
      
      // Hide modal and show success message
      hideEditProfileModal();
      showMessage('Profile updated successfully!', 'success');
    } else {
      showMessage('Failed to update profile.', 'error');
    }
  } else {
    // Fallback to old system
    const currentUser = JSON.parse(localStorage.getItem('slsuUser') || '{}');
    const updatedUser = { ...currentUser, ...updatedData };
    
    localStorage.setItem('slsuUser', JSON.stringify(updatedUser));
    
    // Update users list if email changed
    if (currentUser.email !== updatedData.email) {
      updateUsersEmail(currentUser.email, updatedData.email);
    }
    
    // Update dashboard
    updateDashboard(updatedUser);

    // Save updated profile to Firestore
    saveToFirestore('users', {
      ...updatedUser,
      updatedAtLocal: new Date().toISOString()
    });
    
    // Hide modal and show success message
    hideEditProfileModal();
    showMessage('Profile updated successfully!', 'success');
  }
}

// Update user email in users list
function updateUsersEmail(oldEmail, newEmail) {
  try {
    const users = JSON.parse(localStorage.getItem('slsuUsers') || '[]');
    const userIndex = users.findIndex(u => u.email === oldEmail);
    
    if (userIndex !== -1) {
      users[userIndex].email = newEmail;
      localStorage.setItem('slsuUsers', JSON.stringify(users));
    }
  } catch (error) {
    console.error('Error updating user email:', error);
  }
}

// Show message to user
function showMessage(message, type = 'info') {
  // Remove existing messages
  const existingMessages = document.querySelectorAll('.user-message');
  existingMessages.forEach(msg => msg.remove());
  
  // Create new message element
  const messageEl = document.createElement('div');
  messageEl.className = `user-message user-message-${type}`;
  messageEl.innerHTML = `
    <span>${message}</span>
    <button class="message-close">&times;</button>
  `;
  
  // Add styles
  messageEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
    color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 15px;
    max-width: 400px;
    border-left: 4px solid ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
  `;
  
  // Add close button styles
  const closeBtn = messageEl.querySelector('.message-close');
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
  
  // Add close functionality
  closeBtn.addEventListener('click', () => {
    messageEl.remove();
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (messageEl.parentElement) {
      messageEl.remove();
    }
  }, 5000);
  
  // Add to page
  document.body.appendChild(messageEl);
}

// Generate unique user ID
function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

// Demo data initialization (for testing)
function initializeDemoData() {
  // Only initialize if no users exist
  if (!localStorage.getItem('slsuUsers')) {
    const demoUsers = [
      {
        id: 'demo_user_1',
        firstName: 'John',
        lastName: 'Doe',
        studentId: '23-001234',
        email: 'john.doe@slsu.edu.ph',
        courseYear: 'bs-psych-2',
        password: btoa('password123'),
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('slsuUsers', JSON.stringify(demoUsers));
    console.log('Demo data initialized. You can login with: john.doe@slsu.edu.ph / password123');
  }
}
