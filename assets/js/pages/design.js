/* Design System page — a live reference of the tokens and components. */
(function () {
  var ICONS = window.ICONS;

  var COLORS = [
    ["--c-bg", "Background"], ["--c-surface", "Surface"], ["--c-surface-alt", "Surface alt"],
    ["--c-border", "Border"], ["--c-text", "Text"], ["--c-heading", "Heading"],
    ["--c-muted", "Muted"], ["--c-accent", "Accent"], ["--c-accent-light", "Accent light"],
    ["--c-accent-2", "Accent 2"], ["--c-success", "Success"], ["--c-warning", "Warning"],
    ["--c-error", "Error"], ["--c-dot-green", "Dot green"]
  ];
  var TYPE = [
    ["--font-5xl", "Page title · h1", "2rem"], ["--font-3xl", "Section · h2", "1.5rem"],
    ["--font-xl", "Subhead · h3", "1.25rem"], ["--font-md", "Lead", "1.0625rem"],
    ["--font-base", "Body", "1rem"], ["--font-body-sm", "Small", "0.875rem"],
    ["--font-sm", "Meta", "0.75rem"], ["--font-xs", "Micro", "0.6875rem"]
  ];
  var SPACE = [["0.25rem", 4], ["0.5rem", 8], ["0.75rem", 12], ["1rem", 16], ["1.5rem", 24], ["2rem", 32], ["2.5rem", 40]];
  var RADIUS = [["4px", "4px"], ["8px", "8px"], ["12px", "12px"], ["14px", "14px"], ["20px", "20px"], ["999px", "pill"]];
  var ELEV = [["--elevation-surface", "surface"], ["--elevation-raised", "raised"], ["--elevation-floating", "floating"], ["--elevation-dock", "dock"]];

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  window.__PAGE__ = {
    id: "design",
    build: function () {
      return '<div class="pb-2 reveal"><h1 class="title title--h1 title__separate">Design System<span class="title--tone">.</span></h1>' +
        '<p class="portfolio-intro">A live reference of the tokens and components this site is built from. Toggle the theme in the nav to see every value adapt.</p></div>' +

        section("colour", "Colour", "Semantic tokens for surfaces, text, accents and status. One accent per surface; values flip between light and dark themes.",
          '<div class="ds-swatches" data-swatches></div>') +

        section("type", "Typography", "Space Grotesk for display, Poppins for body, a monospace stack for metadata. The scale runs from 11px micro text to the 32px page title.",
          '<div data-type></div>') +

        section("spacing", "Spacing", "A rem-based spacing scale from 4px to 40px.",
          '<div class="ds-scale">' + SPACE.map(function (s) {
            return '<div class="ds-scale__item"><div class="ds-scale__box" style="width:' + s[0] + ';height:' + s[0] + '"></div><span class="ds-scale__label">' + s[1] + '</span></div>';
          }).join("") + '</div>') +

        section("radius", "Radius", "Corner radii from 4px tags up to 999px pills.",
          '<div class="ds-radius">' + RADIUS.map(function (r) {
            return '<div class="ds-radius__box" style="border-radius:' + r[0] + '">' + r[1] + '</div>';
          }).join("") + '</div>') +

        section("elevation", "Elevation", "Layered shadow tokens for resting, raised, floating and dock surfaces.",
          '<div class="ds-elevation-grid">' + ELEV.map(function (e) {
            return '<div class="ds-elevation" style="box-shadow:var(' + e[0] + ')">' + e[1] + '</div>';
          }).join("") + '</div>') +

        section("components", "Components", "The reusable building blocks used across the site.",
          '<div class="ds-components">' +
            '<div class="ds-demo-row">' +
              '<button class="pill pill--mono pill--active">Active <span class="pill__count">5</span></button>' +
              '<button class="pill pill--mono">Topic <span class="pill__count">3</span></button>' +
              '<button class="pill pill--toggle">+4 more</button>' +
            '</div>' +
            '<div class="ds-demo-row"><div class="seg-control" style="width:320px;max-width:100%"><button class="seg-control__seg seg-control__seg--active">Stats</button><button class="seg-control__seg">Scope</button><button class="seg-control__seg">Client</button></div></div>' +
            '<div class="ds-demo-row">' +
              '<span class="cv-group"><span class="cv-group__segments"><button class="cv-btn cv-btn--main">' + ICONS.get("download", 16) + '<span class="cv-btn__text">Download CV</span></button><button class="cv-btn cv-btn--variant">ATS</button></span></span>' +
              '<a class="back-link" style="position:static">' + '<span class="back-link__icon">' + ICONS.get("arrowLeft", 18) + '</span><span>Back link</span></a>' +
            '</div>' +
            '<div class="ds-demo-row">' +
              '<span class="share__btn">' + ICONS.get("x", 16) + '<span>Share</span></span>' +
              '<span class="share__btn is-copied">' + ICONS.get("check", 16) + '<span>Copied</span></span>' +
            '</div>' +
          '</div>') +

        section("icons", "Iconography", "Stroke icons on a 24×24 grid, 2px stroke, drawn in the current text colour.",
          '<div class="ds-demo-row" style="gap:1rem">' +
            ["about", "portfolio", "blog", "contact", "design", "search", "mail", "download", "shield", "cloud", "activity", "terminal", "tag", "globe", "github", "linkedin"].map(function (n) {
              return '<span style="color:var(--c-muted)">' + ICONS.get(n, 22) + '</span>';
            }).join("") +
          '</div>');
    },
    mount: function (root) {
      // swatches (read computed values after render)
      root.querySelector("[data-swatches]").innerHTML = COLORS.map(function (c) {
        var val = cssVar(c[0]) || "";
        return '<div class="ds-swatch"><div class="ds-swatch__chip" style="background:var(' + c[0] + ')"></div>' +
          '<div class="ds-swatch__meta"><div class="ds-swatch__name">' + c[1] + '</div><div class="ds-swatch__value">' + c[0] + '</div></div></div>';
      }).join("");

      root.querySelector("[data-type]").innerHTML = TYPE.map(function (t) {
        return '<div class="ds-type-row"><span class="ds-type-row__label">' + t[2] + '</span>' +
          '<span class="ds-type-row__sample" style="font-size:var(' + t[0] + ');font-family:' + (t[0] === "--font-5xl" || t[0] === "--font-3xl" || t[0] === "--font-xl" ? "var(--font-display)" : "var(--font-body)") + '">' + t[1] + '</span></div>';
      }).join("");
    }
  };

  function section(id, title, desc, inner) {
    return '<section id="' + id + '" class="ds-section reveal"><header class="ds-section__head"><h2 class="ds-section__title">' + title + '</h2>' +
      '<p class="ds-section__desc">' + desc + '</p></header>' + inner + '</section>';
  }
})();
