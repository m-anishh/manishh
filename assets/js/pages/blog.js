/* Blog listing page */
(function () {
  var ICONS = window.ICONS;
  var PAGE_SIZE = 6;
  var state = { tag: "All", year: "All", query: "", shown: PAGE_SIZE, topicsExpanded: false };

  function monthYear(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    return d.toLocaleString("en-US", { month: "short", year: "numeric" });
  }
  function readingTime(p) {
    var text = (p.body || "").replace(/<[^>]+>/g, " ");
    var words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200)) + " min read";
  }
  function live() { return window.MB.livePosts(); }

  function filtered() {
    return live().filter(function (p) {
      if (state.tag !== "All" && (p.tags || []).indexOf(state.tag) === -1) return false;
      if (state.year !== "All" && new Date(p.date).getFullYear() !== state.year) return false;
      if (state.query) {
        var hay = (p.title + " " + p.description + " " + (p.tags || []).join(" ")).toLowerCase();
        if (hay.indexOf(state.query.toLowerCase()) === -1) return false;
      }
      return true;
    });
  }

  function postRow(p, featured) {
    var tags = (p.tags || []).slice(0, 4).map(function (t) {
      return '<li><a href="/blog/blog.html?tag=' + encodeURIComponent(t) + '" class="post-row__tag" data-tag="' + t + '">#' + t + '</a></li>';
    }).join("");
    var href = "/blog/post.html?slug=" + encodeURIComponent(p.slug);
    return '<article class="post-row' + (featured ? " post-row-featured" : "") + '">' +
      '<div class="post-row__media"><img class="post-row__img" loading="lazy" src="' + p.cover + '" alt="' + p.title + '" width="640" height="480"></div>' +
      '<div class="post-row__body">' +
        '<p class="post-row__meta"><span>' + monthYear(p.date) + '</span><span class="post-row__sep" aria-hidden="true">·</span><span>' + readingTime(p) + '</span><span class="post-row__sep" aria-hidden="true">·</span><span class="post-row__part">' + (p.lang || "EN") + '</span></p>' +
        '<h2 class="post-row__title"><a class="post-row__title-link" href="' + href + '">' + p.title + '</a></h2>' +
        '<p class="post-row__desc">' + p.description + '</p>' +
        '<ul class="post-row__tags">' + tags + '</ul>' +
      '</div></article>';
  }

  function listHtml() {
    var list = filtered();
    if (!list.length) return '<div class="empty-state"><p>No posts match your filters.</p></div>';
    var html = "";
    var slice = list.slice(0, state.shown);
    slice.forEach(function (p, i) {
      html += postRow(p, i === 0 && p.featured && state.tag === "All" && state.year === "All" && !state.query);
    });
    if (list.length > state.shown) {
      html += '<div class="post-list__more"><button class="post-list__more-btn" data-more>Load more</button></div>';
    }
    return html;
  }

  function toolbarHtml() {
    var posts = live();
    var years = {};
    posts.forEach(function (p) { var y = new Date(p.date).getFullYear(); years[y] = (years[y] || 0) + 1; });
    var yearItems = [{ key: "All", count: posts.length, active: state.year === "All" }].concat(
      Object.keys(years).sort(function (a, b) { return b - a; }).map(function (y) {
        return { key: y, count: years[y], active: state.year === +y };
      })
    );
    var yearLinks = yearItems.map(function (it) {
      return '<li><button class="year-link' + (it.active ? " year-link--active" : "") + '" data-year="' + it.key + '">' + it.key + ' <span class="year-link__count">' + it.count + '</span></button></li>';
    }).join("");

    var tagCounts = { All: posts.length };
    posts.forEach(function (p) { (p.tags || []).forEach(function (t) { tagCounts[t] = (tagCounts[t] || 0) + 1; }); });
    var tagNames = Object.keys(tagCounts).filter(function (t) { return t !== "All"; }).sort(function (a, b) { return tagCounts[b] - tagCounts[a]; });
    var visibleTags = state.topicsExpanded ? tagNames : tagNames.slice(0, 7);
    var topicPills = '<button class="pill pill--mono' + (state.tag === "All" ? " pill--active" : "") + '" data-tag="All">All <span class="pill__count">' + tagCounts.All + '</span></button>' +
      visibleTags.map(function (t) {
        return '<button class="pill pill--mono' + (state.tag === t ? " pill--active" : "") + '" data-tag="' + t + '">' + t + ' <span class="pill__count">' + tagCounts[t] + '</span></button>';
      }).join("");
    var more = tagNames.length > 7 ? '<button class="index-toolbar__more" data-topics-toggle>' + (state.topicsExpanded ? "Show less" : "+" + (tagNames.length - 7) + " more") + '</button>' : "";

    return '<nav class="index-toolbar" aria-label="Blog filters">' +
      '<ul class="index-toolbar__years">' + yearLinks + '</ul>' +
      '<div class="index-toolbar__topics">' + topicPills + more + '</div>' +
      '</nav>';
  }

  window.__PAGE__ = {
    id: "blog",
    build: function () {
      // read ?tag= from URL
      var params = new URLSearchParams(location.search);
      if (params.get("tag")) state.tag = params.get("tag");
      var posts = live();
      var years = posts.map(function (p) { return new Date(p.date).getFullYear(); });
      var span = years.length ? Math.min.apply(null, years) + "–" + Math.max.apply(null, years) : "";
      return '<header class="index-masthead reveal"><h1 class="title title--h1 title__separate">Blog<span class="title--tone">.</span></h1>' +
        '<p class="index-masthead__lead">Field notes on cloud infrastructure, reliability and the systems that keep things running.</p>' +
        '<div class="index-masthead__foot">' +
          '<p class="index-masthead__stat">' + posts.length + ' posts <span class="index-masthead__sep" aria-hidden="true">·</span> ' + span + '</p>' +
          '<div class="blog-search"><span class="blog-search__icon">' + ICONS.get("search", 16) + '</span>' +
            '<input class="blog-search__input" type="text" placeholder="Search posts…" aria-label="Search posts" data-blog-search>' +
          '</div>' +
        '</div></header>' +
        '<div data-toolbar>' + toolbarHtml() + '</div>' +
        '<div class="post-list" data-post-list>' + listHtml() + '</div>';
    },
    mount: function (root) {
      function refreshToolbar() { root.querySelector("[data-toolbar]").innerHTML = toolbarHtml(); }
      function refreshList() { root.querySelector("[data-post-list]").innerHTML = listHtml(); }

      root.addEventListener("click", function (e) {
        var yr = e.target.closest("[data-year]");
        if (yr) { var y = yr.getAttribute("data-year"); state.year = y === "All" ? "All" : +y; state.shown = PAGE_SIZE; refreshToolbar(); refreshList(); return; }
        var tg = e.target.closest("[data-tag]");
        if (tg) { e.preventDefault(); state.tag = tg.getAttribute("data-tag"); state.shown = PAGE_SIZE; refreshToolbar(); refreshList(); return; }
        var tt = e.target.closest("[data-topics-toggle]");
        if (tt) { state.topicsExpanded = !state.topicsExpanded; refreshToolbar(); return; }
        var mo = e.target.closest("[data-more]");
        if (mo) { state.shown += PAGE_SIZE; refreshList(); return; }
      });

      var si = root.querySelector("[data-blog-search]");
      var tmr;
      si.addEventListener("input", function () {
        clearTimeout(tmr);
        tmr = setTimeout(function () { state.query = si.value; state.shown = PAGE_SIZE; refreshList(); }, 120);
      });
    }
  };
})();
