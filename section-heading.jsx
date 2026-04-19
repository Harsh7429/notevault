@import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
  --base-cream: #f6f1e8;
  --base-paper: #fffdf8;
  --ink-900: #161616;
  --ink-700: #4b463d;
  --line-soft: rgba(22, 22, 22, 0.1);
  --accent-olive: #5f6f52;
  --accent-sand: #d9c8a9;
  --accent-coral: #c98773;
}

html {
  scroll-behavior: smooth;
  overflow-x: hidden;
  /* iOS momentum scrolling */
  -webkit-overflow-scrolling: touch;
}

body {
  margin: 0;
  min-height: 100vh;
  /* Full-bleed on iOS including safe areas */
  min-height: -webkit-fill-available;
  background: var(--base-cream);
  color: var(--ink-900);
  font-family: "Manrope", sans-serif;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* Safe-area padding for iPhone notch / home bar */
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

* {
  box-sizing: border-box;
}

button,
a,
input,
textarea,
select {
  font: inherit;
}

/* CRITICAL: Prevent iOS Safari from zooming into focused inputs */
@media (max-width: 767px) {
  input,
  select,
  textarea {
    font-size: 16px !important;
  }
}

/* Minimum touch target size — 44×44px per Apple HIG */
button,
[role="button"],
a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

/* Override for decorative/text-only links that shouldn't be taller */
a.no-min-h,
span > a,
p > a {
  min-height: unset;
  display: inline;
}

a {
  color: inherit;
  text-decoration: none;
}

canvas {
  display: block;
}

/* react-pdf: prevent canvas from ever exceeding its container width.
   Without this, on mobile the PDF canvas can render at its natural
   PDF width (e.g. 595px for A4) and overflow the viewport. */
.react-pdf__Page,
.react-pdf__Page__canvas,
.react-pdf__Page__textContent {
  max-width: 100% !important;
  width: 100% !important;
  height: auto !important;
}

.react-pdf__Page__canvas {
  /* Canvas must scale down on narrow screens */
  max-width: 100% !important;
  height: auto !important;
}

::selection {
  background: rgba(95, 111, 82, 0.2);
  color: #11110f;
}

/* Tap highlight color for mobile */
* {
  -webkit-tap-highlight-color: rgba(95, 111, 82, 0.12);
}

.font-heading {
  font-family: "Fraunces", serif;
}

.glass-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 253, 248, 0.78));
  border: 1px solid rgba(22, 22, 22, 0.08);
  box-shadow: 0 20px 60px rgba(80, 68, 48, 0.08);
}

.market-card {
  background: rgba(255, 253, 248, 0.84);
  border: 1px solid rgba(22, 22, 22, 0.08);
  box-shadow: 0 18px 48px rgba(80, 68, 48, 0.07);
}

.soft-grid {
  background-image:
    linear-gradient(rgba(22, 22, 22, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(22, 22, 22, 0.04) 1px, transparent 1px);
  background-size: 48px 48px;
}

.home-orb {
  filter: blur(14px);
  opacity: 0.55;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
