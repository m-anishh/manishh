/* =====================================================================
   assets/js/layout.js  —  Shared application shell
   Builds the header, navigation (desktop rail / tablet bar / mobile dock
   + drawer), footer, search modal, theme + locale toggles and scroll-to-top,
   then mounts the current page (window.__PAGE__) into #main-content.
   Pure vanilla JS; works from file:// or any static server.
   ===================================================================== */
(function () {
  "use strict";
  var SITE = window.SITE, ICONS = window.ICONS;
  var PAGE = window.__PAGE__ || { id: "about", build: function () { return ""; } };
  var el = function (html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; };

  /* ---------------- Theme ---------------- */
  var Theme = {
    get: function () { try { return localStorage.getItem("mb-theme"); } catch (e) { return null; } },
    set: function (v) { try { localStorage.setItem("mb-theme", v); } catch (e) {} },
    current: function () {
      var saved = Theme.get();
      if (saved) return saved;
      return "light"; // first-time default is light; returning visitors keep their saved choice
    },
    apply: function (v) { document.documentElement.setAttribute("data-theme", v); },
    toggle: function () {
      var next = Theme.current() === "dark" ? "light" : "dark";
      document.documentElement.classList.add("theme-transitioning");
      Theme.set(next); Theme.apply(next); syncToggles();
      setTimeout(function () { document.documentElement.classList.remove("theme-transitioning"); }, 400);
    }
  };
  Theme.apply(Theme.current());

  /* ---------------- Locale (EN/ID, visual preference) ---------------- */
  var Locale = {
    get: function () { try { return localStorage.getItem("mb-locale") || "EN"; } catch (e) { return "EN"; } },
    set: function (v) { try { localStorage.setItem("mb-locale", v); } catch (e) {} ; syncLocale(); }
  };

  /* ---------------- Nav rendering ---------------- */
  function isActive(id) { return PAGE.id === id; }

  function railNav() {
    var items = SITE.nav.map(function (n) {
      return '<li class="nav__item"><a href="' + n.href + '" class="rack-nav__item' + (isActive(n.id) ? " is-active" : "") +
        '" title="' + n.label + '"' + (isActive(n.id) ? ' aria-current="page"' : "") + '>' +
        '<span class="nav__icon">' + ICONS.get(n.icon, 18) + '</span>' +
        '<span class="nav__label">' + n.label + '</span></a></li>';
    }).join("");
    return '<nav class="sidebar box sticky-column rack-desktop box-entrance box-entrance--sidebar" aria-label="Main navigation">' +
      '<ul class="nav">' + items + '</ul>' +
      '<div class="rack-utils">' +
        '<button class="search-trigger" data-search-open aria-label="Search (Ctrl+K)" title="Search (Ctrl+K)">' +
          '<span class="search-trigger__icon">' + searchGlyph(14) + '</span>' +
          '<span class="search-trigger__label">Search</span>' +
          '<kbd class="search-trigger__kbd">Ctrl K</kbd></button>' +
        '<button class="theme-toggle" data-theme-toggle aria-label="Toggle dark / light">' +
          '<span class="theme-toggle__icon">' + themeGlyphs() + '</span>' +
          '<span class="theme-toggle__label">' + themeLabel() + '</span></button>' +
      '</div></nav>';
  }

  function tabletBar() {
    var items = SITE.nav.map(function (n) {
      return '<a href="' + n.href + '" class="tablet-nav__item' + (isActive(n.id) ? " is-active" : "") + '" title="' + n.label + '">' +
        '<span class="tablet-nav__icon">' + ICONS.get(n.icon, 16) + '</span>' +
        '<span class="tablet-nav__label">' + n.label + '</span></a>';
    }).join("");
    return '<div class="rack-tablet"><nav class="sidebar box sticky-column tablet-bar" aria-label="Main navigation">' +
      '<div class="tablet-nav">' + items + '</div>' +
      '<div class="tablet-utils">' +
        '<button class="tablet-utils__search" data-search-open aria-label="Search">' + searchGlyph(15) + '</button>' +
        '<button class="tablet-theme" data-theme-toggle aria-label="Toggle dark / light">' + themeGlyphs() + '</button>' +
      '</div></nav></div>';
  }

  function mobileDock() {
    var dockItems = SITE.nav.filter(function (n) { return n.dock; });
    var cells = dockItems.map(function (n, i) {
      var seam = i >= 3 ? '<span class="mobile-dock__cell-seam" aria-hidden="true"></span>' : "";
      return '<li class="mobile-dock__cell">' + seam + '<a href="' + n.href + '" class="mobile-dock__item' + (isActive(n.id) ? " is-active" : "") + '" title="' + n.label + '">' +
        '<span class="mobile-dock__icon">' + ICONS.get(n.icon, 18) + '</span>' +
        '<span class="mobile-dock__label">' + n.label + '</span></a></li>';
    }).join("");
    var moreCell = '<li class="mobile-dock__cell"><span class="mobile-dock__cell-seam" aria-hidden="true"></span>' +
      '<button class="mobile-dock__more" data-drawer-toggle aria-expanded="false" aria-controls="mobile-nav-drawer" title="More">' +
      '<span class="mobile-dock__more-icon">' + ICONS.get("menu", 18) + '</span>' +
      '<span class="mobile-dock__label">More</span></button></li>';

    var drawerItems = SITE.nav.map(function (n) {
      return '<li class="mobile-drawer__cell' + (SITE.nav.length % 2 && n === SITE.nav[SITE.nav.length - 1] ? " mobile-drawer__cell--full" : "") + '">' +
        '<a href="' + n.href + '" class="mobile-drawer__item' + (isActive(n.id) ? " is-active" : "") + '" title="' + n.label + '">' +
        '<span class="mobile-drawer__icon">' + ICONS.get(n.icon, 18) + '</span>' +
        '<span class="mobile-drawer__label">' + n.label + '</span></a></li>';
    }).join("");

    return '<div class="rack-mobile-dock">' +
      '<div class="mobile-drawer" id="mobile-nav-drawer" hidden>' +
        '<div class="mobile-drawer__panel">' +
          '<ul class="mobile-drawer__grid">' + drawerItems + '</ul>' +
          '<div class="mobile-drawer__rack">' +
            '<button class="mobile-drawer__util" data-search-open><span class="mobile-drawer__util-icon">' + searchGlyph(16) + '</span><span class="mobile-drawer__util-label">Search</span></button>' +
            '<button class="mobile-drawer__util" data-theme-toggle><span class="mobile-drawer__util-icon">' + themeGlyphs() + '</span><span class="mobile-drawer__util-label" data-theme-label>' + themeLabel() + '</span></button>' +
          '</div>' +
        '</div></div>' +
      '<nav class="mobile-dock" aria-label="Main navigation"><ul class="mobile-dock__list" style="grid-template-columns:repeat(' + (dockItems.length + 1) + ',1fr)">' + cells + moreCell + '</ul></nav>' +
      '</div>';
  }

  function searchGlyph(s) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="' + s + '" height="' + s + '"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'; }
  function themeGlyphs() {
    return '<svg class="theme-toggle__sun tablet-theme__sun" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' + ICONS.raw.sun + '</svg>' +
      '<svg class="theme-toggle__moon tablet-theme__moon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' + ICONS.raw.moon + '</svg>';
  }
  function themeLabel() { return Theme.current() === "dark" ? "Dark" : "Light"; }
  function cvBtn(kind, inner, cls, aria) {
    var cv = SITE.profile.cv || {};
    if (cv[kind]) return '<a class="cv-btn ' + cls + '" href="' + cv[kind] + '" download target="_blank" rel="noopener" aria-label="' + aria + '" title="' + aria + '">' + inner + '</a>';
    return ""; // no CV configured for this kind — render nothing
  }
  function hasCv() { var cv = SITE.profile.cv || {}; return !!cv.main; }

  /* ---------------- Header ---------------- */
  function header() {
    var p = SITE.profile;
    var socials = SITE.socials.map(function (s) {
      return '<li><a href="' + s.href + '" target="_blank" rel="noopener" title="' + s.label + '" aria-label="' + s.label + '">' + ICONS.get(s.icon, 16) + '</a></li>';
    }).join("");
    return '<header class="header box box-entrance box-entrance--header">' +
      '<div class="header__body">' +
        '<div class="header-identity">' +
          '<div class="header-identity__photo">' + (p.avatar
            ? '<img class="header-identity__photo-img" src="' + p.avatar + '" alt="' + p.firstName + ' ' + p.lastName + '" width="160" height="160">'
            : '<span class="header-identity__photo-fallback" role="img" aria-label="' + p.firstName + ' ' + p.lastName + '"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12.5a4.75 4.75 0 1 0 0-9.5 4.75 4.75 0 0 0 0 9.5Z"></path><path d="M4 21v-.8C4 16.9 7.4 14.5 12 14.5s8 2.4 8 5.7V21Z"></path></svg></span>') +
          '</div>' +
          '<div class="header-identity__info">' +
            '<div class="header-identity__name">' + p.firstName + ' <span class="header-identity__name-surname">' + p.lastName + '</span></div>' +
            '<div class="header-identity__role">' + p.role + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="header-signal">' +
          '<div class="header-signal__title">Availability</div>' +
          '<div class="header-signal__status"><span class="header-signal__dot" aria-hidden="true"></span> ' + p.availability.status + '</div>' +
          '<p class="header-signal__meta">' + p.availability.meta + '</p>' +
        '</div>' +
        '<div class="header-action">' +
          (hasCv()
            ? '<div class="cv-group cv-group--header">' +
                '<div class="cv-group__segments" role="group" aria-label="Download CV">' +
                  cvBtn("main", '<span class="cv-btn__icon">' + ICONS.get("download", 16) + '</span><span class="cv-btn__text">Download CV</span>', "cv-btn--main", "Download CV as PDF") +
                  cvBtn("ats", "ATS", "cv-btn--variant", "Download ATS-friendly CV") +
                '</div></div>'
            : '') +
          '<a href="mailto:' + p.email + '" class="header-action__email" aria-label="Email ' + p.email + '">' + ICONS.get("mail", 14) + ' ' + p.email + '</a>' +
          '<ul class="header-action__social" aria-label="Social media links">' + socials + '</ul>' +
        '</div>' +
      '</div></header>';
  }

  function footer() {
    return '<footer class="footer">' +
      '<span class="footer__copyright">' + SITE.copyright + '</span>' +
      '<span class="footer__sep" aria-hidden="true">·</span>' +
      '<a href="/contact.html" class="footer__contact">Contact</a>' +
      '</footer>';
  }

  /* ---------------- Search modal ---------------- */
  function searchModal() {
    return '<div class="search-backdrop" data-search-backdrop hidden>' +
      '<div class="search-modal" role="dialog" aria-modal="true" aria-label="Search">' +
        '<div class="search-modal__header">' +
          '<span class="search-modal__icon">' + searchGlyph(18) + '</span>' +
          '<input class="search-modal__input" data-search-input type="text" placeholder="Search pages and posts…" aria-label="Search">' +
          '<button class="search-modal__esc" data-search-close>ESC</button>' +
        '</div>' +
        '<div class="search-modal__body" data-search-results></div>' +
        '<div class="search-modal__footer"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div>' +
      '</div></div>';
  }

  /* ---------------- Assemble shell ---------------- */
  function render() {
    var app = document.getElementById("app");
    app.innerHTML =
      '<a href="#main-content" class="skip-link">Skip to content</a>' +
      '<main class="main"><div class="container gutter-top">' +
        header() +
        '<div class="row sticky-parent">' +
          '<aside class="col-12 rack-col">' + railNav() + tabletBar() + '</aside>' +
          '<div class="col-12 rack-content-col">' +
            '<div id="main-content" class="box box-content box-entrance box-entrance--content" tabindex="-1"></div>' +
            footer() +
          '</div>' +
        '</div>' +
        '<button class="scroll-to-top" data-scroll-top aria-label="Scroll to top">' + ICONS.get("arrowUp", 20) + '</button>' +
      '</div></main>' +
      mobileDock() +
      searchModal();

    // mount page content
    var mc = document.getElementById("main-content");
    try { mc.innerHTML = PAGE.build ? PAGE.build() : ""; } catch (e) { mc.innerHTML = '<p>Failed to render page.</p>'; console.error(e); }
    if (PAGE.mount) { try { PAGE.mount(mc); } catch (e) { console.error(e); } }

    wire();
    syncToggles(); syncLocale();
    document.body.classList.add("js-ready", "js-boot");
    revealObserver();
    if (document.title) {} // keep page title
  }

  /* ---------------- Behaviour wiring ---------------- */
  function syncToggles() {
    document.querySelectorAll(".theme-toggle__label, [data-theme-label]").forEach(function (n) { n.textContent = themeLabel(); });
  }
  function syncLocale() {
    var loc = Locale.get();
    document.querySelectorAll("[data-locale]").forEach(function (b) {
      var on = b.getAttribute("data-locale") === loc;
      b.classList.toggle("locale-seg__btn--active", on && b.classList.contains("locale-seg__btn"));
      b.classList.toggle("tablet-utils__locale-btn--active", on && b.classList.contains("tablet-utils__locale-btn"));
      b.classList.toggle("mobile-drawer__locale-btn--active", on && b.classList.contains("mobile-drawer__locale-btn"));
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function wire() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-theme-toggle]"); if (t) { Theme.toggle(); return; }
      var lc = e.target.closest("[data-locale]"); if (lc) { Locale.set(lc.getAttribute("data-locale")); return; }
      var so = e.target.closest("[data-search-open]"); if (so) { openSearch(); return; }
      var sc = e.target.closest("[data-search-close]"); if (sc) { closeSearch(); return; }
      var bd = e.target.closest("[data-search-backdrop]"); if (bd && e.target === bd) { closeSearch(); return; }
      var dt = e.target.closest("[data-drawer-toggle]"); if (dt) { toggleDrawer(); return; }
      var st = e.target.closest("[data-scroll-top]"); if (st) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      var cv = e.target.closest("[data-cv]"); if (cv) { e.preventDefault(); alert("Add your CV: drop a PDF into assets/cv/ and set profile.cv in content/site.js\n\ne.g. cv: { main: \"assets/cv/manish-bista-cv.pdf\", ats: \"assets/cv/manish-bista-ats.pdf\" }"); return; }
    });

    // keyboard: Ctrl/Cmd+K opens search
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); openSearch(); return; }
      if (e.key === "Escape") { closeSearch(); closeDrawer(); }
    });

    // scroll-to-top visibility
    var stBtn = document.querySelector("[data-scroll-top]");
    var onScroll = function () { if (stBtn) stBtn.classList.toggle("is-visible", window.scrollY > 500); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  /* drawer */
  function toggleDrawer() {
    var d = document.getElementById("mobile-nav-drawer");
    var btn = document.querySelector("[data-drawer-toggle]");
    var open = d.hasAttribute("hidden");
    if (open) { d.removeAttribute("hidden"); } else { d.setAttribute("hidden", ""); }
    if (btn) { btn.setAttribute("aria-expanded", open ? "true" : "false"); btn.classList.toggle("is-open", open); }
  }
  function closeDrawer() {
    var d = document.getElementById("mobile-nav-drawer"); if (d && !d.hasAttribute("hidden")) { d.setAttribute("hidden", ""); var b = document.querySelector("[data-drawer-toggle]"); if (b) { b.setAttribute("aria-expanded", "false"); b.classList.remove("is-open"); } }
  }

  /* search */
  var searchIndex = null, activeResult = -1;
  function buildIndex() {
    var idx = [];
    SITE.nav.forEach(function (n) { idx.push({ type: "Pages", title: n.label, desc: "Go to " + n.label, href: n.href }); });
    allPosts().filter(isLive).sort(byDateDesc).forEach(function (p) {
      idx.push({ type: "Posts", title: p.title, desc: p.description, href: "/blog/post.html?slug=" + encodeURIComponent(p.slug), tags: (p.tags || []).join(" ") });
    });
    return idx;
  }
  function openSearch() {
    if (!searchIndex) searchIndex = buildIndex();
    var bd = document.querySelector("[data-search-backdrop]"); bd.removeAttribute("hidden");
    var input = bd.querySelector("[data-search-input]"); input.value = ""; renderResults(""); activeResult = -1;
    setTimeout(function () { input.focus(); }, 20);
    input.oninput = function () { activeResult = -1; renderResults(input.value); };
    input.onkeydown = function (e) {
      var results = Array.prototype.slice.call(bd.querySelectorAll(".search-result"));
      if (e.key === "ArrowDown") { e.preventDefault(); activeResult = Math.min(activeResult + 1, results.length - 1); highlight(results); }
      else if (e.key === "ArrowUp") { e.preventDefault(); activeResult = Math.max(activeResult - 1, 0); highlight(results); }
      else if (e.key === "Enter") { e.preventDefault(); var r = results[activeResult] || results[0]; if (r) window.location.href = r.getAttribute("href"); }
    };
  }
  function highlight(results) {
    results.forEach(function (r, i) { r.classList.toggle("search-result--active", i === activeResult); });
    if (results[activeResult]) results[activeResult].scrollIntoView({ block: "nearest" });
  }
  function closeSearch() { var bd = document.querySelector("[data-search-backdrop]"); if (bd) bd.setAttribute("hidden", ""); }
  function renderResults(q) {
    var box = document.querySelector("[data-search-results]");
    q = q.trim().toLowerCase();
    if (!q) { box.innerHTML = '<p class="search-modal__hint">Type to search pages and posts…</p>'; return; }
    var hits = searchIndex.filter(function (it) {
      return (it.title + " " + it.desc + " " + (it.tags || "")).toLowerCase().indexOf(q) !== -1;
    });
    if (!hits.length) { box.innerHTML = '<p class="search-modal__empty">No results for “' + escapeHtml(q) + '”.</p>'; return; }
    var groups = {}; hits.forEach(function (h) { (groups[h.type] = groups[h.type] || []).push(h); });
    box.innerHTML = Object.keys(groups).map(function (g) {
      return '<div class="search-group"><div class="search-group__label">' + g + '</div>' +
        groups[g].map(function (h) {
          return '<a class="search-result" href="' + h.href + '"><span class="search-result__title">' + escapeHtml(h.title) + '</span><span class="search-result__desc">' + escapeHtml(h.desc || "") + '</span></a>';
        }).join("") + '</div>';
    }).join("");
  }

  /* reveal on scroll */
  function revealObserver() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("revealed"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("revealed"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------------- Shared helpers (exposed) ---------------- */
  function isLive(p) {
    if (p.status !== "published") return false;
    var d = new Date(p.date + "T00:00:00");
    return d.getTime() <= Date.now();
  }
  function byDateDesc(a, b) { return new Date(b.date) - new Date(a.date); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }

  // Admin drafts saved in this browser (localStorage), merged over the static posts.
  var ADMIN_KEY = "mb-admin-posts";
  function localPosts() { try { return JSON.parse(localStorage.getItem(ADMIN_KEY) || "[]"); } catch (e) { return []; } }
  function allPosts() {
    var map = {};
    (window.POSTS || []).forEach(function (p) { map[p.slug] = p; });
    localPosts().forEach(function (p) { if (p && p.slug) map[p.slug] = p; }); // local overrides static
    return Object.keys(map).map(function (k) { return map[k]; });
  }
  function saveLocalPosts(arr) { try { localStorage.setItem(ADMIN_KEY, JSON.stringify(arr || [])); } catch (e) {} }

  window.MB = {
    isLive: isLive, byDateDesc: byDateDesc, escapeHtml: escapeHtml, el: el,
    openSearch: openSearch, closeDrawer: closeDrawer,
    allPosts: allPosts, localPosts: localPosts, saveLocalPosts: saveLocalPosts,
    livePosts: function () { return allPosts().filter(isLive).sort(byDateDesc); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
