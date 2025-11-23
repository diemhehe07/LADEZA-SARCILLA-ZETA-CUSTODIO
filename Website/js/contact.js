// contact.js - Contact page functionality (form + live chat + map + Firebase)

document.addEventListener('DOMContentLoaded', function () {
  initContactForm();
  initChat();
});

// ---------------------------
// Contact form
// ---------------------------
function initContactForm() {
  const form = document.getElementById('contactForm');
  const resultBox = document.getElementById('contactMessageResult');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(form);
    const payload = {
      name: formData.get('name')?.trim() || '',
      studentId: formData.get('studentId')?.trim() || '',
      email: formData.get('email')?.trim() || '',
      phone: formData.get('phone')?.trim() || '',
      courseYear: formData.get('courseYear')?.trim() || '',
      subject: formData.get('subject') || '',
      message: formData.get('message')?.trim() || '',
      urgency: formData.get('urgency') || 'medium',
      studentConsent: !!formData.get('studentConsent'),
      consent: !!formData.get('consent'),
      submittedAt: new Date().toISOString(),
      source: 'contact-page'
    };

    // Basic validation
    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      showContactMessage('Please fill in all required fields (*).', 'error');
      return;
    }

    // ✅ Gmail-only email
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(payload.email)) {
      showContactMessage('Please use a valid Gmail address (example@gmail.com).', 'error');
      return;
    }

    if (!payload.studentConsent || !payload.consent) {
      showContactMessage('Please confirm you are a student and consent to being contacted.', 'error');
      return;
    }

    // Save to localStorage for any future features
    try {
      const existing = JSON.parse(localStorage.getItem('contactMessages') || '[]');
      existing.push(payload);
      localStorage.setItem('contactMessages', JSON.stringify(existing));
    } catch (err) {
      console.error('Error saving contact message to localStorage:', err);
    }

    // Save to Firestore
    if (window.FirebaseService && FirebaseService.isReady()) {
      try {
        const user = FirebaseService.getCurrentUser();
        const dataToSave = {
          ...payload,
          userId: user ? user.uid : null,
          userEmail: user ? user.email : payload.email
        };
        await FirebaseService.saveDocument('contactMessages', dataToSave);
      } catch (err) {
        console.error('Error saving contact message to Firestore:', err);
      }
    }

    showContactMessage('Thank you for reaching out. Our team will contact you soon.', 'success');
    form.reset();
  });

  function showContactMessage(text, type = 'info') {
    if (!resultBox) return;
    resultBox.textContent = text;
    resultBox.className = `message ${type}`;
    resultBox.style.display = 'block';
  }
}

// ---------------------------
// Campus map
// ---------------------------
function openCampusMap() {
  // Opens SLSU Lucena in Google Maps (you can replace with exact coordinates)
  const url = 'https://www.google.com/maps/search/?api=1&query=Southern+Luzon+State+University+Lucena';
  window.open(url, '_blank');
}

// ---------------------------
// Live Chat
// ---------------------------
function initChat() {
  const chatModal = document.getElementById('chatModal');
  const startChatBtn = document.getElementById('startChat');
  const closeBtn = chatModal ? chatModal.querySelector('.close') : null;
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendMessage');

  if (!chatModal || !startChatBtn || !chatMessages || !chatInput || !sendBtn) return;

  let currentSessionId = null;
  let isStartingSession = false;

  startChatBtn.addEventListener('click', async function () {
    chatModal.style.display = 'block';
    chatInput.focus();

    if (!currentSessionId && !isStartingSession) {
      isStartingSession = true;
      currentSessionId = await createChatSession();
      isStartingSession = false;
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      chatModal.style.display = 'none';
    });
  }

  window.addEventListener('click', function (e) {
    if (e.target === chatModal) {
      chatModal.style.display = 'none';
    }
  });

  sendBtn.addEventListener('click', handleSendMessage);
  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  async function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Show user bubble
    appendMessageBubble('user', text);
    chatInput.value = '';

    // Ensure we have a session
    if (!currentSessionId && !isStartingSession) {
      isStartingSession = true;
      currentSessionId = await createChatSession();
      isStartingSession = false;
    }

    // Save to Firestore
    await saveChatMessage(currentSessionId, 'user', text);

    // Fake "realistic" bot reply
    const reply = buildBotReply(text);
    setTimeout(async () => {
      appendMessageBubble('bot', reply);
      await saveChatMessage(currentSessionId, 'bot', reply);
    }, 800);
  }

  function appendMessageBubble(sender, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-message ${sender}`;
    bubble.innerHTML = `<p>${escapeHtml(text)}</p>`;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function buildBotReply(userText) {
    const lower = userText.toLowerCase();

    if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('stress')) {
      return "That sounds really heavy, and I'm glad you reached out. While I'm not a replacement for a counselor, we can book you with the guidance office or talk through resources that might help. What usually makes your stress worse – exams, deadlines, or something else?";
    }

    if (lower.includes('appointment') || lower.includes('book')) {
      return "We can help you set an appointment with a campus counselor. You can also use the “Book Session” page for a full schedule. Would you prefer morning or afternoon sessions?";
    }

    if (lower.includes('friend') || lower.includes('relationship')) {
      return "Relationships and friendships can really affect how we feel. You deserve support with that. Can you share a bit about what's been happening with your friend or relationship?";
    }

    if (lower.includes('cry') || lower.includes('sad') || lower.includes('down')) {
      return "I'm sorry you're feeling this way. You don't have to carry it alone. If you're okay with it, you can tell me what’s been making you feel this way, and we can figure out possible next steps together.";
    }

    if (lower.includes('thank')) {
      return "You're very welcome. Reaching out is already a big step. If you want, we can also help you connect with a counselor on campus for more support.";
    }

    return "Thank you for sharing that. I’m here to listen and help you find the right campus support. Can you tell me a bit more about what you’re going through right now?";
  }

  async function createChatSession() {
    const entry = {
      startedAt: new Date().toISOString(),
      status: 'open',
      fromPage: 'contact-page'
    };

    if (window.FirebaseService && FirebaseService.isReady()) {
      const user = FirebaseService.getCurrentUser();
      entry.userId = user ? user.uid : null;
      entry.userEmail = user ? user.email : null;

      try {
        const sessionId = await FirebaseService.saveDocument('chatSessions', entry);
        return sessionId;
      } catch (err) {
        console.error('Error creating chat session in Firestore:', err);
      }
    }

    // Local fallback
    const sessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
    const id = 'SESSION_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    sessions.push({ id, ...entry });
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
    return id;
  }

  async function saveChatMessage(sessionId, sender, text) {
    const msg = {
      sessionId,
      sender,
      text,
      createdAt: new Date().toISOString()
    };

    // Firestore nested collection
    if (window.FirebaseService && FirebaseService.isReady() && typeof firebase !== 'undefined') {
      try {
        const db = firebase.firestore();
        await db
          .collection('chatSessions')
          .doc(sessionId)
          .collection('messages')
          .add({
            sender,
            text,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
      } catch (err) {
        console.error('Error saving chat message in Firestore:', err);
      }
    }

    // Local fallback
    try {
      const all = JSON.parse(localStorage.getItem('chatMessages') || '[]');
      all.push(msg);
      localStorage.setItem('chatMessages', JSON.stringify(all));
    } catch (err) {
      console.error('Error saving chat message locally:', err);
    }
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (m) {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return m;
      }
    });
  }
}
