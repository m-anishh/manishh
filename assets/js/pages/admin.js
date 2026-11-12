/* Blog Admin panel (admin.html).
   Client-side editor for a static site: drafts are saved in this browser
   (localStorage) and shown live on the blog for preview; Export downloads an
   updated content/posts.js to publish for everyone. Not a server/database. */
(function () {
  var SITE = window.SITE, ICONS = window.ICONS;

  function esc(s) { return window.MB.escapeHtml(s); }
  function slugify(s) { return String(s).toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""); }
  function readingTime(body) { var w = String(body || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length; return Math.max(1, Math.round(w / 200)) + " min read"; }
  function fmtMonth(d) { try { return new Date(d + "T00:00:00").toLocaleString("en-US", { month: "short", year: "numeric" }); } catch (e) { return d; } }
  function blank() { return { slug: "", title: "", description: "", date: new Date().toISOString().slice(0, 10), status: "draft", lang: "EN", tags: [], cover: "", featured: false, body: "" }; }

  window.__PAGE__ = {
    id: "admin",
    build: function () {
      return '<div class="pb-2"><h1 class="title title--h1 title__separate">Blog Admin<span class="title--tone">.</span></h1>' +
        '<p class="terminal-intro">Write and manage posts. Drafts are saved in <strong>this browser</strong> so you can preview them live on the blog; <strong>Export</strong> downloads an updated <code>content/posts.js</code> to publish for everyone.</p></div>' +
        '<div data-admin-root></div>';
    },
    mount: function (root) {
      var container = root.querySelector("[data-admin-root]");
      var pass = (SITE.admin && SITE.admin.passcode) || "";
      var authed = !pass || sessionStorage.getItem("mb-admin-ok") === "1";
      authed ? renderAdmin() : renderLock();

      function renderLock() {
        container.innerHTML = '<div class="admin-lock"><form class="admin-lock__box" data-lock>' +
          '<span class="admin-lock__icon">' + ICONS.get("shield", 26) + '</span>' +
          '<h2 class="admin-lock__title">Enter passcode</h2>' +
          '<p class="admin-lock__hint">Client-side gate only — not real security.</p>' +
          '<input class="contact-field__input" type="password" data-pass placeholder="Passcode" aria-label="Passcode">' +
          '<div class="contact-field__error" data-lock-err hidden></div>' +
          '<button class="contact-submit" type="submit" style="width:100%;margin-top:.25rem">Unlock</button>' +
          '</form></div>';
        var inp = container.querySelector("[data-pass]");
        container.querySelector("[data-lock]").addEventListener("submit", function (e) {
          e.preventDefault();
          if (inp.value === pass) { try { sessionStorage.setItem("mb-admin-ok", "1"); } catch (x) {} renderAdmin(); }
          else { var er = container.querySelector("[data-lock-err]"); er.hidden = false; er.innerHTML = ICONS.get("alert", 14) + "<span>Wrong passcode.</span>"; inp.select(); }
        });
        inp.focus();
      }

      function renderAdmin() {
        container.innerHTML = '<div class="admin">' +
          '<aside class="admin__list" data-list></aside>' +
          '<section class="admin__editor">' +
            '<div class="admin__notice" data-notice hidden></div>' +
            '<form class="admin__form" data-form novalidate></form>' +
            '<div class="admin__preview-wrap"><div class="admin__preview-label">Live preview</div><div class="admin__preview" data-preview></div></div>' +
          '</section></div>';
        renderList();
        loadForm(blank());
        wire();
      }

      function renderList() {
        var locals = window.MB.localPosts();
        var localSlugs = {}; locals.forEach(function (p) { localSlugs[p.slug] = true; });
        var all = window.MB.allPosts().sort(window.MB.byDateDesc);
        var rows = all.map(function (p) {
          var isLocal = !!localSlugs[p.slug];
          var badge = p.status === "published"
            ? (window.MB.isLive(p) ? '<span class="admin-badge admin-badge--live">published</span>' : '<span class="admin-badge admin-badge--sched">scheduled</span>')
            : '<span class="admin-badge admin-badge--draft">draft</span>';
          var src = isLocal ? '<span class="admin-badge admin-badge--local">local</span>' : '<span class="admin-badge admin-badge--file">file</span>';
          return '<li class="admin-item" data-slug="' + esc(p.slug) + '">' +
            '<button class="admin-item__main" data-edit="' + esc(p.slug) + '"><span class="admin-item__title">' + esc(p.title || "(untitled)") + '</span>' +
            '<span class="admin-item__meta">' + fmtMonth(p.date) + ' · ' + badge + ' ' + src + '</span></button>' +
            (isLocal ? '<button class="admin-icon-btn admin-icon-btn--danger" data-del="' + esc(p.slug) + '" title="Delete local draft" aria-label="Delete local draft">' + ICONS.get("close", 15) + '</button>' : "") +
            '</li>';
        }).join("");
        container.querySelector("[data-list]").innerHTML =
          '<div class="admin__list-head"><span>Posts (' + all.length + ')</span><button class="admin-btn admin-btn--accent" data-new>+ New post</button></div>' +
          '<ul class="admin__items">' + rows + '</ul>' +
          '<div class="admin__list-foot">' +
            '<button class="admin-btn" data-export>↓ Export posts.js</button>' +
            '<button class="admin-btn admin-btn--ghost" data-clear>Clear local (' + locals.length + ')</button>' +
          '</div>';
      }

      function field(label, inner, hint) {
        return '<div class="contact-field"><div class="contact-field__head"><label class="contact-field__label">' + label + '</label>' +
          (hint ? '<span class="contact-field__count">' + hint + '</span>' : "") + '</div>' + inner + '</div>';
      }

      function loadForm(post) {
        var f = container.querySelector("[data-form]");
        f.innerHTML =
          '<div class="contact-form-row">' +
            field("Title", '<input class="contact-field__input" data-f="title" type="text" placeholder="Post title" value="' + esc(post.title) + '">') +
            field("Slug", '<input class="contact-field__input" data-f="slug" type="text" placeholder="auto-from-title" value="' + esc(post.slug) + '">', "url id") +
          '</div>' +
          '<div class="contact-form-row">' +
            field("Publish date", '<input class="contact-field__input" data-f="date" type="date" value="' + esc(post.date) + '">') +
            field("Status", '<select class="contact-field__input" data-f="status"><option value="draft"' + (post.status === "draft" ? " selected" : "") + '>Draft (hidden)</option><option value="published"' + (post.status === "published" ? " selected" : "") + '>Published</option></select>') +
          '</div>' +
          '<div class="contact-form-row">' +
            field("Language", '<select class="contact-field__input" data-f="lang"><option' + (post.lang === "EN" ? " selected" : "") + '>EN</option><option' + (post.lang === "ID" ? " selected" : "") + '>ID</option></select>') +
            field("Tags", '<input class="contact-field__input" data-f="tags" type="text" placeholder="AWS, SRE, DevOps" value="' + esc((post.tags || []).join(", ")) + '">', "comma-separated") +
          '</div>' +
          field("Cover image URL", '<input class="contact-field__input" data-f="cover" type="text" placeholder="https://… or assets/img/cover.jpg" value="' + esc(post.cover) + '">') +
          '<div class="contact-field"><label class="admin-check"><input type="checkbox" data-f="featured"' + (post.featured ? " checked" : "") + '> Featured (large hero row — newest post)</label></div>' +
          field("Description", '<textarea class="contact-field__input contact-field__input--textarea" data-f="description" style="min-height:64px" placeholder="One-line summary for the listing and search.">' + esc(post.description) + '</textarea>') +
          field("Body (HTML)", '<textarea class="contact-field__input contact-field__input--textarea" data-f="body" style="min-height:220px;font-family:var(--font-mono);font-size:var(--font-sm)" placeholder="&lt;h2 id=&quot;intro&quot;&gt;Intro&lt;/h2&gt;&#10;&lt;p&gt;…&lt;/p&gt;&#10;&lt;pre data-lang=&quot;bash&quot;&gt;&lt;code&gt;…&lt;/code&gt;&lt;/pre&gt;">' + esc(post.body) + '</textarea>', "h2/h3 build the TOC") +
          '<div class="admin__form-actions"><button class="contact-submit" type="button" data-save>Save draft (local)</button>' +
          '<button class="admin-btn admin-btn--ghost" type="button" data-reset>New / clear</button>' +
          '<a class="admin-btn admin-btn--ghost" data-view target="_blank" rel="noopener" hidden>View on blog ↗</a></div>';

        // auto-slug from title until the user edits slug manually
        var titleEl = f.querySelector('[data-f="title"]'), slugEl = f.querySelector('[data-f="slug"]');
        var slugDirty = !!post.slug;
        slugEl.addEventListener("input", function () { slugDirty = true; });
        titleEl.addEventListener("input", function () { if (!slugDirty) slugEl.value = slugify(titleEl.value); updatePreview(); });
        f.querySelectorAll("[data-f]").forEach(function (el) { el.addEventListener("input", updatePreview); });
        updatePreview();
      }

      function collect() {
        var f = container.querySelector("[data-form]");
        var get = function (k) { var el = f.querySelector('[data-f="' + k + '"]'); return el.type === "checkbox" ? el.checked : el.value; };
        var title = String(get("title")).trim();
        return {
          slug: slugify(get("slug") || title),
          title: title,
          description: String(get("description")).trim(),
          date: get("date") || new Date().toISOString().slice(0, 10),
          status: get("status"),
          lang: get("lang"),
          tags: String(get("tags")).split(",").map(function (t) { return t.trim(); }).filter(Boolean),
          cover: String(get("cover")).trim(),
          featured: get("featured"),
          body: get("body")
        };
      }

      function updatePreview() {
        var p = collect();
        var cover = p.cover || "assets/img/covers/default.svg";
        var tags = (p.tags || []).slice(0, 4).map(function (t) { return '<li><span class="post-row__tag">#' + esc(t) + "</span></li>"; }).join("");
        container.querySelector("[data-preview]").innerHTML =
          '<div class="post-row" style="cursor:default">' +
            '<div class="post-row__media"><img class="post-row__img" src="' + esc(cover) + '" alt=""></div>' +
            '<div class="post-row__body">' +
              '<p class="post-row__meta"><span>' + fmtMonth(p.date) + '</span><span class="post-row__sep">·</span><span>' + readingTime(p.body) + '</span><span class="post-row__sep">·</span><span class="post-row__part">' + esc(p.lang) + '</span>' +
              (p.status !== "published" ? ' <span class="post-row__sep">·</span> <span class="admin-badge admin-badge--draft">' + esc(p.status) + "</span>" : "") + '</p>' +
              '<h2 class="post-row__title">' + esc(p.title || "(untitled)") + '</h2>' +
              '<p class="post-row__desc">' + esc(p.description) + '</p>' +
              '<ul class="post-row__tags">' + tags + '</ul>' +
            '</div></div>' +
          '<div class="caption-post admin__body-preview">' + (p.body || '<p class="term-muted">Body preview appears here…</p>') + '</div>';
      }

      function toast(msg, kind) {
        var n = container.querySelector("[data-notice]");
        n.hidden = false; n.className = "admin__notice admin__notice--" + (kind || "success");
        n.innerHTML = ICONS.get(kind === "error" ? "alert" : "check", 16) + "<span>" + msg + "</span>";
      }

      function save() {
        var p = collect();
        if (!p.title) { toast("Add a title first.", "error"); return; }
        if (!p.slug) { toast("Add a slug (or title) first.", "error"); return; }
        var locals = window.MB.localPosts();
        var i = -1; locals.forEach(function (x, idx) { if (x.slug === p.slug) i = idx; });
        if (i >= 0) locals[i] = p; else locals.push(p);
        window.MB.saveLocalPosts(locals);
        renderList();
        var v = container.querySelector("[data-view]");
        v.hidden = false; v.href = "/blog/post.html?slug=" + encodeURIComponent(p.slug);
        toast("Saved “" + esc(p.title) + "” locally. " + (window.MB.isLive(p) ? "It's live on your blog now." : "It's a hidden draft.") + " Export to publish for everyone.");
      }

      function del(slug) {
        var locals = window.MB.localPosts().filter(function (x) { return x.slug !== slug; });
        window.MB.saveLocalPosts(locals);
        renderList();
        toast("Deleted local draft.");
      }

      function exportFile() {
        var map = {};
        (window.POSTS || []).forEach(function (p) { map[p.slug] = p; });
        window.MB.localPosts().forEach(function (p) { map[p.slug] = p; });
        var merged = Object.keys(map).map(function (k) { return map[k]; }).sort(window.MB.byDateDesc);
        var body = "/* content/posts.js — generated by the blog admin panel on " + new Date().toISOString().slice(0, 10) + ".\n" +
          "   Replace content/posts.js with this file to publish these posts for everyone.\n" +
          "   See posts.js header comments for the field reference. */\n" +
          "window.POSTS = " + JSON.stringify(merged, null, 2) + ";\n";
        var blob = new Blob([body], { type: "application/javascript" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = "posts.js";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        toast("Exported posts.js (" + merged.length + " posts). Replace content/posts.js with it to publish.");
      }

      function wire() {
        container.addEventListener("click", function (e) {
          var ed = e.target.closest("[data-edit]"); if (ed) { var s = ed.getAttribute("data-edit"); var p = window.MB.allPosts().filter(function (x) { return x.slug === s; })[0]; if (p) { loadForm(JSON.parse(JSON.stringify(p))); window.scrollTo({ top: 0, behavior: "smooth" }); } return; }
          var dl = e.target.closest("[data-del]"); if (dl) { del(dl.getAttribute("data-del")); return; }
          if (e.target.closest("[data-new]")) { loadForm(blank()); var v = container.querySelector("[data-view]"); if (v) v.hidden = true; return; }
          if (e.target.closest("[data-save]")) { save(); return; }
          if (e.target.closest("[data-reset]")) { loadForm(blank()); return; }
          if (e.target.closest("[data-export]")) { exportFile(); return; }
          if (e.target.closest("[data-clear]")) { if (window.MB.localPosts().length) { window.MB.saveLocalPosts([]); renderList(); loadForm(blank()); toast("Cleared all local drafts."); } return; }
        });
      }
    }
  };
})();
