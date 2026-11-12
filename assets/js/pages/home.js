/* About / Home page */
(function () {
  var SITE = window.SITE, ICONS = window.ICONS;
  window.__PAGE__ = {
    id: "about",
    build: function () {
      var a = SITE.about;
      var facts = a.facts.map(function (f) {
        return '<div class="about-story__fact"><dt>' + f.label + '</dt><dd>' + f.value + '</dd></div>';
      }).join("");
      var prose = '<p class="about-story__lead">' + a.lead + '</p>' +
        a.paragraphs.map(function (p) { return '<p>' + p + '</p>'; }).join("") +
        '<p>' + a.closing + '</p>' +
        '<a href="' + a.ctaHref + '" class="about-story__link"><span>' + a.ctaLabel + '</span><span class="about-story__link-arrow" aria-hidden="true">→</span></a>';

      var stats = SITE.stats.map(function (s) {
        return '<a href="' + s.href + '" class="about-stat"><span class="about-stat__value">' + s.value + '</span><span class="about-stat__label">' + s.label + '</span></a>';
      }).join("");

      var scope = SITE.scope.map(function (c) {
        return '<div class="about-scope-grid__item reveal"><article class="about-scope-card">' +
          '<span class="about-scope-card__index" aria-hidden="true">' + c.index + '</span>' +
          '<div class="about-scope-card__body">' +
            '<div class="about-scope-card__head"><h3 class="about-scope-card__title">' + c.title + '</h3><span class="about-scope-card__type">' + c.type.toUpperCase() + '</span></div>' +
            '<p class="about-scope-card__desc">' + c.desc + '</p>' +
          '</div>' +
          '<span class="about-scope-card__icon" aria-hidden="true">' + ICONS.get(c.icon, 18) + '</span>' +
        '</article></div>';
      }).join("");

      return '' +
        '<div class="pb-2 reveal"><h1 class="title title--h1 title__separate">About Me<span class="title--tone">.</span></h1></div>' +
        '<section id="story" class="reveal about-story">' +
          '<aside class="about-story__meta"><span class="about-story__kicker">Profile</span><dl class="about-story__facts">' + facts + '</dl></aside>' +
          '<div class="about-story__prose">' + prose + '</div>' +
        '</section>' +
        '<nav class="seg-control seg-control-nav" role="tablist" aria-label="Section jump">' +
          '<button class="seg-control__seg" role="tab" data-jump="stats"><span>Stats</span></button>' +
          '<button class="seg-control__seg" role="tab" data-jump="scope"><span>Scope</span></button>' +
        '</nav>' +
        '<section id="stats" class="reveal reveal-delay-2 about-section">' +
          '<header class="about-section__head"><h2 class="about-section__title">Track Record</h2></header>' +
          '<div class="about-stats">' + stats + '</div>' +
        '</section>' +
        '<section id="scope" class="reveal reveal-delay-3 about-section">' +
          '<header class="about-section__head"><h2 class="about-section__title">Areas of Work</h2></header>' +
          '<div class="about-scope-grid">' + scope + '</div>' +
        '</section>';
    },
    mount: function (root) {
      // segmented control -> smooth-scroll to section + active state
      var segs = root.querySelectorAll(".seg-control__seg");
      segs.forEach(function (s) {
        s.addEventListener("click", function () {
          var id = s.getAttribute("data-jump");
          var target = document.getElementById(id);
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
      // highlight the segment for the section in view
      var sections = ["stats", "scope"].map(function (id) { return document.getElementById(id); }).filter(Boolean);
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              segs.forEach(function (s) { s.classList.toggle("seg-control__seg--active", s.getAttribute("data-jump") === en.target.id); });
            }
          });
        }, { rootMargin: "-40% 0px -55% 0px" });
        sections.forEach(function (s) { io.observe(s); });
      }
    }
  };
})();
