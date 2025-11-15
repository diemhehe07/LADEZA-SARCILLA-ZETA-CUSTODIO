// Website/js/login.js

document.addEventListener('DOMContentLoaded', function() {
  // Tab switching functionality
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
    });
  });
  
  // Auth switch links (at bottom of forms)
  const authSwitches = document.querySelectorAll('.auth-switch');
  authSwitches.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute('data-switch');
      
      // Find and click the corresponding tab
      const targetTabElement = document.querySelector(`.auth-tab[data-tab="${targetTab}"]`);
      if (targetTabElement) {
        targetTabElement.click();
      }
    });
  });
  
  // Password toggle functionality
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
  
  // Password strength indicator
  const registerPassword = document.getElementById('registerPassword');
  const strengthFill = document.getElementById('strengthFill');
  const strengthText = document.getElementById('strengthText');
  
  if (registerPassword) {
    registerPassword.addEventListener('input', checkPasswordStrength);
  }
  
  function checkPasswordStrength() {
    const password = registerPassword.value;
    let strength = 0;
    let feedback = '';
    
    // Check password length
    if (password.length >= 8) strength += 1;
    
    // Check for lowercase letters
    if (/[a-z]/.test(password)) strength += 1;
    
    // Check for uppercase letters
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Check for numbers
    if (/[0-9]/.test(password)) strength += 1;
    
    // Check for special characters
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Update strength indicator
    switch(strength) {
      case 0:
      case 1:
        strengthFill.style.width = '20%';
        strengthFill.style.backgroundColor = '#e74c3c';
        strengthText.textContent = 'Weak';
        break;
      case 2:
        strengthFill.style.width = '40%';
        strengthFill.style.backgroundColor = '#e67e22';
        strengthText.textContent = 'Fair';
        break;
      case 3:
        strengthFill.style.width = '60%';
        strengthFill.style.backgroundColor = '#f1c40f';
        strengthText.textContent = 'Good';
        break;
      case 4:
        strengthFill.style.width = '80%';
        strengthFill.style.backgroundColor = '#2ecc71';
        strengthText.textContent = 'Strong';
        break;
      case 5:
        strengthFill.style.width = '100%';
        strengthFill.style.backgroundColor = '#27ae60';
        strengthText.textContent = 'Very Strong';
        break;
    }
  }
  
  // Password confirmation validation
  const registerConfirmPassword = document.getElementById('registerConfirmPassword');
  const passwordMatch = document.getElementById('passwordMatch');
  
  if (registerConfirmPassword) {
    registerConfirmPassword.addEventListener('input', checkPasswordMatch);
  }
  
  function checkPasswordMatch() {
    const password = registerPassword.value;
    const confirmPassword = registerConfirmPassword.value;
    
    if (confirmPassword === '') {
      passwordMatch.textContent = '';
      passwordMatch.className = 'password-match';
      return;
    }
    
    if (password === confirmPassword) {
      passwordMatch.textContent = 'Passwords match';
      passwordMatch.className = 'password-match valid';
    } else {
      passwordMatch.textContent = 'Passwords do not match';
      passwordMatch.className = 'password-match invalid';
    }
  }
  
  // Form validation and submission
  const loginForm = document.getElementById('loginFormElement');
  const registerForm = document.getElementById('registerFormElement');
  
  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Register form submission
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  
  // Handle login form submission
  function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');
    const rememberMe = formData.get('rememberMe');
    
    // Basic validation
    if (!email || !password) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    // Show loading state
    const submitBtn = loginForm.querySelector('.auth-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
      // In a real application, this would be an API call to your backend
      const users = JSON.parse(localStorage.getItem('slsUsers') || '[]');
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        // Store user session
        const sessionData = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isLoggedIn: true
        };
        
        if (rememberMe) {
          localStorage.setItem('slsUserSession', JSON.stringify(sessionData));
        } else {
          sessionStorage.setItem('slsUserSession', JSON.stringify(sessionData));
        }
        
        showNotification('Login successful! Redirecting...', 'success');
        
        // Redirect to dashboard or home page
        setTimeout(() => {
          window.location.href = '/Website/html/home.html';
        }, 1500);
      } else {
        showNotification('Invalid email or password', 'error');
        
        // Reset button state
        btnText.style.display = 'block';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
      }
    }, 1500);
  }
  
  // Handle registration form submission
  function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(registerForm);
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const userType = formData.get('userType');
    const termsAgreement = formData.get('termsAgreement');
    const newsletterSubscription = formData.get('newsletterSubscription');
    
    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }
    
    if (!termsAgreement) {
      showNotification('Please agree to the Terms of Service and Privacy Policy', 'error');
      return;
    }
    
    // Show loading state
    const submitBtn = registerForm.querySelector('.auth-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
      // Check if user already exists
      const users = JSON.parse(localStorage.getItem('slsUsers') || '[]');
      const existingUser = users.find(u => u.email === email);
      
      if (existingUser) {
        showNotification('An account with this email already exists', 'error');
        
        // Reset button state
        btnText.style.display = 'block';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
        return;
      }
      
      // Create new user
      const newUser = {
        id: generateId(),
        firstName,
        lastName,
        email,
        phone,
        password, // In a real app, this should be hashed
        userType,
        newsletterSubscription: newsletterSubscription === 'on',
        createdAt: new Date().toISOString()
      };
      
      // Save to localStorage (simulating database)
      users.push(newUser);
      localStorage.setItem('slsUsers', JSON.stringify(users));
      
      showNotification('Account created successfully! Please sign in.', 'success');
      
      // Reset form and switch to login
      registerForm.reset();
      strengthFill.style.width = '0%';
      strengthText.textContent = 'Password strength';
      passwordMatch.textContent = '';
      passwordMatch.className = 'password-match';
      
      // Reset button state
      btnText.style.display = 'block';
      btnLoading.style.display = 'none';
      submitBtn.disabled = false;
      
      // Switch to login tab
      document.querySelector('.auth-tab[data-tab="login"]').click();
    }, 2000);
  }
  
  // Generate unique ID for users
  function generateId() {
    return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
  
  // Notification system
  function showNotification(message, type) {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Auto-remove after 5 seconds
    const autoRemove = setTimeout(() => {
      hideNotification(notification);
    }, 5000);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      clearTimeout(autoRemove);
      hideNotification(notification);
    });
  }
  
  function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }
  
  // Social login buttons
  const socialButtons = document.querySelectorAll('.social-btn');
  socialButtons.forEach(button => {
    button.addEventListener('click', () => {
      showNotification('Social login functionality would be implemented here', 'info');
    });
  });
});