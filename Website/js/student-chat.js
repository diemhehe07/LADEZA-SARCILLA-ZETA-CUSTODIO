// /Website/js/student-chat.js
document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = FirebaseService.getCurrentUser();
  if (!currentUser) {
    // open overlay instead of redirect if overlay exists
    if (typeof window.OverlayAuth !== 'undefined') {
      window.OverlayAuth.show();
    } else {
      window.location.href = '/Website/html/login.html';
    }
    return;
  }

  const profile = await FirebaseService.getUserProfile(currentUser.uid);

  // Only students can use this page
  if (!profile || profile.role !== 'student') {
    window.location.href = '/Website/html/profile.html';
    return;
  }

  const counselorNameEl = document.getElementById('counselorName');
  const chatMessagesEl = document.getElementById('chatMessages');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendMessageBtn');

  // Replace with real assignment logic later. For now, use assignment stored on student profile
  const therapistId = profile.assignedTherapistId || profile.therapistId || 'default-therapist-id';
  const therapistDisplayName = profile.assignedTherapistName || 'Campus Counselor';

  if (counselorNameEl) counselorNameEl.textContent = therapistDisplayName;

  const studentName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Student';

  // Create or get chatId (deterministic)
  const chatId = await FirebaseService.getOrCreateChat(therapistId, currentUser.uid, {
    [therapistId]: therapistDisplayName,
    [currentUser.uid]: studentName
  });

  // Real-time listener for messages
  const unsubscribe = FirebaseService.listenToMessages(chatId, (messages) => {
    renderMessages(messages);
  });

  function renderMessages(messages) {
    if (!chatMessagesEl) return;

    if (!messages.length) {
      chatMessagesEl.innerHTML = `
        <div class="welcome-message">
          <i class="fas fa-comments"></i>
          <h3>Start the conversation</h3>
          <p>You can share what you're going through. Your counselor will respond here.</p>
        </div>
      `;
      chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
      return;
    }

    chatMessagesEl.innerHTML = messages
      .map((msg) => {
        const isOwn = msg.senderId === currentUser.uid;
        const time =
          msg.timestamp && msg.timestamp.toDate
            ? msg.timestamp.toDate().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })
            : '';

        return `
        <div class="message ${isOwn ? 'own' : ''}">
          <div class="message-avatar">
            <i class="fas ${isOwn ? 'fa-user-graduate' : 'fa-user-md'}"></i>
          </div>
          <div class="message-content">
            <p class="message-text">${escapeHtml(msg.message || '')}</p>
            <p class="message-time">${time}</p>
          </div>
        </div>
      `;
      })
      .join('');

    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }

  async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    try {
      // Use updated FirebaseService.sendMessage which updates chat metadata
      await FirebaseService.sendMessage(chatId, {
        senderId: currentUser.uid,
        message: text,
        read: false
      });

      messageInput.value = '';
      messageInput.focus();
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Please try again.");
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
      switch (m) {
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '"':
          return '&quot;';
        case "'":
          return '&#39;';
        default:
          return m;
      }
    });
  }

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    if (typeof unsubscribe === 'function') unsubscribe();
  });
});
