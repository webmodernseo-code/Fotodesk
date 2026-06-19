/* ============================================
   FOTODESK — Main JavaScript
   Navbar, Scroll Reveal, Counters, FAQ, Mobile Menu
   ============================================ */

function initAll() {
  initNavbar();
  initMobileMenu();
  initScrollReveal();
  initCounters();
  initFAQ();
  initSmoothScroll();
  initPricingToggle();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  // Déjà chargé (React), on exécute directement
  initAll();
}

/* ══════════════════════════════════════════
   NAVBAR — Scroll Effect
   ══════════════════════════════════════════ */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let lastScrollY = 0;
  let ticking = false;

  function updateNavbar() {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScrollY = scrollY;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNavbar);
      ticking = true;
    }
  }, { passive: true });

  // Initial check
  updateNavbar();
}

/* ══════════════════════════════════════════
   MOBILE MENU
   ══════════════════════════════════════════ */
function initMobileMenu() {
  const toggle = document.querySelector('.navbar__toggle');
  const mobileMenu = document.querySelector('.navbar__mobile-menu');
  const mobileLinks = document.querySelectorAll('.navbar__mobile-link');

  if (!toggle || !mobileMenu) return;

  function closeMenu() {
    toggle.classList.remove('active');
    mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
  }

  function openMenu() {
    toggle.classList.add('active');
    mobileMenu.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  toggle.addEventListener('click', () => {
    if (toggle.classList.contains('active')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
      closeMenu();
    }
  });
}

/* ══════════════════════════════════════════
   SCROLL REVEAL — IntersectionObserver
   ══════════════════════════════════════════ */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════════
   ANIMATED COUNTERS
   ══════════════════════════════════════════ */
function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-counter'), 10);
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      el.textContent = prefix + current.toLocaleString('fr-FR') + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = prefix + target.toLocaleString('fr-FR') + suffix;
      }
    }

    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════════
   FAQ ACCORDION
   ══════════════════════════════════════════ */
function initFAQ() {
  const items = document.querySelectorAll('.accordion-item');
  if (!items.length) return;

  items.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all items
      items.forEach(i => i.classList.remove('active'));

      // Toggle current
      if (!isActive) {
        item.classList.add('active');
      }
    });

    // Keyboard accessibility
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger.click();
      }
    });
  });
}

/* ══════════════════════════════════════════
   SMOOTH SCROLL — Anchor Links
   ══════════════════════════════════════════ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      
      const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 20;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  });
}

/* ══════════════════════════════════════════
   GEOLOCATION & CURRENCY DETECTION
   ══════════════════════════════════════════ */
const CFA_COUNTRIES = ['CI', 'SN', 'CM', 'TG', 'BJ', 'BF', 'ML', 'NE', 'GA', 'CG', 'TD', 'CF', 'GQ', 'GW'];
const EURO_COUNTRIES = ['FR', 'DE', 'IT', 'ES', 'BE', 'NL', 'LU', 'AT', 'FI', 'IE', 'PT', 'GR', 'CY', 'EE', 'LV', 'LT', 'SK', 'SI', 'MT', 'HR'];

function guessOfflineRegion() {
  const lang = (navigator.language || '').toUpperCase();
  if (CFA_COUNTRIES.some(code => lang.endsWith(code) || lang.includes('-' + code))) {
    return 'africa';
  }
  if (EURO_COUNTRIES.some(code => lang.endsWith(code) || lang.includes('-' + code))) {
    return 'europe';
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      if (
        tz.startsWith('Africa/Abidjan') || 
        tz.startsWith('Africa/Dakar') || 
        tz.startsWith('Africa/Douala') || 
        tz.startsWith('Africa/Libreville') || 
        tz.startsWith('Africa/Brazzaville') || 
        tz.startsWith('Africa/Lome') || 
        tz.startsWith('Africa/Bamako') || 
        tz.startsWith('Africa/Niamey') || 
        tz.startsWith('Africa/Ouagadougou') || 
        tz.startsWith('Africa/Porto-Novo')
      ) {
        return 'africa';
      }
      if (tz.startsWith('Europe/')) {
        return 'europe';
      }
    }
  } catch (e) {
    // ignore
  }
  return 'usa';
}

