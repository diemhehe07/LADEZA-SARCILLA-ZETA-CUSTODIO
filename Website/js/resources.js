// Resources page functionality
document.addEventListener('DOMContentLoaded', function() {
  // Category tab functionality
  const categoryTabs = document.querySelectorAll('.category-tab');
  const categoryPanes = document.querySelectorAll('.category-pane');
  
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const category = this.getAttribute('data-category');
      
      // Update active tab
      categoryTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // Show corresponding pane
      categoryPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === category) {
          pane.classList.add('active');
        }
      });
    });
  });
  
  // Resource button functionality
  const resourceButtons = document.querySelectorAll('.resource-btn');
  const resourceModal = document.getElementById('resourceModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  const startResourceBtn = document.getElementById('startResource');
  const saveResourceBtn = document.getElementById('saveResource');
  const closeModal = resourceModal.querySelector('.close');
  
  let currentResource = null;
  
  resourceButtons.forEach(button => {
    button.addEventListener('click', function() {
      const resource = this.getAttribute('data-resource');
      currentResource = resource;
      
      // Set modal content based on resource
      const resourceData = getResourceData(resource);
      modalTitle.textContent = resourceData.title;
      modalContent.innerHTML = resourceData.content;
      
      // Update button text
      startResourceBtn.textContent = resourceData.buttonText;
      
      resourceModal.style.display = 'block';
    });
  });
  
  // Close modal
  closeModal.addEventListener('click', function() {
    resourceModal.style.display = 'none';
  });
  
  window.addEventListener('click', function(e) {
    if (e.target === resourceModal) {
      resourceModal.style.display = 'none';
    }
  });
  
  // Start resource
  startResourceBtn.addEventListener('click', function() {
    if (currentResource) {
      // Track resource usage
      const resources = JSON.parse(localStorage.getItem('resourceActivity') || '[]');
      const resourceData = getResourceData(currentResource);
      
      resources.push({
        name: resourceData.title,
        type: currentResource,
        date: new Date().toISOString()
      });
      localStorage.setItem('resourceActivity', JSON.stringify(resources));
      
      // Update stats
      updateResourceStats();
      
      // Close modal and show success message
      resourceModal.style.display = 'none';
      alert(`Starting: ${resourceData.title}`);
    }
  });
  
  // Save resource for later
  saveResourceBtn.addEventListener('click', function() {
    if (currentResource) {
      const saved = JSON.parse(localStorage.getItem('savedResources') || '[]');
      const resourceData = getResourceData(currentResource);
      
      if (!saved.find(r => r.type === currentResource)) {
        saved.push({
          name: resourceData.title,
          type: currentResource,
          savedDate: new Date().toISOString()
        });
        localStorage.setItem('savedResources', JSON.stringify(saved));
        alert('Resource saved for later!');
      } else {
        alert('Resource already saved!');
      }
    }
  });
  
  // Location search functionality
  const locationForm = document.getElementById('locationForm');
  if (locationForm) {
    locationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const zipCode = document.getElementById('zipCode').value;
      searchLocalResources(zipCode);
    });
  }
  
  // Helper functions
  function getResourceData(resource) {
    const resources = {
      'breathing-exercise': {
        title: 'Guided Breathing Exercise',
        content: '<p>This 5-minute guided breathing exercise will help you regulate your breathing and reduce anxiety. Find a comfortable position and follow the audio instructions.</p><div class="audio-player"><audio controls><source src="#" type="audio/mpeg">Your browser does not support the audio element.</audio></div>',
        buttonText: 'Start Exercise'
      },
      'body-scan': {
        title: 'Body Scan Meditation',
        content: '<p>This 15-minute body scan meditation will help increase body awareness and reduce tension. Lie down or sit comfortably and follow the guidance.</p><div class="audio-player"><audio controls><source src="#" type="audio/mpeg">Your browser does not support the audio element.</audio></div>',
        buttonText: 'Start Meditation'
      },
      'anxiety-article': {
        title: 'Understanding Anxiety',
        content: '<p>Anxiety is a normal and often healthy emotion. However, when a person regularly feels disproportionate levels of anxiety, it might become a medical disorder.</p><div class="article-content"><h4>Common Symptoms</h4><ul><li>Excessive worrying</li><li>Restlessness</li><li>Difficulty concentrating</li><li>Sleep problems</li></ul><h4>Coping Strategies</h4><ul><li>Practice deep breathing</li><li>Exercise regularly</li><li>Limit caffeine and alcohol</li><li>Get enough sleep</li></ul></div>',
        buttonText: 'Read Article'
      }
      // Add more resources as needed
    };
    
    return resources[resource] || {
      title: 'Resource',
      content: '<p>Resource content not available.</p>',
      buttonText: 'Start'
    };
  }
  
  function searchLocalResources(zipCode) {
    // Simulate API call to find local resources
    const resultsDiv = document.getElementById('locationResults');
    resultsDiv.innerHTML = '<p>Searching for resources in your area...</p>';
    
    setTimeout(() => {
      // Mock data - in a real app, this would come from an API
      const mockResults = [
        { name: 'Community Mental Health Center', distance: '2.3 miles', phone: '(555) 123-4567' },
        { name: 'Family Counseling Services', distance: '3.1 miles', phone: '(555) 234-5678' },
        { name: 'Wellness Support Group', distance: '1.8 miles', phone: '(555) 345-6789' }
      ];
      
      let resultsHTML = '<h4>Local Resources Found:</h4>';
      mockResults.forEach(result => {
        resultsHTML += `
          <div class="local-resource">
            <h5>${result.name}</h5>
            <p>Distance: ${result.distance} | Phone: ${result.phone}</p>
            <button class="secondary-btn" onclick="window.location.href='tel:${result.phone}'">Call</button>
          </div>
        `;
      });
      
      resultsDiv.innerHTML = resultsHTML;
    }, 1500);
  }
  
  function updateResourceStats() {
    const resources = JSON.parse(localStorage.getItem('resourceActivity') || '[]');
    document.getElementById('accessedCount').textContent = resources.length;
    
    if (resources.length > 0) {
      const lastResource = resources[resources.length - 1];
      document.getElementById('lastAccessed').textContent = lastResource.name;
      
      // Find most accessed resource
      const accessCount = {};
      resources.forEach(resource => {
        accessCount[resource.name] = (accessCount[resource.name] || 0) + 1;
      });
      
      const mostAccessed = Object.keys(accessCount).reduce((a, b) => 
        accessCount[a] > accessCount[b] ? a : b
      );
      document.getElementById('mostHelpful').textContent = mostAccessed;
    }
  }
  
  // Initialize resource stats
  updateResourceStats();
});