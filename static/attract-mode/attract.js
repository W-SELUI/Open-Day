const DEFAULT_SLIDES = [
  { icon: "🧩", name: "Hand Puzzle", tag: "Move it with your hands", accent: "#67e8f9" },
  { icon: "⚡", name: "Gravity Thief", tag: "Steal the core. Beat the lasers.", accent: "#a78bfa" },
  { icon: "🎓", name: "Career Quest", tag: "Your next direction is hiding in plain sight", accent: "#f5dc85" },
  { icon: "✨", name: "VibeLink", tag: "Two strangers. One verdict.", accent: "#c4b5fd" },
  { icon: "🔮", name: "Vibe Oracle", tag: "Ask the future something harmless", accent: "#a7f3d0" },
  { icon: "🍉", name: "Slice Club", tag: "Slice fast. Dodge bombs.", accent: "#fb7185" },
  { icon: "🎯", name: "SkyShot", tag: "Raise your hand. Take the shot.", accent: "#38bdf8" },
];

const IDLE_DELAY = 15_000;
const SLIDE_DELAY = 4_200;

export default function(component) {
  const { data, parentElement } = component;
  const root = parentElement.querySelector(".nv-attract-root");
  if (!root) return () => {};

  const slides = Array.isArray(data?.slides) && data.slides.length
    ? data.slides
    : DEFAULT_SLIDES;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let slideIndex = 0;
  let idleTimer = 0;
  let slideTimer = 0;
  let active = false;

  root.innerHTML = `
    <section class="nv-attract" aria-hidden="true" aria-label="NeuroVerse showcase">
      <div class="nv-attract-shell">
        <div class="nv-attract-top">
          <span class="nv-attract-brand">NEURO<span>VERSE</span></span>
          <span>Open Day arcade</span>
        </div>
        <div class="nv-attract-main">
          <div>
            <p class="nv-attract-kicker">Welcome to the lab</p>
            <h1 class="nv-attract-title">Find your next world.</h1>
            <p class="nv-attract-copy">Tap, move, speak, predict, and play. Which NeuroVerse experience will you unlock first?</p>
          </div>
          <div class="nv-attract-orbit">
            <div class="nv-attract-card">
              <div class="nv-attract-icon" aria-hidden="true"></div>
              <h2 class="nv-attract-card-name"></h2>
              <p class="nv-attract-card-tag"></p>
            </div>
          </div>
        </div>
        <div class="nv-attract-footer">
          <span>Touch the screen to explore</span>
          <div class="nv-attract-dots" aria-hidden="true"></div>
        </div>
      </div>
      <span class="nv-attract-hint">Showcase mode · no camera active</span>
    </section>
  `;

  const overlay = root.querySelector(".nv-attract");
  const icon = root.querySelector(".nv-attract-icon");
  const name = root.querySelector(".nv-attract-card-name");
  const tag = root.querySelector(".nv-attract-card-tag");
  const dots = root.querySelector(".nv-attract-dots");

  dots.innerHTML = slides.map((_, index) => `<span class="nv-attract-dot${index === 0 ? " active" : ""}></span>`).join("");

  function renderSlide() {
    const slide = slides[slideIndex % slides.length];
    overlay.style.setProperty("--nv-accent", slide.accent || "#67e8f9");
    icon.textContent = slide.icon || "✦";
    name.textContent = slide.name || "NeuroVerse";
    tag.textContent = slide.tag || "Choose your next experience";
    dots.querySelectorAll(".nv-attract-dot").forEach((dot, index) => {
      dot.classList.toggle("active", index === slideIndex % slides.length);
    });
  }

  function stopShowcase() {
    active = false;
    window.clearInterval(slideTimer);
    slideTimer = 0;
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
  }

  function startShowcase() {
    if (active) return;
    active = true;
    slideIndex = 0;
    renderSlide();
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
    if (!reducedMotion && slides.length > 1) {
      slideTimer = window.setInterval(() => {
        slideIndex = (slideIndex + 1) % slides.length;
        renderSlide();
      }, SLIDE_DELAY);
    }
  }

  function resetIdle() {
    window.clearTimeout(idleTimer);
    if (active) stopShowcase();
    idleTimer = window.setTimeout(startShowcase, IDLE_DELAY);
  }

  const onActivity = () => resetIdle();
  ["pointerdown", "pointermove", "keydown", "touchstart"].forEach((eventName) => {
    document.addEventListener(eventName, onActivity, { passive: true });
  });
  overlay.addEventListener("click", stopShowcase);
  renderSlide();
  resetIdle();

  return () => {
    window.clearTimeout(idleTimer);
    window.clearInterval(slideTimer);
    ["pointerdown", "pointermove", "keydown", "touchstart"].forEach((eventName) => {
      document.removeEventListener(eventName, onActivity);
    });
    overlay.removeEventListener("click", stopShowcase);
  };
}
