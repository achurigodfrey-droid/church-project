/**
 * RIABORE CATHOLIC CHURCH — SHARED SITE INTERACTIVITY
 * Handles: scroll reveal, navbar shrink/hide, back-to-top,
 *          toast system, smooth anchor scrolling, page
 *          transitions, active-link highlight, dark-mode toggle
 */

'use strict';

/* ═══════════════════════════════════════════════════════
   TOAST SYSTEM  (shared — live.js also uses this pattern)
═══════════════════════════════════════════════════════ */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  const icons = {
    info:    'fa-info-circle',
    success: 'fa-check-circle',
    warning: 'fa-exclamation-triangle',
    prayer:  'fa-hands-praying',
    error:   'fa-times-circle'
  };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>
    <button class="toast-close" aria-label="Dismiss">&times;</button>`;
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 380);
  });
  container.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-show')));
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 380);
    }
  }, duration);
}
window.showToast = showToast;   // expose globally

/* ═══════════════════════════════════════════════════════
   NAVBAR — shrink on scroll + hide-on-scroll-down
═══════════════════════════════════════════════════════ */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let lastScroll = 0;
  let ticking    = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const current = window.scrollY;
        navbar.classList.toggle('navbar-scrolled', current > 60);
        // Hide on scroll-down, reveal on scroll-up (only past 200px)
        if (current > 200) {
          navbar.classList.toggle('navbar-hidden', current > lastScroll + 4);
          navbar.classList.toggle('navbar-visible', current < lastScroll - 4);
        } else {
          navbar.classList.remove('navbar-hidden', 'navbar-visible');
        }
        lastScroll = current;
        ticking    = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ═══════════════════════════════════════════════════════
   MOBILE NAV — hamburger toggle (all pages)
═══════════════════════════════════════════════════════ */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', open);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
    }
  });

  // Close on nav-link click (mobile)
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
    });
  });
}

/* ═══════════════════════════════════════════════════════
   BACK-TO-TOP BUTTON
═══════════════════════════════════════════════════════ */
function initBackToTop() {
  const btn = document.createElement('button');
  btn.id = 'backToTop';
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('btt-visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ═══════════════════════════════════════════════════════
   SCROLL REVEAL — fade-up animation on enter viewport
═══════════════════════════════════════════════════════ */
function initScrollReveal() {
  // Mark elements we want to animate
  const selectors = [
    '.card', '.time-card', '.announce-item', '.mv-card',
    '.priest-card', '.ministry-item', '.sacrament-card',
    '.event-item', '.section-header', '.two-col',
    '.contact-item', '.reading-card', '.cta-inner',
    '.live-banner-inner', '.stat-item'
  ];

  const targets = document.querySelectorAll(selectors.join(','));
  targets.forEach((el, i) => {
    el.classList.add('reveal');
    // Stagger delay for siblings inside grids
    el.style.transitionDelay = `${(i % 6) * 80}ms`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
}

/* ═══════════════════════════════════════════════════════
   SMOOTH ANCHOR SCROLLING
═══════════════════════════════════════════════════════ */
function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════
   ACTIVE NAV LINK — highlight current page
═══════════════════════════════════════════════════════ */
function initActiveNavLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* ═══════════════════════════════════════════════════════
   PAGE TRANSITION — fade in on load
═══════════════════════════════════════════════════════ */
function initPageTransition() {
  document.body.classList.add('page-loading');
  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      document.body.classList.remove('page-loading');
      document.body.classList.add('page-loaded');
    });
  });
}

/* ═══════════════════════════════════════════════════════
   HERO PARTICLE CANVAS (index page only)
═══════════════════════════════════════════════════════ */
function initHeroParticles() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'heroCanvas';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
  hero.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  }

  function createParticles() {
    particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.3,
      dy: -(Math.random() * 0.4 + 0.15),
      alpha: Math.random() * 0.5 + 0.15
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,168,76,${p.alpha})`;
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;
      if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
      if (p.x < 0)  p.x = W;
      if (p.x > W)  p.x = 0;
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); createParticles(); }, { passive: true });
  resize();
  createParticles();
  draw();
}

