/* Mowazef AI — site behaviour & motion. No dependencies. */
(function () {
  'use strict';

  // ---- Settings -------------------------------------------------------
  // GA4 Measurement ID. Leave as-is until you have one; WhatsApp clicks are
  // still pushed to window.dataLayer so nothing is lost when you add it.
  var GA_ID = 'G-XXXXXXXXXX';
  var PROD_HOST = /(^|\.)mowazefai\.com$/;

  var root = document.documentElement;
  var rtl = root.dir === 'rtl';
  var introDelay = root.classList.contains('intro-on') ? 1500 : 0;
  // Remove the opening intro overlay once its curtain animation has finished.
  setTimeout(function () { var intro = document.querySelector('.intro'); if (intro) intro.remove(); }, introDelay ? 2700 : 0);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }

  // ---- Theme toggle ---------------------------------------------------
  var themeBtn = $('[data-theme-toggle]');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store('theme', next);
      var meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'dark' ? '#0B0B0C' : '#FFFFFF');
    });
  }

  // ---- Mobile menu ----------------------------------------------------
  var header = $('.site-header');
  var menuBtn = $('[data-menu-toggle]');
  var menu = document.getElementById('mobile-menu');
  function menuOpen() { return document.body.classList.contains('menu-open'); }
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open));
    if (menu) menu.toggleAttribute('inert', !open);
    if (open && header) header.classList.remove('is-hidden');
  }
  if (menuBtn && menu) {
    setMenu(false);
    menuBtn.addEventListener('click', function () { setMenu(!menuOpen()); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1024) setMenu(false); });
  }

  // ---- Split headings into words --------------------------------------
  function splitWords(el) {
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var outer = document.createElement('span'); outer.className = 'w';
            var inner = document.createElement('span'); inner.className = 'wi';
            inner.textContent = part;
            inner.style.setProperty('--i', words.length);
            outer.appendChild(inner); frag.appendChild(outer); words.push(inner);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR' && n.tagName.toLowerCase() !== 'svg') {
          walk(n);
        }
      });
    })(el);
    return words;
  }

  // ---- Reveal on scroll ----------------------------------------------
  if (!reduce) {
    $$('.hero-title, .page-hero h1, .h2, .cta-band h2, .work-copy h3').forEach(function (el) {
      if (el.closest('[hidden]')) return;
      splitWords(el);
      el.setAttribute('data-split', '');
    });
    var fadeSel = '.hero-sub, .hero .btn-row, .hero-points, .stage, .kicker, .lead, .breadcrumbs, .page-hero .btn-row, .channels,' +
      '.card, .feature, .why-item, .founder, .soon-card, .step, .faq details, .related a, .work-copy p, .work-copy .check-list, .work-copy .btn-row,' +
      '.cta-band p, .cta-band .btn-row, .sc-tab, .prose > *';
    $$('.laptop-screen, .sc-stage').forEach(function (el) { el.setAttribute('data-wipe', ''); });
    $$(fadeSel).forEach(function (el) {
      if (el.hasAttribute('data-split') || el.closest('[hidden]')) return;
      el.setAttribute('data-reveal', '');
      // stagger siblings of the same kind
      var sibs = el.parentNode ? Array.prototype.filter.call(el.parentNode.children, function (c) { return c.className === el.className; }) : [];
      var idx = sibs.indexOf(el);
      if (idx > 0) el.style.setProperty('--rd', Math.min(idx, 6) * 90 + 'ms');
    });
    // hero copy gets a short delay chain after the headline
    var heroSub = $('.hero-sub'); if (heroSub) heroSub.style.setProperty('--rd', '350ms');
    var heroBtns = $('.hero .btn-row'); if (heroBtns) heroBtns.style.setProperty('--rd', '480ms');
    var heroPts = $('.hero-points'); if (heroPts) heroPts.style.setProperty('--rd', '600ms');
    var stage = $('.stage'); if (stage) stage.style.setProperty('--rd', '250ms');
  }

  var revealEls = $$('[data-split], [data-reveal]');
  // A fully clipped element never reports as intersecting, so watch its parent.
  var wipeEls = $$('[data-wipe]');
  if ('IntersectionObserver' in window && !reduce) {
    var wio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        wipeEls.forEach(function (w) { if (w.parentElement === en.target) w.classList.add('is-in'); });
        wio.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
    wipeEls.forEach(function (w) { wio.observe(w.parentElement); });
  } else {
    wipeEls.forEach(function (w) { w.classList.add('is-in'); });
  }
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
    // Safety net: never leave anything hidden that is already on screen.
    setTimeout(function () {
      revealEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
      });
    }, 1500);
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---- Scroll-linked effects -----------------------------------------
  var progress = $('.scroll-progress');
  var scrubs = $$('[data-scrub]').map(function (el) { return { el: el, words: reduce ? [] : splitWords(el) }; });
  var tilts = $$('[data-tilt]');
  var timelines = $$('[data-timeline]');
  var footMark = $('.footer-mark');
  var marquee = $('.marquee'), skewTimer = null;
  var heroEl = $('.hero');
  var lastY = window.scrollY;
  var ticking = false;

  function sectionProgress(el, start, end) {
    // 0 when el top is at `start` (fraction of viewport), 1 when at `end`
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    return clamp((vh * start - r.top) / (vh * (start - end)), 0, 1);
  }

  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    var vel = y - lastY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (header) {
      header.classList.toggle('is-scrolled', y > 8);
      if (!menuOpen()) header.classList.toggle('is-hidden', y > lastY && y > 480);
    }
    lastY = y;
    if (reduce) return;

    if (marquee) {
      marquee.style.setProperty('--skew', clamp(-vel * 0.25, -10, 10).toFixed(2) + 'deg');
      clearTimeout(skewTimer); skewTimer = setTimeout(function () { marquee.style.setProperty('--skew', '0deg'); }, 120);
    }
    if (heroEl && y < window.innerHeight * 1.2) {
      heroEl.style.setProperty('--hy', (y * 0.28).toFixed(1) + 'px');
      heroEl.style.setProperty('--ho', Math.max(0, 1 - y / (window.innerHeight * 0.85)).toFixed(3));
      heroEl.style.setProperty('--sy', (-y * 0.1).toFixed(1) + 'px');
    }

    scrubs.forEach(function (s) {
      var p = sectionProgress(s.el, 0.9, 0.35);
      var n = Math.round(p * s.words.length);
      s.words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    });
    tilts.forEach(function (el) { el.style.setProperty('--p', sectionProgress(el, 1.05, 0.55).toFixed(3)); });
    timelines.forEach(function (el) {
      var p = sectionProgress(el, 0.85, 0.35);
      el.style.setProperty('--p', p.toFixed(3));
      var steps = $$('.step', el);
      steps.forEach(function (st, i) { st.classList.toggle('is-lit', p >= (i + 0.2) / steps.length || p >= 0.999); });
    });
    if (footMark) footMark.style.setProperty('--fill', (sectionProgress(footMark, 1, 0.6) * 100).toFixed(1) + '%');
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // ---- Pointer effects (desktop only) --------------------------------
  if (finePointer && !reduce) {
    // custom cursor: a ring that trails the pointer and grows over links
    var ring = document.createElement('div'); ring.className = 'cursor is-hidden';
    var dot = document.createElement('div'); dot.className = 'cursor-dot is-hidden';
    document.body.appendChild(ring); document.body.appendChild(dot);
    root.classList.add('has-cursor');
    var cx = -100, cy = -100, rx = -100, ry = -100, following = false;
    // The ring eases toward the pointer and the loop stops once it arrives.
    function follow() {
      rx += (cx - rx) * 0.18; ry += (cy - ry) * 0.18;
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      if (Math.abs(cx - rx) + Math.abs(cy - ry) > 0.3) requestAnimationFrame(follow); else following = false;
    }
    window.addEventListener('pointermove', function (e) {
      cx = e.clientX; cy = e.clientY;
      dot.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      ring.classList.remove('is-hidden'); dot.classList.remove('is-hidden');
      ring.classList.toggle('is-link', !!e.target.closest('a, button, summary, [role="tab"]'));
      if (!following) { following = true; requestAnimationFrame(follow); }
    });
    document.addEventListener('pointerleave', function () { ring.classList.add('is-hidden'); dot.classList.add('is-hidden'); });

    // showcase screen tilts in 3D toward the pointer
    $$('.sc-stage').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (px * 8).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-py * 6).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });

    // hero: aurora spotlight + phone/cards parallax
    $$('.hero, .page-hero').forEach(function (hero) {
      var aurora = $('.aurora', hero);
      var stageEl = $('.stage', hero);
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, yy = (e.clientY - r.top) / r.height;
        if (aurora) { aurora.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); aurora.style.setProperty('--my', (yy * 100).toFixed(1) + '%'); }
        if (stageEl) { stageEl.style.setProperty('--tx', ((x - 0.5) * 28).toFixed(1) + 'px'); stageEl.style.setProperty('--ty', ((yy - 0.5) * 28).toFixed(1) + 'px'); }
      });
      hero.addEventListener('pointerleave', function () {
        if (stageEl) { stageEl.style.setProperty('--tx', '0px'); stageEl.style.setProperty('--ty', '0px'); }
      });
    });
    // spotlight that follows the cursor
    $$('.sc-stage').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--x', (e.clientX - r.left) + 'px');
        el.style.setProperty('--y', (e.clientY - r.top) + 'px');
      });
    });
    // magnetic buttons
    $$('.btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.translate = ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function () { b.style.translate = ''; });
    });
  }

  // ---- Hero chat: messages play one by one, cards react ---------------
  var chat = $('[data-chat]');
  var stageBox = $('[data-stage]');
  if (stageBox) setTimeout(function () { stageBox.classList.add('s-ready'); }, reduce ? 0 : introDelay + 1400);
  if (chat && reduce && stageBox) stageBox.classList.add('s-msg', 's-booked');
  if (chat && !reduce) {
    var body = $('.chat-body', chat);
    var msgs = $$('.msg', chat);
    var typing = $('.typing', chat);
    var started = false;
    var play = function () {
      if (started) return;
      started = true;
      chat.classList.add('is-playing');
      var i = 0;
      (function next() {
        if (i >= msgs.length) {
          if (stageBox) stageBox.classList.add('s-booked');
          setTimeout(function () {               // loop after a pause
            msgs.forEach(function (m) { m.classList.remove('is-shown'); });
            if (stageBox) stageBox.classList.remove('s-msg', 's-booked');
            i = 0; setTimeout(next, 700);
          }, 6500);
          return;
        }
        var m = msgs[i];
        var isBot = m.classList.contains('msg-in');
        if (isBot && typing) { body.insertBefore(typing, m); typing.classList.add('is-shown'); }
        setTimeout(function () {
          if (typing) typing.classList.remove('is-shown');
          m.classList.add('is-shown');
          if (i === 0 && stageBox) stageBox.classList.add('s-msg');
          i++;
          setTimeout(next, isBot ? 1500 : 1000);
        }, isBot ? 1200 : 600);
      })();
    };
    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { setTimeout(play, introDelay + 700); cio.disconnect(); } }, { threshold: 0.3 });
      cio.observe(chat);
    } else { play(); }
  }

  // ---- Services showcase: tabs that auto-advance ---------------------
  $$('[data-showcase]').forEach(function (sc) {
    var tabs = $$('.sc-tab', sc);
    var panels = $$('.sc-panel', sc);
    var DUR = 7000, timer = null, current = 0, visible = false, paused = false;
    sc.style.setProperty('--sc-dur', DUR + 'ms');

    function select(i, focus) {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) {
        var on = k === current;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        // restart the progress bar animation
        var bar = $('.sc-bar i', t); if (bar && on) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      });
      panels.forEach(function (p, k) {
        var on = k === current;
        p.hidden = !on;
        p.classList.remove('is-active');
        if (on) { void p.offsetWidth; p.classList.add('is-active'); }
      });
      if (focus) tabs[current].focus();
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (reduce || !visible || paused) return;
      timer = setTimeout(function () { select(current + 1); }, DUR);
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { select(k); });
      t.addEventListener('keydown', function (e) {
        var fwd = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft';
        if (e.key === fwd || e.key === 'ArrowDown') { e.preventDefault(); select(current + 1, true); }
        if (e.key === back || e.key === 'ArrowUp') { e.preventDefault(); select(current - 1, true); }
      });
    });
    sc.addEventListener('pointerenter', function () { paused = true; sc.classList.add('is-paused'); clearTimeout(timer); });
    sc.addEventListener('pointerleave', function () { paused = false; sc.classList.remove('is-paused'); select(current); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        var was = visible; visible = en[0].isIntersecting;
        if (visible && !was) select(current); else if (!visible) clearTimeout(timer);
      }, { threshold: 0.35 }).observe(sc);
    }
  });

  // ---- FAQ: smooth open/close ----------------------------------------
  if (!reduce && Element.prototype.animate) {
    $$('.faq details').forEach(function (d) {
      var s = $('summary', d), a = $('.answer', d);
      if (!s || !a) return;
      s.addEventListener('click', function (e) {
        e.preventDefault();
        var ease = 'cubic-bezier(.2,.7,.2,1)';
        if (d.open) {
          var anim = a.animate([{ height: a.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: ease });
          anim.onfinish = function () { d.open = false; };
        } else {
          d.open = true;
          a.animate([{ height: '0px', opacity: 0 }, { height: a.offsetHeight + 'px', opacity: 1 }], { duration: 420, easing: ease });
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
