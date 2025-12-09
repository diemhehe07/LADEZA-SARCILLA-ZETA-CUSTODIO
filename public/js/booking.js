// booking.js - Complete Fix for All Booking Page Issues

// ================================
// FIREBASE INTEGRATION FUNCTIONS
// ================================

async function saveBookingToFirebase(bookingData) {
  try {
    console.log("🔥 Attempting to save booking to Firebase...");
    
    if (!window.FirebaseService || !window.FirebaseService.isReady()) {
      console.warn("FirebaseService not ready, saving to localStorage only");
      throw new Error("Firebase not available");
    }

    const currentUser = FirebaseService.getCurrentUser ? FirebaseService.getCurrentUser() : null;
    
    const firebaseData = {
      // Core booking info
      id: bookingData.id,
      bookingId: bookingData.id,
      service: bookingData.service,
      serviceName: bookingData.serviceName,
      therapist: bookingData.therapist,
      therapistName: bookingData.therapistName,
      date: bookingData.date,
      time: bookingData.time,
      duration: bookingData.duration,
      format: bookingData.format,
      formatText: bookingData.formatText,
      
      // Student information
      firstName: bookingData.firstName,
      lastName: bookingData.lastName,
      fullName: `${bookingData.firstName} ${bookingData.lastName}`,
      studentId: bookingData.studentId,
      courseYear: bookingData.courseYear,
      email: bookingData.email,
      phone: bookingData.phone,
      preferredContact: bookingData.preferredContact,
      preferredContactValue: bookingData.preferredContactValue,
      sessionType: bookingData.sessionType,
      concerns: bookingData.concerns || "",
      emergencyContact: bookingData.emergencyContact || "",
      
      // Consent flags
      privacyConsent: bookingData.privacyConsent,
      cancellationConsent: bookingData.cancellationConsent,
      studentConsent: bookingData.studentConsent,
      
      // System fields
      status: "confirmed",
      bookedAt: new Date().toISOString(),
      source: "booking-page",
      page: window.location.pathname,
      
      // User info if logged in
      userEmail: currentUser ? currentUser.email : bookingData.email,
      userId: currentUser ? currentUser.uid : null
    };

    console.log("📦 Prepared Firebase data:", firebaseData);
    const result = await window.FirebaseService.saveDocument("bookings", firebaseData);
    console.log("✅ Successfully saved to Firebase with ID:", result);
    return { success: true, firestoreId: result };
    
  } catch (error) {
    console.error("❌ Error saving to Firebase:", error);
    throw error;
  }
}

function saveBookingToLocalStorage(bookingData) {
  try {
    const existingBookings = JSON.parse(localStorage.getItem("slsuBookings") || "[]");
    existingBookings.push(bookingData);
    localStorage.setItem("slsuBookings", JSON.stringify(existingBookings));
    console.log("💾 Saved backup to localStorage");
    return true;
  } catch (error) {
    console.warn("⚠️ Could not save to localStorage:", error);
    return false;
  }
}

