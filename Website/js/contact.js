// Contact page functionality
document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contactForm');
  const chatModal = document.getElementById('chatModal');
  const startChatBtn = document.getElementById('startChat');
  const closeChat = chatModal.querySelector('.close');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendMessageBtn = document.getElementById('sendMessage');
  
  // Contact form submission
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      
      // Show loading state
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
      
      // Simulate API call
      setTimeout(() => {
        // Store contact submission
        const contacts = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
        contacts.push({
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          subject: formData.get('subject'),
          message: formData.get('message'),
          urgency: formData.get('urgency'),
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('contactSubmissions', JSON.stringify(contacts));
        
        // Show success message
        const resultDiv = document.getElementById('contactMessageResult');
        resultDiv.textContent = 'Thank you for your message! We will get back to you within 24 hours.';
        resultDiv.className = 'message success';
        resultDiv.style.display = 'block';
        
        // Reset form
        contactForm.reset();
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        // Scroll to result message
        resultDiv.scrollIntoView({ behavior: 'smooth' });
      }, 1500);
    });
  }
  
  // Chat functionality
  if (startChatBtn) {
    startChatBtn.addEventListener('click', function() {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      
      // Check if within business hours (Mon-Fri, 9AM-6PM)
      if (day >= 1 && day <= 5 && hour >= 9 && hour < 18) {
        chatModal.style.display = 'block';
        chatInput.focus();
      } else {
        alert('Our live chat is available Monday-Friday, 9AM-6PM. Please call our hotline for immediate assistance.');
      }
    });
  }
  
  // Close chat modal
  if (closeChat) {
    closeChat.addEventListener('click', function() {
      chatModal.style.display = 'none';
    });
  }
  
  // Send chat message
  if (sendMessageBtn) {
    sendMessageBtn.addEventListener('click', sendChatMessage);
  }
  
  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendChatMessage();
      }
    });
  }
  
  function sendChatMessage() {
    const message = chatInput.value.trim();
    if (message) {
      // Add user message
      addChatMessage(message, 'user');
      chatInput.value = '';
      
      // Simulate bot response
      setTimeout(() => {
        const responses = [
          "Thank you for sharing that. I understand this might be difficult to talk about.",
          "I appreciate you reaching out. Our team can help you with that.",
          "That sounds challenging. Would you like me to connect you with one of our specialists?",
          "Thank you for your message. We're here to support you through this.",
          "I understand. Let me help you get the support you need."
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addChatMessage(randomResponse, 'bot');
      }, 1000 + Math.random() * 2000);
    }
  }
  
  function addChatMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.innerHTML = `<p>${message}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    if (e.target === chatModal) {
      chatModal.style.display = 'none';
    }
  });
});

// Open map directions
function openMap() {
  // In a real application, this would open Google Maps or Apple Maps
  const address = "123 Wellness Street, Mental Health City";
  alert(`Directions to: ${address}\n\nIn a real application, this would open your map application.`);
}