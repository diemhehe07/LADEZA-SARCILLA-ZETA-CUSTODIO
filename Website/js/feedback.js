// Feedback page functionality
document.addEventListener('DOMContentLoaded', function() {
  const feedbackForm = document.getElementById('feedbackForm');
  const thankYouModal = document.getElementById('thankYouModal');
  const closeThankYou = thankYouModal.querySelector('.close');
  
  // Load feedback statistics
  loadFeedbackStats();
  
  // Load recent feedback
  loadRecentFeedback();
  
  // Feedback form submission
  if (feedbackForm) {
  feedbackForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const isAnonymous = document.getElementById('anonymousFeedback').checked;
    
    // Show loading state
    const submitBtn = feedbackForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
      // Store feedback locally
      const feedbacks = JSON.parse(localStorage.getItem('userFeedback') || '[]');
      const feedbackData = {
        rating: parseInt(formData.get('rating')),
        type: formData.get('feedbackType'),
        service: formData.get('service'),
        title: formData.get('title'),
        message: formData.get('message'),
        improvement: formData.get('improvement'),
        timestamp: new Date().toISOString(),
        anonymous: isAnonymous
      };
      
      // Add user info if not anonymous
      if (!isAnonymous) {
        feedbackData.name = formData.get('name');
        feedbackData.email = formData.get('email');
      }
      
      feedbacks.push(feedbackData);
      localStorage.setItem('userFeedback', JSON.stringify(feedbacks));
      
      // 🔗 Save feedback to Firestore if Firebase is available
      if (window.FirebaseService && FirebaseService.isReady()) {
        const user = FirebaseService.getCurrentUser();
        const feedbackDoc = {
          ...feedbackData,
          userId: user ? user.uid : null,
          userEmail: user ? user.email : feedbackData.email || null,
          source: 'feedback-page'
        };

        FirebaseService.saveDocument('feedback', feedbackDoc).catch(err => {
          console.error('Error saving feedback to Firestore:', err);
        });
      }
      
      // Show thank you modal
      thankYouModal.style.display = 'block';
      
      // Reset form
      feedbackForm.reset();
      
      // Reset button
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      
      // Update stats
      loadFeedbackStats();
      loadRecentFeedback();
    }, 1000);
  });
}

  
  // Close thank you modal
  if (closeThankYou) {
    closeThankYou.addEventListener('click', function() {
      thankYouModal.style.display = 'none';
    });
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    if (e.target === thankYouModal) {
      thankYouModal.style.display = 'none';
    }
  });
  
  // Anonymous checkbox functionality
  const anonymousCheckbox = document.getElementById('anonymousFeedback');
  if (anonymousCheckbox) {
    anonymousCheckbox.addEventListener('change', function() {
      const nameField = document.getElementById('feedbackName');
      const emailField = document.getElementById('feedbackEmail');
      
      if (this.checked) {
        nameField.disabled = true;
        emailField.disabled = true;
        nameField.placeholder = 'Name hidden (anonymous)';
        emailField.placeholder = 'Email hidden (anonymous)';
      } else {
        nameField.disabled = false;
        emailField.disabled = false;
        nameField.placeholder = 'If you\'d like to share your name';
        emailField.placeholder = 'If you\'d like us to follow up';
      }
    });
  }
});

function loadFeedbackStats() {
  const feedbacks = JSON.parse(localStorage.getItem('userFeedback') || '[]');
  
  // Update statistics
  document.getElementById('totalFeedback').textContent = feedbacks.length;
  
  // Calculate average rating
  if (feedbacks.length > 0) {
    const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
    const avgRating = (totalRating / feedbacks.length).toFixed(1);
    document.getElementById('avgRating').textContent = avgRating;
  } else {
    document.getElementById('avgRating').textContent = '0.0';
  }
  
  // Count improvements (feedback with improvement suggestions)
  const improvements = feedbacks.filter(f => f.improvement && f.improvement.trim() !== '').length;
  document.getElementById('improvements').textContent = improvements;
}

function loadRecentFeedback() {
  const feedbacks = JSON.parse(localStorage.getItem('userFeedback') || '[]');
  const recentList = document.getElementById('recentFeedbackList');
  
  // Clear existing content
  recentList.innerHTML = '';
  
  // Show latest 5 feedbacks
  const recentFeedbacks = feedbacks.slice(-5).reverse();
  
  if (recentFeedbacks.length === 0) {
    recentList.innerHTML = '<p>No feedback submitted yet. Be the first to share your experience!</p>';
    return;
  }
  
  recentFeedbacks.forEach(feedback => {
    const feedbackItem = document.createElement('div');
    feedbackItem.className = 'feedback-item';
    
    const displayName = feedback.anonymous ? 'Anonymous User' : (feedback.name || 'User');
    const date = new Date(feedback.timestamp).toLocaleDateString();
    
    // Create rating stars
    const ratingStars = '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
    
    feedbackItem.innerHTML = `
      <div class="feedback-meta">
        <div>
          <strong>${displayName}</strong>
          <span> - ${date}</span>
        </div>
        <div class="feedback-rating" title="Rating: ${feedback.rating}/5">
          ${ratingStars}
        </div>
      </div>
      <p><strong>${feedback.title}</strong></p>
      <p>${feedback.message}</p>
    `;
    
    recentList.appendChild(feedbackItem);
  });
}

function closeThankYouModal() {
  document.getElementById('thankYouModal').style.display = 'none';
}