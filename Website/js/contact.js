// Website/js/contact.js
// Contact form + realistic live chat assistant

document.addEventListener('DOMContentLoaded', function () {
  // ---------- CONTACT FORM ----------
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const formData = new FormData(this);

      // Button loading state
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
      }

      setTimeout(() => {
        const submission = {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          subject: formData.get('subject'),
          message: formData.get('message'),
          urgency: formData.get('urgency'),
          timestamp: new Date().toISOString()
        };

        // Local storage (backup / analytics)
        const contacts = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
        contacts.push(submission);
        localStorage.setItem('contactSubmissions', JSON.stringify(contacts));

        // Firestore (if available)
        if (window.FirebaseService && FirebaseService.isReady()) {
          const user = FirebaseService.getCurrentUser();
          const submissionDoc = {
            ...submission,
            userId: user ? user.uid : null,
            userEmail: user ? user.email : submission.email || null,
            source: 'contact-page'
          };

          FirebaseService.saveDocument('contactSubmissions', submissionDoc).catch(err => {
            console.error('Error saving contact submission to Firestore:', err);
          });
        }

        // Feedback message
        const resultDiv = document.getElementById('contactMessageResult');
        if (resultDiv) {
          resultDiv.textContent =
            'Thank you for reaching out. The team will review your message and respond within 1–2 working days.';
          resultDiv.className = 'message success';
          resultDiv.style.display = 'block';
          resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        contactForm.reset();

        if (submitBtn) {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
      }, 1200);
    });
  }

  // ---------- LIVE CHAT ----------
  const chatModal = document.getElementById('chatModal');
  const startChatBtn = document.getElementById('startChat');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendMessageBtn = document.getElementById('sendMessage');
  const closeChatBtn = chatModal ? chatModal.querySelector('.close') : null;

  // Conversation context (for more realistic replies)
  const chatContext = {
    sessionId: 'chat-' + Date.now(),
    turnCount: 0,
    lastTopic: null
  };

  // Helper: add system intro when chat opens
  function addIntroMessageIfFirst() {
    if (!chatMessages) return;
    if (chatContext.turnCount > 0) return;

    addChatMessage(
      'SLS-U Matter (Automated Assistant)',
      "Hi, I'm an automated chat assistant for SLS-U Matter. I can help you sort through what you're feeling and suggest next steps. I'm not a live counselor or an emergency service, but I’ll do my best to guide you.",
      'system'
    );
  }

  // Open chat (with business hours check)
  if (startChatBtn && chatModal) {
    startChatBtn.addEventListener('click', function () {
      const now = new Date();
      const day = now.getDay(); // 0 = Sun, 1 = Mon ...
      const hour = now.getHours();

      // Business hours: Mon–Fri, 9AM–6PM (for "live" feel)
      if (day >= 1 && day <= 5 && hour >= 9 && hour < 18) {
        chatModal.style.display = 'block';
        addIntroMessageIfFirst();
        if (chatInput) chatInput.focus();
      } else {
        // Outside hours: still let them use the bot, but clarify
        chatModal.style.display = 'block';
        addIntroMessageIfFirst();
        addChatMessage(
          'SLS-U Matter (Automated Assistant)',
          'Right now is outside our usual office hours, so this chat is not monitored by a live person. You can still talk to me as an automated assistant, and for urgent concerns please use the contact form or emergency numbers.',
          'system'
        );
        if (chatInput) chatInput.focus();
      }
    });
  }

  // Close chat modal
  if (closeChatBtn && chatModal) {
    closeChatBtn.addEventListener('click', function () {
      chatModal.style.display = 'none';
    });
  }

  // Close when clicking outside
  if (chatModal) {
    window.addEventListener('click', function (e) {
      if (e.target === chatModal) {
        chatModal.style.display = 'none';
      }
    });
  }

  // Send message triggers
  if (sendMessageBtn) {
    sendMessageBtn.addEventListener('click', sendChatMessage);
  }
  if (chatInput) {
    chatInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  // ---------- CHAT LOGIC ----------
  function sendChatMessage() {
    if (!chatInput || !chatMessages) return;
    const message = chatInput.value.trim();
    if (!message) return;

    // User message
    addChatMessage('You', message, 'user');
    chatInput.value = '';
    chatContext.turnCount += 1;

    // Bot "typing" delay
    setTimeout(() => {
      const response = getBotResponse(message, chatContext);
      addChatMessage('SLS-U Matter', response.text, 'counselor');
      chatContext.lastTopic = response.topic || chatContext.lastTopic;
      if (response.followUp) {
        setTimeout(() => {
          addChatMessage('SLS-U Matter', response.followUp, 'counselor');
        }, 800);
      }

      // Optional: store chat snippets locally
      saveChatLocally(message, response.text);
    }, 700);
  }

  function addChatMessage(sender, text, type) {
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;

    const header = document.createElement('div');
    header.className = 'chat-header';
    header.textContent = sender;

    const body = document.createElement('div');
    body.className = 'chat-body';
    body.textContent = text;

    const time = document.createElement('div');
    time.className = 'chat-time';
    time.textContent = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    messageDiv.appendChild(header);
    messageDiv.appendChild(body);
    messageDiv.appendChild(time);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function saveChatLocally(userMessage, botMessage) {
    try {
      const history =
        JSON.parse(localStorage.getItem('contactChatHistory') || '[]') || [];
      history.push({
        sessionId: chatContext.sessionId,
        userMessage,
        botMessage,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('contactChatHistory', JSON.stringify(history));
    } catch (err) {
      console.error('Error saving chat history:', err);
    }
  }

  // ---------- BOT RESPONSE ENGINE ----------
  function getBotResponse(userMessage, ctx) {
    const msg = userMessage.toLowerCase();

    // --- Crisis / self-harm keywords ---
    if (
      msg.includes('suicide') ||
      msg.includes('kill myself') ||
      msg.includes('end my life') ||
      msg.includes('hurt myself') ||
      msg.includes('self harm') ||
      msg.includes('self-harm') ||
      msg.includes('i dont want to live') ||
      msg.includes("i don't want to live")
    ) {
      return {
        topic: 'crisis',
        text:
          "I'm really glad you shared that with me. I'm just an automated assistant and I can't provide emergency help or medical advice, but you deserve support right now. If you are in immediate danger or feel you might act on these thoughts, please contact your local emergency services or a crisis hotline right away.",
        followUp:
          'If you are on or near SLSU Lucena campus, please also consider reaching out to the Guidance and Counseling Office or a trusted adult as soon as you can. You do not have to go through this alone.'
      };
    }

    // --- Strong distress / overwhelmed ---
    if (
      msg.includes('overwhelmed') ||
      msg.includes('cant cope') ||
      msg.includes("can't cope") ||
      msg.includes('too much') ||
      msg.includes('breakdown') ||
      msg.includes('burnout')
    ) {
      return {
        topic: 'distress',
        text:
          "It sounds like things have been really heavy for you, and I'm sorry you're carrying so much. A lot of students feel this way when school, family, and personal stuff all pile up at once.",
        followUp:
          'Would you like to tell me a bit more about what feels the heaviest right now—academics, family, relationships, or something else? I can suggest some next steps or campus supports that might help.'
      };
    }

    // --- Stress / anxiety / panic ---
    if (
      msg.includes('stress') ||
      msg.includes('stressed') ||
      msg.includes('anxiety') ||
      msg.includes('anxious') ||
      msg.includes('panic') ||
      msg.includes('worry') ||
      msg.includes('worried')
    ) {
      return {
        topic: 'anxiety',
        text:
          "Thank you for telling me that you're feeling stressed or anxious. That's a very real experience, and many SLSU students go through similar moments.",
        followUp:
          'One small thing you can try is a slow breathing exercise: inhale for 4 seconds, hold for 4, exhale for 6, and repeat a few times. If you want, you can also share what usually triggers these feelings (exams, deadlines, people, etc.) so I can tailor suggestions a bit more.'
      };
    }

    // --- Academic / exam / thesis stress ---
    if (
      msg.includes('exam') ||
      msg.includes('test') ||
      msg.includes('quiz') ||
      msg.includes('thesis') ||
      msg.includes('capstone') ||
      msg.includes('grades') ||
      msg.includes('school') ||
      msg.includes('subject') ||
      msg.includes('acad') ||
      msg.includes('academic')
    ) {
      return {
        topic: 'academics',
        text:
          "Academics can bring a lot of pressure, especially with exams, grades, and big projects like thesis or capstone.",
        followUp:
          "A helpful first step is to break tasks down into smaller pieces and plan them across your week. You can also consider booking a session with a counselor to talk about study stress or using the resources section of SLS-U Matter for exam anxiety and time management tools."
      };
    }

    // --- Relationships / friends / family ---
    if (
      msg.includes('friend') ||
      msg.includes('friends') ||
      msg.includes('relationship') ||
      msg.includes('boyfriend') ||
      msg.includes('girlfriend') ||
      msg.includes('partner') ||
      msg.includes('family') ||
      msg.includes('parents') ||
      msg.includes('mom') ||
      msg.includes('dad')
    ) {
      return {
        topic: 'relationships',
        text:
          "Relationships with friends, partners, or family can really affect how we feel day to day. It’s understandable if that’s been weighing on you.",
        followUp:
          'If you want to share a bit (without names or too many details), you can tell me what’s been happening. I can suggest some ways to communicate your feelings, set boundaries, or decide if talking to a counselor might help.'
      };
    }

    // --- Sleep / energy / physical ---
    if (
      msg.includes('sleep') ||
      msg.includes('insomnia') ||
      msg.includes('cant sleep') ||
      msg.includes("can't sleep") ||
      msg.includes('tired') ||
      msg.includes('no energy') ||
      msg.includes('exhausted')
    ) {
      return {
        topic: 'sleep',
        text:
          "Sleep and energy have a big impact on mental health. When rest is off, everything else can feel harder.",
        followUp:
          'You might try small steps like setting a consistent bedtime, reducing screen time before sleep, or doing a short wind-down routine. If sleep issues are ongoing or severe, it could be helpful to mention this when you book a session or talk to a health professional.'
      };
    }

    // --- Sad / low mood / loneliness ---
    if (
      msg.includes('sad') ||
      msg.includes('down') ||
      msg.includes('empty') ||
      msg.includes('lonely') ||
      msg.includes('alone') ||
      msg.includes('depressed') ||
      msg.includes('no one')
    ) {
      return {
        topic: 'low-mood',
        text:
          "Feeling low or lonely can be really tough, and I’m glad you typed it out instead of keeping it all inside.",
        followUp:
          'Even small connections—like talking to one trusted person, joining a campus org, or reaching out to the guidance office—can be a step toward feeling less alone. If you’d like, you can tell me whether this feeling has been going on for days, weeks, or longer, and I can suggest some options.'
      };
    }

    // --- Office hours / how to get help ---
    if (
      msg.includes('office hours') ||
      msg.includes('guidance office') ||
      msg.includes('schedule') ||
      msg.includes('open') ||
      msg.includes('available') ||
      msg.includes('how to get help') ||
      msg.includes('where to go')
    ) {
      return {
        topic: 'access',
        text:
          'Our guidance and counseling services usually follow campus office hours (e.g., weekdays during the day). Exact schedules may change, so it’s best to check current announcements from SLSU or the guidance office.',
        followUp:
          'For non-urgent concerns, you can use the Booking page in SLS-U Matter to request a session. For urgent or crisis situations, please go directly to the guidance office during open hours or contact local emergency services.'
      };
    }

    // --- Greetings / small talk (especially early in chat) ---
    const isShortGreeting =
      ctx.turnCount <= 2 &&
      (msg === 'hi' ||
        msg === 'hello' ||
        msg === 'hey' ||
        msg === 'good morning' ||
        msg === 'good afternoon' ||
        msg === 'good evening');

    if (isShortGreeting) {
      return {
        topic: 'greeting',
        text:
          'Hello! Thank you for reaching out to SLS-U Matter. How are you feeling today—emotionally or mentally?',
        followUp:
          'You don’t have to give a long story. A simple “I feel ___ because ___” is already a good start.'
      };
    }

    // --- Default / catch-all response ---
    if (ctx.turnCount <= 1) {
      return {
        topic: 'general',
        text:
          "Thank you for sharing that with me. I may not catch every detail perfectly, but I’ll do my best to understand what you’re going through.",
        followUp:
          'If you’re comfortable, could you tell me whether this is more about school, family, relationships, your health, or something else? That can help me give more relevant suggestions.'
      };
    }

    return {
      topic: ctx.lastTopic || 'general',
      text:
        "I’m still here reading what you share. Even though I’m just an automated assistant, your feelings matter. It might also help to bring this to a counselor or someone you trust offline.",
      followUp:
        'If you’d like, you can also use the Booking page to request a session, or the Contact page to send a more detailed message that the team can respond to.'
    };
  }
});

// Standalone function for your “View on map” button
function openMap() {
  const address = 'SLSU Lucena Campus – Guidance and Counseling Office';
  alert(
    `Directions to: ${address}\n\nIn a live deployment, this button could open Google Maps or another navigation app with the campus location pre-loaded.`
  );
}
