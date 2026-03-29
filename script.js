document.addEventListener("DOMContentLoaded", () => {

    gsap.registerPlugin(ScrollTrigger);

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
            duration: 1,
            ease: "power4.inOut"
        });

        // Reveal hero title lines
        tl.to('.reveal-text', {
            y: "0%",
            duration: 1.4,
            stagger: 0.15,
            ease: "power4.out"
        }, "-=0.4");

        // Fade in hero label
        tl.to('.hero-label', {
            opacity: 1, y: 0,
            duration: 0.8,
            ease: "power2.out"
        }, "-=1.2");

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
    // 13. Skill cards stagger
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
    });

    // ═══════════════════════════════════════
    // 14. Footer massive link magnetic effect
    // ═══════════════════════════════════════
    const massiveLink = document.querySelector('.massive-link');
    if (massiveLink) {
        massiveLink.addEventListener('mousemove', (e) => {
            const rect = massiveLink.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(massiveLink, {
                x: x * 0.15, y: y * 0.15,
                duration: 0.4, ease: "power2.out"
            });
        });

        massiveLink.addEventListener('mouseleave', () => {
            gsap.to(massiveLink, {
                x: 0, y: 0,
                duration: 0.6, ease: "elastic.out(1, 0.5)"
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

});
