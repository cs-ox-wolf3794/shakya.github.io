/* =====================================================================
   Shakya Deb Ganguly — profile site interactivity
   Vanilla JS, no dependencies. Progressively enhances a fully
   functional static page.
   ===================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------------------------------------------------------------------
     Theme toggle (persisted). Falls back to OS preference when the user
     hasn't chosen. Sets data-theme explicitly once they do.
  ------------------------------------------------------------------- */
  var toggle = document.querySelector(".theme-toggle");
  var stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) {}
  if (stored === "dark" || stored === "light") {
    root.setAttribute("data-theme", stored);
  }

  function currentTheme() {
    var attr = root.getAttribute("data-theme");
    if (attr) return attr;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function syncToggle() {
    if (!toggle) return;
    var isDark = currentTheme() === "dark";
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    // keep the mobile browser chrome in step with the active theme
    var meta = document.querySelector('meta[name="theme-color"]:not([media])') ||
               document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#12151c" : "#fbfaf7");
  }
  syncToggle();

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      syncToggle();
    });
  }

  /* -------------------------------------------------------------------
     Mobile navigation
  ------------------------------------------------------------------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  var scrim = document.querySelector(".nav-scrim");

  function openNav() {
    if (!mobileNav) return;
    mobileNav.hidden = false;
    if (scrim) scrim.hidden = false;
    // next frame so the transition runs
    requestAnimationFrame(function () {
      mobileNav.classList.add("open");
      if (scrim) scrim.classList.add("show");
    });
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close menu");
  }

  function closeNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove("open");
    if (scrim) scrim.classList.remove("show");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    window.setTimeout(function () {
      mobileNav.hidden = true;
      if (scrim) scrim.hidden = true;
    }, 300);
  }

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      open ? closeNav() : openNav();
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
    if (scrim) scrim.addEventListener("click", closeNav);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") closeNav();
    });
    // Close the menu if the viewport grows back to desktop width.
    window.matchMedia("(min-width: 861px)").addEventListener("change", function (e) {
      if (e.matches) closeNav();
    });
  }

  /* -------------------------------------------------------------------
     Header shadow + scroll progress bar
  ------------------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  var progress = document.querySelector(".scroll-progress span");
  var toTop = document.querySelector(".to-top");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("scrolled", y > 8);

    if (progress) {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docH > 0 ? (y / docH) * 100 : 0;
      progress.style.setProperty("--progress", pct.toFixed(2) + "%");
    }

    if (toTop) {
      var show = y > 600;
      if (show && toTop.hidden) { toTop.hidden = false; requestAnimationFrame(function () { toTop.classList.add("show"); }); }
      else if (!show && !toTop.hidden) { toTop.classList.remove("show"); window.setTimeout(function () { toTop.hidden = true; }, 300); }
    }
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
  }

  /* -------------------------------------------------------------------
     Reveal-on-scroll with a staggered delay per group
  ------------------------------------------------------------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // stagger siblings that share a parent for a pleasant cascade
        var siblings = Array.prototype.slice.call(el.parentElement.querySelectorAll(":scope > [data-reveal]"));
        var idx = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = Math.min(idx * 80, 320) + "ms";
        el.classList.add("in");
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* -------------------------------------------------------------------
     Scrollspy — highlight the nav link for the section in view
  ------------------------------------------------------------------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.site-nav a[href^="#"], .mobile-nav a[href^="#"]')
  );

  function setActive(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("href") === "#" + id);
    });
  }

  if (sections.length && "IntersectionObserver" in window) {
    var current = null;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { current = entry.target.id; setActive(current); }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }
})();
