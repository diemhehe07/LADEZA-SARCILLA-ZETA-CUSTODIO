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

document.addEventListener('DOMContentLoaded', function() {
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const email = formData.get('email');

      // Simulate API call
      setTimeout(async () => {
        const messageDiv = document.getElementById('newsletterMessage');
        messageDiv.textContent = 'Thank you for subscribing to our newsletter!';
        messageDiv.className = 'message success';
        newsletterForm.reset();

        // Store in localStorage
        const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
        const subscriberData = {
          email,
          date: new Date().toISOString()
        };
        subscribers.push(subscriberData);
        localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));

        // Also store in Firestore
        await saveToFirestore('newsletterSubscribers', subscriberData);
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

// Parallax scrolling effect for hero section
function initParallax() {
  const heroSection = document.querySelector('.hero-parallax');
  const heroBackground = document.getElementById('heroBackground');
  
  if (!heroSection || !heroBackground) return;
  
  function updateParallax() {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;
    
    heroBackground.style.transform = `translateY(${rate}px)`;
  }
  
  // Use requestAnimationFrame for smoother performance
  function tick() {
    updateParallax();
    requestAnimationFrame(tick);
  }
  
  // Start the animation loop
  requestAnimationFrame(tick);
}

// Alternative: Simple scroll-based parallax
function initSimpleParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  
  window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const parallaxSpeed = 0.5;
    hero.style.backgroundPosition = `center ${scrolled * parallaxSpeed}px`;
  });
}

// Initialize based on which hero style is used
document.addEventListener('DOMContentLoaded', function() {
  if (document.querySelector('.hero-parallax')) {
    initParallax();
  } else if (document.querySelector('.hero')) {
    initSimpleParallax();
  }
});

