// contact.js (updated) - require login for contact page features
document.addEventListener('DOMContentLoaded', function () {
  initUserTypeSelection();
  initContactForm();
  initChat();
  ensureAuthForContactPage();
});

// Ensure contact page is accessible only to logged-in users
function ensureAuthForContactPage() {
  const contactForm = document.getElementById('contactForm');
  const startChatBtn = document.getElementById('startChat');
  const startChatModal = document.getElementById('chatModal');

  function disableContactUI() {
    if (contactForm) {
      Array.from(contactForm.elements).forEach(el => el.disabled = true);
    }
    if (startChatBtn) startChatBtn.disabled = true;
  }

  function enableContactUI() {
    if (contactForm) {
      Array.from(contactForm.elements).forEach(el => el.disabled = false);
    }
    if (startChatBtn) startChatBtn.disabled = false;
  }

  // Initially disable until we confirm auth state
  disableContactUI();

  // If overlay-auth.js is loaded, open overlay to prompt login
  function promptLogin() {
    if (typeof window.openAuthOverlay === 'function') {
      window.openAuthOverlay();
    } else {
      // Fallback: simple alert + redirect to home where overlay will auto-open
      alert('Please sign in to access the Contact page.');
      window.location.href = '/Website/html/index.html';
    }
  }

  // Listen for global login event fired by overlay-auth.js
  window.addEventListener('slsu:user-logged-in', (ev) => {
    enableContactUI();
  });

  // Also check auth state via firebase directly (in case user already logged in)
  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        enableContactUI();
      } else {
        // Not logged in: prompt login overlay (do not immediately redirect away, just prompt)
        promptLogin();
      }
    });
  } else {
    // If firebase is not available for some reason, keep UI disabled and show message
    console.warn('Firebase not available — contact page requires authentication.');
    const msgBox = document.getElementById('contactMessageResult');
    if (msgBox) {
      msgBox.textContent = 'Authentication required to use this page. Please sign in.';
      msgBox.className = 'message error';
      msgBox.style.display = 'block';
    }
  }
}
