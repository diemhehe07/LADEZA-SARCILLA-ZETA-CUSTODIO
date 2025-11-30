// booking.js - Booking page functionality

document.addEventListener('DOMContentLoaded', function () {
  // Booking state
  const bookingState = {
    currentStep: 1,
    selectedService: null,
    selectedTherapist: null,
    selectedDate: null,
    selectedTime: null,
    personalDetails: {},
    // Match keys with data-service in HTML
    services: {
      academic: {
        name: 'Academic Stress Counseling',
        duration: '50 min',
        price: 0
      },
      career: {
        name: 'Career & Future Planning',
        duration: '60 min',
        price: 0
      },
      adjustment: {
        name: 'College Adjustment Support',
        duration: '45 min',
        price: 0
      },
      social: {
        name: 'Social Skills & Relationships',
        duration: '50 min',
        price: 0
      },
      crisis: {
        name: 'Crisis Intervention',
        duration: '30–60 min',
        price: 0
      }
    },
    therapists: {
      maria: { name: 'Dr. Maria Santos', specialty: 'Head Campus Psychologist' },
      james: { name: 'Prof. James Reyes', specialty: 'Guidance Counselor' },
      andrea: { name: 'Dr. Andrea Cruz', specialty: 'Student Wellness Coordinator' },
      carlos: { name: 'Dr. Carlos Lim', specialty: 'Clinical Psychologist' }
    }
  };

  initBookingSystem();

  function initBookingSystem() {
    initStepNavigation();
    initServiceSelection();
    initTherapistSelection();
    initCalendar();
    initTimeSlots();
    initFormValidation();
    initBookingConfirmation();
    updateSidebar();
    checkUserRole();
  }

  // ---------------------------
  // Check User Role
  // ---------------------------
  function checkUserRole() {
    const therapistActionsCard = document.getElementById('therapistActionsCard');
    if (!therapistActionsCard) return;

    // Check if user is logged in and is a therapist/counselor
    const userDataStr = localStorage.getItem('slsuUser');
    if (!userDataStr) {
      return; // User not logged in
    }

    try {
      const userData = JSON.parse(userDataStr);
      
      // Show therapist actions only for therapists/counselors
      if (userData.userType === 'therapist') {
        therapistActionsCard.style.display = 'block';
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }

  // ---------------------------
  // Step navigation
  // ---------------------------
  function initStepNavigation() {
    document.querySelectorAll('.next-step').forEach(button => {
      button.addEventListener('click', function () {
        const nextStep = parseInt(this.getAttribute('data-next'), 10);

        // For step 4 → 5, ensure personal details are valid & summary updated
        if (bookingState.currentStep === 4 && nextStep === 5) {
          if (!validatePersonalDetails()) {
            return;
          }
          updateBookingSummary();
        }

        if (validateCurrentStep(bookingState.currentStep)) {
          navigateToStep(nextStep);
        }
      });
    });

    document.querySelectorAll('.prev-step').forEach(button => {
      button.addEventListener('click', function () {
        const prevStep = parseInt(this.getAttribute('data-prev'), 10);
        navigateToStep(prevStep);
      });
    });
  }

  function navigateToStep(step) {
    document.getElementById(`step${bookingState.currentStep}`).classList.remove('active');
    document.querySelector(`.step[data-step="${bookingState.currentStep}"]`).classList.remove('active');

    document.getElementById(`step${step}`).classList.add('active');
    document.querySelector(`.step[data-step="${step}"]`).classList.add('active');

    const progressPercentage = ((step - 1) / 4) * 100;
    document.getElementById('progressFill').style.width = `${progressPercentage}%`;

    bookingState.currentStep = step;
    updateSidebar();

    document.getElementById(`step${step}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validateCurrentStep(step) {
    switch (step) {
      case 1:
        if (!bookingState.selectedService) {
          showValidationError('Please select a service to continue.');
          return false;
        }
        return true;
      case 2:
        if (!bookingState.selectedTherapist) {
          showValidationError('Please select a counselor to continue.');
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
        // validation handled when going to step 5
        return true;
      default:
        return true;
    }
  }

  function showValidationError(message) {
    let errorDiv = document.querySelector('.validation-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'validation-error message error';
      const actions = document.querySelector(`#step${bookingState.currentStep} .step-actions`);
      if (actions) actions.prepend(errorDiv);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';

    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }

  // ---------------------------
  // Service selection
  // ---------------------------
  function initServiceSelection() {
    document.querySelectorAll('.service-option').forEach(option => {
      option.addEventListener('click', function () {
        const serviceId = this.getAttribute('data-service');

        document.querySelectorAll('.service-option').forEach(opt => {
          opt.classList.remove('selected');
        });

        this.classList.add('selected');
        bookingState.selectedService = serviceId;
        updateSidebar();
      });
    });
  }

  // ---------------------------
  // Therapist selection
  // ---------------------------
  function initTherapistSelection() {
    document.querySelectorAll('.therapist-option').forEach(option => {
      option.addEventListener('click', function () {
        const therapistId = this.getAttribute('data-therapist');

        document.querySelectorAll('.therapist-option').forEach(opt => {
          opt.classList.remove('selected');
        });

        this.classList.add('selected');
        bookingState.selectedTherapist = therapistId;
        updateSidebar();
      });
    });
  }

  // ---------------------------
  // Calendar
  // ---------------------------
  function initCalendar() {
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    function renderCalendar() {
      const calendarElement = document.getElementById('calendar');
      const monthYearElement = document.getElementById('currentMonth');

      monthYearElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
      calendarElement.innerHTML = '';

      const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dayHeaders.forEach(day => {
        const headerElement = document.createElement('div');
        headerElement.className = 'calendar-header';
        headerElement.textContent = day;
        calendarElement.appendChild(headerElement);
      });

      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      for (let i = 0; i < firstDay; i++) {
        const emptyElement = document.createElement('div');
        emptyElement.className = 'calendar-day disabled';
        calendarElement.appendChild(emptyElement);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        const currentDay = new Date(currentYear, currentMonth, day);
        currentDay.setHours(0, 0, 0, 0);

        if (currentDay < today) {
          dayElement.classList.add('disabled');
        } else {
          dayElement.addEventListener('click', function () {
            selectDate(currentDay);
          });

          if (currentDay.getTime() === today.getTime()) {
            dayElement.classList.add('today');
          }
        }

        if (
          bookingState.selectedDate &&
          currentDay.getTime() === bookingState.selectedDate.getTime()
        ) {
          dayElement.classList.add('selected');
        }

        calendarElement.appendChild(dayElement);
      }
    }

    function selectDate(date) {
      bookingState.selectedDate = date;
      bookingState.selectedTime = null;
      renderCalendar();
      generateTimeSlots();
      updateSidebar();
    }

    document.getElementById('prevMonth').addEventListener('click', function () {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', function () {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar();
    });

    renderCalendar();
  }

  // ---------------------------
  // Time slots
  // ---------------------------
  function initTimeSlots() {
    generateTimeSlots();
  }

  function generateTimeSlots() {
    const timeslotContainer = document.getElementById('timeslotOptions');
    const noSlotsMessage = document.getElementById('noSlotsMessage');

    timeslotContainer.innerHTML = '';

    if (!bookingState.selectedDate) {
      noSlotsMessage.style.display = 'block';
      timeslotContainer.style.display = 'none';
      return;
    }

    const timeSlots = [];
    const startHour = 8;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`;
        const displayTime = `${
          hour > 12 ? hour - 12 : hour
        }:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;

        timeSlots.push({
          time: timeString,
          display: displayTime,
          available: Math.random() > 0.3
        });
      }
    }

    const availableSlots = timeSlots.filter(slot => slot.available);

    if (!availableSlots.length) {
      noSlotsMessage.style.display = 'block';
      timeslotContainer.style.display = 'none';
      return;
    }

    noSlotsMessage.style.display = 'none';
    timeslotContainer.style.display = 'grid';

    availableSlots.forEach(slot => {
      const timeslotElement = document.createElement('div');
      timeslotElement.className = 'timeslot';
      timeslotElement.textContent = slot.display;
      timeslotElement.setAttribute('data-time', slot.time);

      timeslotElement.addEventListener('click', function () {
        document.querySelectorAll('.timeslot').forEach(ts => {
          ts.classList.remove('selected');
        });

        this.classList.add('selected');
        bookingState.selectedTime = slot.time;
        updateSidebar();
      });

      if (bookingState.selectedTime === slot.time) {
        timeslotElement.classList.add('selected');
      }

      timeslotContainer.appendChild(timeslotElement);
    });
  }

  // ---------------------------
  // Personal details validation
  // ---------------------------
  function initFormValidation() {
    const form = document.querySelector('.personal-details-form');
    if (!form) return;

    form.addEventListener('input', function () {
      updateBookingSummary();
    });
  }

  function validatePersonalDetails() {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'studentId', 'courseYear'];
    let isValid = true;

    requiredFields.forEach(fieldId => {
      const input = document.getElementById(fieldId);
      if (!input) return;

      if (!input.value.trim()) {
        input.style.borderColor = 'var(--accent-5)';
        isValid = false;
      } else {
        input.style.borderColor = '';
      }
    });

    // ✅ Gmail-only requirement
    const emailInput = document.getElementById('email');
    if (emailInput) {
      const email = emailInput.value.trim();
      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

      if (!gmailRegex.test(email)) {
        showValidationError('Please enter a valid Gmail address (example@gmail.com).');
        emailInput.style.borderColor = 'var(--accent-5)';
        isValid = false;
      }
    }

    const privacyConsent = document.getElementById('privacyConsent');
    const cancellationConsent = document.getElementById('cancellationConsent');
    const studentConsent = document.getElementById('studentConsent');

    if (!privacyConsent.checked || !cancellationConsent.checked || !studentConsent.checked) {
      showValidationError('Please agree to the required consents before continuing.');
      isValid = false;
    }

    return isValid;
  }

  // ---------------------------
  // Booking confirmation
  // ---------------------------
  function initBookingConfirmation() {
    const confirmBtn = document.getElementById('confirmBooking');
    if (!confirmBtn) return;

    confirmBtn.addEventListener('click', function () {
      if (!bookingState.selectedService || !bookingState.selectedTherapist || !bookingState.selectedDate || !bookingState.selectedTime) {
        showValidationError('Missing booking details. Please review your information.');
        return;
      }

      submitBooking();
    });
  }

  function submitBooking() {
    const confirmBtn = document.getElementById('confirmBooking');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Processing...';
    confirmBtn.disabled = true;

    setTimeout(() => {
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

      const bookings = JSON.parse(localStorage.getItem('therapyBookings') || '[]');
      bookings.push(bookingData);
      localStorage.setItem('therapyBookings', JSON.stringify(bookings));

      // Save to Firestore as well
      if (window.FirebaseService && FirebaseService.isReady()) {
        const user = FirebaseService.getCurrentUser();
        const dataToSave = {
          ...bookingData,
          userId: user ? user.uid : null,
          userEmail: user
            ? user.email
            : bookingData.personalDetails && bookingData.personalDetails.email
              ? bookingData.personalDetails.email
              : null,
          source: 'booking-page'
        };

        FirebaseService.saveDocument('bookings', dataToSave).catch(err => {
          console.error('Error saving booking to Firestore:', err);
        });
      }

      showSuccessModal(bookingData);

      confirmBtn.textContent = originalText;
      confirmBtn.disabled = false;
    }, 1500);
  }

  function generateBookingId() {
    return 'BK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  function getPersonalDetails() {
    return {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      studentId: document.getElementById('studentId').value.trim(),
      courseYear: document.getElementById('courseYear').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      preferredContact: document.getElementById('preferredContact').value,
      sessionType: document.getElementById('sessionType').value,
      concerns: document.getElementById('concerns').value.trim(),
      emergencyContact: document.getElementById('emergencyContact').value.trim()
    };
  }

  function showSuccessModal(bookingData) {
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

    document.getElementById('successModal').style.display = 'block';
  }

  function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  }

  // ---------------------------
  // Sidebar + Summary
  // ---------------------------
  function updateSidebar() {
    const serviceElement = document.getElementById('sidebarService');
    const therapistElement = document.getElementById('sidebarTherapist');
    const dateTimeElement = document.getElementById('sidebarDateTime');
    const totalElement = document.getElementById('sidebarTotal');

    if (bookingState.selectedService && bookingState.services[bookingState.selectedService]) {
      serviceElement.textContent = bookingState.services[bookingState.selectedService].name;
      totalElement.textContent = 'Free for SLSU Students';
    } else {
      serviceElement.textContent = 'Not selected';
      totalElement.textContent = 'Free for SLSU Students';
    }

    if (bookingState.selectedTherapist && bookingState.therapists[bookingState.selectedTherapist]) {
      therapistElement.textContent = bookingState.therapists[bookingState.selectedTherapist].name;
    } else {
      therapistElement.textContent = 'Not selected';
    }

    if (bookingState.selectedDate && bookingState.selectedTime) {
      const formattedDate = bookingState.selectedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const formattedTime = formatTime(bookingState.selectedTime);
      dateTimeElement.textContent = `${formattedDate} at ${formattedTime}`;
    } else {
      dateTimeElement.textContent = 'Not selected';
    }
  }

  function updateBookingSummary() {
    const personalDetails = getPersonalDetails();

    if (bookingState.selectedService && bookingState.services[bookingState.selectedService]) {
      document.getElementById('summaryService').textContent =
        bookingState.services[bookingState.selectedService].name;
      document.getElementById('summaryDuration').textContent =
        bookingState.services[bookingState.selectedService].duration;
      document.getElementById('summaryTotal').textContent = 'Free for SLSU Students';
    }

    if (bookingState.selectedTherapist && bookingState.therapists[bookingState.selectedTherapist]) {
      document.getElementById('summaryTherapist').textContent =
        bookingState.therapists[bookingState.selectedTherapist].name;
    }

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

    const sessionTypeSelect = document.getElementById('sessionType');
    if (sessionTypeSelect) {
      document.getElementById('summaryFormat').textContent =
        sessionTypeSelect.options[sessionTypeSelect.selectedIndex].text;
    }

    document.getElementById('summaryName').textContent =
      `${personalDetails.firstName} ${personalDetails.lastName}`.trim() || '-';
    document.getElementById('summaryStudentId').textContent = personalDetails.studentId || '-';
    document.getElementById('summaryCourseYear').textContent = personalDetails.courseYear || '-';
    document.getElementById('summaryEmail').textContent = personalDetails.email || '-';

    const contactSelect = document.getElementById('preferredContact');
    if (contactSelect) {
      document.getElementById('summaryContactMethod').textContent =
        contactSelect.options[contactSelect.selectedIndex].text;
    }
  }

  // ---------------------------
  // Modal close
  // ---------------------------
  window.addEventListener('click', function (e) {
    const modal = document.getElementById('successModal');
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('successModal');
      if (modal) modal.style.display = 'none';
    }
  });
});