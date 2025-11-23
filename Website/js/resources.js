// resources.js - Resources page functionality

document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------
  // Category tab functionality
  // -----------------------------
  const categoryTabs = document.querySelectorAll(".category-tab");
  const categoryPanes = document.querySelectorAll(".category-pane");

  if (categoryTabs.length && categoryPanes.length) {
    categoryTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const category = tab.getAttribute("data-category");

        // Update active tab
        categoryTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        // Show corresponding pane
        categoryPanes.forEach((pane) => {
          pane.classList.remove("active");
          if (pane.id === category) {
            pane.classList.add("active");
          }
        });
      });
    });
  }

  // -----------------------------
  // Resource modal + buttons
  // -----------------------------
  const resourceButtons = document.querySelectorAll(".resource-btn");
  const resourceModal = document.getElementById("resourceModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");
  const startResourceBtn = document.getElementById("startResource");
  const saveResourceBtn = document.getElementById("saveResource");
  const closeModal = resourceModal ? resourceModal.querySelector(".close") : null;

  let currentResource = null;

  if (
    resourceButtons.length &&
    resourceModal &&
    modalTitle &&
    modalContent &&
    startResourceBtn &&
    saveResourceBtn
  ) {
    // Open modal with correct content
    resourceButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const resourceKey = button.getAttribute("data-resource");

        // Some buttons (like crisis call) don't have data-resource
        if (!resourceKey) {
          return; // let their onclick (tel:, etc.) handle behavior
        }

        currentResource = resourceKey;

        const resourceData = getResourceData(resourceKey);
        modalTitle.textContent = resourceData.title;
        modalContent.innerHTML = resourceData.content;
        startResourceBtn.textContent = resourceData.buttonText || "Access Resource";

        // Fetch supportive quote from external public API
        fetchSupportiveQuote();

        resourceModal.style.display = "block";
      });
    });

    // Close modal (X)
    if (closeModal) {
      closeModal.addEventListener("click", () => {
        resourceModal.style.display = "none";
      });
    }

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target === resourceModal) {
        resourceModal.style.display = "none";
      }
    });

    // -----------------------------
    // Start resource (track usage)
    // -----------------------------
    startResourceBtn.addEventListener("click", () => {
      if (!currentResource) return;

      const resources =
        JSON.parse(localStorage.getItem("resourceActivity") || "[]") || [];
      const resourceData = getResourceData(currentResource);

      const entry = {
        name: resourceData.title,
        type: currentResource,
        date: new Date().toISOString(),
      };

      // Local tracking
      resources.push(entry);
      localStorage.setItem("resourceActivity", JSON.stringify(resources));

      // Firestore tracking
      if (window.FirebaseService && FirebaseService.isReady()) {
        const user = FirebaseService.getCurrentUser();
        const docToSave = {
          ...entry,
          userId: user ? user.uid : null,
          userEmail: user ? user.email : null,
          source: "resources-page",
        };

        FirebaseService.saveDocument("resourceActivity", docToSave).catch(
          (err) => {
            console.error("Error saving resource activity to Firestore:", err);
          }
        );
      }

      // Update UI stats
      updateResourceStats();

      // Close modal + notify
      resourceModal.style.display = "none";
      alert(`Starting: ${resourceData.title}`);
    });

    // -----------------------------
    // Save resource for later
    // -----------------------------
    saveResourceBtn.addEventListener("click", () => {
      if (!currentResource) return;

      const saved =
        JSON.parse(localStorage.getItem("savedResources") || "[]") || [];
      const resourceData = getResourceData(currentResource);

      if (!saved.find((r) => r.type === currentResource)) {
        const entry = {
          name: resourceData.title,
          type: currentResource,
          savedDate: new Date().toISOString(),
        };

        // Local save
        saved.push(entry);
        localStorage.setItem("savedResources", JSON.stringify(saved));

        // Firestore save
        if (window.FirebaseService && FirebaseService.isReady()) {
          const user = FirebaseService.getCurrentUser();
          const docToSave = {
            ...entry,
            userId: user ? user.uid : null,
            userEmail: user ? user.email : null,
            source: "resources-page",
          };

          FirebaseService.saveDocument("savedResources", docToSave).catch(
            (err) => {
              console.error(
                "Error saving resource bookmark to Firestore:",
                err
              );
            }
          );
        }

        alert("Resource saved for later!");
      } else {
        alert("Resource already saved!");
      }
    });
  }

  // -----------------------------
  // External API: supportive quote
  // -----------------------------
  function fetchSupportiveQuote() {
    if (!modalContent) return;

    const extraDiv = document.createElement("div");
    extraDiv.className = "resource-extra";
    extraDiv.innerHTML =
      '<p class="resource-extra-loading">Loading a short supportive message...</p>';
    modalContent.appendChild(extraDiv);

    // Using a known public quote API (no auth needed)
    // Docs existed before my knowledge cutoff; I can't "look it up" now,
    // but this URL format is stable in my training:
    //   https://zenquotes.io/api/random  -> [ { q: "Quote", a: "Author" } ]
    fetch("https://zenquotes.io/api/random")
      .then((res) => res.json())
      .then((data) => {
        const quoteObj = Array.isArray(data) && data[0] ? data[0] : null;
        if (!quoteObj || !quoteObj.q) {
          throw new Error("No quote in response");
        }

        extraDiv.innerHTML = `
          <div class="resource-quote">
            <p>"${quoteObj.q}"</p>
            <p class="resource-quote-author">– ${quoteObj.a || "Unknown"}</p>
          </div>
        `;
      })
      .catch((err) => {
        console.error("Error fetching supportive quote:", err);
        extraDiv.innerHTML = `
          <div class="resource-quote">
            <p>Remember: it's okay to ask for help, and small steps still count as progress.</p>
          </div>
        `;
      });
  }

  // -----------------------------
  // (Optional) Local resource search
  // -----------------------------
  const locationForm = document.getElementById("locationForm");
  if (locationForm) {
    locationForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const zipInput = document.getElementById("zipCode");
      const zipCode = zipInput ? zipInput.value.trim() : "";
      if (!zipCode) {
        alert("Please enter your ZIP or postal code.");
        return;
      }
      searchLocalResources(zipCode);
    });
  }

  // -----------------------------
  // Helper: resource content map
  // Keys must match data-resource="" in resources.html
  // -----------------------------
  function getResourceData(resourceKey) {
    const resources = {
      "exam-anxiety": {
        title: "Exam Anxiety Relief Guide",
        content: `
          <p>This guide provides step-by-step techniques you can use before and during exams.</p>
          <ul class="resource-points">
            <li>Grounding exercises for pre-exam jitters</li>
            <li>Breathing techniques you can use in the exam room</li>
            <li>Post-exam reflection prompts</li>
          </ul>
          <p>You can download or screenshot the strategies that work best for you.</p>
        `,
        buttonText: "Download Guide",
      },
      "time-management": {
        title: "Time Management for Students",
        content: `
          <p>Use this workbook to plan weekly tasks, track deadlines, and avoid burnout.</p>
          <ul class="resource-points">
            <li>Weekly planning template for SLSU class schedules</li>
            <li>Priority matrix for balancing academics and org work</li>
            <li>Tips on building sustainable study habits</li>
          </ul>
        `,
        buttonText: "Get Workbook",
      },
      "thesis-support": {
        title: "Thesis & Capstone Support Pack",
        content: `
          <p>Tools to manage stress and stay organized while working on your thesis or capstone.</p>
          <ul class="resource-points">
            <li>Break your thesis into smaller, manageable tasks</li>
            <li>Reflective prompts when you feel stuck</li>
            <li>Communication templates for reaching out to advisers</li>
          </ul>
        `,
        buttonText: "View Support Pack",
      },
      "campus-living": {
        title: "Adjusting to Campus Living",
        content: `
          <p>For students living in dorms or boarding houses around SLSU Lucena.</p>
          <ul class="resource-points">
            <li>Setting healthy boundaries with roommates</li>
            <li>Maintaining routines far from home</li>
            <li>Where to get help on campus if living conditions feel unsafe</li>
          </ul>
        `,
        buttonText: "Open Guide",
      },
      "campus-mindfulness": {
        title: "Campus Mindfulness Walk",
        content: `
          <p>A short walking practice you can do around campus when you feel overwhelmed.</p>
          <ol class="resource-steps">
            <li>Choose a safe, familiar route on campus.</li>
            <li>Walk slowly and notice 5 things you can see.</li>
            <li>Notice 4 things you can touch, 3 things you can hear, 2 things you can smell, 1 thing you can taste.</li>
          </ol>
          <p>You can adapt this practice between classes or on your way home.</p>
        `,
        buttonText: "Start Practice",
      },
      "mood-tracker": {
        title: "SLSU Mood Tracker",
        content: `
          <p>Track how your mood changes across classes, days, and campus events.</p>
          <ul class="resource-points">
            <li>Note your mood (1–10) before and after class</li>
            <li>Record triggers and helpful coping strategies</li>
            <li>Bring your notes to counseling if you'd like to share patterns</li>
          </ul>
        `,
        buttonText: "Use Tracker",
      },
      "stress-worksheet": {
        title: "Academic Stress Worksheet",
        content: `
          <p>Identify your main academic stressors and plan healthier responses.</p>
          <ul class="resource-points">
            <li>List top stress triggers (subjects, deadlines, situations)</li>
            <li>Rate each trigger from 1–10</li>
            <li>Match each trigger with at least one coping strategy or support option</li>
          </ul>
        `,
        buttonText: "Download Worksheet",
      },
      "self-care-planner": {
        title: "Student Self-Care Planner",
        content: `
          <p>Design a self-care routine that fits your schedule as an SLSU student.</p>
          <ul class="resource-points">
            <li>Daily 5–10 minute self-care options between classes</li>
            <li>Weekly check-in questions</li>
            <li>Ideas for connecting with campus organizations and support</li>
          </ul>
        `,
        buttonText: "Start Planning",
      },
      "support-schedule": {
        title: "Counseling Support Scheduler",
        content: `
          <p>Prepare for counseling sessions by organizing your concerns and goals.</p>
          <ul class="resource-points">
            <li>Note key concerns you want to discuss</li>
            <li>List recent events that affected your mood</li>
            <li>Write down what you hope to get from counseling</li>
          </ul>
        `,
        buttonText: "Prepare Now",
      },
      "career-assessment": {
        title: "Career Path Self-Assessment",
        content: `
          <p>Reflect on your interests, strengths, and values as you explore career paths.</p>
          <ul class="resource-points">
            <li>Identify what subjects you enjoy and why</li>
            <li>Reflect on what “meaningful work” looks like for you</li>
            <li>Plan follow-up questions for guidance counselors</li>
          </ul>
        `,
        buttonText: "Start Assessment",
      },
      "emergency-procedures": {
        title: "Emergency Procedures & Hotlines",
        content: `
          <p>If you or someone you know is in immediate danger, seek help right away.</p>
          <ul class="resource-points">
            <li>Emergency numbers for campus and local responders</li>
            <li>Steps to take during a mental health crisis</li>
            <li>How to support a friend in crisis safely</li>
          </ul>
          <p><strong>Note:</strong> This resource does not replace emergency services. In life-threatening situations, contact local emergency numbers immediately.</p>
        `,
        buttonText: "View Procedures",
      },
    };

    return (
      resources[resourceKey] || {
        title: "SLSU Resource",
        content:
          "<p>Details for this resource are not available yet. Please try another item or contact the guidance office for more information.</p>",
        buttonText: "Access Resource",
      }
    );
  }

  // -----------------------------
  // Fake local resource search (can be replaced with real API)
  // -----------------------------
  function searchLocalResources(zipCode) {
    console.log("Searching local resources near ZIP:", zipCode);

    const resultsContainer = document.getElementById("localResourcesResults");
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
      <div class="local-resource">
        <h4>SLSU Guidance and Counseling Center</h4>
        <p>Location: SLSU Lucena Campus</p>
        <p>Services: Individual counseling, group sessions, referrals</p>
      </div>
      <div class="local-resource">
        <h4>Nearby Community Health Center</h4>
        <p>Location: Within your area (${zipCode})</p>
        <p>Services: General health, mental health referrals</p>
      </div>
    `;
  }

  // -----------------------------
  // Resource stats from localStorage
  // -----------------------------
  function updateResourceStats() {
    const resources =
      JSON.parse(localStorage.getItem("resourceActivity") || "[]") || [];

    const accessedCountEl = document.getElementById("accessedCount");
    const lastAccessedEl = document.getElementById("lastAccessed");
    const mostHelpfulEl = document.getElementById("mostHelpful");

    if (accessedCountEl) accessedCountEl.textContent = resources.length;

    if (!resources.length) {
      if (lastAccessedEl) lastAccessedEl.textContent = "None yet";
      if (mostHelpfulEl) mostHelpfulEl.textContent = "-";
      return;
    }

    const lastResource = resources[resources.length - 1];
    if (lastAccessedEl) lastAccessedEl.textContent = lastResource.name;

    // Compute most accessed
    const accessCount = {};
    resources.forEach((res) => {
      accessCount[res.name] = (accessCount[res.name] || 0) + 1;
    });

    const mostAccessed = Object.keys(accessCount).reduce((a, b) =>
      accessCount[a] > accessCount[b] ? a : b
    );

    if (mostHelpfulEl) mostHelpfulEl.textContent = mostAccessed;
  }

  // Initialize stats on load
  updateResourceStats();
});
