// Fade-in effect on page load
  document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("fade-in");
  });

  // Fade-out effect before navigating away
  document.querySelectorAll("a").forEach(link => {
    const href = link.getAttribute("href");

    // Ignore links with # or JavaScript
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

    link.addEventListener("click", e => {
      e.preventDefault();
      const destination = link.href;

      document.body.style.opacity = 0;
      setTimeout(() => {
        window.location = destination;
      }, 400); // same as transition time in CSS
    });
  });