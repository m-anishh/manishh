/* Portfolio page */
(function () {
  var SITE = window.SITE, ICONS = window.ICONS;
  var activeCat = "All";

  function card(p) {
    var links = p.links.map(function (l) {
      var ext = l.external ? ' target="_blank" rel="noopener"' : "";
      var icon = l.external ? ICONS.get("external", 14) : ICONS.get("arrowRight", 14);
      return '<a href="' + l.href + '"' + ext + ' class="portfolio-card__link' + (l.primary ? " portfolio-card__link--primary" : "") + '">' + l.label + ' ' + icon + '</a>';
    }).join("");
    var kind = p.category === "Certifications" ? "cert" : "project";
    return '<article class="portfolio-card portfolio-card--' + kind + (p.feature ? " portfolio-card--feature" : "") + '">' +
      '<div class="portfolio-card__media"><img class="portfolio-card__img" loading="lazy" src="' + p.image + '" alt="' + p.title + '"></div>' +
      '<div class="portfolio-card__body">' +
        '<span class="portfolio-card__category">' + p.category + '</span>' +
        '<h2 class="portfolio-card__title">' + p.title + '</h2>' +
        '<p class="portfolio-card__desc">' + p.desc + '</p>' +
        '<div class="portfolio-card__links">' + links + '</div>' +
      '</div></article>';
  }

  window.__PAGE__ = {
    id: "portfolio",
    build: function () {
      var chips = SITE.projectCategories.map(function (c) {
        var count = c === "All" ? SITE.projects.length : SITE.projects.filter(function (p) { return p.category === c; }).length;
        return '<button class="pill pill--mono' + (c === activeCat ? " pill--active" : "") + '" data-cat="' + c + '">' + c + ' <span class="pill__count">' + count + '</span></button>';
      }).join("");
      return '<div class="pb-2 reveal"><h1 class="title title--h1 title__separate">DevOps Cloud Engineer Portfolio<span class="title--tone">.</span></h1>' +
        '<p class="portfolio-intro">Network, cloud, DevOps and Agentic AI. Infrastructure, delivery pipelines and intelligent systems built to stay reliable in production. Every project notes the architecture decision and the outcome, and certifications are verifiable on request.</p></div>' +
        '<div class="portfolio-explore reveal reveal-delay-1" role="group" aria-label="Filter portfolio by category"><div class="portfolio-explore__chips" data-chips>' + chips + '</div></div>' +
        '<div class="portfolio-grid reveal reveal-delay-2" data-grid>' + SITE.projects.map(card).join("") + '</div>';
    },
    mount: function (root) {
      var grid = root.querySelector("[data-grid]");
      root.querySelector("[data-chips]").addEventListener("click", function (e) {
        var b = e.target.closest("[data-cat]"); if (!b) return;
        activeCat = b.getAttribute("data-cat");
        root.querySelectorAll("[data-cat]").forEach(function (x) { x.classList.toggle("pill--active", x === b); });
        var list = activeCat === "All" ? SITE.projects : SITE.projects.filter(function (p) { return p.category === activeCat; });
        grid.innerHTML = list.length ? list.map(card).join("") : '<div class="portfolio-empty"><p class="portfolio-empty__title">Nothing here yet</p><p class="portfolio-empty__body">No projects in this category.</p></div>';
      });
    }
  };
})();
