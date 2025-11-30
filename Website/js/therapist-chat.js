// /Website/js/therapist-chat.js
class TherapistChat {
  constructor() {
    this.currentChatId = null;
    this.currentClientId = null;
    this.unsubscribeMessages = null;
    this.unsubscribeChats = null;
    this.init();
  }

  init() {
    this.loadConversations();
    this.setupEventListeners();
    this.setupNoteModal();
  }

  setupEventListeners() {
    const sendBtn = document.getElementById('sendMessageBtn');
    const messageInput = document.getElementById('messageInput');

    if (sendBtn && messageInput) {
      sendBtn.addEventListener('click', () => this.sendMessage());
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    const refreshBtn = document.getElementById('refreshChats');
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadConversations());

    const endChatBtn = document.getElementById('endChatBtn');
    if (endChatBtn) endChatBtn.addEventListener('click', () => this.endChat());

    const addNoteBtn = document.getElementById('addNoteBtn');
    if (addNoteBtn) addNoteBtn.addEventListener('click', () => this.openNoteModal());
  }

  async loadConversations() {
    const currentUser = FirebaseService.getCurrentUser();
    if (!currentUser) return;

    // Unsubscribe previous
    if (this.unsubscribeChats) this.unsubscribeChats();

    this.unsubscribeChats = FirebaseService.listenToUserChats(currentUser.uid, (chats) => {
      this.renderConversations(chats);
    });
  }

