// feedback.js – handles feedback form + saves to Firestore

document.addEventListener("DOMContentLoaded", () => {
  const feedbackForm = document.getElementById("feedbackForm");
  const thankYouModal = document.getElementById("thankYouModal");
  const closeThankYou = document.getElementById("closeThankYou");
  const closeThankYouBtn = document.getElementById("closeThankYouBtn");

  // ----- helper: safe Firestore write directly to 'feedback' -----
  async function saveFeedbackToFirestore(feedbackData) {
    try {
      if (
        !window.FirebaseService ||
        !window.FirebaseService.isReady ||
        !window.FirebaseService.isReady()
      ) {
        console.warn(
          "[Feedback] FirebaseService not ready, skipping Firestore save"
        );
        return;
      }

      const user = FirebaseService.getCurrentUser
        ? FirebaseService.getCurrentUser()
        : null;

      const payload = {
        ...feedbackData,
        userId: user ? user.uid : null,
        userEmail: user ? user.email : null,
        source: "feedback-page",
        submittedAt: new Date().toISOString()
      };

      console.log("[Feedback] Saving to Firestore:", payload);
      await FirebaseService.saveDocument("feedback", payload);
      console.log("[Feedback] Saved to Firestore successfully");
    } catch (err) {
      console.error("[Feedback] Error saving to Firestore:", err);
    }
  }

  // ----- form submit -----
  if (feedbackForm) {
    feedbackForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = feedbackForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : "Submit";

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
      }

      const formData = new FormData(feedbackForm);
      const isAnonymous = !!formData.get("anonymousFeedback"); // checkbox

      // Build feedback object from form inputs
      const feedbackData = {
        rating: parseInt(formData.get("rating") || "0", 10),
        type: formData.get("feedbackType") || formData.get("type") || "",
        service: formData.get("service") || "",
        title: formData.get("title") || "",
        message: formData.get("message") || "",
        improvement: formData.get("improvement") || "",
        anonymous: isAnonymous
      };

      if (!isAnonymous) {
        feedbackData.name = formData.get("name") || "";
        feedbackData.email = formData.get("email") || "";
        feedbackData.studentId = formData.get("studentId") || "";
      }

      // Basic validation
      if (!feedbackData.rating || !feedbackData.message.trim()) {
        alert("Please provide a rating and share your experience.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
        return;
      }

      try {
        // ----- 1) localStorage (for dashboard widgets) -----
        const stored = JSON.parse(
          localStorage.getItem("userFeedback") || "[]"
        );
        stored.push({
          ...feedbackData,
          submittedAt: new Date().toISOString()
        });
        localStorage.setItem("userFeedback", JSON.stringify(stored));

        // ----- 2) Firestore -----
        await saveFeedbackToFirestore(feedbackData);

        // ----- 3) UI: thank you modal + reset -----
        if (thankYouModal) {
          thankYouModal.style.display = "block";
        } else {
          alert("Thank you for your feedback!");
        }

        feedbackForm.reset();

        if (window.loadFeedbackStats) {
          window.loadFeedbackStats();
        }
        if (window.loadRecentFeedback) {
          window.loadRecentFeedback();
        }
      } catch (err) {
        console.error("[Feedback] Submit error:", err);
        alert(
          "There was a problem submitting your feedback. Please try again."
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // ----- modal closing -----
  function hideThankYou() {
    if (thankYouModal) {
      thankYouModal.style.display = "none";
    }
  }

  if (closeThankYou) {
    closeThankYou.addEventListener("click", hideThankYou);
  }
  if (closeThankYouBtn) {
    closeThankYouBtn.addEventListener("click", hideThankYou);
  }

  window.addEventListener("click", (e) => {
    if (e.target === thankYouModal) {
      hideThankYou();
    }
  });

  // Optional: re-calculate stats on load
  if (window.loadFeedbackStats) {
    window.loadFeedbackStats();
  }
  if (window.loadRecentFeedback) {
    window.loadRecentFeedback();
  }
});
