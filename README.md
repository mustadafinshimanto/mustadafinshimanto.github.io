# Mustadafin Shimanto — Personal Portfolio

Welcome to the source repository of my personal portfolio website. This site exhibits a high-end, responsive cyber-themed aesthetic, showcasing my experience transitioning from defensive cybersecurity to designing vibe-coded intelligent systems.

Live site: [https://mustadafinshimanto.github.io/](https://mustadafinshimanto.github.io/)

---

## ⚡ Core Features

- **Cyberpunk / Glassmorphic Aesthetic**: Deep indigo backgrounds, neon gradients, ambient floating orbs, and real-time noise overlay filters.
- **Scroll Animations**: Dynamic page movement and parallax layouts powered by **GSAP (GreenSock)** and **ScrollTrigger**.
- **Smooth Inertial Scrolling**: Smooth-scrolling behavior across all viewports enabled by **Lenis**.
- **3D Tilt Interactions**: Card tilting and mouse-light-tracking effects for skills and certificate galleries.
- **Lightbox Gallery**: Immersive, full-screen lightbox dialog to inspect certifications.
- **Micro-animations**: Dynamic looping titles and letter-wave animations.
- **SEO Ready**: Schema.org JSON-LD structured data, metadata optimization, sitemap, and robots configurations included.
- **Fully Accessible (a11y)**: Built-in support for keyboard tabs, clear button roles, dynamic `aria-expanded` toggle hooks, and focus state restoration.

---

## 🛠️ Technology Stack

- **Markup & Structure**: Semantic HTML5.
- **Styling**: Vanilla CSS3 custom properties (CSS variables), grid layouts, and clip-path wipes.
- **Interactions & Logic**: JavaScript (ES6+), GSAP 3, ScrollTrigger, and Lenis Scroll (delivered via secure CDNs).
- **Hosting**: GitHub Pages (fully static, client-side, zero runtime server required).

---

## 📂 Project Structure

```text
├── assets/                  # Images, certificate photos, and skill icons
│   ├── certificates/        # License and cert image files
│   ├── skills/              # Technology/skill logos
│   ├── img1.png             # Parallax background artwork
│   ├── img2.png             # Cyber security conceptual artwork
│   └── mustadafinshimanto.png # Profile picture
├── index.html               # Main website markup & layout
├── style.css                # Global stylesheet containing core design system
├── script.js                # Core JS logic, GSAP animations, and dynamic behaviors
├── favicon.png              # Site icon
├── robots.txt               # Crawler instructions
└── sitemap.xml              # Search engine index helper
```

---

## ⚙️ Performance & Accessibility Optimizations

### 1. High-Performance Text Splitting Loop
The hero title features a dynamic word rotation ("Vibe Coding" ↔ "Cyber Security"). Originally, this was done by recreating DOM nodes from scratch every 5 seconds. The current implementation recycles the existing character `<span>` tags in-place:
```javascript
// Updates existing text nodes in-place rather than rebuilding HTML
const updateSplitText = (el, newText) => {
    const chars = newText.split('');
    const existingSpans = el.querySelectorAll('.char');
    
    for (let i = 0; i < Math.max(chars.length, existingSpans.length); i++) {
        if (i < chars.length) {
            const char = chars[i] === ' ' ? '\u00A0' : chars[i];
            if (i < existingSpans.length) {
                const span = existingSpans[i];
                span.innerText = char;
                gsap.set(span, { clearProps: "all" });
            } else {
                const span = document.createElement('span');
                span.className = 'char';
                span.innerText = char;
                el.appendChild(span);
            }
        } else {
            existingSpans[i].remove();
        }
    }
};
```

### 2. Full Keyboard Navigation Support
All card triggers and back-to-top buttons support tab indexing and activation triggers:
- Keyboard focusable via `tabindex="0"`.
- Activates on `Enter` or `Space` keydown events.
- Modal focus restoration logic saves the triggering element and returns focus to it when the modal is closed.

### 3. Image Lazy Loading
Images below the fold are loaded asynchronously using native browser lazy loading (`loading="lazy"`), boosting initial lighthouse metrics and reducing mobile bandwidth consumption.

---

## 🚀 Local Development

To run and view the website locally, use a simple static server of your choice:

### Option A: Using Python (Built-in)
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your web browser.

### Option B: Using Node.js (npx)
```bash
npx http-server -p 8080
```
Then open `http://localhost:8080` in your web browser.
