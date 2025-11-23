// about.js - Newsletter + team contact modal + Firebase

document.addEventListener('DOMContentLoaded', function () {
  initNewsletter();
  initTeamContactModal();
});

// ---------------------------
// Newsletter subscription
// ---------------------------
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  const messageEl = document.getElementById('newsletterMessage');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(form);
    const email = formData.get('email')?.trim() || '';

    if (!email) {
      showNewsletterMessage('Please enter your email address.', 'error');
      return;
    }

    // ✅ Gmail-only requirement
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      showNewsletterMessage('Please enter a valid Gmail address (example@gmail.com).', 'error');
      return;
    }

    const payload = {
      email,
      subscribedAt: new Date().toISOString(),
      source: 'about-page'
    };

    try {
      const existing = JSON.parse(localStorage.getItem('newsletterSubscriptions') || '[]');
      if (!existing.find(e => e.email === email)) {
        existing.push(payload);
        localStorage.setItem('newsletterSubscriptions', JSON.stringify(existing));
      }
    } catch (err) {
      console.error('Error saving newsletter subscription locally:', err);
    }

    if (window.FirebaseService && FirebaseService.isReady()) {
      try {
        await FirebaseService.saveDocument('newsletterSubscriptions', payload);
      } catch (err) {
        console.error('Error saving newsletter subscription to Firestore:', err);
      }
    }

    showNewsletterMessage('Thank you for subscribing! You’ll receive updates soon.', 'success');
    form.reset();
  });

  function showNewsletterMessage(text, type = 'info') {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
  }
}

// ---------------------------
// Team contact modal
// ---------------------------
function initTeamContactModal() {
  const modal = document.getElementById('contactModal');
  const form = document.getElementById('teamContactForm');
  const closeBtn = modal ? modal.querySelector('.close') : null;
  const memberButtons = document.querySelectorAll('.contact-member');

  if (!modal || !form) return;

  memberButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const memberId = this.getAttribute('data-member');
      const hiddenInput = document.getElementById('teamMember');
      if (hiddenInput) hiddenInput.value = memberId || '';
      modal.style.display = 'block';
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      modal.style.display = 'none';
    });
  }

  window.addEventListener('click', function (e) {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(form);
    const payload = {
      teamMember: formData.get('teamMember') || '',
      name: formData.get('name')?.trim() || '',
      email: formData.get('email')?.trim() || '',
      studentId: formData.get('studentId')?.trim() || '',
      message: formData.get('message')?.trim() || '',
      submittedAt: new Date().toISOString(),
      source: 'about-team-contact'
    };

    if (!payload.name || !payload.email || !payload.message) {
      alert('Please fill in your name, email, and message.');
      return;
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(payload.email)) {
      alert('Please enter a valid Gmail address (example@gmail.com).');
      return;
    }

    try {
      const existing = JSON.parse(localStorage.getItem('teamMessages') || '[]');
      existing.push(payload);
      localStorage.setItem('teamMessages', JSON.stringify(existing));
    } catch (err) {
      console.error('Error saving team message locally:', err);
    }

    if (window.FirebaseService && FirebaseService.isReady()) {
      try {
        await FirebaseService.saveDocument('teamMessages', payload);
      } catch (err) {
        console.error('Error saving team message to Firestore:', err);
      }
    }

    alert('Your message has been sent. Thank you for reaching out!');
    form.reset();
    modal.style.display = 'none';
  });
}
