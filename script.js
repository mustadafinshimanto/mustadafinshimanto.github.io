document.addEventListener("DOMContentLoaded", () => {
    
    // ═══════════════════════════════════════
    // 0. Smooth Scroll (Lenis)
    // ═══════════════════════════════════════
    const lenis = new Lenis({
        duration: 0.8,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 2.2,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // ═══════════════════════════════════════
    // 1. Core Logic & Scroll
    // ═══════════════════════════════════════
    if (history.scrollRestoration) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            lenis.scrollTo(0, { duration: 1.5 });
        });
        backToTop.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                backToTop.click();
            }
        });
    }

    gsap.registerPlugin(ScrollTrigger);

    // Connect Lenis to ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    ScrollTrigger.create({
        start: 'top -500',
        onUpdate: (self) => {
            if (self.scroll() > 500) {
                backToTop?.classList.add('visible');
            } else {
                backToTop?.classList.remove('visible');
            }
        }
    });

    // ═══════════════════════════════════════
    // 2. Text Splitting for Animations
    // ═══════════════════════════════════════
    const splitText = (selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            const text = el.innerText;
            el.innerHTML = '';
            text.split('').forEach(char => {
                const span = document.createElement('span');
                span.className = 'char';
                span.innerText = char === ' ' ? '\u00A0' : char;
                el.appendChild(span);
            });
        });
    };

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

    splitText('[data-split]');

    // ═══════════════════════════════════════
    // 3. Real Asset Preloader with Adaptive Connection Fallbacks
    // ═══════════════════════════════════════
    const counterEl = document.querySelector('.preloader-counter');
    const barEl = document.querySelector('.preloader-bar');
    
    let targetProgress = 0;
    let displayProgress = 0;
    let isFinished = false;

    // Detect mobile device
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Detect slow connections or data-saver mode
    const isSlowConnection = !!(
        navigator.connection && (
            navigator.connection.saveData || 
            ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType)
        )
    );

    // Track fonts loading
    let fontsLoaded = false;
    if (document.fonts) {
        document.fonts.ready.then(() => {
            fontsLoaded = true;
        }).catch(() => {
            fontsLoaded = true;
        });
    } else {
        fontsLoaded = true;
    }

    // Track non-lazy critical images loading
    const eagerImages = Array.from(document.querySelectorAll('img:not([loading="lazy"])'));
    let imagesLoadedCount = 0;
    if (eagerImages.length > 0) {
        eagerImages.forEach(img => {
            if (img.complete) {
                imagesLoadedCount++;
            } else {
                img.addEventListener('load', () => { imagesLoadedCount++; });
                img.addEventListener('error', () => { imagesLoadedCount++; }); // don't block on error
            }
        });
    }

    // Max preloader timeout to prevent being stuck on slower connections
    const startTime = Date.now();
    const TIMEOUT = 5000;

    const loadInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const hasTimedOut = elapsed >= TIMEOUT;

        // 1. Font progress (20% of total load)
        const fProg = fontsLoaded ? 100 : 0;

        // 2. Image progress (80% of total load)
        const iProg = eagerImages.length === 0 ? 100 : (imagesLoadedCount / eagerImages.length) * 100;

        // Calculate weighted progress
        const FONT_WEIGHT = 0.2;
        const IMAGE_WEIGHT = 0.8;

        let actualProgress = (fProg * FONT_WEIGHT) + (iProg * IMAGE_WEIGHT);
        if (hasTimedOut) {
            actualProgress = 100;
        }

        targetProgress = Math.round(actualProgress);

        // Interpolate display progress for premium smooth transition
        const diff = targetProgress - displayProgress;
        if (diff > 0) {
            displayProgress += Math.ceil(diff * 0.08); // smooth catch-up
        }

        if (displayProgress > 100) displayProgress = 100;

        counterEl.textContent = displayProgress;
        barEl.style.width = displayProgress + '%';

        if (displayProgress === 100 && !isFinished) {
            isFinished = true;
            clearInterval(loadInterval);

            setTimeout(() => {
                runIntro();
            }, 100);
        }
    }, 30);

    // ═══════════════════════════════════════
    // 4. Intro Timeline
    // ═══════════════════════════════════════
    function runIntro() {
        const tl = gsap.timeline({
            onComplete: () => {
                document.body.classList.remove('loading');
                // Ensure text is not clipped during continuous wave animation
                gsap.set('.line-wrap', { overflow: 'visible' });
            }
        });

        // Slide preloader up quickly
        tl.to('.preloader', {
            yPercent: -100,
            duration: 0.8,
            ease: "power3.inOut",
            onComplete: () => {
                const preloader = document.querySelector('.preloader');
                if (preloader) preloader.style.display = 'none';
            }
        });

        // Reveal hero title characters with original premium 3D cyber transitions
        tl.fromTo('.hero-title .char', 
            { 
                y: "150%", 
                opacity: 0, 
                rotateX: -90,
                rotateY: 45,
                z: -200,
                color: "#7000ff" 
            },
            {
                y: "0%", 
                opacity: 1, 
                rotateX: 0,
                rotateY: 0,
                z: 0,
                color: "#ffffff",
                duration: 1.5,
                stagger: {
                    amount: 0.8,
                    from: "random"
                },
                ease: "elastic.out(1, 0.4)"
            }, "-=0.7");

        // Fade in hero label (name)
        tl.fromTo('.hero-label', 
            { opacity: 0, y: "15px" },
            {
                opacity: 1, 
                y: "0px",
                duration: 0.5,
                ease: "power2.out"
            }, "-=0.5");

        // Fade hero footer elements (description & scroll indicator)
        tl.fromTo('.hero-footer p, .scroll-indicator', 
            { opacity: 0, y: "15px" },
            {
                opacity: 1, 
                y: "0px",
                duration: 0.5,
                stagger: 0.1,
                ease: "power2.out"
            }, "-=0.4");

        // Navbar entrance
        tl.fromTo('.navbar', 
            { y: -30, opacity: 0 }, 
            {
                y: 0, 
                opacity: 1,
                duration: 0.5,
                ease: "power3.out"
            }, "-=0.4");
    }

    // ═══════════════════════════════════════
    // 5. Navbar scroll effect
    // ═══════════════════════════════════════
    ScrollTrigger.create({
        start: "top -80",
        onUpdate: (self) => {
            const nav = document.getElementById('navbar');
            if (self.direction === 1 && self.scroll() > 100) {
                nav.classList.add('scrolled');
            } else if (self.scroll() < 100) {
                nav.classList.remove('scrolled');
            }
        }
    });

    // ═══════════════════════════════════════
    // 6. Marquee speed effect on scroll
    // ═══════════════════════════════════════
    const marqueeWrapper = document.querySelector('.marquee-wrapper');
    if (marqueeWrapper) {
        gsap.to(marqueeWrapper, {
            scrollTrigger: {
                trigger: '.marquee-section',
                start: "top bottom",
                end: "bottom top",
                scrub: 1
            },
            x: -200,
            ease: "none"
        });
    }

    // ═══════════════════════════════════════
    // 7. Image Reveal Animations (clip-path wipe)
    // ═══════════════════════════════════════
    document.querySelectorAll('.image-reveal').forEach(reveal => {
        gsap.to(reveal, {
            clipPath: "inset(0 0% 0 0)",
            duration: 1.5,
            ease: "power4.inOut",
            scrollTrigger: {
                trigger: reveal,
                start: "top 80%",
            }
        });
    });

    // ═══════════════════════════════════════
    // 7.5. Global 3D Cyber Neural Background Engine (Interactive 60+ FPS Canvas)
    // ═══════════════════════════════════════
    const neuralCanvas = document.getElementById('neuralCanvas');
    if (neuralCanvas) {
        const ctx = neuralCanvas.getContext('2d');
        let width = 0;
        let height = 0;
        let dpr = 1;

        function resizeCanvas() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            neuralCanvas.width = width * dpr;
            neuralCanvas.height = height * dpr;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // 3D Neural Nodes Configuration
        const nodeCount = isMobile ? 55 : 100;
        const nodes = [];
        const fov = 400;
        let rotY = 0;
        let rotX = 0;
        let targetRotX = 0;
        let targetRotY = 0;
        let scrollSpin = 0;
        let mouseX = width / 2;
        let mouseY = height / 2;
        let curMouseX = width / 2;
        let curMouseY = height / 2;

        const colors = [
            '#00f3ff', // Cyan
            '#00f3ff', 
            '#7000ff', // Neon Purple
            '#9d4edd', // Bright Violet
            '#ffffff'  // Cyber White
        ];

        // Spread nodes evenly throughout a dynamic 3D ellipsoid
        for (let i = 0; i < nodeCount; i++) {
            const radX = 350 + Math.random() * 450;
            const radY = 220 + Math.random() * 320;
            const radZ = 300 + Math.random() * 400;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            nodes.push({
                x: radX * Math.sin(phi) * Math.cos(theta),
                y: radY * Math.sin(phi) * Math.sin(theta),
                z: radZ * Math.cos(phi),
                baseX: radX * Math.sin(phi) * Math.cos(theta),
                baseY: radY * Math.sin(phi) * Math.sin(theta),
                baseZ: radZ * Math.cos(phi),
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                vz: (Math.random() - 0.5) * 0.25,
                size: 1.8 + Math.random() * 2.2,
                color: colors[Math.floor(Math.random() * colors.length)],
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: 0.02 + Math.random() * 0.03
            });
        }

        // Global mouse tracking across the entire website
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            targetRotY = ((mouseX - width / 2) / (width / 2)) * 0.35;
            targetRotX = -((mouseY - height / 2) / (height / 2)) * 0.25;
        });

        // Touch tracking for mobile
        window.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches[0]) {
                mouseX = e.touches[0].clientX;
                mouseY = e.touches[0].clientY;
                targetRotY = ((mouseX - width / 2) / (width / 2)) * 0.25;
                targetRotX = -((mouseY - height / 2) / (height / 2)) * 0.18;
            }
        }, { passive: true });

        // Scroll-driven camera rotation across the page
        lenis.on('scroll', (e) => {
            scrollSpin = (e.scroll || window.scrollY) * 0.0006;
        });

        let isDocumentVisible = true;
        document.addEventListener('visibilitychange', () => {
            isDocumentVisible = !document.hidden;
        });

        function renderNeuralNetwork() {
            requestAnimationFrame(renderNeuralNetwork);
            if (!isDocumentVisible) return;

            // Interpolate mouse and rotation smoothly
            curMouseX += (mouseX - curMouseX) * 0.06;
            curMouseY += (mouseY - curMouseY) * 0.06;
            rotY += (targetRotY + scrollSpin - rotY) * 0.04;
            rotX += (targetRotX - rotX) * 0.04;

            ctx.clearRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;
            const cosY = Math.cos(rotY);
            const sinY = Math.sin(rotY);
            const cosX = Math.cos(rotX);
            const sinX = Math.sin(rotX);

            const projected = [];

            // Project 3D coordinates
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];

                // Slow ambient drift
                n.baseX += n.vx;
                n.baseY += n.vy;
                n.baseZ += n.vz;
                if (Math.abs(n.baseX) > 850) n.vx *= -1;
                if (Math.abs(n.baseY) > 550) n.vy *= -1;
                if (Math.abs(n.baseZ) > 750) n.vz *= -1;

                n.pulse += n.pulseSpeed;

                // 3D Rotation (Y then X)
                let x1 = n.baseX * cosY - n.baseZ * sinY;
                let z1 = n.baseZ * cosY + n.baseX * sinY;
                let y1 = n.baseY * cosX - z1 * sinX;
                let z2 = z1 * cosX + n.baseY * sinX;

                // Mouse magnetic reaction
                const distToMouse = Math.hypot(x1 - (curMouseX - cx) * 0.8, y1 - (curMouseY - cy) * 0.8);
                if (distToMouse < 180) {
                    const force = (1 - distToMouse / 180) * 22;
                    x1 += ((x1 - (curMouseX - cx) * 0.8) / (distToMouse || 1)) * force;
                    y1 += ((y1 - (curMouseY - cy) * 0.8) / (distToMouse || 1)) * force;
                }

                const scale = fov / (fov + z2 + 350);
                if (scale <= 0) continue;

                projected.push({
                    x: cx + x1 * scale,
                    y: cy + y1 * scale,
                    scale: scale,
                    z: z2,
                    color: n.color,
                    size: Math.max(n.size * scale * (1 + 0.25 * Math.sin(n.pulse)), 1)
                });
            }

            // Draw synaptic connection network
            const maxDist = isMobile ? 85 : 125;
            for (let i = 0; i < projected.length; i++) {
                const p1 = projected[i];
                for (let j = i + 1; j < projected.length; j++) {
                    const p2 = projected[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < maxDist && Math.abs(p1.z - p2.z) < 260) {
                        const alpha = (1 - dist / maxDist) * 0.35 * Math.min(p1.scale, p2.scale);
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(0, 243, 255, ${alpha.toFixed(3)})`;
                        ctx.lineWidth = Math.min(p1.scale * 1.1, 1.2);
                        ctx.stroke();
                    }
                }
            }

            // Draw glowing nodes
            for (let i = 0; i < projected.length; i++) {
                const p = projected[i];
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 10 * p.scale;
                ctx.fill();
            }
            ctx.shadowBlur = 0;
        }

        requestAnimationFrame(renderNeuralNetwork);
    }

    // ═══════════════════════════════════════
    // 8. Parallax on images
    // ═══════════════════════════════════════
    document.querySelectorAll('.image-reveal img, .image-reveal video, .project-image-wrapper img').forEach(img => {
        const trigger = img.closest('.image-reveal-wrapper') || img.closest('.project-image-wrapper');
        gsap.to(img, {
            yPercent: -15,
            ease: "none",
            scrollTrigger: {
                trigger: trigger,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });

    // ═══════════════════════════════════════
    // 9. Floating text parallax
    // ═══════════════════════════════════════
    document.querySelectorAll('.rellax').forEach(el => {
        const speed = parseFloat(el.dataset.speed) || 0.5;
        gsap.to(el, {
            y: () => -120 * speed,
            ease: "none",
            scrollTrigger: {
                trigger: el.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });

    // ═══════════════════════════════════════
    // 10. General scroll reveals
    // ═══════════════════════════════════════
    document.querySelectorAll('.reveal-up:not(.hero-label):not(.hero-footer p):not(.scroll-indicator)').forEach(el => {
        gsap.to(el, {
            opacity: 1, y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: el,
                start: "top 88%"
            }
        });
    });

    // ═══════════════════════════════════════
    // 11. Skill bar fill animation
    // ═══════════════════════════════════════
    document.querySelectorAll('.skill-fill').forEach(bar => {
        const w = bar.dataset.width || 50;
        gsap.to(bar, {
            width: w + '%',
            duration: 1.5,
            ease: "power2.out",
            scrollTrigger: {
                trigger: bar,
                start: "top 90%"
            }
        });
    });

    // ═══════════════════════════════════════
    // 12. Service items stagger
    // ═══════════════════════════════════════
    gsap.utils.toArray('.service-item').forEach((item, i) => {
        gsap.fromTo(item,
            { opacity: 0, x: -30 },
            {
                opacity: 1, x: 0,
                duration: 0.8,
                delay: i * 0.1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: item,
                    start: "top 85%"
                }
            }
        );
    });

    // ═══════════════════════════════════════
    // 13. Skill cards tilt & stagger
    // ═══════════════════════════════════════
    gsap.utils.toArray('.skill-card').forEach((card, i) => {
        gsap.fromTo(card,
            { opacity: 0, y: 50, scale: 0.95 },
            {
                opacity: 1, y: 0, scale: 1,
                duration: 0.8,
                delay: i * 0.08,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: card,
                    start: "top 90%"
                }
            }
        );

        if (!isMobile) {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 15;
                const rotateY = (centerX - x) / 15;

                gsap.to(card, {
                    rotateX: rotateX,
                    rotateY: rotateY,
                    duration: 0.5,
                    ease: "power2.out"
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    rotateX: 0, rotateY: 0,
                    duration: 0.5, ease: "power2.out"
                });
            });
        }
    });

    // ═══════════════════════════════════════
    // 13.5. Education cards tilt & stagger
    // ═══════════════════════════════════════
    gsap.utils.toArray('.education-card').forEach((card, i) => {
        gsap.fromTo(card,
            { opacity: 0, y: 50, scale: 0.95 },
            {
                opacity: 1, y: 0, scale: 1,
                duration: 0.8,
                delay: i * 0.1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: card,
                    start: "top 90%"
                }
            }
        );

        if (!isMobile) {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;

                gsap.to(card, {
                    rotateX: rotateX,
                    rotateY: rotateY,
                    duration: 0.5,
                    ease: "power2.out",
                    transformPerspective: 1000
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    rotateX: 0, rotateY: 0,
                    duration: 0.5, ease: "power2.out"
                });
            });
        }
    });

    // ═══════════════════════════════════════
    // 14. Magnetic Effects
    // ═══════════════════════════════════════
    const magneticElements = document.querySelectorAll('.nav-cta, .massive-link, .back-to-top, .footer-links a, .recruitment-btn');
    
    if (!isMobile) {
        magneticElements.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                gsap.to(el, {
                    x: x * 0.3, y: y * 0.3,
                    duration: 0.4, ease: "power2.out"
                });
            });

            el.addEventListener('mouseleave', () => {
                gsap.to(el, {
                    x: 0, y: 0,
                    duration: 0.6, ease: "elastic.out(1, 0.4)"
                });
            });
        });
    }

    // ═══════════════════════════════════════
    // 11. Certifications: 3D Tilt & Lightbox
    // ═══════════════════════════════════════
    const certCards = document.querySelectorAll('.cert-card');
    const modal = document.getElementById('certModal');
    const modalImg = document.getElementById('modalImage');
    const modalClose = document.getElementById('modalClose');
    let lastActiveElement = null;

    // Open Lightbox helper
    const openModal = (card) => {
        lastActiveElement = document.activeElement;
        const openLightbox = () => {
            const imgSrc = card.querySelector('img').src;
            modalImg.src = imgSrc;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            modalClose?.focus();
            
            // Animation for modal contents
            gsap.from("#modalImage", {
                scale: 0.8,
                opacity: 0,
                duration: 0.4,
                ease: "back.out(1.7)"
            });
        };

        openLightbox();
    };

    certCards.forEach(card => {
        if (!isMobile) {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Update CSS variables for the mouse follow effect
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
                // Calculate tilt based on center point
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 8;
                const rotateY = (centerX - x) / 8;

                gsap.to(card, {
                    rotateX: rotateX,
                    rotateY: rotateY,
                    duration: 0.5,
                    ease: "power2.out",
                    transformPerspective: 1000
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.5,
                    ease: "power2.out"
                });
            });
        }

        // Open Lightbox
        card.addEventListener('click', () => openModal(card));

        // Keyboard activation
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal(card);
            }
        });
    });

    // Close Lightbox
    const closeModalFunc = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        if (lastActiveElement) {
            lastActiveElement.focus();
        }
    };

    modalClose?.addEventListener('click', closeModalFunc);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModalFunc();
    });

    // Keyboard support (Escape to close)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModalFunc();
        }
    });

    // ═══════════════════════════════════════
    // 15. Mobile Menu Toggle
    // ═══════════════════════════════════════
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            const isActive = navMenu.classList.contains('active');
            menuToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            if (isActive) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu on link click
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            });
        });
    }

    // ═══════════════════════════════════════
    // 16. Continuous Title Transition
    // ═══════════════════════════════════════
    const titles = [
        { l1: "Full-Stack", l2: "AI-Native", l3: "Developer" },
        { l1: "Cyber", l2: "Security", l3: "Expert" }
    ];
    let currentTitleIndex = 0;
    let waveTween;

    function startHeroWave() {
        if (waveTween) waveTween.kill();
        waveTween = gsap.to('.hero-title .char', {
            y: -15,
            color: "#00f3ff",
            textShadow: "0 0 20px rgba(0,243,255,0.8)",
            duration: 1.2,
            stagger: {
                each: 0.1,
                yoyo: true,
                repeat: -1
            },
            ease: "sine.inOut"
        });
    }

    function swapHeroTitle() {
        if (waveTween) waveTween.kill();
        // Reset all 3 lines' characters to baseline
        gsap.set('#titleLine1 .char, #titleLine2 .char, #titleLine3 .char', { y: 0, color: "#ffffff", textShadow: "none" });
        // Set overflow to hidden for the sliding mask effect during transition
        gsap.set('.line-wrap', { overflow: 'hidden' });

        currentTitleIndex = (currentTitleIndex + 1) % titles.length;
        const nextTitle = titles[currentTitleIndex];

        const line1 = document.getElementById('titleLine1');
        const line2 = document.getElementById('titleLine2');
        const line3 = document.getElementById('titleLine3');

        const tl = gsap.timeline({
            onComplete: () => {
                // Update text using the in-place split text recycling
                updateSplitText(line1, nextTitle.l1);
                updateSplitText(line2, nextTitle.l2);
                updateSplitText(line3, nextTitle.l3);

                // Reveal animation for new characters
                gsap.fromTo(['#titleLine1 .char', '#titleLine2 .char', '#titleLine3 .char'], 
                    { 
                        y: "100%", 
                        opacity: 0, 
                        rotateX: -90,
                        color: "#7000ff"
                    },
                    {
                        y: "0%", 
                        opacity: 1, 
                        rotateX: 0,
                        color: "#ffffff",
                        duration: 0.8,
                        stagger: 0.05,
                        ease: "power2.out",
                        onComplete: () => {
                            startHeroWave();
                            // Ensure text is not clipped during continuous wave animation
                            gsap.set('.line-wrap', { overflow: 'visible' });
                        }
                    }
                );
            }
        });

        // Hide current characters of line 1, 2, and 3
        tl.to(['#titleLine1 .char', '#titleLine2 .char', '#titleLine3 .char'], {
            y: "-100%",
            opacity: 0,
            duration: 0.5,
            stagger: 0.02,
            ease: "power2.in"
        });
    }

    // Start wave after initial intro (3s)
    setTimeout(() => {
        startHeroWave();
        // Start rotation loop
        setInterval(swapHeroTitle, 5000);
    }, 3000);

    // ═══════════════════════════════════════
    // 19. ResizeObserver for content-visibility
    // ═══════════════════════════════════════
    if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => {
            ScrollTrigger.refresh();
        });
        document.querySelectorAll('.about, .projects-section, .certifications, .education, .skills-section, .recruitment-section, .footer').forEach(el => {
            ro.observe(el);
        });
    }

});