/* ═══════════════════════════════════════════════════════
   LIVE COUNTDOWN TIMER (index page — next Sunday Mass)
═══════════════════════════════════════════════════════ */
function initLiveCountdown() {
  const container = document.getElementById('massCountdown');
  if (!container) return;

  function getNextSunday9am() {
    const now = new Date();
    const day = now.getDay(); // 0=Sun
    let daysUntil = day === 0 ? 0 : 7 - day;
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntil);
    next.setHours(9, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 7);
    return next;
  }

  function tick() {
    const diff = getNextSunday9am() - new Date();
    if (diff <= 0) {
      container.innerHTML = `<span class="countdown-live">🔴 MASS IS LIVE NOW!</span>`;
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    container.innerHTML = `
      <div class="countdown-unit"><span>${d}</span><small>Days</small></div>
      <div class="countdown-sep">:</div>
      <div class="countdown-unit"><span>${String(h).padStart(2,'0')}</span><small>Hours</small></div>
      <div class="countdown-sep">:</div>
      <div class="countdown-unit"><span>${String(m).padStart(2,'0')}</span><small>Min</small></div>
      <div class="countdown-sep">:</div>
      <div class="countdown-unit"><span>${String(s).padStart(2,'0')}</span><small>Sec</small></div>`;
  }

  tick();
  setInterval(tick, 1000);
}

/* ═══════════════════════════════════════════════════════
   ANNOUNCEMENT ACCORDION (index page)
═══════════════════════════════════════════════════════ */
function initAnnouncementAccordion() {
  document.querySelectorAll('.announce-item').forEach(item => {
    const body = item.querySelector('.announce-body');
    const heading = item.querySelector('h4');
    if (!body || !heading) return;

    // Wrap body text in a collapsible area
    const p = body.querySelector('p');
    if (!p) return;
    p.classList.add('announce-collapse');

    const toggle = document.createElement('button');
    toggle.className = 'announce-toggle';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.innerHTML = '<i class="fas fa-chevron-up"></i>';
    heading.appendChild(toggle);

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const expanded = p.classList.toggle('announce-collapsed');
      toggle.querySelector('i').className = expanded
        ? 'fas fa-chevron-down'
        : 'fas fa-chevron-up';
      toggle.setAttribute('aria-expanded', !expanded);
    });
  });
}

/* ═══════════════════════════════════════════════════════
   NEWSLETTER / NOTIFICATION SIGNUP (index page)
═══════════════════════════════════════════════════════ */
function initNewsletterBanner() {
  const section = document.getElementById('newsletterSection');
  if (!section) return;

  const form = section.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput?.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }
    form.innerHTML = `<p class="newsletter-success"><i class="fas fa-check-circle"></i> Thank you! You'll receive Mass notifications at <strong>${email}</strong>. God bless you! 🙏</p>`;
    showToast('Subscribed! You will receive Mass updates by email.', 'success', 5000);
  });
}

