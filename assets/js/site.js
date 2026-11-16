/* Mowazef AI — site behaviour. No dependencies. */
(function () {
  'use strict';

  // GA4 Measurement ID. Leave as-is until you have one.
  var GA_ID = 'G-XXXXXXXXXX';
  var PROD_HOST = /(^|\.)mowazefai\.com$/;

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // ---- Mobile menu ----------------------------------------------------
  var menuBtn = $('[data-menu-toggle]'), menu = $('#mobile-menu');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1024) setMenu(false); });
  }

  // ---- Header: blur after scroll, hide on scroll down -----------------
  var header = $('.site-header'), lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 8);
      header.classList.toggle('is-hidden', y > 480 && y > lastY && !document.body.classList.contains('menu-open'));
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- Reveal on scroll -----------------------------------------------
  var revealSel = '.section-head, .svc, .step, .plan, .why-item, .feature, .use, .int-cat, .crm-card, .seo-list li, .faq details, .related a, .cta-band, .founder';
  setTimeout(function () { var it = document.querySelector('.intro'); if (it) it.remove(); root.classList.remove('intro-on'); }, root.classList.contains('intro-on') ? 2700 : 0);
  var els = $$(revealSel).filter(function (el) { return !el.closest('.hero'); });
  els.forEach(function (el) {
    el.setAttribute('data-reveal', '');
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.className === el.className; });
    var i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', Math.min(i, 6) * 0.08 + 's');
  });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---- Count-up numbers -------------------------------------------------
  $$('[data-count]').forEach(function (el) {
    var end = parseFloat(el.getAttribute('data-count')), suffix = el.getAttribute('data-suffix') || '';
    if (reduce || !('IntersectionObserver' in window)) return;
    var cio = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      cio.disconnect();
      var t0 = performance.now(), dur = 1400;
      (function tick(t) {
        var p = Math.min(1, Math.max(0, (t - t0) / dur)), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * e) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
    cio.observe(el);
  });

  // ---- Hero browser: gentle tilt toward the pointer ---------------------
  if (finePointer && !reduce) {
    $$('[data-tilt]').forEach(function (box) {
      var b = $('.browser', box);
      if (!b) return;
      box.addEventListener('pointermove', function (e) {
        var r = box.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        b.style.setProperty('--ry', (x * 6).toFixed(2) + 'deg');
        b.style.setProperty('--rx', (-y * 5).toFixed(2) + 'deg');
      });
      box.addEventListener('pointerleave', function () { b.style.setProperty('--ry', '0deg'); b.style.setProperty('--rx', '0deg'); });
    });
  }

  // ---- FAQ: smooth open/close -------------------------------------------
  if (!reduce && Element.prototype.animate) {
    $$('.faq details').forEach(function (d) {
      var s = $('summary', d), a = $('.answer', d);
      if (!s || !a) return;
      s.addEventListener('click', function (e) {
        e.preventDefault();
        var ease = 'cubic-bezier(.16,1,.3,1)';
        if (d.open) {
          var anim = a.animate([{ height: a.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: ease });
          anim.onfinish = function () { d.open = false; };
        } else {
          d.open = true;
          a.animate([{ height: '0px', opacity: 0 }, { height: a.offsetHeight + 'px', opacity: 1 }], { duration: 460, easing: ease });
        }
      });
    });
  }

  // ---- Footer year ----------------------------------------------------
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // ---- Analytics ------------------------------------------------------
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  var isProd = PROD_HOST.test(location.hostname);
  var gaReady = /^G-[A-Z0-9]{6,}$/.test(GA_ID) && GA_ID !== 'G-XXXXXXXXXX';
  var gaLoaded = false;
  function loadScript(src) {
    var s = document.createElement('script');
    s.src = src; s.async = true; s.defer = true;
    document.head.appendChild(s);
  }
  function loadGA() {
    if (gaLoaded || !gaReady || !isProd) return;
    gaLoaded = true;
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + GA_ID);
  }
  // Defer GA until the visitor interacts, so it never slows the first paint.
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, loadGA, { once: true, passive: true });
  });
  setTimeout(loadGA, 6000);

  // Vercel Web Analytics (free page views) — only on the real domain.
  if (isProd) {
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    loadScript('/_vercel/insights/script.js');
  }

  // Track every WhatsApp click with where it happened.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href*="wa.me/"]');
    if (!a) return;
    var where = a.getAttribute('data-wa') || 'unknown';
    gtag('event', 'whatsapp_click', { link_location: where, page_path: location.pathname, page_language: root.lang });
    if (window.va) window.va('event', { name: 'whatsapp_click', data: { location: where } });
  });
})();
