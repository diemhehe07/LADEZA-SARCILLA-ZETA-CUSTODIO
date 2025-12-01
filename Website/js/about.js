// about.js - Newsletter + team contact modal + Therapist Dashboard
// Updated: Fixed authentication check to use Firebase instead of localStorage

document.addEventListener('DOMContentLoaded', function () {
  initNewsletter();
  initTeamContactModal();
  
  // Wait for Firebase to initialize before checking auth state
  if (window.FirebaseService && FirebaseService.isReady()) {
    // Listen for auth state changes to show/hide therapist dashboard
    FirebaseService.onAuthChange((user) => {
      initTherapistDashboard();
    });
    // Also check initial state
    initTherapistDashboard();
  } else {
    // If Firebase isn't ready, still try to initialize therapist dashboard
    initTherapistDashboard();
  }
});

// ---------------------------
// Therapist Dashboard
// ---------------------------
function initTherapistDashboard() {
  const therapistSection = document.getElementById('therapistDashboardSection');
  if (!therapistSection) return;

  // Check if user is logged in using Firebase
  const currentUser = FirebaseService.getCurrentUser();
  
  if (!currentUser) {
    therapistSection.style.display = 'none';
    return;
  }

  // Get user profile from Firebase to check role
  FirebaseService.getUserProfile(currentUser.uid)
    .then(profile => {
      if (profile && profile.role === 'therapist') {
        therapistSection.style.display = 'block';
        loadTherapistStats();
        if (window.FirebaseService && FirebaseService.isReady()) {
          loadTherapistStatsFromFirebase().catch(console.error);
        }
      } else {
        therapistSection.style.display = 'none';
      }
    })
    .catch(error => {
      console.error('Error getting user profile:', error);
      therapistSection.style.display = 'none';
    });
}

// ---------------------------
// Load Therapist Statistics
// ---------------------------
function loadTherapistStats() {
  // Load upcoming sessions count
  const upcomingSessionsEl = document.getElementById('upcomingSessions');
  const activeClientsEl = document.getElementById('activeClients');
  const pendingNotesEl = document.getElementById('pendingNotes');

  if (upcomingSessionsEl) {
    const bookings = JSON.parse(localStorage.getItem('therapyBookings') || '[]');
    const now = new Date();
    const upcoming = bookings.filter(b => {
      if (!b.date) return false;
      try {
        const d = new Date(b.date);
        if (b.time) {
          const [h, m] = b.time.split(':');
          d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
        }
        return d >= now && (b.status === 'confirmed' || !b.status);
      } catch (e) {
        return false;
      }
    }).length;
    upcomingSessionsEl.textContent = upcoming;
  }

  if (activeClientsEl) {
    // For demo purposes - in real app, this would come from your data
    const activeClients = JSON.parse(localStorage.getItem('activeClients') || '[]').length;
    activeClientsEl.textContent = activeClients || '12'; // Fallback demo number
  }

  if (pendingNotesEl) {
    // For demo purposes - in real app, this would come from your data
    const pendingNotes = JSON.parse(localStorage.getItem('pendingSessionNotes') || '[]').length;
    pendingNotesEl.textContent = pendingNotes || '3'; // Fallback demo number
  }

  // If using Firebase, load real data
  if (window.FirebaseService && FirebaseService.isReady()) {
    loadTherapistStatsFromFirebase().catch(console.error);
  }
}

// ---------------------------
// Load Therapist Stats from Firebase
// ---------------------------
async function loadTherapistStatsFromFirebase() {
  try {
    const db = firebase.firestore();
    const user = FirebaseService.getCurrentUser();

    if (!user) return;

    // Load upcoming sessions
    const today = new Date();
    const sessionsSnapshot = await db.collection('therapySessions')
      .where('therapistId', '==', user.uid)
      .where('date', '>=', today)
      .where('status', 'in', ['confirmed', 'scheduled'])
      .get();

    const upcomingSessionsEl = document.getElementById('upcomingSessions');
    if (upcomingSessionsEl) {
      upcomingSessionsEl.textContent = sessionsSnapshot.size;
    }

    // Load active clients (students with active sessions)
    const clientsSnapshot = await db.collection('therapySessions')
      .where('therapistId', '==', user.uid)
      .where('status', 'in', ['confirmed', 'scheduled', 'in-progress'])
      .get();

    const uniqueClients = new Set();
    clientsSnapshot.forEach(doc => {
      const session = doc.data();
      if (session.studentId) {
        uniqueClients.add(session.studentId);
      }
    });

    const activeClientsEl = document.getElementById('activeClients');
    if (activeClientsEl) {
      activeClientsEl.textContent = uniqueClients.size;
    }

    // Load pending session notes
    const notesSnapshot = await db.collection('sessionNotes')
      .where('therapistId', '==', user.uid)
      .where('status', '==', 'pending')
      .get();

    const pendingNotesEl = document.getElementById('pendingNotes');
    if (pendingNotesEl) {
      pendingNotesEl.textContent = notesSnapshot.size;
    }

  } catch (error) {
    console.error('Error loading therapist stats from Firebase:', error);
  }
}

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

    showNewsletterMessage('Thank you for subscribing! You\'ll receive updates soon.', 'success');
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