/* ═══════════════════════════════════════════════════════
   ANIMATED STAT COUNTERS (about page)
═══════════════════════════════════════════════════════ */
function initStatCounters() {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el   = entry.target;
      const end  = parseInt(el.dataset.target, 10);
      const dur  = 1800;
      const step = end / (dur / 16);
      let current = 0;

      const tick = () => {
        current = Math.min(current + step, end);
        el.textContent = Math.floor(current).toLocaleString() + (el.dataset.suffix || '');
        if (current < end) requestAnimationFrame(tick);
      };
      tick();
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* ═══════════════════════════════════════════════════════
   MINISTRY INTEREST MODAL (about page)
═══════════════════════════════════════════════════════ */
function initMinistryModal() {
  const items = document.querySelectorAll('.ministry-item');
  if (!items.length) return;

  // Build modal once
  const modal = document.createElement('div');
  modal.id = 'ministryModal';
  modal.className = 'modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="modal-box">
      <button class="modal-close" aria-label="Close modal">&times;</button>
      <div class="modal-icon"><i class="fas fa-hands-helping"></i></div>
      <h3 id="modalMinistryName">Ministry Name</h3>
      <p id="modalMinistryDesc">Description goes here.</p>
      <hr class="modal-divider"/>
      <h4>Express Interest</h4>
      <form id="ministryForm">
        <input type="text"  id="mName"  placeholder="Your full name *" required />
        <input type="tel"   id="mPhone" placeholder="Phone number *" required />
        <input type="email" id="mEmail" placeholder="Email address (optional)" />
        <button type="submit" class="btn btn-gold full-width">
          <i class="fas fa-paper-plane"></i> Send Interest
        </button>
      </form>
      <div id="ministryFormSuccess" style="display:none" class="modal-success">
        <i class="fas fa-check-circle"></i>
        <p>Thank you! The ministry leader will be in touch soon. God bless you!</p>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const ministryData = {
    'Choir Ministry':    { desc: 'Join our choir and lead the parish in joyful worship through music and song. Rehearsals every Friday at 5:00 PM.', icon: 'fa-music' },
    'Youth Ministry':    { desc: 'Engage with other young Catholics in faith formation, service, and fellowship. Meetings every Sunday at 2:00 PM.', icon: 'fa-child' },
    'Outreach & Charity':{ desc: 'Serve the poor, orphans, and marginalized in our community through food drives, visits, and material support.', icon: 'fa-hands-helping' },
    'Bible Study':       { desc: 'Deepen your understanding of Scripture in a welcoming small group. Meets every Wednesday at 6:30 PM.', icon: 'fa-book-open' },
    "Women's Group":     { desc: 'The Catholic Women\'s League — a community of faith, friendship, and service. Meetings every first Saturday.', icon: 'fa-female' },
    'Media Ministry':    { desc: 'Help stream the Mass online, manage social media, and spread the Gospel through digital platforms.', icon: 'fa-broadcast-tower' }
  };

  items.forEach(item => {
    const name = item.querySelector('h4')?.textContent?.trim();
    if (!name) return;
    const btn = document.createElement('button');
    btn.className = 'ministry-join-btn';
    btn.textContent = 'Join Ministry';
    item.appendChild(btn);

    btn.addEventListener('click', () => {
      const data = ministryData[name] || { desc: 'Get involved with this ministry.', icon: 'fa-church' };
      modal.querySelector('#modalMinistryName').textContent = name;
      modal.querySelector('#modalMinistryDesc').textContent = data.desc;
      modal.querySelector('.modal-icon i').className = `fas ${data.icon}`;
      modal.querySelector('#ministryForm').style.display = 'flex';
      modal.querySelector('#ministryFormSuccess').style.display = 'none';
      modal.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      modal.querySelector('#mName').focus();
    });
  });

  // Close logic
  function closeModal() {
    modal.classList.remove('modal-open');
    document.body.style.overflow = '';
  }
  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // Form submission
  document.getElementById('ministryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('mName').value.trim();
    const ministry = document.getElementById('modalMinistryName').textContent;
    modal.querySelector('#ministryForm').style.display = 'none';
    modal.querySelector('#ministryFormSuccess').style.display = 'flex';
    showToast(`Thank you, ${name}! Your interest in <strong>${ministry}</strong> has been noted. 🙏`, 'success', 5000);
  });
}

/* ═══════════════════════════════════════════════════════
   SCHEDULE — TAB FILTER (schedule page)
═══════════════════════════════════════════════════════ */
function initScheduleTabs() {
  const tabBar = document.getElementById('scheduleTabs');
  if (!tabBar) return;

  const table = document.querySelector('.schedule-table tbody');
  if (!table) return;

  tabBar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    tabBar.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('tab-active'));
    btn.classList.add('tab-active');
    const filter = btn.dataset.filter;

    table.querySelectorAll('tr').forEach(row => {
      const day = row.querySelector('.day-cell strong')?.textContent?.toLowerCase() || '';
      const show =
        filter === 'all' ||
        (filter === 'sunday'   && day.includes('sunday')) ||
        (filter === 'weekday'  && day.includes('monday')) ||
        (filter === 'saturday' && day.includes('saturday')) ||
        (filter === 'live'     && row.querySelector('.tag-live'));
      row.style.display = show ? '' : 'none';
    });
  });
}

