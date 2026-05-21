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

    // Reference and handle background video loading
    const bgVideo = document.getElementById('bgVideo');
    let videoActive = !!bgVideo;
    let shouldPlayVideo = false;

    // Helper function to robustly discard video element and stop stream downloading
    const discardVideo = (videoEl) => {
        if (!videoEl) return;
        // Strip the src attribute on the video itself
        videoEl.removeAttribute('src');
        // Clear all <source> child elements
        while (videoEl.firstChild) {
            videoEl.removeChild(videoEl.firstChild);
        }
        // Force the video element to reload to clear references & buffer
        try {
            videoEl.load();
        } catch (e) {}
        // Remove from DOM
        videoEl.remove();
    };

    if (bgVideo) {
        if (isSlowConnection || isMobile) {
            // Discard heavy video immediately on 2G/3G/Save-Data or mobile devices to prevent UI jank
            discardVideo(bgVideo);
            videoActive = false;
            shouldPlayVideo = false;
        } else {
            // Start playing immediately in the background so it is already running when the preloader slides up
            bgVideo.play().catch(err => {
                console.log("Early background video play was prevented/blocked, will retry on transition:", err);
            });
            shouldPlayVideo = true;
        }
    }

    // Max preloader timeout to prevent being stuck on slower connections
    const startTime = Date.now();
    const TIMEOUT = 7000;

    // Only track video buffering in preloader on desktop connections that aren't slow.
    // Mobile browsers block preloading/buffering of media until play is initiated,
    // so we exclude it from preloader progress to prevent mobile devices from hanging.
    const trackVideoProgress = videoActive && !isMobile;

    const loadInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const hasTimedOut = elapsed >= TIMEOUT;

        // 1. Font progress (20% of total load)
        const fProg = fontsLoaded ? 100 : 0;

        // 2. Image progress (30% if video is tracked, otherwise 80%)
        const iProg = eagerImages.length === 0 ? 100 : (imagesLoadedCount / eagerImages.length) * 100;

        // 3. Video buffering progress (50% if video is tracked)
        let vProg = 100;
        if (trackVideoProgress && bgVideo) {
            if (bgVideo.readyState >= 1 && bgVideo.duration) {
                const buffered = bgVideo.buffered;
                if (buffered.length > 0) {
                    const bufferedEnd = buffered.end(buffered.length - 1);
                    vProg = Math.min((bufferedEnd / bgVideo.duration) * 100, 100);
                } else {
                    vProg = 0;
                }
            } else {
                vProg = 0;
            }
        }

        // Calculate weighted progress
        const FONT_WEIGHT = 0.2;
        const IMAGE_WEIGHT = trackVideoProgress ? 0.3 : 0.8;
        const VIDEO_WEIGHT = trackVideoProgress ? 0.5 : 0.0;

        let actualProgress = (fProg * FONT_WEIGHT) + (iProg * IMAGE_WEIGHT) + (vProg * VIDEO_WEIGHT);
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

            if (bgVideo && shouldPlayVideo) {
                if (trackVideoProgress) {
                    // Check if the video buffered enough to play smoothly on desktop
                    const videoBufferedEnough = vProg >= 80;
                    if (videoBufferedEnough && !hasTimedOut) {
                        // Video is ready to play
                    } else {
                        // Discard it if it failed to buffer in time
                        discardVideo(bgVideo);
                        shouldPlayVideo = false;
                    }
                } else {
                    // Keep the video element on mobile since we bypass pre-buffering tracking
                }
            }

            setTimeout(() => {
                runIntro(shouldPlayVideo);
            }, 100);
        }
    }, 30);

    // ═══════════════════════════════════════
    // 4. Intro Timeline
    // ═══════════════════════════════════════
    function runIntro(playVideo) {
        // Fallback play trigger if not already playing
        if (playVideo && bgVideo && bgVideo.parentNode) {
            bgVideo.play().catch(err => {
                console.log("Background video play fallback failed:", err);
            });
        }

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

        // Reveal background video opacity concurrently
        tl.fromTo('.bg-video', { opacity: 0 }, {
            opacity: 0.4,
            duration: 1.0,
            ease: "power2.out"
        }, "-=0.6");

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
        { l1: "Vibe", l2: "Coding" },
        { l1: "Cyber", l2: "Security" }
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
        // Reset all title characters to baseline before transitioning to avoid layout/animation conflicts
        gsap.set('.hero-title .char', { y: 0, color: "#ffffff", textShadow: "none" });
        // Set overflow to hidden for mask effect during transition
        gsap.set('.line-wrap', { overflow: 'hidden' });

        currentTitleIndex = (currentTitleIndex + 1) % titles.length;
        const nextTitle = titles[currentTitleIndex];

        const line1 = document.getElementById('titleLine1');
        const line2 = document.getElementById('titleLine2');

        const tl = gsap.timeline({
            onComplete: () => {
                // Update text using the in-place split text recycling
                updateSplitText(line1, nextTitle.l1);
                updateSplitText(line2, nextTitle.l2);

                // Reveal animation for new characters
                gsap.fromTo(['#titleLine1 .char', '#titleLine2 .char'], 
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

        // Hide current characters of line 1 and 2
        tl.to(['#titleLine1 .char', '#titleLine2 .char'], {
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
