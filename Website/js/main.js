document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("nav a");
  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const id = link.getAttribute("data-section");
      document.getElementById(id).scrollIntoView({ behavior: "smooth" });
    });
  });
});

function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

const reveals = document.querySelectorAll(".reveal");
window.addEventListener("scroll", () => {
  for (let r of reveals) {
    const rect = r.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      r.classList.add("active");
    }
  }
});

const feedbackForm = document.getElementById("feedbackForm");
feedbackForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = feedbackForm.name.value.trim();
  const email = feedbackForm.email.value.trim();
  const message = feedbackForm.message.value.trim();

  if (name && email && message) {
    alert(`Thank you, ${name}! Your feedback has been submitted.`);
    feedbackForm.reset();
  } else {
    alert("Please fill out all fields before submitting.");
  }
});

const carousel = document.querySelector(".carousel");
let isDown = false, startX, scrollLeft;

carousel.addEventListener("mousedown", (e) => {
  isDown = true;
  startX = e.pageX - carousel.offsetLeft;
  scrollLeft = carousel.scrollLeft;
});
carousel.addEventListener("mouseleave", () => isDown = false);
carousel.addEventListener("mouseup", () => isDown = false);
carousel.addEventListener("mousemove", (e) => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - carousel.offsetLeft;
  const walk = (x - startX) * 2;
  carousel.scrollLeft = scrollLeft - walk;
});