/* ═══════════════════════════════════════════════════════
   ADD TO CALENDAR (schedule page)
═══════════════════════════════════════════════════════ */
function initAddToCalendar() {
  document.querySelectorAll('.add-to-cal').forEach(btn => {
    btn.addEventListener('click', () => {
      const title    = encodeURIComponent(btn.dataset.title    || 'Riabore Catholic Church Mass');
      const details  = encodeURIComponent(btn.dataset.details  || 'Holy Mass at Riabore Catholic Church');
      const location = encodeURIComponent(btn.dataset.location || 'Riabore, Kisii County, Kenya');
      const start    = btn.dataset.start || '20261101T070000';
      const end      = btn.dataset.end   || '20261101T080000';
      const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
      window.open(url, '_blank', 'noopener');
      showToast('Opening Google Calendar to add this Mass...', 'success', 3000);
    });
  });
}

/* ═══════════════════════════════════════════════════════
   CONTACT — LIVE CHAR COUNTER + VALIDATION
═══════════════════════════════════════════════════════ */
function initContactForm() {
  const textarea = document.getElementById('message');
  const counter  = document.getElementById('msgCharCount');
  if (textarea && counter) {
    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      counter.textContent = `${len}/1000`;
      counter.classList.toggle('char-warn', len > 900);
    });
  }

  // Real-time field validation feedback
  const fields = document.querySelectorAll('.contact-form input[required], .contact-form select[required], .contact-form textarea[required]');
  fields.forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('field-error')) validateField(field);
    });
  });

  function validateField(field) {
    const err = field.parentElement.querySelector('.field-err-msg');
    if (field.checkValidity() && field.value.trim()) {
      field.classList.remove('field-error');
      field.classList.add('field-ok');
      if (err) err.remove();
    } else {
      field.classList.add('field-error');
      field.classList.remove('field-ok');
      if (!err) {
        const msg = document.createElement('span');
        msg.className = 'field-err-msg';
        msg.textContent = field.validationMessage || 'This field is required.';
        field.parentElement.appendChild(msg);
      }
    }
  }

  // Submit with loading state
  const form   = document.querySelector('.contact-form');
  const submitBtn = form?.querySelector('button[type="submit"]');
  if (form && submitBtn) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Final validation pass
      let valid = true;
      fields.forEach(f => { validateField(f); if (!f.checkValidity()) valid = false; });
      if (!valid) {
        showToast('Please fill in all required fields correctly.', 'warning');
        return;
      }
      // Loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      setTimeout(() => {
        form.style.display = 'none';
        const success = document.getElementById('formSuccess');
        if (success) success.style.display = 'flex';
        showToast('Your message has been sent! We will reply within 24 hours. 🙏', 'success', 5000);
      }, 1600);
    });
  }
}

/* ═══════════════════════════════════════════════════════
   REMINDER TOGGLE (schedule page)
═══════════════════════════════════════════════════════ */
function initReminderToggles() {
  document.querySelectorAll('.reminder-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const active = btn.classList.toggle('reminder-on');
      const label  = btn.dataset.mass || 'this Mass';
      btn.innerHTML = active
        ? `<i class="fas fa-bell"></i> Reminder On`
        : `<i class="far fa-bell"></i> Set Reminder`;
      showToast(
        active
          ? `Reminder set for <strong>${label}</strong>. We'll notify you before it starts! 🔔`
          : `Reminder cancelled for <strong>${label}</strong>.`,
        active ? 'success' : 'info',
        3500
      );
    });
  });
}

/* ═══════════════════════════════════════════════════════
   SCROLL PROGRESS BAR
═══════════════════════════════════════════════════════ */
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scrollProgress';
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const max  = document.documentElement.scrollHeight - window.innerHeight;
    const pct  = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.width = pct + '%';
  }, { passive: true });
}

/* ═══════════════════════════════════════════════════════
   INIT ALL
═══════════════════════════════════════════════════════ */
function init() {
  initPageTransition();
  initNavbar();
  initMobileNav();
  initBackToTop();
  initScrollReveal();
  initSmoothAnchors();
  initActiveNavLink();
  initScrollProgress();

  // Page-specific
  initHeroParticles();       // index only
  initLiveCountdown();       // index only
  initAnnouncementAccordion();
  initNewsletterBanner();
  initStatCounters();        // about only
  initMinistryModal();       // about only
  initScheduleTabs();        // schedule only
  initAddToCalendar();       // schedule only
  initReminderToggles();     // schedule only
  initContactForm();         // contact only
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
