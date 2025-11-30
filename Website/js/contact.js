// contact.js - Contact page functionality (form + live chat + map + Firebase)

document.addEventListener('DOMContentLoaded', function () {
  initUserTypeSelection();
  initContactForm();
  initChat();
});

// ---------------------------
// User Type Selection
// ---------------------------
function initUserTypeSelection() {
  const userTypeOptions = document.querySelectorAll('.user-type-option');
  const userTypeInput = document.getElementById('contactUserType');
  const studentSupport = document.getElementById('studentSupport');
  const therapistSupport = document.getElementById('therapistSupport');
  const studentFields = document.getElementById('contactStudentFields');
  const therapistFields = document.getElementById('contactTherapistFields');
  const studentConsent = document.getElementById('studentConsent');
  const consentText = document.getElementById('consentText');
  const contactSubject = document.getElementById('contactSubject');

  if (!userTypeOptions.length) return;

  // Initialize with student as default
  updateUserType('student');

  userTypeOptions.forEach(option => {
    option.addEventListener('click', function() {
      const selectedType = this.getAttribute('data-type');
      
      // Remove active class from all options
      userTypeOptions.forEach(opt => opt.classList.remove('active'));
      
      // Add active class to clicked option
      this.classList.add('active');
      
      // Update hidden input value
      userTypeInput.value = selectedType;
      
      // Update UI based on user type
      updateUserType(selectedType);
    });
  });

  function updateUserType(userType) {
    if (userType === 'student') {
      // Show student sections, hide therapist sections
      if (studentSupport) {
        studentSupport.classList.add('active');
        studentSupport.style.display = 'block';
      }
      if (therapistSupport) {
        therapistSupport.classList.remove('active');
        therapistSupport.style.display = 'none';
      }
      
      // Show student form fields, hide therapist fields
      if (studentFields) {
        studentFields.classList.add('active');
        studentFields.style.display = 'block';
      }
      if (therapistFields) {
        therapistFields.classList.remove('active');
        therapistFields.style.display = 'none';
      }
      
      // Update consent text
      if (consentText) {
        consentText.textContent = 'I confirm I am a student *';
      }
      
      // Update subject options for students
      updateSubjectOptions('student');
      
      // Update field requirements
      updateFieldRequirements('student');
      
    } else {
      // Show therapist sections, hide student sections
      if (studentSupport) {
        studentSupport.classList.remove('active');
        studentSupport.style.display = 'none';
      }
      if (therapistSupport) {
        therapistSupport.classList.add('active');
        therapistSupport.style.display = 'block';
      }
      
      // Show therapist form fields, hide student fields
      if (studentFields) {
        studentFields.classList.remove('active');
        studentFields.style.display = 'none';
      }
      if (therapistFields) {
        therapistFields.classList.add('active');
        therapistFields.style.display = 'block';
      }
      
      // Update consent text
      if (consentText) {
        consentText.textContent = 'I confirm I am a therapist *';
      }
      
      // Update subject options for therapists
      updateSubjectOptions('therapist');
      
      // Update field requirements
      updateFieldRequirements('therapist');
    }
  }

  function updateSubjectOptions(userType) {
    if (!contactSubject) return;
    
    // Store current value
    const currentValue = contactSubject.value;
    
    // Clear existing options except the first one
    while (contactSubject.options.length > 1) {
      contactSubject.remove(1);
    }
    
    // Add options based on user type
    const studentOptions = [
      { value: 'appointment', text: 'Counseling Appointment' },
      { value: 'academic', text: 'Academic Stress Support' },
      { value: 'career', text: 'Career Guidance' },
      { value: 'adjustment', text: 'College Adjustment' },
      { value: 'crisis', text: 'Crisis Support' },
      { value: 'general', text: 'General Inquiry' },
      { value: 'feedback', text: 'Feedback' },
      { value: 'other', text: 'Other' }
    ];
    
    const therapistOptions = [
      { value: 'technical', text: 'Technical Support' },
      { value: 'clinical', text: 'Clinical Consultation' },
      { value: 'scheduling', text: 'Schedule Management' },
      { value: 'resources', text: 'Resource Access' },
      { value: 'training', text: 'Training Request' },
      { value: 'general', text: 'General Inquiry' },
      { value: 'feedback', text: 'Feedback' },
      { value: 'other', text: 'Other' }
    ];
    
    const options = userType === 'student' ? studentOptions : therapistOptions;
    
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      contactSubject.appendChild(optionElement);
    });
    
    // Restore previous value if it exists in new options
    if (currentValue && options.some(opt => opt.value === currentValue)) {
      contactSubject.value = currentValue;
    }
  }

  function updateFieldRequirements(userType) {
    const studentId = document.getElementById('studentId');
    const therapistId = document.getElementById('therapistId');
    const specialization = document.getElementById('specialization');
    
    if (userType === 'student') {
      if (studentId) studentId.required = false;
      if (therapistId) therapistId.required = false;
      if (specialization) specialization.required = false;
    } else {
      if (studentId) studentId.required = false;
      if (therapistId) therapistId.required = true;
      if (specialization) specialization.required = true;
    }
  }
}

