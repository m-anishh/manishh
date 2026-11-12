/* Blog post detail page */
(function () {
  var ICONS = window.ICONS;

  function getSlug() { return new URLSearchParams(location.search).get("slug"); }
  function findPost(slug) {
    var pool = (window.MB && window.MB.allPosts) ? window.MB.allPosts() : (window.POSTS || []);
    return pool.filter(function (p) { return p.slug === slug; })[0];
  }

  function fmtDate(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    return d.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  function readingTime(body) {
    var words = body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200)) + " min read";
  }

  var DOMAIN = "https://manishbista11.com.np";
  function setMeta(attr, key, val) {
    var m = document.head.querySelector("meta[" + attr + '="' + key + '"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute(attr, key); document.head.appendChild(m); }
    m.setAttribute("content", val);
  }
  function setCanonical(url) {
    var l = document.head.querySelector('link[rel="canonical"]');
    if (!l) { l = document.createElement("link"); l.rel = "canonical"; document.head.appendChild(l); }
    l.href = url;
  }
  // Per-post SEO: title, meta description, canonical, Open Graph/Twitter, and BlogPosting JSON-LD.
  function setPostSEO(post) {
    var url = DOMAIN + "/blog/post.html?slug=" + encodeURIComponent(post.slug);
    var img = DOMAIN + "/assets/img/og-cover.png";
    document.title = post.title + " — Manish Bista";
    setMeta("name", "description", post.description);
    setMeta("name", "twitter:title", post.title);
    setMeta("name", "twitter:description", post.description);
    setMeta("property", "og:type", "article");
    setMeta("property", "og:title", post.title);
    setMeta("property", "og:description", post.description);
    setMeta("property", "og:url", url);
    setMeta("property", "article:published_time", post.date);
    setCanonical(url);
    var ld = {
      "@context": "https://schema.org", "@type": "BlogPosting",
      headline: post.title, description: post.description,
      datePublished: post.date, dateModified: post.date,
      inLanguage: post.lang === "ID" ? "id" : "en",
      url: url, mainEntityOfPage: url, image: img,
      keywords: (post.tags || []).join(", "),
      author: { "@type": "Person", name: "Manish Bista", url: DOMAIN + "/" },
      publisher: { "@type": "Person", name: "Manish Bista" }
    };
    var el = document.getElementById("post-jsonld");
    if (!el) { el = document.createElement("script"); el.type = "application/ld+json"; el.id = "post-jsonld"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(ld);
  }

  // Transform <pre data-lang="x"><code>..</code></pre> into the code-block component.
  function enhanceBody(html) {
    return html.replace(/<pre\s+data-lang="([^"]*)">\s*<code>([\s\S]*?)<\/code>\s*<\/pre>/g, function (_, lang, code) {
      return '<div class="code-block"><div class="code-block__header"><span class="code-block__lang">' + lang + '</span>' +
        '<button class="code-block__copy" data-copy-code type="button">' + ICONS.get("copy", 14) + '<span>Copy</span></button></div>' +
        '<pre><code>' + code + '</code></pre></div>';
    });
  }

  // Build a table of contents from h2/h3 in the body.
  function buildToc(container) {
    var heads = container.querySelectorAll("h2, h3");
    if (heads.length < 3) return null;
    var items = [];
    heads.forEach(function (h) {
      if (!h.id) h.id = h.textContent.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
      items.push({ id: h.id, text: h.textContent, indent: h.tagName === "H3" });
    });
    return items;
  }

  window.__PAGE__ = {
    id: "blog",
    build: function () {
      var post = findPost(getSlug());
      if (!post || !window.MB.isLive(post)) {
        return '<a href="/blog/blog.html" class="back-link"><span class="back-link__icon">' + ICONS.get("arrowLeft", 20) + '</span><span>Return to Blog</span></a>' +
          '<div class="empty-state"><h1 class="title title--h2">Post not found<span class="title--tone">.</span></h1>' +
          '<p>This post may be a draft, scheduled for the future, or the link is wrong.</p>' +
          '<p><a href="/blog/blog.html">Browse all posts →</a></p></div>';
      }
      setPostSEO(post);
      this._post = post;
      var tagPills = (post.tags || []).map(function (t) {
        return '<a href="/blog/blog.html?tag=' + encodeURIComponent(t) + '" class="pill pill--mono">' + t + '</a>';
      }).join("");

      return '<div class="reading-progress" data-progress></div>' +
        '<a href="/blog/blog.html" class="back-link"><span class="back-link__icon">' + ICONS.get("arrowLeft", 20) + '</span><span>Return to Blog</span></a>' +
        '<article>' +
          '<header class="header-post">' +
            '<h1 class="title title--h1">' + post.title + '</h1>' +
            '<p class="blog-post__meta">' + fmtDate(post.date) + ' <span class="blog-header-meta">· ' + readingTime(post.body) + ' · ' + (post.lang || "EN") + '</span></p>' +
            '<div class="blog-post__lead"><p>' + post.description + '</p></div>' +
            '<div class="header-post__image-wrap"><img src="' + post.cover + '" alt="' + post.title + '" width="960" height="540"></div>' +
          '</header>' +
          '<aside class="toc" data-toc hidden>' +
            '<button class="toc__toggle" data-toc-toggle aria-expanded="false"><span data-toc-count>Contents</span>' + ICONS.get("arrowDown", 14).replace("app-icon", "app-icon toc__toggle-icon") + '</button>' +
            '<div class="toc__divider"></div>' +
            '<ul class="toc__list" data-toc-list></ul>' +
          '</aside>' +
          '<div class="caption-post" data-post-body>' + enhanceBody(post.body) + '</div>' +
          '<section class="post-tags"><h2 class="post-tags__title">Topics</h2><div class="post-tags__list">' + tagPills + '</div></section>' +
          '<section class="share"><h2 class="share__title">Share this article</h2><div class="share__actions">' +
            '<button class="share__btn" data-share="x">' + ICONS.get("x", 16) + '<span>X</span></button>' +
            '<button class="share__btn" data-share="linkedin">' + ICONS.get("linkedin", 16) + '<span>LinkedIn</span></button>' +
            '<button class="share__btn" data-share="facebook">' + ICONS.get("facebook", 16) + '<span>Facebook</span></button>' +
            '<button class="share__btn share__btn-copy" data-share="copy">' + ICONS.get("copy", 16) + '<span>Copy Link</span></button>' +
          '</div></section>' +
          '<section class="giscus-container"><div class="giscus-header">' + ICONS.get("comments", 18) + '<span class="giscus-header__title">Comments</span><span class="giscus-header__line"></span></div>' +
            '<div class="giscus-card--disabled"><p class="giscus-disabled__text">Comments are disabled on this demo.</p><p class="giscus-disabled__hint">' + ICONS.get("alert", 14) + ' In the reference this is a Giscus thread.</p></div>' +
          '</section>' +
        '</article>';
    },
    mount: function (root) {
      var post = this._post;
      if (!post) return;

      // code-block copy buttons
      root.addEventListener("click", function (e) {
        var cc = e.target.closest("[data-copy-code]");
        if (cc) {
          var code = cc.closest(".code-block").querySelector("code").innerText;
          copy(code); var span = cc.querySelector("span"); var old = span.textContent; cc.classList.add("copied"); span.textContent = "Copied";
          setTimeout(function () { cc.classList.remove("copied"); span.textContent = old; }, 1600);
          return;
        }
        var sh = e.target.closest("[data-share]");
        if (sh) { share(sh.getAttribute("data-share"), post, sh); return; }
      });

      // TOC
      var body = root.querySelector("[data-post-body]");
      var items = buildToc(body);
      var tocEl = root.querySelector("[data-toc]");
      if (items) {
        tocEl.removeAttribute("hidden");
        root.querySelector("[data-toc-count]").textContent = "Contents (" + items.length + ")";
        root.querySelector("[data-toc-list]").innerHTML = items.map(function (it) {
          return '<li class="toc__item' + (it.indent ? " toc__item--indent" : "") + '"><a href="#' + it.id + '">' + it.text + '</a></li>';
        }).join("");
        root.querySelector("[data-toc-toggle]").addEventListener("click", function () {
          var open = tocEl.classList.toggle("expanded");
          this.setAttribute("aria-expanded", open ? "true" : "false");
        });
        root.querySelector("[data-toc-list]").addEventListener("click", function (e) {
          var a = e.target.closest("a"); if (!a) return;
          e.preventDefault();
          var tgt = document.getElementById(a.getAttribute("href").slice(1));
          if (tgt) tgt.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }

      // reading progress
      var bar = root.querySelector("[data-progress]");
      var onScroll = function () {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        var pct = max > 0 ? h.scrollTop / max : 0;
        bar.style.transform = "scaleX(" + pct + ")";
      };
      window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    }
  };

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {} document.body.removeChild(ta);
  }
  function share(kind, post, btn) {
    var url = location.href;
    var text = post.title;
    if (kind === "copy") {
      copy(url); btn.classList.add("is-copied"); var s = btn.querySelector("span"); var old = s.textContent; s.textContent = "Copied!";
      setTimeout(function () { btn.classList.remove("is-copied"); s.textContent = old; }, 1600); return;
    }
    var map = {
      x: "https://twitter.com/intent/tweet?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text),
      linkedin: "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url),
      facebook: "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url)
    };
    window.open(map[kind], "_blank", "noopener,width=600,height=520");
  }
})();
