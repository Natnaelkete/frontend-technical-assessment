export class Navigation {
  constructor() {
    this.nav = document.querySelector(".nav");
    this.navToggle = document.querySelector(".nav-toggle");
    this.navList = document.getElementById("nav-list");
    this.navLinks = document.querySelectorAll(".nav-link");
    this.sections = document.querySelectorAll("section");

    this.init();
  }

  init() {
    this.nav.style.position = "sticky";
    this.nav.style.top = "0";
    this.nav.style.zIndex = "999";
    this.nav.style.background = "#fff";
    this.nav.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";

    this.navToggle.addEventListener("click", () => {
      const expanded = this.navToggle.getAttribute("aria-expanded") === "true";
      this.navToggle.setAttribute("aria-expanded", String(!expanded));
      this.navList.classList.toggle("nav-list-open");
    });

    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").slice(1);
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (this.navList.classList.contains("nav-list-open")) {
          this.navList.classList.remove("nav-list-open");
          this.navToggle.setAttribute("aria-expanded", "false");
        }
      });

      // Keyboard accessibility
      link.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          link.click();
        }
      });
    });

    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.6,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        const link = document.querySelector(`.nav-link[href="#${id}"]`);
        if (entry.isIntersecting) {
          this.navLinks.forEach((l) => l.classList.remove("active"));
          link.classList.add("active");
        }
      });
    }, observerOptions);

    this.sections.forEach((section) => observer.observe(section));
  }
}