  renderConversations(chats) {
    const conversationList = document.getElementById('conversationList');
    if (!conversationList) return;

    if (!chats || chats.length === 0) {
      conversationList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-comments"></i>
          <p>No active conversations</p>
        </div>
      `;
      return;
    }

    const currentUser = FirebaseService.getCurrentUser();

    conversationList.innerHTML = chats
      .map((chat) => {
        const otherParticipantId = chat.participants.find((id) => id !== currentUser.uid);
        const otherParticipantName =
          (chat.participantNames && chat.participantNames[otherParticipantId]) || 'Student';
        const lastPreview = chat.lastMessagePreview || chat.lastMessage || '';
        const lastAt = chat.lastMessageAt && chat.lastMessageAt.toDate ? this.formatTime(chat.lastMessageAt.toDate()) : '';

        return `
        <div class="conversation-item" data-chat-id="${chat.id}" data-client-id="${otherParticipantId}">
          <div class="user-avatar"><i class="fas fa-user-graduate"></i></div>
          <div class="conversation-info">
            <h4 class="user-name">${this.escapeHtml(otherParticipantName)}</h4>
            <p class="last-message">${this.escapeHtml(lastPreview)}</p>
          </div>
          <div class="message-time">${lastAt}</div>
        </div>
      `;
      })
      .join('');

    // click handlers
    conversationList.querySelectorAll('.conversation-item').forEach((item) => {
      item.addEventListener('click', () => {
        const chatId = item.getAttribute('data-chat-id');
        const clientId = item.getAttribute('data-client-id');
        this.selectConversation(chatId, clientId);
      });
    });
  }

  async selectConversation(chatId, clientId) {
    this.currentChatId = chatId;
    this.currentClientId = clientId;

    // UI toggle
    document.querySelectorAll('.conversation-item').forEach((item) => item.classList.remove('active'));
    const selected = document.querySelector(`[data-chat-id="${chatId}"]`);
    if (selected) selected.classList.add('active');

    // Show input area
    const inputContainer = document.getElementById('chatInputContainer');
    if (inputContainer) inputContainer.style.display = 'flex';

    // Load messages
    this.loadMessages(chatId);

    // mark as read (optional extension)
    await this.markMessagesAsRead(chatId);
  }

  loadMessages(chatId) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    chatMessages.innerHTML = '';

    if (this.unsubscribeMessages) {
      this.unsubscribeMessages();
      this.unsubscribeMessages = null;
    }

    this.unsubscribeMessages = FirebaseService.listenToMessages(chatId, (messages) => {
      this.renderMessages(messages);
    });
  }

  renderMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    const currentUser = FirebaseService.getCurrentUser();
    if (!chatMessages || !currentUser) return;

    if (!messages || messages.length === 0) {
      chatMessages.innerHTML = `
        <div class="welcome-message">
          <i class="fas fa-comments"></i>
          <h3>Start a conversation</h3>
          <p>Send a message to begin the chat</p>
        </div>
      `;
      return;
    }

    chatMessages.innerHTML = messages
      .map((message) => {
        const isOwnMessage = message.senderId === currentUser.uid;
        const time = message.timestamp && message.timestamp.toDate ? this.formatTime(message.timestamp.toDate()) : '';

        return `
        <div class="message ${isOwnMessage ? 'own' : ''}">
          <div class="message-avatar">
            <i class="fas ${isOwnMessage ? 'fa-user-md' : 'fa-user-graduate'}"></i>
          </div>
          <div class="message-content">
            <p class="message-text">${this.escapeHtml(message.message || '')}</p>
            <p class="message-time">${time}</p>
          </div>
        </div>
      `;
      })
      .join('');

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;
    const message = messageInput.value.trim();
    if (!message || !this.currentChatId) return;

    const currentUser = FirebaseService.getCurrentUser();
    if (!currentUser) return;

    try {
      await FirebaseService.sendMessage(this.currentChatId, {
        senderId: currentUser.uid,
        message,
        read: false
      });

      messageInput.value = '';
      messageInput.focus();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    }
  }

  async markMessagesAsRead(chatId) {
    // Optional: implement a server-side function or update subcollection docs to mark messages read.
    // For now it's a placeholder where you could update message docs with `read: true`.
    console.log('markMessagesAsRead called for', chatId);
  }

  endChat() {
    this.currentChatId = null;
    this.currentClientId = null;

    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
      chatMessages.innerHTML = `
        <div class="welcome-message">
          <i class="fas fa-comments"></i>
          <h3>Welcome to Live Chat</h3>
          <p>Select a conversation from the sidebar to start chatting</p>
        </div>
      `;
    }

    const inputContainer = document.getElementById('chatInputContainer');
    if (inputContainer) inputContainer.style.display = 'none';

    document.querySelectorAll('.conversation-item').forEach((item) => {
      item.classList.remove('active');
    });
  }

  openNoteModal() {
    const modal = document.getElementById('sessionNoteModal');
    if (modal) {
      modal.style.display = 'block';
      const clientInput = document.getElementById('noteClientId');
      if (clientInput) clientInput.value = this.currentClientId || '';
    }
  }

  setupNoteModal() {
    const modal = document.getElementById('sessionNoteModal');
    if (!modal) return;
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = document.getElementById('cancelNote');
    if (closeBtn) closeBtn.addEventListener('click', () => (modal.style.display = 'none'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => (modal.style.display = 'none'));

    const noteForm = document.getElementById('sessionNoteForm');
    if (noteForm) {
      noteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Implement saving of the note to Firestore here (e.g., collection 'sessionNotes')
        const noteClientId = document.getElementById('noteClientId').value;
        const noteType = document.getElementById('noteType').value;
        const noteContent = document.getElementById('noteContent').value;
        const followUpAction = document.getElementById('followUpAction').value;
        try {
          await FirebaseService.saveDocument('sessionNotes', {
            clientId: noteClientId,
            therapistId: FirebaseService.getCurrentUser()?.uid || null,
            type: noteType,
            content: noteContent,
            followUp: followUpAction,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          modal.style.display = 'none';
          alert('Session note saved.');
        } catch (err) {
          console.error('Failed to save note', err);
          alert('Failed to save note.');
        }
      });
    }
  }

  formatTime(date) {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  escapeHtml(str) {
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

  destroy() {
    if (this.unsubscribeMessages) this.unsubscribeMessages();
    if (this.unsubscribeChats) this.unsubscribeChats();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = FirebaseService.getCurrentUser();
  if (!currentUser) {
    if (typeof window.OverlayAuth !== 'undefined') {
      window.OverlayAuth.show();
    } else {
      window.location.href = '/Website/html/login.html';
    }
    return;
  }

  const profile = await FirebaseService.getUserProfile(currentUser.uid);
  if (!profile || profile.role !== 'therapist') {
    window.location.href = '/Website/html/profile.html';
    return;
  }

  const therapistChat = new TherapistChat();

  window.addEventListener('beforeunload', () => {
    therapistChat.destroy();
  });
});
