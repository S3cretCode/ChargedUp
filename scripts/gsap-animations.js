/* ============================================
   ChargedUP: GSAP ScrollTrigger Animations
   Optimized for performance
   ============================================ */

(function initGSAPAnimations() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnimations);
    } else {
        initAnimations();
    }

    function initAnimations() {
        // Check if GSAP and ScrollTrigger are available
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('GSAP or ScrollTrigger not loaded');
            return;
        }

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            console.log('Reduced motion preference detected, skipping animations');
            initPageNavigation(); // Still add navigation
            return;
        }

        // Register ScrollTrigger plugin
        gsap.registerPlugin(ScrollTrigger);

        /* ============================================
           Page Load Animations (Simple, no ScrollTrigger)
           ============================================ */

        // Hero content staggered reveal
        const heroContent = document.querySelector('.hero__content');
        if (heroContent) {
            gsap.from('.hero__content > *', {
                opacity: 0,
                y: 20,
                duration: 0.6,
                stagger: 0.15,
                ease: 'power2.out',
                delay: 0.2
            });
        }

        // Page title animation
        const pageTitle = document.querySelector('.section:first-child h1');
        if (pageTitle) {
            gsap.from(pageTitle, {
                opacity: 0,
                y: 15,
                duration: 0.5,
                ease: 'power2.out',
                delay: 0.1
            });
        }

        /* ============================================
           ScrollTrigger: Batch Animation (Performance)
           Uses a single observer for all cards
           ============================================ */

        // Batch animate cards - much more performant than individual triggers
        ScrollTrigger.batch('.card', {
            onEnter: batch => gsap.to(batch, {
                opacity: 1,
                y: 0,
                stagger: 0.1,
                duration: 0.5,
                ease: 'power2.out'
            }),
            start: 'top 90%',
            once: true
        });

        // Set initial state for cards
        gsap.set('.card', { opacity: 0, y: 20 });

        /* ============================================
           Footer Reveal (Single trigger)
           ============================================ */

        const footer = document.querySelector('.footer');
        if (footer) {
            gsap.from(footer, {
                scrollTrigger: {
                    trigger: footer,
                    start: 'top 95%',
                    once: true
                },
                opacity: 0,
                y: 15,
                duration: 0.4,
                ease: 'power2.out'
            });
        }

        /* ============================================
           Page Navigation Arrows
           ============================================ */

        initPageNavigation();

        console.log('GSAP animations initialized (optimized)');
    }

    /* ============================================
       Page Navigation System
       ============================================ */

    function initPageNavigation() {
        // Page order for sequential navigation
        const pageOrder = [
            { url: 'index.html', name: 'Home' },
            { url: 'chemistry.html', name: 'Chemistry' },
            { url: 'physics.html', name: 'Physics' },
            { url: 'integrated.html', name: 'Integrated' },
            { url: 'simulations.html', name: 'Simulations' },
            { url: 'glossary.html', name: 'Glossary' },
            { url: 'sources.html', name: 'Sources' },
            { url: 'about.html', name: 'About' }
        ];

        // Get current page filename
        const currentPath = window.location.pathname;
        const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

        // Find current index
        const currentIndex = pageOrder.findIndex(page => page.url === currentPage);
        if (currentIndex === -1) return;

        // Create prev arrow if not on first page
        if (currentIndex > 0) {
            const prevPage = pageOrder[currentIndex - 1];
            createArrow('prev', prevPage.url, prevPage.name);
        }

        // Create next arrow if not on last page
        if (currentIndex < pageOrder.length - 1) {
            const nextPage = pageOrder[currentIndex + 1];
            createArrow('next', nextPage.url, nextPage.name);
        }
    }

    function createArrow(direction, targetUrl, pageName) {
        const arrow = document.createElement('a');
        arrow.href = targetUrl;
        arrow.className = `page-nav-arrow page-nav-arrow--${direction}`;
        arrow.setAttribute('aria-label', `Go to ${pageName}`);

        // Create SVG arrow icon
        const svgIcon = direction === 'prev'
            ? '<svg viewBox="0 0 24 24"><polyline points="15,18 9,12 15,6"/></svg>'
            : '<svg viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6"/></svg>';

        arrow.innerHTML = `
            ${svgIcon}
            <span class="page-nav-arrow__label">${pageName}</span>
        `;

        // Simple click handler - just navigate
        arrow.addEventListener('click', function (e) {
            e.preventDefault();

            // Quick fade out then navigate
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.2s ease';

            setTimeout(() => {
                window.location.href = targetUrl;
            }, 200);
        });

        document.body.appendChild(arrow);
    }
})();
