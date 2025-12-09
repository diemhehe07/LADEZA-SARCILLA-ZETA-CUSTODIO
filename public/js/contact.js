// Helper to safely save to Firestore using FirebaseService
async function saveToFirestore(collection, data) {
  if (!window.FirebaseService || !window.FirebaseService.isReady()) {
    console.warn("FirebaseService not ready; skipping Firestore save for", collection);
    return;
  }

  try {
    const currentUser = window.FirebaseService.getCurrentUser
      ? window.FirebaseService.getCurrentUser()
      : null;

    await window.FirebaseService.saveDocument(collection, {
      ...data,
      userId: currentUser ? currentUser.uid : null,
      page: window.location.pathname
    });
  } catch (err) {
    console.error("Error saving to Firestore (" + collection + "):", err);
  }
}

// Contact page functionality
document.addEventListener("DOMContentLoaded", function () {
  const contactForm = document.getElementById("contactForm");
  const chatModal = document.getElementById("chatModal");
  const startChatBtn = document.getElementById("startChat");
  const closeChat = chatModal ? chatModal.querySelector(".close") : null;
  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const sendMessageBtn = document.getElementById("sendMessage");

  /* ------------------ CONTACT FORM SUBMISSION ------------------ */

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const formData = new FormData(this);

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : "Sending...";
      if (submitBtn) {
        submitBtn.textContent = "Sending...";
        submitBtn.disabled = true;
      }

      // Build the payload to match your Firestore schema
      const contactData = {
        source: "contact-page",
        name: formData.get("name") || "",
        email: formData.get("email") || "",
        phone: formData.get("phone") || "",
        studentId: formData.get("studentId") || "",
        courseYear: formData.get("courseYear") || "",
        subject: formData.get("subject") || "",
        message: formData.get("message") || "",
        urgency: formData.get("urgency") || "medium",
        studentConsent:
          formData.get("studentConsent") === "on" ||
          formData.get("studentConsent") === "true",
        consent:
          formData.get("consent") === "on" ||
          formData.get("consent") === "true",
        submittedAt: new Date().toISOString()
      };

      // LocalStorage copy (optional)
      const contacts =
        JSON.parse(localStorage.getItem("contactSubmissions") || "[]") || [];
      contacts.push(contactData);
      localStorage.setItem("contactSubmissions", JSON.stringify(contacts));

      // Save in Firestore -> contactMessages
      saveToFirestore("contactMessages", contactData)
        .then(() => {
          const resultDiv = document.getElementById("contactMessageResult");
          if (resultDiv) {
            resultDiv.textContent =
              "Thank you for your message! We will get back to you within 24 hours.";
            resultDiv.className = "message success";
            resultDiv.style.display = "block";
            resultDiv.scrollIntoView({ behavior: "smooth" });
          }

          contactForm.reset();
        })
        .catch((err) => {
          console.error("Error saving contact submission:", err);
          const resultDiv = document.getElementById("contactMessageResult");
          if (resultDiv) {
            resultDiv.textContent =
              "Oops, something went wrong while sending your message. Please try again.";
            resultDiv.className = "message error";
            resultDiv.style.display = "block";
          }
        })
        .finally(() => {
          if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }
        });
    });
  }

  /* ------------------ CHAT FUNCTIONALITY ------------------ */

  if (startChatBtn && chatModal) {
    startChatBtn.addEventListener("click", function () {
      const now = new Date();
      const day = now.getDay(); // 0 = Sun, 1 = Mon
      const hour = now.getHours();

      // Mon–Fri, 9AM–6PM
      if (day >= 1 && day <= 5 && hour >= 9 && hour < 18) {
        chatModal.style.display = "block";
        if (chatInput) chatInput.focus();
      } else {
        alert(
          "Our live chat is available Monday–Friday, 9AM–6PM. Please call our hotline for immediate assistance."
        );
      }
    });
  }

  if (closeChat && chatModal) {
    closeChat.addEventListener("click", function () {
      chatModal.style.display = "none";
    });
  }

  if (sendMessageBtn) {
    sendMessageBtn.addEventListener("click", sendChatMessage);
  }

  if (chatInput) {
    chatInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  function sendChatMessage() {
    if (!chatInput || !chatMessages) return;

    const message = chatInput.value.trim();
    if (!message) return;

    // add user bubble in UI
    addChatMessage(message, "user");
    chatInput.value = "";

    const nowIso = new Date().toISOString();

    // Save USER chat message into contactMessages
    saveToFirestore("contactMessages", {
      source: "contact-chat",
      role: "user",
      message,
      submittedAt: nowIso
    });

    const responses = [
      "Thank you for reaching out. A counselor will review your message shortly.",
      "We appreciate you contacting SLS-U Matter. If this is urgent, please also call the campus hotline.",
      "Your well-being matters to us. A member of our team will get back to you soon.",
      "Got it. Feel free to share more details if you are comfortable.",
      "Thanks for the message. Remember, if this is an emergency, contact your local emergency services or our hotline right away."
    ];
    const reply = responses[Math.floor(Math.random() * responses.length)];

    setTimeout(() => {
      // add bot bubble in UI
      addChatMessage(reply, "bot");

      // Save BOT reply into contactMessages
      saveToFirestore("contactMessages", {
        source: "contact-chat",
        role: "bot",
        message: reply,
        submittedAt: new Date().toISOString()
      });
    }, 800);
  }

  function addChatMessage(message, sender) {
    if (!chatMessages) return;
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.innerHTML = `<p>${message}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Close modal when clicking outside
  window.addEventListener("click", function (e) {
    if (chatModal && e.target === chatModal) {
      chatModal.style.display = "none";
    }
  });
});

/* ------------------ MAP HELPER (existing) ------------------ */

function openMap() {
  const address = "123 Wellness Street, Mental Health City";
  alert(
    `Directions to: ${address}\n\nIn a real application, this would open your map application.`
  );
}
