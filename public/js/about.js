// Helper to safely save to Firestore using FirebaseService
async function saveToFirestore(collection, data) {
  if (!window.FirebaseService || !window.FirebaseService.isReady()) {
    console.warn("FirebaseService not ready; skipping Firestore save for", collection);
    return;
  }

  try {
    await window.FirebaseService.saveDocument(collection, {
      ...data,
      page: window.location.pathname
    });
  } catch (err) {
    console.error("Error saving to Firestore (" + collection + "):", err);
  }
}

// Team member contact functionality
document.addEventListener('DOMContentLoaded', function() {
  const contactButtons = document.querySelectorAll('.contact-member');
  const modal = document.getElementById('contactModal');
  const closeBtn = modal.querySelector('.close');
  const teamMemberField = document.getElementById('teamMember');
  const contactForm = document.getElementById('teamContactForm');
  
  // Open modal when contact button is clicked
  contactButtons.forEach(button => {
    button.addEventListener('click', function() {
      const member = this.getAttribute('data-member');
      teamMemberField.value = member;
      modal.style.display = 'block';
    });
  });
  
  // Close modal
  closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // Handle contact form submission
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    
    // Simulate sending message
    setTimeout(() => {
      alert('Your message has been sent to our team member. They will get back to you within 24 hours.');
      contactForm.reset();
      modal.style.display = 'none';
      
     const contacts = JSON.parse(localStorage.getItem('teamContacts') || '[]');
const contactData = {
  name: formData.get('name'),
  email: formData.get('email'),
  message: formData.get('message'),
  timestamp: new Date().toISOString()
};
contacts.push(contactData);
localStorage.setItem('teamContacts', JSON.stringify(contacts));

// Firestore
saveToFirestore('teamContacts', contactData);

    }, 1000);
  });
});