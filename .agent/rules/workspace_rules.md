# Antigravity Agent Workspace Rules - Portfolio Website Builder

This file allows both the Antigravity IDE and CLI (`agy`) agents to maintain workspace context and adhere to project-specific constraints.

## 1. Technical Stack & Deployment Constraints
- **Static Delivery Only**: This project is hosted on GitHub Pages. Do NOT add node build steps, backend frameworks, Webpack/Vite pipelines, or dynamic servers to the production codebase.
- **HTML/CSS/JS Core**: Maintain a clean structure of `index.html`, `style.css`, and `script.js` directly in the root of the workspace.
- **CDNs for External Dependencies**: Use stable CDNs (e.g. cdnjs, unpkg) for third-party scripts. Currently, the project utilizes:
  - GSAP (GreenSock Animation Platform) + ScrollTrigger (via cdnjs)
  - Lenis Scroll (via unpkg)
  - FontAwesome (via cdnjs)
  - Orbitron, Rajdhani, and Share Tech Mono Google Fonts

## 2. Core Architectural Standards
- **DOM Animation Optimization**: Continuous letter animations and word rotations (such as in `swapHeroTitle`) MUST recycle existing `<span>` characters (using `updateSplitText` in `script.js`) to avoid thrashing the DOM or forcing layout recalculation.
- **GSAP Tweens Cleanup**: Always kill active tweens (like `waveTween`) before beginning transition animations on the same elements to prevent frame stutters.
- **CSS Custom Properties**: Keep colors, spacing, and transition speeds mapped to the custom properties declared in `:root` inside `style.css`.

## 3. Accessibility (a11y) Rules
- **Interactive Elements**: All custom clickable items (like `.cert-card` and `.back-to-top`) must have:
  - `tabindex="0"` for tab-navigation support.
  - `role="button"` and clear `aria-label` / `aria-haspopup` tags.
  - Keyboard listeners for `Enter` and `Space` in `script.js`.
- **Focus Management**: Lightbox modals must trap focus or restore keyboard focus back to the originating element when closed to preserve user flow.
- **Menu States**: Mobile menu hamburgers must declare default `aria-expanded="false"` and transition programmatically to `"true"` when active.

## 4. Git Branch Hygiene
- Do not commit node modules, temporary test configurations, or local development files. Ensure they are kept inside `.gitignore`.
