// /Website/js/login.js
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  const currentUser = FirebaseService.getCurrentUser();
  if (currentUser) {
    redirectBasedOnRole(currentUser.uid);
    return;
  }

  // Initialize the authentication system
  initializeAuth();
});

function initializeAuth() {
  // Tab switching
  setupTabSwitching();
  
  // User type selection
  setupUserTypeSelection();
  
  // Password toggle
  setupPasswordToggle();
  
  // Form submissions
  setupFormSubmissions();
}

function setupTabSwitching() {
  const authTabs = document.querySelectorAll('.auth-tab');
  const authForms = document.querySelectorAll('.auth-form');
  
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      
      // Update active tab
      authTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding form
      authForms.forEach(form => {
        form.classList.remove('active');
        if (form.id === `${targetTab}Form`) {
          form.classList.add('active');
        }
      });
      
      // Clear messages when switching tabs
      clearMessages();
    });
  });
}

function setupUserTypeSelection() {
  const userTypeOptions = document.querySelectorAll('.user-type-option');
  
  userTypeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const userType = option.getAttribute('data-type');
      
      // Update active option
      userTypeOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      
      // Update hidden input
      document.getElementById('registerUserType').value = userType;
      
      // Show/hide role-specific fields
      toggleRoleFields(userType);
    });
  });
}

function toggleRoleFields(userType) {
  const studentFields = document.getElementById('studentFields');
  const therapistFields = document.getElementById('therapistFields');
  
  // Hide all fields first
  studentFields.classList.remove('active');
  therapistFields.classList.remove('active');
  
  // Show relevant fields
  if (userType === 'student') {
    studentFields.classList.add('active');
  } else {
    therapistFields.classList.add('active');
  }
}

function setupPasswordToggle() {
  const passwordToggles = document.querySelectorAll('.password-toggle');
  
  passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const input = toggle.parentElement.querySelector('input');
      const icon = toggle.querySelector('i');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });
}

function setupFormSubmissions() {
  // Registration form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegistration);
  }

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Social login
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', handleGoogleLogin);
  }

  const facebookLoginBtn = document.getElementById('facebookLoginBtn');
  if (facebookLoginBtn) {
    facebookLoginBtn.addEventListener('click', handleFacebookLogin);
  }
}

async function handleRegistration(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const submitBtn = e.target.querySelector('.primary-btn');
  
  // Validate terms agreement
  if (!formData.get('terms')) {
    showMessage('Please agree to the Terms of Service and Privacy Policy', 'error');
    return;
  }
  
  const userData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: document.getElementById('registerUserType').value,
    newsletter: formData.get('newsletter') === 'on'
  };
  
  // Add role-specific fields
  if (userData.role === 'student') {
    userData.studentId = formData.get('studentId');
    userData.courseYear = formData.get('courseYear');
  } else {
    userData.therapistId = formData.get('therapistId');
    userData.specialization = formData.get('specialization');
    userData.licenseNumber = formData.get('licenseNumber');
  }
  
  try {
    // Show loading state
    setButtonLoading(submitBtn, true);
    
    const user = await FirebaseService.registerWithEmail(
      userData.email, 
      userData.password, 
      userData
    );
    
    if (user) {
      showMessage('Registration successful! Welcome to SLS U Matter.', 'success');
      // The auth state change will handle redirection
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const submitBtn = e.target.querySelector('.primary-btn');
  const email = formData.get('email');
  const password = formData.get('password');
  
  try {
    // Show loading state
    setButtonLoading(submitBtn, true);
    
    const user = await FirebaseService.loginWithEmail(email, password);
    
    if (user) {
      showMessage('Login successful! Redirecting...', 'success');
    }
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

async function handleGoogleLogin() {
  try {
    await FirebaseService.loginWithProvider('google');
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
  }
}

async function handleFacebookLogin() {
  try {
    await FirebaseService.loginWithProvider('facebook');
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
  }
}

function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.classList.add('loading');
  } else {
    button.disabled = false;
    button.classList.remove('loading');
  }
}

function showMessage(message, type) {
  // Remove existing messages
  clearMessages();
  
  // Create message element
  const messageEl = document.createElement('div');
  messageEl.className = `auth-message ${type}`;
  messageEl.textContent = message;
  
  // Insert at the top of the active form
  const activeForm = document.querySelector('.auth-form.active');
  const formContainer = activeForm.querySelector('.form-scroll-container');
  formContainer.insertBefore(messageEl, formContainer.firstChild);
  
  // Auto-remove success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }
}

function clearMessages() {
  const messages = document.querySelectorAll('.auth-message');
  messages.forEach(msg => msg.remove());
}

function getErrorMessage(error) {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/popup-closed-by-user':
      return 'Login was cancelled. Please try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email but different sign-in method.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}

async function redirectBasedOnRole(uid) {
  try {
    const profile = await FirebaseService.getUserProfile(uid);
    if (profile?.role === 'therapist') {
      window.location.href = '../html/therapist-dashboard.html';
    } else {
      window.location.href = '../html/index.html';
    }
  } catch (error) {
    console.error('Error redirecting:', error);
  }
}

// Listen for auth state changes
FirebaseService.onAuthChange((user) => {
  if (user) {
    redirectBasedOnRole(user.uid);
  }
});