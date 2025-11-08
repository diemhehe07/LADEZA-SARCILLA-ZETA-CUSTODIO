// Mobile menu functionality
const menuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    menuToggle.classList.toggle('active');
  });
}

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
    menuToggle.classList.remove('active');
  });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Reveal animations on scroll
const revealElements = document.querySelectorAll('.reveal');

const revealOnScroll = () => {
  revealElements.forEach(element => {
    const elementTop = element.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    
    if (elementTop < windowHeight - 100) {
      element.classList.add('active');
    }
  });
};

window.addEventListener('scroll', revealOnScroll);
// Initial check in case elements are already in view
revealOnScroll();

// Form handling
document.addEventListener('DOMContentLoaded', function() {
  // Handle newsletter signup
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const email = formData.get('email');
      
      // Simulate API call
      setTimeout(() => {
        const messageDiv = document.getElementById('newsletterMessage');
        messageDiv.textContent = 'Thank you for subscribing to our newsletter!';
        messageDiv.className = 'message success';
        newsletterForm.reset();
        
        // Store in localStorage
        const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
        subscribers.push({
          email: email,
          date: new Date().toISOString()
        });
        localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
      }, 1000);
    });
  }
});

// Resource tracking
if (window.location.pathname.includes('resources.html')) {
  const resources = JSON.parse(localStorage.getItem('resourceActivity') || '[]');
  
  // Update resource stats
  const updateResourceStats = () => {
    document.getElementById('accessedCount').textContent = resources.length;
    
    if (resources.length > 0) {
      const lastResource = resources[resources.length - 1];
      document.getElementById('lastAccessed').textContent = lastResource.name;
      
      // Find most helpful resource
      const helpfulCount = {};
      resources.forEach(resource => {
        helpfulCount[resource.name] = (helpfulCount[resource.name] || 0) + 1;
      });
      
      const mostHelpful = Object.keys(helpfulCount).reduce((a, b) => 
        helpfulCount[a] > helpfulCount[b] ? a : b
      );
      document.getElementById('mostHelpful').textContent = mostHelpful;
    }
  };
  
  updateResourceStats();
}