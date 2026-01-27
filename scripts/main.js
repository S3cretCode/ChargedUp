/* ============================================
   ChargedUP: Main JavaScript
   Core functionality for all pages
   ============================================ */

(function () {
    'use strict';

    /* ============================================
       Constants
       ============================================ */
    const STORAGE_KEYS = {
        THEME: 'chargedup-theme',
        TEXT_SIZE: 'chargedup-text-size',
        CHEMISTRY_DATA: 'chargedup-chemistry-data',
        CHEMISTRY_INPUTS: 'chargedup-chemistry-inputs',
        PHYSICS_INPUTS: 'chargedup-physics-inputs'
    };

    /* ============================================
       Theme Management
       ============================================ */
    function initTheme() {
        const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);

        const savedTextSize = localStorage.getItem(STORAGE_KEYS.TEXT_SIZE);
        if (savedTextSize) {
            document.documentElement.setAttribute('data-text-size', savedTextSize);
        }
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    }

    function setTextSize(size) {
        if (size === 'default') {
            document.documentElement.removeAttribute('data-text-size');
            localStorage.removeItem(STORAGE_KEYS.TEXT_SIZE);
        } else {
            document.documentElement.setAttribute('data-text-size', size);
            localStorage.setItem(STORAGE_KEYS.TEXT_SIZE, size);
        }
    }

    /* ============================================
       Mobile Navigation
       ============================================ */
    function initMobileNav() {
        const navToggle = document.querySelector('.nav-toggle');
        const navList = document.querySelector('.nav__list');

        if (navToggle && navList) {
            navToggle.addEventListener('click', () => {
                const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
                navToggle.setAttribute('aria-expanded', !isExpanded);
                navToggle.classList.toggle('active');
                navList.classList.toggle('active');
            });

            // Close menu when clicking a link
            navList.querySelectorAll('.nav__link').forEach(link => {
                link.addEventListener('click', () => {
                    navToggle.classList.remove('active');
                    navList.classList.remove('active');
                    navToggle.setAttribute('aria-expanded', 'false');
                });
            });
        }
    }

    /* ============================================
       Mode Toggle (Chemistry/Physics)
       ============================================ */
    function initModeToggle() {
        const modeButtons = document.querySelectorAll('.mode-toggle__btn');

        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;

                // Update button states
                modeButtons.forEach(b => {
                    b.classList.remove('mode-toggle__btn--active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('mode-toggle__btn--active');
                btn.setAttribute('aria-pressed', 'true');

                // Navigate to appropriate page
                if (mode === 'chemistry') {
                    window.location.href = 'chemistry.html';
                } else if (mode === 'physics') {
                    window.location.href = 'physics.html';
                }
            });
        });
    }

    /* ============================================
       Collapsible Sections (Show Work, Technical Notes)
       ============================================ */
    function initCollapsibles() {
        // Handle .show-work elements
        const showWorkHeaders = document.querySelectorAll('.show-work__header');

        showWorkHeaders.forEach(header => {
            // Set initial state
            const content = header.nextElementSibling;
            const toggle = header.querySelector('.show-work__toggle');
            const isExpanded = header.getAttribute('aria-expanded') === 'true';

            if (!isExpanded && content) {
                content.style.display = 'none';
            }

            header.style.cursor = 'pointer';
            header.setAttribute('role', 'button');
            header.setAttribute('tabindex', '0');

            // Click handler
            header.addEventListener('click', () => {
                toggleShowWork(header, content, toggle);
            });

            // Keyboard handler
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleShowWork(header, content, toggle);
                }
            });
        });

        // Handle native <details> elements
        const detailsElements = document.querySelectorAll('details');
        detailsElements.forEach(details => {
            const summary = details.querySelector('summary');
            if (summary) {
                summary.style.cursor = 'pointer';
            }
        });
    }

    function toggleShowWork(header, content, toggle) {
        const isCurrentlyExpanded = header.getAttribute('aria-expanded') === 'true';
        const newState = !isCurrentlyExpanded;

        header.setAttribute('aria-expanded', newState);

        if (content) {
            if (newState) {
                content.style.display = 'block';
                // Animate in
                content.style.opacity = '0';
                content.style.transform = 'translateY(-10px)';
                requestAnimationFrame(() => {
                    content.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    content.style.opacity = '1';
                    content.style.transform = 'translateY(0)';
                });
            } else {
                content.style.display = 'none';
            }
        }

        if (toggle) {
            if (newState) {
                toggle.textContent = 'Hide Details ▲';
            } else {
                toggle.textContent = toggle.textContent.includes('Work') ? 'Show Work ▼' : 'Show Details ▼';
            }
        }
    }

    /* ============================================
       Tooltips
       ============================================ */
    function initTooltips() {
        const tooltipTriggers = document.querySelectorAll('[data-tooltip]');

        tooltipTriggers.forEach(trigger => {
            const tooltipText = trigger.getAttribute('data-tooltip');

            trigger.addEventListener('mouseenter', (e) => {
                showTooltip(e.target, tooltipText);
            });

            trigger.addEventListener('mouseleave', () => {
                hideTooltip();
            });

            trigger.addEventListener('focus', (e) => {
                showTooltip(e.target, tooltipText);
            });

            trigger.addEventListener('blur', () => {
                hideTooltip();
            });
        });
    }

    function showTooltip(element, text) {
        hideTooltip(); // Remove any existing tooltip

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.id = 'active-tooltip';
        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        tooltip.style.cssText = `
            position: fixed;
            top: ${rect.bottom + 8}px;
            left: ${rect.left + rect.width / 2}px;
            transform: translateX(-50%);
            background: var(--color-bg-tertiary);
            color: var(--color-text-primary);
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.875rem;
            max-width: 250px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 1px solid var(--color-border);
            pointer-events: none;
        `;
    }

    function hideTooltip() {
        const tooltip = document.getElementById('active-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    /* ============================================
       Glossary Search & Filter
       ============================================ */
    function initGlossary() {
        const searchInput = document.getElementById('glossary-search');
        const filterTabs = document.querySelectorAll('.glossary-filter__tab');
        const glossaryItems = document.querySelectorAll('.glossary-item');

        if (!searchInput || !glossaryItems.length) return;

        let currentCategory = 'all';

        // Search functionality
        searchInput.addEventListener('input', (e) => {
            filterGlossary(e.target.value.toLowerCase(), currentCategory);
        });

        // Category filter
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('glossary-filter__tab--active'));
                tab.classList.add('glossary-filter__tab--active');
                currentCategory = tab.dataset.category;
                filterGlossary(searchInput.value.toLowerCase(), currentCategory);
            });
        });

        function filterGlossary(searchTerm, category) {
            glossaryItems.forEach(item => {
                const term = item.querySelector('.glossary-term').textContent.toLowerCase();
                const itemCategory = item.dataset.category;

                // Only search term names, not definitions
                const matchesSearch = term.includes(searchTerm);
                const matchesCategory = category === 'all' || itemCategory === category;

                item.style.display = (matchesSearch && matchesCategory) ? 'block' : 'none';
            });
        }
    }

    /* ============================================
       Hero Canvas Animation
       ============================================ */
    function initHeroCanvas() {
        const canvas = document.getElementById('hero-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationId;

        function resize() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        function createParticles() {
            particles = [];
            const count = Math.floor((canvas.width * canvas.height) / 15000);

            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    radius: Math.random() * 2 + 1,
                    color: Math.random() > 0.5 ? '#00D1FF' : '#3EF1C6'
                });
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                // Update position
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around edges
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = 0.6;
                ctx.fill();
            });

            // Draw connections
            ctx.globalAlpha = 0.1;
            ctx.strokeStyle = '#00D1FF';
            particles.forEach((p1, i) => {
                particles.slice(i + 1).forEach(p2 => {
                    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                });
            });

            ctx.globalAlpha = 1;
            animationId = requestAnimationFrame(animate);
        }

        resize();
        createParticles();
        animate();

        window.addEventListener('resize', () => {
            resize();
            createParticles();
        });
    }

    /* ============================================
       Preset Buttons
       ============================================ */
    function initPresetButtons() {
        const presetButtons = document.querySelectorAll('.preset-btn');

        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset || btn.dataset.physicsPreset;

                // Dispatch custom event for calculators to handle
                const event = new CustomEvent('presetSelected', {
                    detail: { preset: preset },
                    bubbles: true
                });
                btn.dispatchEvent(event);

                // Visual feedback
                presetButtons.forEach(b => b.classList.remove('preset-btn--active'));
                btn.classList.add('preset-btn--active');
            });
        });
    }

    /* ============================================
       URL Parameter Handling
       ============================================ */
    function getUrlParams() {
        return new URLSearchParams(window.location.search);
    }

    function setUrlParams(params) {
        const url = new URL(window.location);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.set(key, value);
            } else {
                url.searchParams.delete(key);
            }
        });
        window.history.replaceState({}, '', url);
    }

    /* ============================================
       Data Storage (Chemistry → Physics transfer)
       ============================================ */
    function saveChemistryData(data) {
        localStorage.setItem(STORAGE_KEYS.CHEMISTRY_DATA, JSON.stringify(data));
    }

    function getChemistryData() {
        const data = localStorage.getItem(STORAGE_KEYS.CHEMISTRY_DATA);
        return data ? JSON.parse(data) : null;
    }

    function clearChemistryData() {
        localStorage.removeItem(STORAGE_KEYS.CHEMISTRY_DATA);
    }

    // Save/restore chemistry calculator inputs
    function saveChemistryInputs(inputs) {
        localStorage.setItem(STORAGE_KEYS.CHEMISTRY_INPUTS, JSON.stringify(inputs));
    }

    function getChemistryInputs() {
        const data = localStorage.getItem(STORAGE_KEYS.CHEMISTRY_INPUTS);
        return data ? JSON.parse(data) : null;
    }

    // Save/restore physics calculator inputs
    function savePhysicsInputs(inputs) {
        localStorage.setItem(STORAGE_KEYS.PHYSICS_INPUTS, JSON.stringify(inputs));
    }

    function getPhysicsInputs() {
        const data = localStorage.getItem(STORAGE_KEYS.PHYSICS_INPUTS);
        return data ? JSON.parse(data) : null;
    }

    /* ============================================
       Export Functions
       ============================================ */
    function exportToJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy', 'error');
        });
    }

    /* ============================================
       Notifications
       ============================================ */
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#3EF1C6' : type === 'error' ? '#ff4757' : '#00D1FF'};
            color: #071733;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /* ============================================
       Print Functionality
       ============================================ */
    function printPage() {
        window.print();
    }

    /* ============================================
       Settings Panel (Floating Action Button)
       ============================================ */
    const SettingsPanel = {
        isOpen: false,
        fab: null,
        panel: null,

        init() {
            this.createElements();
            this.bindEvents();
            this.updateActiveButtons();
        },

        createElements() {
            // Create FAB button
            const fab = document.createElement('button');
            fab.className = 'settings-fab';
            fab.setAttribute('aria-label', 'Settings');
            fab.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                    <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.43-2.53c.04-.32.07-.64.07-.97s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.03 7.03 0 0 0-1.69-.98l-.38-2.65A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.49.42l-.38 2.65c-.61.25-1.17.58-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1a.5.5 0 0 0 .61-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65z"/>
                </svg>
            `;
            fab.style.cssText = `
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: linear-gradient(135deg, #00D1FF, #3EF1C6);
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0, 209, 255, 0.4);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                color: #071733;
            `;

            // Create settings panel
            const panel = document.createElement('div');
            panel.className = 'settings-panel';
            panel.innerHTML = `
                <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 1rem; color: #3EF1C6;">⚙️ Settings</div>
                
                <div style="margin-bottom: 1rem;">
                    <span style="font-size: 0.85rem; color: #94A3B8; display: block; margin-bottom: 0.5rem;">Theme</span>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="settings-panel__btn" data-theme="dark" style="padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid #334155; background: transparent; color: #F8FAFC; cursor: pointer;">🌙 Dark</button>
                        <button class="settings-panel__btn" data-theme="light" style="padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid #334155; background: transparent; color: #F8FAFC; cursor: pointer;">☀️ Light</button>
                    </div>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <span style="font-size: 0.85rem; color: #94A3B8; display: block; margin-bottom: 0.5rem;">Text Size</span>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="settings-panel__btn" data-textsize="small" style="padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid #334155; background: transparent; color: #F8FAFC; cursor: pointer; font-size: 0.8rem;">Small</button>
                        <button class="settings-panel__btn" data-textsize="default" style="padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid #334155; background: transparent; color: #F8FAFC; cursor: pointer; font-size: 0.9rem;">Default</button>
                        <button class="settings-panel__btn" data-textsize="large" style="padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid #334155; background: transparent; color: #F8FAFC; cursor: pointer; font-size: 1rem;">Large</button>
                    </div>
                </div>

                <div style="border-top: 1px solid #334155; padding-top: 1rem; margin-top: 0.5rem;">
                    <button id="clear-data-btn" style="padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid #ef4444; background: transparent; color: #ef4444; cursor: pointer; width: 100%;">🗑️ Clear All Data</button>
                </div>
            `;
            // CSS handles all styling for .settings-panel class

            document.body.appendChild(fab);
            document.body.appendChild(panel);

            this.fab = fab;
            this.panel = panel;
        },

        bindEvents() {
            this.fab.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });

            // Theme buttons
            this.panel.querySelectorAll('[data-theme]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const theme = btn.dataset.theme;
                    setTheme(theme);
                    this.updateActiveButtons();
                });
            });

            // Text size buttons
            this.panel.querySelectorAll('[data-textsize]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const size = btn.dataset.textsize;
                    setTextSize(size);
                    this.updateActiveButtons();
                });
            });

            // Clear data button
            const clearBtn = this.panel.querySelector('#clear-data-btn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    localStorage.clear();
                    showNotification('All data cleared!', 'success');
                    setTimeout(() => location.reload(), 1000);
                });
            }

            // Close on click outside
            document.addEventListener('click', (e) => {
                if (this.isOpen && !this.panel.contains(e.target) && !this.fab.contains(e.target)) {
                    this.close();
                }
            });

            // Close on Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });

            // Hover effect on FAB
            this.fab.addEventListener('mouseenter', () => {
                this.fab.style.transform = 'scale(1.1)';
                this.fab.style.boxShadow = '0 6px 30px rgba(0, 209, 255, 0.6)';
            });
            this.fab.addEventListener('mouseleave', () => {
                if (!this.isOpen) {
                    this.fab.style.transform = 'scale(1)';
                    this.fab.style.boxShadow = '0 4px 20px rgba(0, 209, 255, 0.4)';
                }
            });
        },

        toggle() {
            this.isOpen ? this.close() : this.open();
        },

        open() {
            this.isOpen = true;
            this.fab.classList.add('active');
            this.panel.classList.add('active');
        },

        close() {
            this.isOpen = false;
            this.fab.classList.remove('active');
            this.panel.classList.remove('active');
        },

        updateActiveButtons() {
            const currentTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
            const currentTextSize = localStorage.getItem(STORAGE_KEYS.TEXT_SIZE) || 'default';

            this.panel.querySelectorAll('[data-theme]').forEach(btn => {
                const isActive = btn.dataset.theme === currentTheme;
                btn.style.background = isActive ? '#3EF1C6' : 'transparent';
                btn.style.color = isActive ? '#071733' : '#F8FAFC';
            });

            this.panel.querySelectorAll('[data-textsize]').forEach(btn => {
                const isActive = btn.dataset.textsize === currentTextSize;
                btn.style.background = isActive ? '#00D1FF' : 'transparent';
                btn.style.color = isActive ? '#071733' : '#F8FAFC';
            });
        }
    };

    function initSettingsPanel() {
        SettingsPanel.init();
    }

    /* ============================================
       Initialize All
       ============================================ */

    /**
     * Scroll to a target element with header offset
     */
    function scrollToTarget(targetId) {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            // Calculate position with header offset
            const headerOffset = 90;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            return true;
        }
        return false;
    }

    /**
     * Handle initial page load with hash in URL
     */
    function scrollToHash() {
        if (window.location.hash) {
            const targetId = window.location.hash.substring(1);
            // Wait for page to fully render
            setTimeout(() => {
                scrollToTarget(targetId);
            }, 200);
        }
    }

    /**
     * Initialize smooth scrolling for all anchor links
     * This handles same-page anchor links AND cross-page links with hashes
     */
    function initSmoothScroll() {
        // Handle clicks on all anchor links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href) return;

            // Check if it's a same-page anchor link (starts with # only)
            if (href.startsWith('#') && href.length > 1) {
                e.preventDefault();
                const targetId = href.substring(1);
                if (scrollToTarget(targetId)) {
                    // Update URL hash without scrolling (we already scrolled)
                    history.pushState(null, '', href);
                }
                return;
            }

            // Check if it's a link to current page with hash (e.g., glossary.html#term when on glossary.html)
            const currentPath = window.location.pathname.split('/').pop() || 'index.html';
            const linkPath = href.split('#')[0].split('/').pop() || '';
            const hash = href.includes('#') ? href.split('#')[1] : null;

            if (hash && (linkPath === currentPath || linkPath === '')) {
                // Same page with hash
                e.preventDefault();
                if (scrollToTarget(hash)) {
                    history.pushState(null, '', '#' + hash);
                }
            }
        });

        // Handle browser back/forward buttons
        window.addEventListener('hashchange', () => {
            if (window.location.hash) {
                const targetId = window.location.hash.substring(1);
                scrollToTarget(targetId);
            }
        });

        // Also handle popstate for back/forward navigation
        window.addEventListener('popstate', () => {
            if (window.location.hash) {
                setTimeout(() => {
                    const targetId = window.location.hash.substring(1);
                    scrollToTarget(targetId);
                }, 50);
            }
        });
    }

    function init() {
        initTheme();
        initMobileNav();
        initModeToggle();
        initCollapsibles();
        initTooltips();
        initGlossary();
        initHeroCanvas();
        initPresetButtons();
        initSettingsPanel();
        initSmoothScroll(); // Initialize smooth scroll for all anchor links
        scrollToHash(); // Scroll to element if hash is in URL on page load
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose global API
    window.ChargedUP = {
        setTheme,
        setTextSize,
        saveChemistryData,
        getChemistryData,
        clearChemistryData,
        saveChemistryInputs,
        getChemistryInputs,
        savePhysicsInputs,
        getPhysicsInputs,
        exportToJSON,
        copyToClipboard,
        showNotification,
        printPage,
        getUrlParams,
        setUrlParams,
        STORAGE_KEYS
    };

})();

/* ============================================
   Add notification animation styles
   ============================================ */
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

/* Note: Scroll animations are now handled by GSAP ScrollTrigger in gsap-animations.js */

/* ============================================
   Glossary Link Styling
   For manually added glossary links in HTML
   ============================================ */
const glossaryStyle = document.createElement('style');
glossaryStyle.textContent = `
    a[href*="glossary.html#"] {
        color: var(--color-accent-teal);
        text-decoration: none;
        transition: color var(--transition-fast), text-decoration var(--transition-fast);
    }
    a[href*="glossary.html#"]:hover {
        color: var(--color-accent-cyan);
        text-decoration: underline;
    }
`;
document.head.appendChild(glossaryStyle);