// ---------------------------
// Contact form
// ---------------------------
function initContactForm() {
  const form = document.getElementById('contactForm');
  const resultBox = document.getElementById('contactMessageResult');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const userType = document.getElementById('contactUserType').value;
    const formData = new FormData(form);
    
    const payload = {
      name: formData.get('name')?.trim() || '',
      email: formData.get('email')?.trim() || '',
      phone: formData.get('phone')?.trim() || '',
      subject: formData.get('subject') || '',
      message: formData.get('message')?.trim() || '',
      urgency: formData.get('urgency') || 'medium',
      consent: !!formData.get('consent'),
      userType: userType,
      submittedAt: new Date().toISOString(),
      source: 'contact-page'
    };

    // Add role-specific data
    if (userType === 'student') {
      payload.studentId = formData.get('studentId')?.trim() || '';
      payload.courseYear = formData.get('courseYear')?.trim() || '';
      payload.studentConsent = !!formData.get('studentConsent');
    } else {
      payload.therapistId = formData.get('therapistId')?.trim() || '';
      payload.specialization = formData.get('specialization') || '';
      payload.therapistConsent = !!formData.get('studentConsent'); // Reusing the same checkbox
    }

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

    // Role-specific validation
    if (userType === 'student' && !payload.studentConsent) {
      showContactMessage('Please confirm you are a student.', 'error');
      return;
    }

    if (userType === 'therapist') {
      if (!payload.therapistConsent) {
        showContactMessage('Please confirm you are a therapist.', 'error');
        return;
      }
      if (!payload.therapistId) {
        showContactMessage('Please provide your Therapist ID.', 'error');
        return;
      }
      if (!payload.specialization) {
        showContactMessage('Please select your specialization.', 'error');
        return;
      }
    }

    if (!payload.consent) {
      showContactMessage('Please consent to being contacted and understand your information will be kept confidential.', 'error');
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

    showContactMessage(`Thank you for reaching out${userType === 'therapist' ? ' as a therapist' : ''}. Our team will contact you soon.`, 'success');
    form.reset();
  });

  function showContactMessage(text, type = 'info') {
    if (!resultBox) return;
    resultBox.textContent = text;
    resultBox.className = `message ${type}`;
    resultBox.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        resultBox.style.display = 'none';
      }, 5000);
    }
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

    // Get user type for personalized responses
    const userType = document.getElementById('contactUserType').value;

    // Fake "realistic" bot reply
    const reply = buildBotReply(text, userType);
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

  function buildBotReply(userText, userType) {
    const lower = userText.toLowerCase();

    if (userType === 'therapist') {
      // Therapist-specific responses
      if (lower.includes('schedule') || lower.includes('calendar') || lower.includes('appointment')) {
        return "I can help you with schedule management. You can access your full calendar through the Therapist Portal. Would you like me to show you how to update your availability?";
      }

      if (lower.includes('case') || lower.includes('client') || lower.includes('patient')) {
        return "For case management and client records, please use the secure Case Portal. I can help you with general questions about the system or direct you to technical support if needed.";
      }

      if (lower.includes('resource') || lower.includes('material') || lower.includes('assessment')) {
        return "You can access our professional resources library through the Therapist Resources page. We have assessment tools, therapy materials, and treatment guides available.";
      }

      if (lower.includes('technical') || lower.includes('problem') || lower.includes('issue')) {
        return "I'm sorry you're experiencing technical issues. For immediate technical support, please contact our IT Help Desk at itsupport@slsu.edu.ph or (042) 710-2540.";
      }

      if (lower.includes('clinical') || lower.includes('consult') || lower.includes('supervision')) {
        return "For clinical consultation or supervision, please contact Dr. Maria Santos at msantos@slsu.edu.ph or (042) 710-2530. She's available for scheduled consultations.";
      }

      return "Thank you for reaching out. As a therapist, you have access to specialized resources and support. How can I assist you with our therapist services today?";
    }

    // Student responses (existing)
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
      return "I'm sorry you're feeling this way. You don't have to carry it alone. If you're okay with it, you can tell me what's been making you feel this way, and we can figure out possible next steps together.";
    }

    if (lower.includes('thank')) {
      return "You're very welcome. Reaching out is already a big step. If you want, we can also help you connect with a counselor on campus for more support.";
    }

    return "Thank you for sharing that. I'm here to listen and help you find the right campus support. Can you tell me a bit more about what you're going through right now?";
  }

  async function createChatSession() {
    const userType = document.getElementById('contactUserType').value;
    const entry = {
      startedAt: new Date().toISOString(),
      status: 'open',
      fromPage: 'contact-page',
      userType: userType
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

// Updated /Website/js/contact.js - Add student chat functionality
document.addEventListener('DOMContentLoaded', function() {
  // ... existing contact.js code ...
  
  // Live Chat functionality for students
  const startChatBtn = document.getElementById('startChat');
  if (startChatBtn) {
    startChatBtn.addEventListener('click', () => {
      openStudentChat();
    });
  }

  function openStudentChat() {
    const currentUser = FirebaseService.getCurrentUser();
    if (!currentUser) {
      alert('Please log in to use live chat.');
      window.location.href = '/Website/html/profile.html';
      return;
    }

    // For demo purposes, connect to a default therapist
    // In production, you'd have a therapist assignment system
    const defaultTherapistId = 'default-therapist-id';
    
    FirebaseService.getUserProfile().then(studentProfile => {
      const studentName = `${studentProfile.firstName} ${studentProfile.lastName}`;
      
      FirebaseService.getOrCreateChat(
        defaultTherapistId,
        currentUser.uid,
        {
          [defaultTherapistId]: 'Counselor',
          [currentUser.uid]: studentName
        }
      ).then(chatId => {
        // Open chat interface
        openChatModal(chatId, defaultTherapistId);
      });
    });
  }

  function openChatModal(chatId, therapistId) {
    // Implementation of student chat modal similar to therapist chat
    // This would show a modal with chat interface for students
    console.log('Opening chat:', chatId, 'with therapist:', therapistId);
    
    // You can implement a modal similar to the therapist chat
    // or redirect to a dedicated student chat page
    alert('Live chat feature would open here. Connecting you with a counselor...');
  }
});