// ================================
// MAIN BOOKING SYSTEM
// ================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Booking page loaded - Starting initialization");
  
  // Booking state
  const bookingState = {
    currentStep: 1,
    selectedService: null,
    selectedTherapist: null,
    selectedDate: null,
    selectedTime: null,
    services: {
      academic: {
        name: "Academic Stress Counseling",
        duration: "50 min",
        price: "Free for SLSU Students"
      },
      career: {
        name: "Career & Future Planning",
        duration: "60 min",
        price: "Free for SLSU Students"
      },
      adjustment: {
        name: "College Adjustment Support",
        duration: "45 min",
        price: "Free for SLSU Students"
      },
      social: {
        name: "Social Skills & Relationships",
        duration: "50 min",
        price: "Free for SLSU Students"
      },
      crisis: {
        name: "Crisis Intervention",
        duration: "30-60 min",
        price: "Free for SLSU Students"
      }
    },
    therapists: {
      maria: { 
        name: "Dr. Maria Santos", 
        specialty: "Head Campus Psychologist",
        experience: "10 years",
        rating: "4.9"
      },
      james: { 
        name: "Prof. James Reyes", 
        specialty: "Guidance Counselor",
        experience: "8 years",
        rating: "4.8"
      },
      andrea: {
        name: "Dr. Andrea Cruz",
        specialty: "Student Wellness Coordinator",
        experience: "7 years",
        rating: "4.9"
      },
      carlos: {
        name: "Dr. Carlos Lim",
        specialty: "Clinical Psychologist",
        experience: "12 years",
        rating: "4.9"
      }
    }
  };

  // Initialize everything
  initBookingSystem();

  function initBookingSystem() {
    console.log("⚙️ Initializing booking system...");
    
    // Set up all event listeners
    initStepNavigation();
    initServiceSelection();
    initTherapistSelection();
    initCalendar();
    initTimeSlots();
    initFormUpdates();
    initBookingConfirmation();
    initModalHandlers();
    updateSidebar();
    
    console.log("✅ Booking system initialized");
  }

  function initStepNavigation() {
    console.log("🔄 Initializing step navigation...");
    
    // Next step buttons
    document.querySelectorAll(".next-step").forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        const nextStep = parseInt(this.getAttribute("data-next"));
        console.log(`➡️ Next step clicked: ${nextStep}`);
        
        if (validateCurrentStep(bookingState.currentStep)) {
          console.log(`✅ Step ${bookingState.currentStep} validated, proceeding to step ${nextStep}`);
          
          if (nextStep === 5) {
            console.log("📋 Updating booking summary for final review...");
            updateBookingSummary();
          }
          
          navigateToStep(nextStep);
        } else {
          console.log(`❌ Step ${bookingState.currentStep} validation failed`);
        }
      });
    });

    // Previous step buttons
    document.querySelectorAll(".prev-step").forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        const prevStep = parseInt(this.getAttribute("data-prev"));
        console.log(`⬅️ Previous step clicked: ${prevStep}`);
        navigateToStep(prevStep);
      });
    });
  }

  function navigateToStep(step) {
    console.log(`🧭 Navigating from step ${bookingState.currentStep} to step ${step}`);
    
    // Hide current step
    const currentStepEl = document.getElementById(`step${bookingState.currentStep}`);
    const currentProgressEl = document.querySelector(`.step[data-step="${bookingState.currentStep}"]`);
    
    if (currentStepEl) currentStepEl.classList.remove("active");
    if (currentProgressEl) currentProgressEl.classList.remove("active");

    // Show new step
    const newStepEl = document.getElementById(`step${step}`);
    const newProgressEl = document.querySelector(`.step[data-step="${step}"]`);
    
    if (newStepEl) newStepEl.classList.add("active");
    if (newProgressEl) newProgressEl.classList.add("active");

    // Update progress bar
    const progressFill = document.getElementById("progressFill");
    if (progressFill) {
      const progressPercentage = ((step - 1) / 4) * 100;
      progressFill.style.width = `${progressPercentage}%`;
      console.log(`📊 Progress: ${progressPercentage}%`);
    }

    // Update state
    bookingState.currentStep = step;
    
    // Update sidebar
    updateSidebar();
    
    // Scroll to step
    if (newStepEl) {
      setTimeout(() => {
        newStepEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }

  function validateCurrentStep(step) {
    console.log(`🔍 Validating step ${step}...`);
    
    switch (step) {
      case 1:
        if (!bookingState.selectedService) {
          showValidationError("Please select a service to continue.");
          return false;
        }
        console.log("✅ Step 1: Service selected");
        return true;

      case 2:
        if (!bookingState.selectedTherapist) {
          showValidationError("Please select a counselor to continue.");
          return false;
        }
        console.log("✅ Step 2: Therapist selected");
        return true;

      case 3:
        if (!bookingState.selectedDate || !bookingState.selectedTime) {
          showValidationError("Please select a date and time to continue.");
          return false;
        }
        console.log("✅ Step 3: Date and time selected");
        return true;

      case 4: {
        console.log("📝 Validating form fields...");
        
        const requiredFields = [
          "firstName",
          "lastName", 
          "studentId",
          "courseYear",
          "email",
          "phone"
        ];
        
        let isValid = true;
        const missingFields = [];

        requiredFields.forEach((field) => {
          const input = document.getElementById(field);
          if (!input) {
            console.error(`❌ Input field not found: ${field}`);
            missingFields.push(field);
            isValid = false;
            return;
          }
          
          if (!input.value.trim()) {
            missingFields.push(field.replace(/([A-Z])/g, " $1").toLowerCase());
            input.style.borderColor = "#ff4444";
            input.style.borderWidth = "2px";
            isValid = false;
            
            input.addEventListener("input", function() {
              if (this.value.trim()) {
                this.style.borderColor = "";
                this.style.borderWidth = "";
              }
            });
          } else {
            input.style.borderColor = "";
            input.style.borderWidth = "";
          }
        });

        // Validate checkboxes - FIXED: Check for all three checkboxes
        const checkboxes = [
          { id: "cancellationConsent", name: "Cancellation Policy agreement" },
          { id: "studentConsent", name: "Student Enrollment confirmation" }
        ];
        
        const missingConsents = [];
        
        checkboxes.forEach(checkbox => {
          const checkboxElement = document.getElementById(checkbox.id);
          if (!checkboxElement) {
            console.error(`❌ Checkbox not found: ${checkbox.id}`);
            missingConsents.push(checkbox.name);
            isValid = false;
          } else if (!checkboxElement.checked) {
            missingConsents.push(checkbox.name);
            isValid = false;
            
            const label = checkboxElement.closest('.checkbox-label');
            if (label) {
              label.style.color = "#ff4444";
              label.style.fontWeight = "bold";
              
              checkboxElement.addEventListener("change", function() {
                if (this.checked) {
                  label.style.color = "";
                  label.style.fontWeight = "";
                }
              });
            }
          }
        });

        if (missingConsents.length > 0) {
          showValidationError(`Please agree to: ${missingConsents.join(", ")}`);
          isValid = false;
        }

        if (missingFields.length > 0) {
          showValidationError(`Please fill in: ${missingFields.join(", ")}`);
          isValid = false;
        }

        if (isValid) {
          console.log("✅ Step 4: All form fields and consents validated");
        }
        
        return isValid;
      }

      default:
        return true;
    }
  }

  function showValidationError(message) {
    console.log("⚠️ Validation Error:", message);
    
    document.querySelectorAll(".validation-error").forEach(el => el.remove());
    
    const errorDiv = document.createElement("div");
    errorDiv.className = "validation-error";
    errorDiv.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #fff5f5, #ffeaea);
        border: 2px solid #ff4444;
        border-radius: 8px;
        padding: 15px;
        margin: 20px 0;
        color: #cc0000;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: fadeIn 0.3s ease;
      ">
        <i class="fas fa-exclamation-circle" style="font-size: 1.2rem;"></i>
        <span>${message}</span>
      </div>
    `;
    
    const stepActions = document.querySelector(`#step${bookingState.currentStep} .step-actions`);
    if (stepActions) {
      stepActions.parentNode.insertBefore(errorDiv, stepActions);
    } else {
      const currentStep = document.getElementById(`step${bookingState.currentStep}`);
      if (currentStep) {
        currentStep.appendChild(errorDiv);
      }
    }
    
    setTimeout(() => {
      errorDiv.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.style.opacity = "0";
        errorDiv.style.transition = "opacity 0.5s ease";
        setTimeout(() => {
          if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
          }
        }, 500);
      }
    }, 8000);
  }

  function initServiceSelection() {
    console.log("🎯 Initializing service selection...");
    
    document.querySelectorAll(".service-option").forEach((option) => {
      option.addEventListener("click", function () {
        const serviceId = this.getAttribute("data-service");
        console.log(`✅ Service selected: ${serviceId}`);
        
        // Remove checkmark from all services
        document.querySelectorAll(".service-option-check i").forEach(icon => {
          icon.style.color = "transparent";
        });
        
        // Remove selected class from all
        document.querySelectorAll(".service-option").forEach(opt => {
          opt.classList.remove("selected");
        });
        
        // Add selected to clicked
        this.classList.add("selected");
        
        // Show checkmark
        const checkIcon = this.querySelector(".service-option-check i");
        if (checkIcon) {
          checkIcon.style.color = "white";
        }
        
        // Update state
        bookingState.selectedService = serviceId;
        
        // Update sidebar
        updateSidebar();
        
        // Highlight the service in UI
        highlightSelectedService(serviceId);
      });
    });
    
    // Initialize first service as selected for demo
    setTimeout(() => {
      const firstService = document.querySelector(".service-option");
      if (firstService && !bookingState.selectedService) {
        firstService.click();
      }
    }, 500);
  }

  function highlightSelectedService(serviceId) {
    document.querySelectorAll(".service-option").forEach(option => {
      if (option.getAttribute("data-service") === serviceId) {
        option.style.borderColor = "var(--accent-2)";
        option.style.boxShadow = "0 0 0 2px rgba(108, 142, 245, 0.3)";
      } else {
        option.style.borderColor = "";
        option.style.boxShadow = "";
      }
    });
  }

  function initTherapistSelection() {
    console.log("👨‍⚕️ Initializing therapist selection...");
    
    document.querySelectorAll(".therapist-option").forEach((option) => {
      option.addEventListener("click", function () {
        const therapistId = this.getAttribute("data-therapist");
        console.log(`✅ Therapist selected: ${therapistId}`);
        
        // Remove checkmark from all therapists
        document.querySelectorAll(".therapist-option-check i").forEach(icon => {
          icon.style.color = "transparent";
        });
        
        // Remove selected class from all
        document.querySelectorAll(".therapist-option").forEach(opt => {
          opt.classList.remove("selected");
        });
        
        // Add selected to clicked
        this.classList.add("selected");
        
        // Show checkmark
        const checkIcon = this.querySelector(".therapist-option-check i");
        if (checkIcon) {
          checkIcon.style.color = "white";
        }
        
        // Update state
        bookingState.selectedTherapist = therapistId;
        
        // Update sidebar
        updateSidebar();
        
        // Highlight the therapist in UI
        highlightSelectedTherapist(therapistId);
      });
    });
    
    // Initialize first therapist as selected for demo
    setTimeout(() => {
      const firstTherapist = document.querySelector(".therapist-option");
      if (firstTherapist && !bookingState.selectedTherapist) {
        firstTherapist.click();
      }
    }, 500);
  }

  function highlightSelectedTherapist(therapistId) {
    document.querySelectorAll(".therapist-option").forEach(option => {
      if (option.getAttribute("data-therapist") === therapistId) {
        option.style.borderColor = "var(--accent-2)";
        option.style.boxShadow = "0 0 0 2px rgba(108, 142, 245, 0.3)";
      } else {
        option.style.borderColor = "";
        option.style.boxShadow = "";
      }
    });
  }

  function initCalendar() {
    console.log("📅 Initializing calendar...");
    
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    function renderCalendar() {
      const calendarEl = document.getElementById("calendar");
      const monthYearEl = document.getElementById("currentMonth");

      if (!calendarEl || !monthYearEl) return;
      
      monthYearEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
      calendarEl.innerHTML = "";

      // Add day headers
      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(day => {
        const header = document.createElement("div");
        header.className = "calendar-header";
        header.textContent = day;
        calendarEl.appendChild(header);
      });

      // Calculate calendar days
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Empty cells for days before the 1st
      for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.className = "calendar-day disabled";
        calendarEl.appendChild(empty);
      }

      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement("div");
        dayEl.className = "calendar-day";
        dayEl.textContent = day;

        const currentDay = new Date(currentYear, currentMonth, day);
        currentDay.setHours(0, 0, 0, 0);

        const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;
        const isPast = currentDay < today;

        if (isPast || isWeekend) {
          dayEl.classList.add("disabled");
        } else {
          dayEl.addEventListener("click", () => selectDate(currentDay));
          
          if (currentDay.getTime() === today.getTime()) {
            dayEl.classList.add("today");
          }
        }

        // Check if selected
        if (bookingState.selectedDate && 
            currentDay.getTime() === bookingState.selectedDate.getTime()) {
          dayEl.classList.add("selected");
        }

        calendarEl.appendChild(dayEl);
      }
    }

    function selectDate(date) {
      console.log(`📌 Date selected: ${date.toDateString()}`);
      bookingState.selectedDate = date;
      bookingState.selectedTime = null;
      renderCalendar();
      generateTimeSlots();
      updateSidebar();
      updateBookingSummary(); // Update summary when date changes
    }

    // Month navigation
    document.getElementById("prevMonth")?.addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar();
    });

    document.getElementById("nextMonth")?.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar();
    });

    renderCalendar();
    
    // Select today's date by default
    setTimeout(() => {
      if (!bookingState.selectedDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectDate(today);
      }
    }, 1000);
  }

  function generateTimeSlots() {
    console.log("⏰ Generating time slots...");
    
    const container = document.getElementById("timeslotOptions");
    const noSlotsMsg = document.getElementById("noSlotsMessage");

    if (!container || !noSlotsMsg) return;
    
    container.innerHTML = "";

    if (!bookingState.selectedDate) {
      noSlotsMsg.style.display = "block";
      container.style.display = "none";
      return;
    }

    // Generate slots from 8 AM to 5 PM in 30-minute intervals
    const timeSlots = [];
    for (let hour = 8; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayHour = hour > 12 ? hour - 12 : hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
        
        timeSlots.push({
          time: timeStr,
          display: displayTime,
          available: Math.random() > 0.2 // 80% available
        });
      }
    }

    const availableSlots = timeSlots.filter(slot => slot.available);
    
    if (availableSlots.length === 0) {
      noSlotsMsg.style.display = "block";
      container.style.display = "none";
    } else {
      noSlotsMsg.style.display = "none";
      container.style.display = "grid";
      
      availableSlots.forEach(slot => {
        const slotEl = document.createElement("div");
        slotEl.className = "timeslot";
        slotEl.textContent = slot.display;
        slotEl.dataset.time = slot.time;
        
        slotEl.addEventListener("click", function() {
          document.querySelectorAll(".timeslot").forEach(t => t.classList.remove("selected"));
          this.classList.add("selected");
          bookingState.selectedTime = slot.time;
          console.log(`⏰ Time selected: ${slot.time}`);
          updateSidebar();
          updateBookingSummary(); // Update summary when time changes
        });
        
        if (bookingState.selectedTime === slot.time) {
          slotEl.classList.add("selected");
        }
        
        container.appendChild(slotEl);
      });
      
      // Select first available slot by default
      if (!bookingState.selectedTime && availableSlots.length > 0) {
        bookingState.selectedTime = availableSlots[0].time;
        updateSidebar();
        updateBookingSummary();
      }
    }
  }

  function initFormUpdates() {
    console.log("📋 Initializing form updates...");
    
    const formFields = document.querySelectorAll(
      ".personal-details-form input, .personal-details-form select, .personal-details-form textarea"
    );

    formFields.forEach(field => {
      field.addEventListener("input", () => {
        updateBookingSummary();
      });
      
      field.addEventListener("change", () => {
        updateBookingSummary();
      });
    });
  }

  function initBookingConfirmation() {
    console.log("✅ Initializing booking confirmation...");
    
    const confirmBtn = document.getElementById("confirmBooking");
    if (!confirmBtn) {
      console.error("❌ Confirm booking button not found!");
      return;
    }
    
    confirmBtn.addEventListener("click", async function(e) {
      e.preventDefault();
      console.log("🔄 Confirm booking button clicked");
      
      // First update the summary to ensure latest data
      updateBookingSummary();
      
      // Validate all steps before submission
      let allValid = true;
      
      for (let step = 1; step <= 4; step++) {
        if (!validateCurrentStep(step)) {
          allValid = false;
          if (step !== bookingState.currentStep) {
            navigateToStep(step);
          }
          break;
        }
      }
      
      if (!allValid) {
        console.log("❌ Booking validation failed");
        return;
      }
      
      console.log("✅ All steps validated, proceeding with booking...");
      await submitBooking();
    });
  }

  async function submitBooking() {
    console.log("🚀 Submitting booking to database...");
    
    const confirmBtn = document.getElementById("confirmBooking");
    if (!confirmBtn) return;
    
    // Save original button state
    const originalText = confirmBtn.innerHTML;
    
    try {
      // Show loading state
      confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Booking...';
      confirmBtn.disabled = true;
      
      // Get all form data
      const personalDetails = getPersonalDetails();
      
      // Generate unique booking ID
      const bookingId = generateBookingId();
      
      // Prepare complete booking data
      const bookingData = {
        // Booking details
        id: bookingId,
        service: bookingState.selectedService,
        serviceName: bookingState.services[bookingState.selectedService]?.name || "Not selected",
        therapist: bookingState.selectedTherapist,
        therapistName: bookingState.therapists[bookingState.selectedTherapist]?.name || "Not selected",
        date: bookingState.selectedDate ? bookingState.selectedDate.toISOString() : null,
        time: bookingState.selectedTime,
        duration: bookingState.services[bookingState.selectedService]?.duration || "Not selected",
        format: document.getElementById("sessionType")?.value || "in-person",
        formatText: document.getElementById("sessionType")?.options[document.getElementById("sessionType").selectedIndex]?.text || "In-Person (Guidance Office)",
        
        // Student details
        firstName: personalDetails.firstName,
        lastName: personalDetails.lastName,
        studentId: personalDetails.studentId,
        courseYear: personalDetails.courseYear,
        email: personalDetails.email,
        phone: personalDetails.phone,
        preferredContact: personalDetails.preferredContact,
        preferredContactValue: document.getElementById("preferredContact")?.value || "email",
        sessionType: personalDetails.sessionType,
        concerns: personalDetails.concerns,
        emergencyContact: personalDetails.emergencyContact,
        
        // Consent flags
        privacyConsent: document.getElementById("privacyConsent")?.checked || false,
        cancellationConsent: document.getElementById("cancellationConsent")?.checked || false,
        studentConsent: document.getElementById("studentConsent")?.checked || false,
        
        // System fields
        status: "confirmed",
        bookedAt: new Date().toISOString(),
        source: "booking-page"
      };
      
      console.log("📦 Prepared booking data:", bookingData);
      
      // 1. Save to localStorage
      const localStorageSaved = saveBookingToLocalStorage(bookingData);
      console.log(localStorageSaved ? "💾 Saved to localStorage" : "⚠️ LocalStorage save failed");
      
      // 2. Save to Firebase
      let firebaseResult = null;
      try {
        firebaseResult = await saveBookingToFirebase(bookingData);
        console.log("🎉 Successfully saved to Firebase:", firebaseResult);
      } catch (firestoreError) {
        console.error("❌ Firebase save failed:", firestoreError);
      }
      
      // 3. Show success modal
      showSuccessModal(bookingData);
      
      console.log("✅ Booking process completed successfully!");
      
    } catch (error) {
      console.error("❌ Error in submitBooking:", error);
      showValidationError("Something went wrong. Please try again.");
      
      // Restore button
      confirmBtn.innerHTML = originalText;
      confirmBtn.disabled = false;
    }
  }

  function getPersonalDetails() {
    const preferredContactSelect = document.getElementById("preferredContact");
    const sessionTypeSelect = document.getElementById("sessionType");
    
    return {
      firstName: document.getElementById("firstName")?.value || "",
      lastName: document.getElementById("lastName")?.value || "",
      studentId: document.getElementById("studentId")?.value || "",
      courseYear: document.getElementById("courseYear")?.value || "",
      email: document.getElementById("email")?.value || "",
      phone: document.getElementById("phone")?.value || "",
      preferredContact: preferredContactSelect?.options[preferredContactSelect?.selectedIndex]?.text || "SLSU Email",
      sessionType: sessionTypeSelect?.options[sessionTypeSelect?.selectedIndex]?.text || "In-Person (Guidance Office)",
      concerns: document.getElementById("concerns")?.value || "",
      emergencyContact: document.getElementById("emergencyContact")?.value || ""
    };
  }

  function generateBookingId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `SLSU${timestamp}${random}`;
  }

  function showSuccessModal(bookingData) {
    console.log("🎊 Showing success modal...");
    
    // Set modal content
    document.getElementById("confirmationNumber").textContent = bookingData.id;
    
    const appointmentDate = new Date(bookingData.date);
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    
    const formattedTime = formatTime(bookingData.time);
    document.getElementById("successDateTime").textContent = `${formattedDate} at ${formattedTime}`;
    
    document.getElementById("successTherapist").textContent = bookingData.therapistName;
    
    // Show modal with animation
    const modal = document.getElementById("successModal");
    if (modal) {
      modal.style.display = "flex";
      modal.style.alignItems = "center";
      modal.style.justifyContent = "center";
      modal.style.animation = "fadeIn 0.5s ease";
      
      // Reset form after modal shows
      setTimeout(() => {
        resetBookingForm();
      }, 1000);
    }
  }

  function formatTime(timeString) {
    if (!timeString) return "Not specified";
    
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    
    return `${displayHour}:${minutes || "00"} ${period}`;
  }

  function updateSidebar() {
    // Service
    const serviceEl = document.getElementById("sidebarService");
    if (serviceEl) {
      serviceEl.textContent = bookingState.selectedService 
        ? bookingState.services[bookingState.selectedService].name 
        : "Not selected";
    }
    
    // Therapist
    const therapistEl = document.getElementById("sidebarTherapist");
    if (therapistEl) {
      therapistEl.textContent = bookingState.selectedTherapist 
        ? bookingState.therapists[bookingState.selectedTherapist].name 
        : "Not selected";
    }
    
    // Date & Time
    const datetimeEl = document.getElementById("sidebarDateTime");
    if (datetimeEl) {
      if (bookingState.selectedDate && bookingState.selectedTime) {
        const formattedDate = bookingState.selectedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
        const formattedTime = formatTime(bookingState.selectedTime);
        datetimeEl.textContent = `${formattedDate} at ${formattedTime}`;
      } else {
        datetimeEl.textContent = "Not selected";
      }
    }
    
    // Cost
    const totalEl = document.getElementById("sidebarTotal");
    if (totalEl) {
      totalEl.textContent = bookingState.selectedService 
        ? bookingState.services[bookingState.selectedService].price 
        : "Free for SLSU Students";
    }
  }

  function updateBookingSummary() {
    console.log("📊 Updating booking summary...");
    
    const personalDetails = getPersonalDetails();
    
    // Update booking details
    if (bookingState.selectedService) {
      const serviceName = document.getElementById("summaryService");
      const duration = document.getElementById("summaryDuration");
      const total = document.getElementById("summaryTotal");
      
      if (serviceName) serviceName.textContent = bookingState.services[bookingState.selectedService].name;
      if (duration) duration.textContent = bookingState.services[bookingState.selectedService].duration;
      if (total) total.textContent = bookingState.services[bookingState.selectedService].price;
    } else {
      document.getElementById("summaryService").textContent = "Not selected";
      document.getElementById("summaryDuration").textContent = "Not selected";
    }
    
    if (bookingState.selectedTherapist) {
      document.getElementById("summaryTherapist").textContent = 
        bookingState.therapists[bookingState.selectedTherapist].name;
    } else {
      document.getElementById("summaryTherapist").textContent = "Not selected";
    }
    
    if (bookingState.selectedDate && bookingState.selectedTime) {
      const formattedDate = bookingState.selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      const formattedTime = formatTime(bookingState.selectedTime);
      document.getElementById("summaryDateTime").textContent = 
        `${formattedDate} at ${formattedTime}`;
    } else {
      document.getElementById("summaryDateTime").textContent = "Not selected";
    }
    
    // Update session format
    const sessionTypeSelect = document.getElementById("sessionType");
    if (sessionTypeSelect) {
      document.getElementById("summaryFormat").textContent = 
        sessionTypeSelect.options[sessionTypeSelect.selectedIndex]?.text || "In-Person";
    } else {
      document.getElementById("summaryFormat").textContent = "Not selected";
    }
    
    // Update personal details
    const summaryName = document.getElementById("summaryName");
    const summaryStudentId = document.getElementById("summaryStudentId");
    const summaryCourseYear = document.getElementById("summaryCourseYear");
    const summaryEmail = document.getElementById("summaryEmail");
    const summaryPhone = document.getElementById("summaryPhone");
    const summaryContactMethod = document.getElementById("summaryContactMethod");
    
    if (summaryName) summaryName.textContent = `${personalDetails.firstName} ${personalDetails.lastName}` || "-";
    if (summaryStudentId) summaryStudentId.textContent = personalDetails.studentId || "-";
    if (summaryCourseYear) summaryCourseYear.textContent = personalDetails.courseYear || "-";
    if (summaryEmail) summaryEmail.textContent = personalDetails.email || "-";
    if (summaryPhone) summaryPhone.textContent = personalDetails.phone || "-";
    
    if (summaryContactMethod) {
      const preferredContactSelect = document.getElementById("preferredContact");
      if (preferredContactSelect) {
        summaryContactMethod.textContent = 
          preferredContactSelect.options[preferredContactSelect.selectedIndex]?.text || "SLSU Email";
      }
    }
  }

  function resetBookingForm() {
    console.log("🔄 Resetting booking form...");
    
    // Reset state
    bookingState.selectedService = null;
    bookingState.selectedTherapist = null;
    bookingState.selectedDate = null;
    bookingState.selectedTime = null;
    bookingState.currentStep = 1;
    
    // Reset UI selections
    document.querySelectorAll(".service-option.selected, .therapist-option.selected").forEach(el => {
      el.classList.remove("selected");
    });
    
    // Reset form fields
    document.querySelectorAll(".personal-details-form input[type='text'], .personal-details-form input[type='email'], .personal-details-form input[type='tel'], .personal-details-form textarea").forEach(input => {
      input.value = "";
    });
    
    // Reset checkboxes
    document.querySelectorAll(".personal-details-form input[type='checkbox']").forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // Reset selects to default
    document.querySelectorAll(".personal-details-form select").forEach(select => {
      select.selectedIndex = 0;
    });
    
    // Reset progress
    const progressFill = document.getElementById("progressFill");
    if (progressFill) {
      progressFill.style.width = "0%";
    }
    
    // Show step 1
    document.querySelectorAll(".booking-step").forEach(step => step.classList.remove("active"));
    document.querySelectorAll(".step").forEach(step => step.classList.remove("active"));
    
    document.getElementById("step1").classList.add("active");
    const step1Progress = document.querySelector('.step[data-step="1"]');
    if (step1Progress) step1Progress.classList.add("active");
    
    // Update sidebar
    updateSidebar();
    
    // Update summary to show "Not selected"
    updateBookingSummary();
    
    console.log("✅ Form reset complete");
  }

  function initModalHandlers() {
    const modal = document.getElementById("successModal");
    if (modal) {
      modal.addEventListener("click", function(e) {
        if (e.target === modal) {
          modal.style.display = "none";
        }
      });
    }
    
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape") {
        const modal = document.getElementById("successModal");
        if (modal && modal.style.display === "flex") {
          modal.style.display = "none";
        }
      }
    });
  }

  // Add CSS animations
  if (!document.querySelector('#booking-styles')) {
    const style = document.createElement('style');
    style.id = 'booking-styles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        animation: fadeIn 0.3s ease;
      }
      
      .modal-content {
        background: white;
        margin: 5% auto;
        padding: 30px;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        animation: fadeIn 0.5s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      }
      
      .validation-error {
        animation: fadeIn 0.3s ease;
      }
      
      /* Fix for checkboxes visibility */
      .checkbox-label input[type="checkbox"] {
        width: 18px !important;
        height: 18px !important;
        margin-right: 10px !important;
        display: inline-block !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      /* Highlight selected options */
      .service-option.selected,
      .therapist-option.selected {
        border-color: var(--accent-2) !important;
        background: rgba(108, 142, 245, 0.05) !important;
      }
      
      .service-option-check i,
      .therapist-option-check i {
        color: transparent;
        transition: color 0.3s ease;
      }
      
      .service-option.selected .service-option-check i,
      .therapist-option.selected .therapist-option-check i {
        color: white !important;
      }
      
      /* Calendar styles */
      .calendar-day.selected {
        background: var(--accent-2) !important;
        color: white !important;
      }
      
      .calendar-day.today {
        border: 2px solid var(--accent-2) !important;
      }
      
      /* Time slot styles */
      .timeslot.selected {
        background: var(--accent-2) !important;
        color: white !important;
        border-color: var(--accent-2) !important;
      }
    `;
    document.head.appendChild(style);
  }
});