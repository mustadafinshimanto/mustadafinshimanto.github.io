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

    splitText('[data-split]');

    // ═══════════════════════════════════════
    // 3. Preloader
    // ═══════════════════════════════════════
    const counterEl = document.querySelector('.preloader-counter');
    const barEl = document.querySelector('.preloader-bar');
    let progress = 0;

    const loadInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 20) + 15;
        if (progress > 100) progress = 100;
        counterEl.textContent = progress;
        barEl.style.width = progress + '%';

        if (progress === 100) {
            clearInterval(loadInterval);
            setTimeout(runIntro, 50);
        }
    }, 20);

    // ═══════════════════════════════════════
    // 4. Intro Timeline
    // ═══════════════════════════════════════
    function runIntro() {
        const tl = gsap.timeline({
            onComplete: () => document.body.classList.remove('loading')
        });

        // Slide preloader up
        tl.to('.preloader', {
            yPercent: -100,
            duration: 1.2,
            ease: "power4.inOut"
        });

        // Reveal background video opacity
        tl.fromTo('.bg-video', { opacity: 0 }, {
            opacity: 0.4,
            duration: 2,
            ease: "power2.out"
        }, "-=0.8");

        // Reveal hero title characters with 3D cyber transitions
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
            }, "-=1.2");

        // Fade in hero label
        tl.to('.hero-label', {
            opacity: 1, y: 0,
            duration: 0.8,
            ease: "power2.out"
        }, "-=1.0");

        // Fade hero footer elements
        tl.to('.hero-footer p, .scroll-indicator', {
            opacity: 1, y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power2.out"
        }, "-=0.6");

        // Navbar entrance
        tl.fromTo('.navbar', { y: -100, opacity: 0 }, {
            y: 0, opacity: 1,
            duration: 0.8,
            ease: "power3.out"
        }, "-=0.6");
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
    const marqueeTrack = document.querySelector('.marquee-track');
    if (marqueeTrack) {
        gsap.to(marqueeTrack, {
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
    // 8. Parallax on images
    // ═══════════════════════════════════════
    document.querySelectorAll('.image-reveal img, .image-reveal video').forEach(img => {
        gsap.to(img, {
            yPercent: -15,
            ease: "none",
            scrollTrigger: {
                trigger: img.closest('.image-reveal-wrapper'),
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
    });

    // ═══════════════════════════════════════
    // 14. Magnetic Effects
    // ═══════════════════════════════════════
    const magneticElements = document.querySelectorAll('.nav-cta, .massive-link, .back-to-top, .footer-links a');
    
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

    // ═══════════════════════════════════════
    // 11. Certifications: 3D Tilt & Lightbox
    // ═══════════════════════════════════════
    const certCards = document.querySelectorAll('.cert-card');
    const modal = document.getElementById('certModal');
    const modalImg = document.getElementById('modalImage');
    const modalClose = document.getElementById('modalClose');

    certCards.forEach(card => {
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

        // Open Lightbox
        card.addEventListener('click', () => {
            const imgSrc = card.querySelector('img').src;
            modalImg.src = imgSrc;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Animation for modal contents
            gsap.from("#modalImage", {
                scale: 0.8,
                opacity: 0,
                duration: 0.4,
                ease: "back.out(1.7)"
            });
        });
    });

    // Close Lightbox
    const closeModalFunc = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
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
            if (navMenu.classList.contains('active')) {
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
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            });
        });
    }

    // ═══════════════════════════════════════
    // 16. Continuous Cyber Wave Effect for Hero
    // ═══════════════════════════════════════
    const heroChars = document.querySelectorAll('.hero-title .char');
    
    // Start a continuous, glowing wave animation automatically after the intro sequence finishes
    setTimeout(() => {
        gsap.to('.hero-title .char', {
            y: -15,
            color: "#00f3ff",
            textShadow: "0 0 20px rgba(0,243,255,0.8)",
            duration: 1.5,
            stagger: {
                each: 0.1,
                yoyo: true,
                repeat: -1
            },
            ease: "sine.inOut"
        });
    }, 3000);

});
