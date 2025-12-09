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
// Services page functionality
document.addEventListener('DOMContentLoaded', function() {
  // Service filtering
  const filterButtons = document.querySelectorAll('.filter-btn');
  const serviceCards = document.querySelectorAll('.service-card');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');
      
      // Update active filter button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Filter service cards
      serviceCards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category').includes(filter)) {
          card.style.display = 'block';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 100);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });
  
  // Service booking and details
  const bookButtons = document.querySelectorAll('.book-service');
  const learnButtons = document.querySelectorAll('.learn-more');
  const serviceModal = document.getElementById('serviceModal');
  const serviceModalContent = document.getElementById('serviceModalContent');
  const closeServiceModal = serviceModal.querySelector('.close');
  
  // Book service functionality
  bookButtons.forEach(button => {
    button.addEventListener('click', function() {
      const service = this.getAttribute('data-service');
      window.location.href = `booking.html?service=${service}`;
    });
  });
  
  // Learn more functionality
  learnButtons.forEach(button => {
    button.addEventListener('click', function() {
      const service = this.getAttribute('data-service');
      showServiceDetails(service);
    });
  });
  
  // Close service modal
  closeServiceModal.addEventListener('click', function() {
    serviceModal.style.display = 'none';
  });
  
  window.addEventListener('click', function(e) {
    if (e.target === serviceModal) {
      serviceModal.style.display = 'none';
    }
  });
  
  // Insurance check functionality
  const insuranceModal = document.getElementById('insuranceModal');
  const checkInsuranceBtn = document.getElementById('checkInsurance');
  const closeInsuranceModal = insuranceModal.querySelector('.close');
  const insuranceForm = document.getElementById('insuranceForm');
  const insuranceResult = document.getElementById('insuranceResult');
  
  checkInsuranceBtn.addEventListener('click', function() {
    insuranceModal.style.display = 'block';
  });
  
  closeInsuranceModal.addEventListener('click', function() {
    insuranceModal.style.display = 'none';
  });
  
  window.addEventListener('click', function(e) {
    if (e.target === insuranceModal) {
      insuranceModal.style.display = 'none';
    }
  });
  
  insuranceForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    
    // Simulate insurance verification
    insuranceResult.innerHTML = '<p>Checking coverage...</p>';
    
    setTimeout(() => {
      // Mock response - in real app, this would come from an API
      const provider = formData.get('provider');
      const coverage = {
        'bcbs': { covered: true, copay: '$30', deductible: 'Met' },
        'aetna': { covered: true, copay: '$25', deductible: '$500 remaining' },
        'cigna': { covered: true, copay: '$35', deductible: 'Met' },
        'uhc': { covered: false, reason: 'Out of network' },
        'medicare': { covered: true, copay: '$20', deductible: 'Met' },
        'other': { covered: false, reason: 'Provider not recognized' }
      };
      
      const result = coverage[provider] || { covered: false, reason: 'Provider not found' };
      
      if (result.covered) {
        insuranceResult.innerHTML = `
          <div class="coverage-success">
            <h4>✓ Coverage Verified</h4>
            <p>Your insurance covers mental health services with us!</p>
            <ul>
              <li><strong>Copay:</strong> ${result.copay} per session</li>
              <li><strong>Deductible:</strong> ${result.deductible}</li>
            </ul>
          </div>
        `;
      } else {
        insuranceResult.innerHTML = `
          <div class="coverage-failed">
            <h4>✗ Coverage Not Available</h4>
            <p>${result.reason}. We offer self-pay options and sliding scale fees.</p>
          </div>
        `;
      }
      
      // Store insurance check
      const insuranceChecks = JSON.parse(localStorage.getItem('insuranceChecks') || '[]');
      insuranceChecks.push({
        provider: provider,
        memberId: formData.get('memberId'),
        covered: result.covered,
        date: new Date().toISOString()
      });
      localStorage.setItem('insuranceChecks', JSON.stringify(insuranceChecks));
    }, 2000);
  });
  
  // Service details function
  function showServiceDetails(service) {
    const serviceData = getServiceData(service);
    
    serviceModalContent.innerHTML = `
      <div class="service-detail">
        <div class="service-header">
          <div class="service-icon-large">${serviceData.icon}</div>
          <div>
            <h2>${serviceData.name}</h2>
            <p class="service-type">${serviceData.type}</p>
          </div>
        </div>
        
        <div class="service-description-detailed">
          <h3>About This Service</h3>
          <p>${serviceData.description}</p>
        </div>
        
        <div class="service-benefits">
          <h3>Benefits</h3>
          <ul>
            ${serviceData.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
          </ul>
        </div>
        
        <div class="service-process">
          <h3>What to Expect</h3>
          <ol>
            ${serviceData.process.map(step => `<li>${step}</li>`).join('')}
          </ol>
        </div>
        
        <div class="service-specialists">
          <h3>Our Specialists</h3>
          <p>${serviceData.specialists}</p>
        </div>
        
        <div class="service-actions-detailed">
          <button class="primary-btn" onclick="window.location.href='booking.html?service=${service}'">Book This Service</button>
          <button class="secondary-btn" onclick="window.location.href='contact.html'">Ask Questions</button>
        </div>
      </div>
    `;
    
    serviceModal.style.display = 'block';
  }
  
  function getServiceData(service) {
    const services = {
      'cbt': {
        name: 'Cognitive Behavioral Therapy (CBT)',
        type: 'Individual Therapy',
        icon: '<i class="fas fa-brain"></i>',
        description: 'CBT is a structured, time-limited therapy that focuses on identifying and changing negative thought patterns and behaviors that contribute to emotional distress. Our therapists will work with you to develop practical skills to manage challenges.',
        benefits: [
          'Learn to identify and challenge negative thoughts',
          'Develop effective coping strategies',
          'Improve problem-solving skills',
          'Reduce symptoms of anxiety and depression'
        ],
        process: [
          'Initial assessment of your concerns and goals',
          'Identification of negative thought patterns',
          'Learning and practicing new coping skills',
          'Application of skills to real-life situations',
          'Maintenance and relapse prevention planning'
        ],
        specialists: 'All our CBT therapists are licensed professionals with specialized training in cognitive behavioral techniques and extensive experience treating anxiety, depression, and related conditions.'
      },
      'couples': {
        name: 'Couples & Relationship Therapy',
        type: 'Couples Therapy',
        icon: '<i class="fas fa-heart"></i>',
        description: 'Our couples therapy helps partners improve communication, resolve conflicts, and strengthen their relationship. Whether you\'re facing specific challenges or want to enhance your connection, we provide a safe space for both partners.',
        benefits: [
          'Improve communication and listening skills',
          'Resolve conflicts constructively',
          'Rebuild trust and intimacy',
          'Develop shared goals and values'
        ],
        process: [
          'Joint assessment of relationship dynamics',
          'Identification of communication patterns',
          'Learning effective conflict resolution',
          'Practicing new communication skills',
          'Developing relationship maintenance strategies'
        ],
        specialists: 'Our relationship specialists are trained in various couples therapy modalities including Gottman Method, Emotionally Focused Therapy, and Imago Relationship Therapy.'
      }
      // Add more services as needed
    };
    
    return services[service] || {
      name: 'Service',
      type: 'Therapy',
      icon: '<i class="fas fa-question"></i>',
      description: 'Service description not available.',
      benefits: ['Benefit information not available'],
      process: ['Process information not available'],
      specialists: 'Specialist information not available'
    };
  }
});