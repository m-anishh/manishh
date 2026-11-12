/* Terminal page — an interactive, in-browser command line. */
(function () {
  var SITE = window.SITE;
  var MB = function () { return window.MB; };  // read at call time (layout.js defines it after this file loads)
  var p = SITE.profile;
  var host = p.firstName.toLowerCase() + "@portfolio:~$";
  var esc = function (s) { return String(s).replace(/[&<>]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]; }); };

  var history = [], histIdx = -1;

  // name -> [description, fn]
  var COMMANDS = {
    about:   ["Show my background", function () { return [p.firstName + " " + p.lastName + " — " + p.role, "", wrap(SITE.about.lead, 72)]; }],
    blog:    ["List recent blog posts", function () {
      var out = ["<span class='term-success'>Latest posts</span>"];
      MB().livePosts().slice(0, 5).forEach(function (po) { out.push("  " + po.date + "  <a class='term-link' href='/blog/post.html?slug=" + encodeURIComponent(po.slug) + "'>" + esc(po.title) + "</a>"); });
      out.push("", "more on the <a class='term-link' href='/blog/blog.html'>blog</a>");
      return out;
    }],
    cat:     ["Open a post or project", function (arg) {
      var t = (arg || "").trim().toLowerCase();
      if (!t) {
        var slugs = MB().livePosts().slice(0, 5).map(function (x) { return x.slug; });
        return ["usage: <span class='term-accent'>cat</span> &lt;post-slug&gt;", "e.g. " + slugs.map(function (s) { return "<span class='term-muted'>" + s + "</span>"; }).join(", ")];
      }
      var po = MB().livePosts().filter(function (x) { return x.slug === t || x.slug.indexOf(t) !== -1 || x.title.toLowerCase().indexOf(t) !== -1; })[0];
      if (po) { go("/blog/post.html?slug=" + encodeURIComponent(po.slug)); return ["<span class='term-success'>" + esc(po.title) + "</span>", wrap(po.description, 72), "", "opening…"]; }
      var pr = SITE.projects.filter(function (x) { return x.title.toLowerCase().indexOf(t) !== -1; })[0];
      if (pr) { return ["<span class='term-success'>" + esc(pr.title) + "</span>", wrap(pr.desc, 72)]; }
      return ["<span class='term-error'>cat: " + esc(t) + ": no such file</span>"];
    }],
    cd:      ["Enter a section (about, blog, projects, contact, infra, design)", function (arg) {
      var t = (arg || "").trim().toLowerCase().replace(/\/+$/, "");
      var pages = { about: "/index.html", home: "/index.html", portfolio: "/portfolio.html", projects: "/portfolio.html", work: "/portfolio.html",
        blog: "/blog/blog.html", posts: "/blog/blog.html", contact: "/contact.html", terminal: "/terminal.html",
        infra: "/infrastructure/infrastructure.html", infrastructure: "/infrastructure/infrastructure.html", design: "/system-design/design-system.html", "design-system": "/system-design/design-system.html" };
      if (!t || t === "~" || t === "..") { go("/index.html"); return ["entering <span class='term-accent'>about</span>…"]; }
      if (pages[t]) { go(pages[t]); return ["entering <span class='term-accent'>" + esc(t) + "</span>…"]; }
      return ["<span class='term-error'>cd: no such section: " + esc(t) + "</span> — try <span class='term-accent'>ls</span>"];
    }],
    clear:   ["Clear the screen", function () { return "__CLEAR__"; }],
    contact: ["Show contact details", function () {
      return [
        "  " + pad("email", 10) + " <a class='term-link' href='mailto:" + p.email + "'>" + p.email + "</a>",
        p.phone ? "  " + pad("phone", 10) + " <a class='term-link' href='tel:" + p.phone.replace(/\s+/g, "") + "'>" + esc(p.phone) + "</a>" : "",
        "  " + pad("location", 10) + " " + esc(p.location),
        "", "or the <a class='term-link' href='/contact.html'>contact page</a>"
      ].filter(Boolean);
    }],
    date:    ["Show date and time", function () { return [new Date().toString()]; }],
    exit:    ["Leave the terminal", function () { go("/index.html"); return ["logout", "<span class='term-muted'>Connection to portfolio closed.</span>"]; }],
    help:    ["Show available commands", function () {
      var out = ["<span class='term-success'>Available commands</span>", ""];
      Object.keys(COMMANDS).sort().forEach(function (k) { out.push("  <span class='term-accent'>" + pad(k, 10) + "</span> <span class='term-muted'>" + COMMANDS[k][0] + "</span>"); });
      return out;
    }],
    ls:      ["List directory contents", function () { return ["about   blog   projects   skills   contact"]; }],
    projects:["List portfolio projects", function () {
      var out = ["<span class='term-success'>Selected work</span> <span class='term-muted'>(</span><a class='term-link' href='/portfolio.html'>portfolio</a><span class='term-muted'>)</span>"];
      SITE.projects.filter(function (x) { return x.category === "Projects"; }).forEach(function (pr) {
        out.push("  • <span class='term-accent'>" + esc(pr.title) + "</span>");
        out.push("    <span class='term-muted'>" + esc(pr.desc) + "</span>");
      });
      return out;
    }],
    pwd:     ["Print working directory", function () { return ["/home/" + p.firstName.toLowerCase()]; }],
    skills:  ["Show skills and stack", function () {
      var out = ["<span class='term-success'>Areas of work</span>"];
      SITE.scope.forEach(function (s) { out.push("  " + s.index + "  <span class='term-accent'>" + esc(s.title) + "</span>  <span class='term-muted'>" + esc(s.type) + "</span>"); });
      return out;
    }],
    sudo:    ["Pretend to be root", function () { return ["<span class='term-error'>nice try.</span> this terminal runs read-only. :)"]; }],
    whoami:  ["Display current user", function () { return [p.firstName.toLowerCase() + " — " + p.role + " · " + p.location]; }]
  };

  function go(url) { setTimeout(function () { window.location.href = url; }, 400); }
  function pad(s, n) { s = String(s); while (s.length < n) s += " "; return s; }
  function wrap(text, n) {
    var words = String(text).split(" "), lines = [], cur = "";
    words.forEach(function (w) { if ((cur + " " + w).trim().length > n) { lines.push(cur.trim()); cur = w; } else cur += " " + w; });
    if (cur.trim()) lines.push(cur.trim());
    return lines.map(esc).join("\n");
  }

  window.__PAGE__ = {
    id: "terminal",
    build: function () {
      return '<div class="pb-2 reveal"><h1 class="title title--h1 title__separate">Terminal<span class="title--tone">.</span></h1>' +
        '<p class="terminal-intro">Explore this portfolio from the command line.</p></div>' +
        '<div class="terminal reveal reveal-delay-1">' +
          '<div class="terminal__bar">' +
            '<div class="terminal__bar-left"><span class="terminal__dots"><span class="terminal__dot terminal__dot--r"></span><span class="terminal__dot terminal__dot--y"></span><span class="terminal__dot terminal__dot--g"></span></span>' +
            '<span class="terminal__path">~</span></div>' +
            '<div class="terminal__hints"><span class="terminal__chip">Tab complete</span><span class="terminal__chip">↑↓ history</span><span class="terminal__chip">Ctrl+L clear</span></div>' +
          '</div>' +
          '<div class="terminal__body" data-term-body>' +
            '<div class="term-line"><span class="term-cmd" style="font-weight:600">' + p.firstName + ' ' + p.lastName + '</span></div>' +
            '<div class="term-line term-accent">' + p.role + '</div>' +
            '<div class="term-line">&nbsp;</div>' +
            '<div class="term-line term-muted">Type <span class="term-accent">help</span> to get started.</div>' +
            '<div class="term-line">&nbsp;</div>' +
          '</div>' +
          '<div class="terminal__foot">Tab completes, ↑↓ walks history, Ctrl+L clears.</div>' +
          '<div class="term-inputline" data-term-inputline><span class="term-prompt">' + host + '</span>' +
            '<input class="term-input" data-term-input autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Terminal input"></div>' +
        '</div>';
    },
    mount: function (root) {
      var body = root.querySelector("[data-term-body]");
      var input = root.querySelector("[data-term-input]");
      function scroll() { body.scrollTop = body.scrollHeight; }
      function print(html, cls) { var d = document.createElement("div"); d.className = "term-line" + (cls ? " " + cls : ""); d.innerHTML = html; body.appendChild(d); }
      function run(raw) {
        var cmd = raw.trim();
        print('<span class="term-prompt">' + host + '</span> <span class="term-cmd">' + esc(cmd) + '</span>');
        if (!cmd) { scroll(); return; }
        history.push(cmd); histIdx = history.length;
        var parts = cmd.split(/\s+/), name = parts[0].toLowerCase(), arg = cmd.slice(parts[0].length).trim();
        var entry = COMMANDS[name];
        if (!entry) { print("<span class='term-error'>command not found: " + esc(name) + "</span> — try <span class='term-accent'>help</span>"); scroll(); return; }
        var res = entry[1](arg);
        if (res === "__CLEAR__") { body.innerHTML = ""; scroll(); return; }
        res.forEach(function (line) { print(line === "" ? "&nbsp;" : line); });
        print("&nbsp;");
        scroll();
      }
      function complete() {
        var val = input.value;
        if (/\s/.test(val)) return;
        var frag = val.toLowerCase();
        if (!frag) return;
        var matches = Object.keys(COMMANDS).filter(function (k) { return k.indexOf(frag) === 0; });
        if (matches.length === 1) { input.value = matches[0] + " "; }
        else if (matches.length > 1) {
          var common = matches.reduce(function (a, b) { var i = 0; while (i < a.length && a[i] === b[i]) i++; return a.slice(0, i); });
          input.value = common;
          print('<span class="term-prompt">' + host + '</span> <span class="term-cmd">' + esc(val) + '</span>');
          print('<span class="term-muted">' + matches.join("   ") + '</span>'); print("&nbsp;"); scroll();
        }
      }
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { var v = input.value; input.value = ""; run(v); }
        else if (e.key === "Tab") { e.preventDefault(); complete(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); if (histIdx > 0) { histIdx--; input.value = history[histIdx] || ""; } }
        else if (e.key === "ArrowDown") { e.preventDefault(); if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx] || ""; } else { histIdx = history.length; input.value = ""; } }
        else if ((e.ctrlKey || e.metaKey) && (e.key === "l" || e.key === "L")) { e.preventDefault(); body.innerHTML = ""; }
      });
      body.addEventListener("click", function (e) { if (!e.target.closest("a")) input.focus(); });
      root.querySelector("[data-term-inputline]").addEventListener("click", function () { input.focus(); });
      setTimeout(function () { input.focus(); }, 60);
    }
  };
})();
