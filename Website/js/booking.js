// booking.js - Booking page functionality

document.addEventListener('DOMContentLoaded', function() {
  // Booking state
  const bookingState = {
    currentStep: 1,
    selectedService: null,
    selectedTherapist: null,
    selectedDate: null,
    selectedTime: null,
    personalDetails: {},
    services: {
      'cbt': { name: 'Cognitive Behavioral Therapy', duration: '50 min', price: 120 },
      'couples': { name: 'Couples Therapy', duration: '75 min', price: 150 },
      'trauma': { name: 'Trauma-Informed Care', duration: '60 min', price: 140 },
      'child': { name: 'Child & Adolescent Therapy', duration: '45 min', price: 130 },
      'online': { name: 'Online Therapy', duration: '50 min', price: 110 }
    },
    therapists: {
      'sarah': { name: 'Dr. Sarah Johnson', specialty: 'Clinical Psychologist' },
      'michael': { name: 'Michael Chen', specialty: 'Licensed Therapist' },
      'elena': { name: 'Dr. Elena Rodriguez', specialty: 'Psychiatrist' },
      'david': { name: 'David Thompson', specialty: 'Couples Therapist' }
    }
  };

  // Initialize booking system
  initBookingSystem();

  function initBookingSystem() {
    // Initialize step navigation
    initStepNavigation();
    
    // Initialize service selection
    initServiceSelection();
    
    // Initialize therapist selection
    initTherapistSelection();
    
    // Initialize calendar
    initCalendar();
    
    // Initialize time slots
    initTimeSlots();
    
    // Initialize form validation
    initFormValidation();
    
    // Initialize booking confirmation
    initBookingConfirmation();
    
    // Update sidebar initially
    updateSidebar();
  }

  function initStepNavigation() {
    // Next step buttons
    document.querySelectorAll('.next-step').forEach(button => {
      button.addEventListener('click', function() {
        const nextStep = parseInt(this.getAttribute('data-next'));
        if (validateCurrentStep(bookingState.currentStep)) {
          navigateToStep(nextStep);
        }
      });
    });

    // Previous step buttons
    document.querySelectorAll('.prev-step').forEach(button => {
      button.addEventListener('click', function() {
        const prevStep = parseInt(this.getAttribute('data-prev'));
        navigateToStep(prevStep);
      });
    });
  }

  function navigateToStep(step) {
    // Hide current step
    document.getElementById(`step${bookingState.currentStep}`).classList.remove('active');
    document.querySelector(`.step[data-step="${bookingState.currentStep}"]`).classList.remove('active');

    // Show new step
    document.getElementById(`step${step}`).classList.add('active');
    document.querySelector(`.step[data-step="${step}"]`).classList.add('active');

    // Update progress bar
    const progressPercentage = ((step - 1) / 4) * 100;
    document.getElementById('progressFill').style.width = `${progressPercentage}%`;

    // Update current step
    bookingState.currentStep = step;

    // Update sidebar
    updateSidebar();

    // Scroll to top of step
    document.getElementById(`step${step}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validateCurrentStep(step) {
    switch(step) {
      case 1:
        if (!bookingState.selectedService) {
          showValidationError('Please select a service to continue.');
          return false;
        }
        return true;
      
      case 2:
        if (!bookingState.selectedTherapist) {
          showValidationError('Please select a therapist to continue.');
          return false;
        }
        return true;
      
      case 3:
        if (!bookingState.selectedDate || !bookingState.selectedTime) {
          showValidationError('Please select a date and time to continue.');
          return false;
        }
        return true;
      
      case 4:
        // Form validation will be handled separately
        return true;
      
      default:
        return true;
    }
  }

  function showValidationError(message) {
    // Create or show validation message
    let errorDiv = document.querySelector('.validation-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'validation-error message error';
      document.querySelector(`#step${bookingState.currentStep} .step-actions`).prepend(errorDiv);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';

    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Hide error after 5 seconds
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }

  function initServiceSelection() {
    document.querySelectorAll('.service-option').forEach(option => {
      option.addEventListener('click', function() {
        const serviceId = this.getAttribute('data-service');
        
        // Remove selection from all options
        document.querySelectorAll('.service-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        
        // Add selection to clicked option
        this.classList.add('selected');
        
        // Update booking state
        bookingState.selectedService = serviceId;
        
        // Update sidebar
        updateSidebar();
      });
    });
  }

  function initTherapistSelection() {
    document.querySelectorAll('.therapist-option').forEach(option => {
      option.addEventListener('click', function() {
        const therapistId = this.getAttribute('data-therapist');
        
        // Remove selection from all options
        document.querySelectorAll('.therapist-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        
        // Add selection to clicked option
        this.classList.add('selected');
        
        // Update booking state
        bookingState.selectedTherapist = therapistId;
        
        // Update sidebar
        updateSidebar();
      });
    });
  }

  function initCalendar() {
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    function renderCalendar() {
      const calendarElement = document.getElementById('calendar');
      const monthYearElement = document.getElementById('currentMonth');
      
      // Update month/year display
      monthYearElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
      
      // Clear calendar
      calendarElement.innerHTML = '';
      
      // Add day headers
      const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dayHeaders.forEach(day => {
        const headerElement = document.createElement('div');
        headerElement.className = 'calendar-header';
        headerElement.textContent = day;
        calendarElement.appendChild(headerElement);
      });
      
      // Get first day of month and number of days
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      // Add empty cells for days before first day of month
      for (let i = 0; i < firstDay; i++) {
        const emptyElement = document.createElement('div');
        emptyElement.className = 'calendar-day disabled';
        calendarElement.appendChild(emptyElement);
      }
      
      // Add days of month
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDay = new Date(currentYear, currentMonth, day);
        currentDay.setHours(0, 0, 0, 0);
        
        // Disable past dates
        if (currentDay < today) {
          dayElement.classList.add('disabled');
        } else {
          dayElement.addEventListener('click', function() {
            selectDate(currentDay);
          });
          
          // Mark today
          if (currentDay.getTime() === today.getTime()) {
            dayElement.classList.add('today');
          }
        }
        
        // Mark selected date
        if (bookingState.selectedDate && 
            currentDay.getTime() === bookingState.selectedDate.getTime()) {
          dayElement.classList.add('selected');
        }
        
        calendarElement.appendChild(dayElement);
      }
    }

    function selectDate(date) {
      bookingState.selectedDate = date;
      bookingState.selectedTime = null; // Reset time when date changes
      renderCalendar();
      generateTimeSlots();
      updateSidebar();
    }

    // Navigation buttons
    document.getElementById('prevMonth').addEventListener('click', function() {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', function() {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar();
    });

    // Initial render
    renderCalendar();
  }

  function initTimeSlots() {
    generateTimeSlots();
  }

  function generateTimeSlots() {
    const timeslotContainer = document.getElementById('timeslotOptions');
    const noSlotsMessage = document.getElementById('noSlotsMessage');
    
    // Clear existing time slots
    timeslotContainer.innerHTML = '';
    
    if (!bookingState.selectedDate) {
      noSlotsMessage.style.display = 'block';
      return;
    }
    
    // Generate time slots (9 AM to 5 PM, every 30 minutes)
    const timeSlots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = `${hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
        
        timeSlots.push({
          time: timeString,
          display: displayTime,
          available: Math.random() > 0.3 // 70% chance of being available
        });
      }
    }
    
    // Filter available time slots
    const availableSlots = timeSlots.filter(slot => slot.available);
    
    if (availableSlots.length === 0) {
      noSlotsMessage.style.display = 'block';
      timeslotContainer.style.display = 'none';
    } else {
      noSlotsMessage.style.display = 'none';
      timeslotContainer.style.display = 'grid';
      
      availableSlots.forEach(slot => {
        const timeslotElement = document.createElement('div');
        timeslotElement.className = 'timeslot';
        timeslotElement.textContent = slot.display;
        timeslotElement.setAttribute('data-time', slot.time);
        
        timeslotElement.addEventListener('click', function() {
          // Remove selection from all time slots
          document.querySelectorAll('.timeslot').forEach(ts => {
            ts.classList.remove('selected');
          });
          
          // Add selection to clicked time slot
          this.classList.add('selected');
          
          // Update booking state
          bookingState.selectedTime = slot.time;
          
          // Update sidebar
          updateSidebar();
        });
        
        // Mark as selected if this time is already selected
        if (bookingState.selectedTime === slot.time) {
          timeslotElement.classList.add('selected');
        }
        
        timeslotContainer.appendChild(timeslotElement);
      });
    }
  }

  function initFormValidation() {
    const form = document.querySelector('.personal-details-form');
    
    form.addEventListener('input', function() {
      // Real-time validation could be added here
      updateBookingSummary();
    });
  }

  function initBookingConfirmation() {
    document.getElementById('confirmBooking').addEventListener('click', function() {
      if (validatePersonalDetails()) {
        submitBooking();
      }
    });
  }

  function validatePersonalDetails() {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
    let isValid = true;
    
    requiredFields.forEach(field => {
      const input = document.getElementById(field);
      if (!input.value.trim()) {
        input.style.borderColor = 'var(--accent-5)';
        isValid = false;
      } else {
        input.style.borderColor = '';
      }
    });
    
    const privacyConsent = document.getElementById('privacyConsent');
    const cancellationConsent = document.getElementById('cancellationConsent');
    
    if (!privacyConsent.checked || !cancellationConsent.checked) {
      showValidationError('Please agree to the privacy policy and cancellation policy.');
      isValid = false;
    }
    
    return isValid;
  }

  function submitBooking() {
    // Show loading state
    const confirmBtn = document.getElementById('confirmBooking');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Processing...';
    confirmBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
      // Store booking in localStorage
      const bookings = JSON.parse(localStorage.getItem('therapyBookings') || '[]');
      const bookingData = {
        id: generateBookingId(),
        service: bookingState.selectedService,
        therapist: bookingState.selectedTherapist,
        date: bookingState.selectedDate.toISOString(),
        time: bookingState.selectedTime,
        personalDetails: getPersonalDetails(),
        status: 'confirmed',
        bookedAt: new Date().toISOString()
      };
      
      bookings.push(bookingData);
      localStorage.setItem('therapyBookings', JSON.stringify(bookings));
      
      // Show success modal
      showSuccessModal(bookingData);
      
      // Reset button
      confirmBtn.textContent = originalText;
      confirmBtn.disabled = false;
    }, 2000);
  }

  function generateBookingId() {
    return 'BK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  function getPersonalDetails() {
    return {
      firstName: document.getElementById('firstName').value,
      lastName: document.getElementById('lastName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      preferredContact: document.getElementById('preferredContact').value,
      sessionType: document.getElementById('sessionType').value,
      concerns: document.getElementById('concerns').value,
      emergencyContact: document.getElementById('emergencyContact').value
    };
  }

  function showSuccessModal(bookingData) {
    // Populate success modal
    document.getElementById('confirmationNumber').textContent = bookingData.id;
    
    const appointmentDate = new Date(bookingData.date);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = formatTime(bookingData.time);
    document.getElementById('successDateTime').textContent = `${formattedDate} at ${formattedTime}`;
    
    document.getElementById('successTherapist').textContent = 
      bookingState.therapists[bookingData.therapist].name;
    
    // Show modal
    document.getElementById('successModal').style.display = 'block';
  }

  function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  }

  function updateSidebar() {
    // Update service
    const serviceElement = document.getElementById('sidebarService');
    if (bookingState.selectedService) {
      serviceElement.textContent = bookingState.services[bookingState.selectedService].name;
    } else {
      serviceElement.textContent = 'Not selected';
    }
    
    // Update therapist
    const therapistElement = document.getElementById('sidebarTherapist');
    if (bookingState.selectedTherapist) {
      therapistElement.textContent = bookingState.therapists[bookingState.selectedTherapist].name;
    } else {
      therapistElement.textContent = 'Not selected';
    }
    
    // Update date & time
    const dateTimeElement = document.getElementById('sidebarDateTime');
    if (bookingState.selectedDate && bookingState.selectedTime) {
      const formattedDate = bookingState.selectedDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      const formattedTime = formatTime(bookingState.selectedTime);
      dateTimeElement.textContent = `${formattedDate} at ${formattedTime}`;
    } else {
      dateTimeElement.textContent = 'Not selected';
    }
    
    // Update total
    const totalElement = document.getElementById('sidebarTotal');
    if (bookingState.selectedService) {
      totalElement.textContent = `$${bookingState.services[bookingState.selectedService].price}`;
    } else {
      totalElement.textContent = '$0';
    }
  }

  function updateBookingSummary() {
    const personalDetails = getPersonalDetails();
    
    // Update service details
    if (bookingState.selectedService) {
      document.getElementById('summaryService').textContent = 
        bookingState.services[bookingState.selectedService].name;
      document.getElementById('summaryDuration').textContent = 
        bookingState.services[bookingState.selectedService].duration;
      document.getElementById('summaryTotal').textContent = 
        `$${bookingState.services[bookingState.selectedService].price}`;
    }
    
    // Update therapist
    if (bookingState.selectedTherapist) {
      document.getElementById('summaryTherapist').textContent = 
        bookingState.therapists[bookingState.selectedTherapist].name;
    }
    
    // Update date & time
    if (bookingState.selectedDate && bookingState.selectedTime) {
      const formattedDate = bookingState.selectedDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const formattedTime = formatTime(bookingState.selectedTime);
      document.getElementById('summaryDateTime').textContent = 
        `${formattedDate} at ${formattedTime}`;
    }
    
    // Update format
    document.getElementById('summaryFormat').textContent = 
      document.getElementById('sessionType').options[document.getElementById('sessionType').selectedIndex].text;
    
    // Update personal information
    document.getElementById('summaryName').textContent = 
      `${personalDetails.firstName} ${personalDetails.lastName}`;
    document.getElementById('summaryEmail').textContent = personalDetails.email;
    document.getElementById('summaryPhone').textContent = personalDetails.phone;
    document.getElementById('summaryContactMethod').textContent = 
      document.getElementById('preferredContact').options[document.getElementById('preferredContact').selectedIndex].text;
  }

  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    const modal = document.getElementById('successModal');
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Close modal with escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.getElementById('successModal').style.display = 'none';
    }
  });
});