async function detectRegion() {
  const cached = sessionStorage.getItem('fotodesk_detected_currency') || localStorage.getItem('fotodesk_detected_currency');
  if (cached === 'africa' || cached === 'europe' || cached === 'usa') {
    return cached;
  }

  const fallback = guessOfflineRegion();
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json();
    const countryCode = (data.country_code || '').toUpperCase();

    let detected = fallback;
    if (CFA_COUNTRIES.includes(countryCode)) {
      detected = 'africa';
    } else if (EURO_COUNTRIES.includes(countryCode)) {
      detected = 'europe';
    } else if (countryCode) {
      detected = 'usa';
    }

    sessionStorage.setItem('fotodesk_detected_currency', detected);
    localStorage.setItem('fotodesk_detected_currency', detected);
    return detected;
  } catch (e) {
    console.warn('Geo-IP lookup failed, using offline guess:', fallback, e);
    return fallback;
  }
}

/* ══════════════════════════════════════════
   PRICING TOGGLE (Mensuel / Annuel & Devises)
   ══════════════════════════════════════════ */
function initPricingToggle() {
  const toggle = document.getElementById('pricing-toggle');
  const monthlyLabel = document.getElementById('toggle-monthly-label');
  const yearlyLabel = document.getElementById('toggle-yearly-label');
  const regionSelect = document.getElementById('region-select');
  const regionSelectMobile = document.getElementById('region-select-mobile');
  const cards = document.querySelectorAll('.pricing-card');

  if (!cards.length) return;

  function updatePrices() {
    const isYearly = toggle ? toggle.classList.contains('active') : false;
    const region = regionSelect ? regionSelect.value : 'africa'; // 'africa', 'europe', or 'usa'

    cards.forEach(card => {
      const amountEl = card.querySelector('.pricing-card__amount');
      const currencyEl = card.querySelector('.pricing-card__currency');
      const periodEl = card.querySelector('.pricing-card__period');
      const priceWrapper = card.querySelector('.pricing-card__price');
      if (!amountEl || !periodEl) return;

      const periodKey = isYearly ? 'yearly' : 'monthly';

      const amountVal = amountEl.getAttribute(`data-${periodKey}-${region}`);
      const periodVal = periodEl.getAttribute(`data-period-${periodKey}-${region}`);
      const currencyVal = currencyEl ? currencyEl.getAttribute(`data-currency-${region}`) : '';

      if (amountVal !== null) amountEl.textContent = amountVal;
      if (currencyEl && currencyVal) currencyEl.textContent = currencyVal;
      if (periodEl && periodVal) periodEl.textContent = periodVal;

      // Adjust layout direction if dollar is prefix vs suffix
      if (priceWrapper) {
        if (currencyVal === '$') {
          priceWrapper.style.flexDirection = 'row-reverse';
          priceWrapper.style.justifyContent = 'center';
        } else {
          priceWrapper.style.flexDirection = 'row';
          priceWrapper.style.justifyContent = 'flex-start';
        }
      }
    });
  }

  // Écouteur pour la bascule de facturation
  if (toggle) {
    toggle.addEventListener('click', () => {
      const isYearly = toggle.classList.toggle('active');
      toggle.setAttribute('aria-checked', isYearly ? 'true' : 'false');

      if (isYearly) {
        monthlyLabel.classList.remove('active');
        yearlyLabel.classList.add('active');
      } else {
        monthlyLabel.classList.add('active');
        yearlyLabel.classList.remove('active');
      }
      updatePrices();
    });
  }

  // Écouteurs pour le sélecteur de région (Synchronisation Desktop & Mobile)
  if (regionSelect) {
    regionSelect.addEventListener('change', (e) => {
      if (regionSelectMobile) regionSelectMobile.value = e.target.value;
      updatePrices();
    });
  }
  if (regionSelectMobile) {
    regionSelectMobile.addEventListener('change', (e) => {
      if (regionSelect) regionSelect.value = e.target.value;
      updatePrices();
    });
  }

  // Automatic detection on load
  detectRegion().then(detected => {
    if (regionSelect) regionSelect.value = detected;
    if (regionSelectMobile) regionSelectMobile.value = detected;
    updatePrices();
  });

  // Rendu initial
  updatePrices();
}
