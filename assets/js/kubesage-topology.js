/* =====================================================================
   kubesage-topology.js  —  interactive, touch-friendly, copy/downloadable
   topology diagram (framework-free). Exposes window.mountTopology(el, opts).
   theme: 'auto' (follows <html data-theme="dark"> or class="dark"), 'light', 'dark'.
   ===================================================================== */
(function () {
  "use strict";

  var W = 1060, H = 640, VY = 104, VH = 524, NW = 190, NH = 64;
  var MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  var SANS = "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

  var THEMES = {
    light: {
      bg: '#ffffff', grid: '#eef0f4', group: '#f3f4f8', groupStroke: '#e3e6ee',
      node: '#ffffff', nodeStroke: '#d6dae4', text: '#14161c', sub: '#5d6475', label: '#6b7285',
      build: '#e2703a', core: '#2f5bea', ai: '#7c4dff', svc: '#8a93a6', edge: '#8a93a6',
      agentFill: '#e9eefc', cardBg: '#ffffff', cardStroke: '#d6dae4'
    },
    dark: {
      bg: '#121418', grid: '#1b1e24', group: '#181b21', groupStroke: '#262a33',
      node: '#16191f', nodeStroke: '#323846', text: '#eceef2', sub: '#9097a6', label: '#8a91a1',
      build: '#f08a4b', core: '#5b84ff', ai: '#a58bff', svc: '#8a93a6', edge: '#7c8496',
      agentFill: '#1a2238', cardBg: '#1a1d23', cardStroke: '#323846'
    }
  };

  var GROUPS = [
    { id: 'build', label: 'BUILD PIPELINE', x: 12, y: 140, w: 242, h: 394 },
    { id: 'aks', label: 'AKS CLUSTER · KUBESAGE-RG', x: 300, y: 120, w: 470, h: 424 },
    { id: 'svc', label: 'MANAGED SERVICES', x: 810, y: 120, w: 230, h: 424 }
  ];

  // kind: build | core | ai | svc  (sets the colour bar)
  var NODES = [
    { id: 'repo', x: 40, y: 180, kind: 'build', cat: 'SOURCE', name: 'kubesage repo', sub: 'app code + Terraform',
      desc: 'Monorepo with the demo services, the agent and all Terraform. Every change starts as a push to main.' },
    { id: 'actions', x: 40, y: 270, kind: 'build', cat: 'CI', name: 'GitHub Actions', sub: 'test · Trivy · OIDC',
      desc: 'Lints, tests and builds images, blocks on HIGH/CRITICAL Trivy findings, and logs in to Azure with OIDC — no stored cloud secrets.' },
    { id: 'acr', x: 40, y: 360, kind: 'build', cat: 'REGISTRY', name: 'Azure ACR', sub: 'private images · Basic',
      desc: 'Private container registry. AKS pulls with its managed identity (AcrPull), so there are no image pull secrets.' },
    { id: 'gitops', x: 40, y: 450, kind: 'build', cat: 'GITOPS', name: 'kubesage-gitops', sub: 'Helm values · tags',
      desc: 'Desired state of the cluster. CI only bumps image tags here; ArgoCD reads it. Rollbacks are git reverts.' },
    { id: 'argocd', x: 320, y: 180, kind: 'core', cat: 'CD', name: 'ArgoCD', sub: 'app-of-apps · self-heal',
      desc: 'Watches kubesage-gitops and keeps the cluster equal to Git. Manual kubectl changes are reverted (self-heal).' },
    { id: 'demo', x: 560, y: 180, kind: 'core', cat: 'WORKLOAD', name: 'Demo apps', sub: 'orders · payments',
      desc: 'Two FastAPI services with fault switches (crash, OOM, latency, 5xx) so the agent always has a real incident.' },
    { id: 'prom', x: 320, y: 320, kind: 'core', cat: 'MONITORING', name: 'Prometheus', sub: '+ Alertmanager rules',
      desc: 'Scrapes /metrics, evaluates alert rules and sends firing alerts to the agent as a JSON webhook.' },
    { id: 'agent', x: 560, y: 320, kind: 'ai', cat: 'AI AGENT', name: 'KubeSage Agent', sub: 'FastAPI · tool calling', main: true,
      desc: 'Investigates each alert with read-only tools (pod status, logs, events, recent deploys), searches runbooks, and returns a root cause with evidence. Capped at 6 tool steps.' },
    { id: 'grafana', x: 320, y: 460, kind: 'core', cat: 'DASHBOARDS', name: 'Grafana', sub: 'latency · errors · tokens',
      desc: 'Request rate, P95 latency and error rate per service, plus agent investigations and LLM token usage.' },
    { id: 'qdrant', x: 560, y: 460, kind: 'ai', cat: 'VECTOR DB', name: 'Qdrant', sub: 'runbook embeddings',
      desc: 'Runbooks split by heading and embedded. The agent retrieves the top 3 chunks and must cite the one it used (RAG).' },
    { id: 'openai', x: 830, y: 180, kind: 'ai', cat: 'LLM', name: 'Azure OpenAI', sub: 'chat + embeddings',
      desc: 'A small chat model for reasoning and tool calling, and text-embedding-3-small for the runbook index. Pay per token.' },
    { id: 'kv', x: 830, y: 320, kind: 'svc', cat: 'SECRETS', name: 'Azure Key Vault', sub: 'CSI driver mount',
      desc: 'Holds the OpenAI key and GitHub token, mounted into the agent pod by the Secrets Store CSI driver. Nothing in Git.' },
    { id: 'issues', x: 830, y: 460, kind: 'svc', cat: 'OUTPUT', name: 'GitHub Issues', sub: 'root cause · /approve',
      desc: 'Each investigation becomes an issue: root cause, evidence, runbook and fix. Commenting /approve-rollback triggers a git revert — a human stays in the loop.' }
  ];

  // style: build (dashed orange) | flow (solid accent) | watch (dotted) | plain (solid grey)
  var EDGES = [
    { id: 'e1', from: 'repo', to: 'actions', style: 'build', d: 'M135 244V270', label: 'git push', lx: 143, ly: 261, a: 'start' },
    { id: 'e2', from: 'actions', to: 'acr', style: 'build', d: 'M135 334V360', label: 'image', lx: 143, ly: 351, a: 'start' },
    { id: 'e3', from: 'actions', to: 'gitops', style: 'build', d: 'M40 302H26V482H40', label: 'bump tag', lx: 20, ly: 392, a: 'middle', rot: true },
    { id: 'e4', from: 'acr', to: 'demo', style: 'plain', d: 'M230 392H260V150H655V180', label: 'pull image', lx: 600, ly: 144, a: 'middle' },
    { id: 'e5', from: 'gitops', to: 'argocd', style: 'flow', d: 'M230 482H290V212H320', label: 'watch', lx: 298, ly: 262, a: 'start' },
    { id: 'e6', from: 'argocd', to: 'demo', style: 'flow', d: 'M510 212H560', label: 'sync', lx: 535, ly: 204, a: 'middle' },
    { id: 'e7', from: 'demo', to: 'prom', style: 'watch', d: 'M600 244V286H415V320', label: 'metrics', lx: 508, ly: 280, a: 'middle' },
    { id: 'e8', from: 'agent', to: 'demo', style: 'watch', d: 'M700 320V244', label: 'logs · events', lx: 692, ly: 286, a: 'end' },
    { id: 'e9', from: 'prom', to: 'agent', style: 'flow', d: 'M510 352H560', label: 'alerts', lx: 535, ly: 344, a: 'middle' },
    { id: 'e10', from: 'prom', to: 'grafana', style: 'plain', d: 'M415 384V460', label: 'query', lx: 423, ly: 426, a: 'start' },
    { id: 'e11', from: 'agent', to: 'qdrant', style: 'flow', d: 'M655 384V460', label: 'RAG search', lx: 663, ly: 426, a: 'start' },
    { id: 'e12', from: 'agent', to: 'openai', style: 'flow', d: 'M750 340H780V212H830', label: 'LLM calls', lx: 788, ly: 276, a: 'start' },
    { id: 'e13', from: 'kv', to: 'agent', style: 'plain', d: 'M830 362H750', label: 'secrets', lx: 790, ly: 356, a: 'middle' },
    { id: 'e14', from: 'agent', to: 'issues', style: 'flow', d: 'M750 384H800V492H830', label: 'opens issue', lx: 808, ly: 430, a: 'start' },
    { id: 'e15', from: 'issues', to: 'gitops', style: 'build', d: 'M925 524V610H135V514', label: '/approve-rollback → git revert', lx: 530, ly: 602, a: 'middle' }
  ];

  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };

  function edgeColor(t, style) { if (style === 'build') return t.build; if (style === 'flow') return t.core; return t.edge; }
  function edgeDash(style) { if (style === 'build') return '6 4'; if (style === 'watch') return '2 4'; return ''; }
  function kindColor(t, kind) { return { build: t.build, core: t.core, ai: t.ai, svc: t.svc }[kind]; }

  function renderSVG(t, title) {
    var markers = ['build', 'flow', 'watch', 'plain'].map(function (s) {
      return '<marker id="kst-' + s + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="' + edgeColor(t, s) + '"/></marker>';
    }).join('');

    var grid = '';
    for (var x = 0; x <= W; x += 24) grid += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + H + '"/>';
    for (var y = 0; y <= H; y += 24) grid += '<line x1="0" y1="' + y + '" x2="' + W + '" y2="' + y + '"/>';

    var groups = GROUPS.map(function (g) {
      return '<g data-group="' + g.id + '"><rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="10" fill="' + t.group + '" stroke="' + t.groupStroke + '"/>' +
        '<text x="' + (g.x + 16) + '" y="' + (g.y + 20) + '" font-family="' + esc(MONO) + '" font-size="9.5" font-weight="600" letter-spacing="1.2" fill="' + t.label + '">' + esc(g.label) + '</text></g>';
    }).join('');

    var edges = EDGES.map(function (e) {
      var c = edgeColor(t, e.style);
      var dash = edgeDash(e.style);
      var label = e.rot
        ? '<text transform="translate(' + e.lx + ' ' + e.ly + ') rotate(-90)" text-anchor="middle" font-family="' + esc(MONO) + '" font-size="9.5" fill="' + t.sub + '">' + esc(e.label) + '</text>'
        : '<text x="' + e.lx + '" y="' + e.ly + '" text-anchor="' + e.a + '" font-family="' + esc(MONO) + '" font-size="9.5" fill="' + t.sub + '">' + esc(e.label) + '</text>';
      return '<g class="kst-edge" data-edge="' + e.id + '" data-from="' + e.from + '" data-to="' + e.to + '">' +
        '<path class="kst-line" d="' + e.d + '" fill="none" stroke="' + c + '" stroke-width="1.4"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' marker-end="url(#kst-' + e.style + ')"/>' +
        label + '</g>';
    }).join('');

    var nodes = NODES.map(function (n) {
      var bar = kindColor(t, n.kind);
      var fill = n.main ? t.agentFill : t.node;
      var stroke = n.main ? t.core : t.nodeStroke;
      return '<g class="kst-node" data-node="' + n.id + '" tabindex="0" role="button" aria-label="' + esc(n.name) + ': ' + esc(n.sub) + '" style="cursor:pointer;outline:none">' +
        '<rect class="kst-box" x="' + n.x + '" y="' + n.y + '" width="' + NW + '" height="' + NH + '" rx="8" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + (n.main ? 1.8 : 1.2) + '"/>' +
        '<rect x="' + (n.x + 10) + '" y="' + (n.y + 12) + '" width="3" height="' + (NH - 24) + '" rx="1.5" fill="' + bar + '"/>' +
        '<text x="' + (n.x + 22) + '" y="' + (n.y + 21) + '" font-family="' + esc(MONO) + '" font-size="9" font-weight="600" letter-spacing="1" fill="' + t.label + '">' + esc(n.cat) + '</text>' +
        '<text x="' + (n.x + 22) + '" y="' + (n.y + 39) + '" font-family="' + esc(SANS) + '" font-size="13.5" font-weight="650" fill="' + t.text + '">' + esc(n.name) + '</text>' +
        '<text x="' + (n.x + 22) + '" y="' + (n.y + 54) + '" font-family="' + esc(MONO) + '" font-size="9.5" fill="' + t.sub + '">' + esc(n.sub) + '</text></g>';
    }).join('');

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ' + VY + ' ' + W + ' ' + VH + '" width="' + W + '" height="' + VH + '" role="img" aria-label="' + esc(title) + '">' +
      '<title>' + esc(title) + '</title><defs>' + markers + '</defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="' + t.bg + '"/>' +
      '<g stroke="' + t.grid + '" stroke-width="1">' + grid + '</g>' +
      groups + '<g class="kst-edges">' + edges + '</g><g class="kst-nodes">' + nodes + '</g></svg>';
  }

  var CSS = '' +
    '.kst{position:relative;font-family:' + SANS + ';-webkit-tap-highlight-color:transparent}' +
    '.kst-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-bottom:10px}' +
    '.kst-hint{font-family:' + MONO + ';font-size:12px;opacity:.75;margin:0}' +
    '.kst-actions{display:flex;gap:6px}' +
    '.kst-btn{font-family:' + MONO + ';font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:7px 11px;border-radius:7px;border:1px solid var(--kst-stroke);background:var(--kst-card);color:var(--kst-text);cursor:pointer;min-height:34px}' +
    '.kst-btn:hover{border-color:var(--kst-accent);color:var(--kst-accent)}' +
    '.kst-btn:focus-visible{outline:2px solid var(--kst-accent);outline-offset:2px}' +
    '.kst-scroll{overflow-x:auto;border:1px solid var(--kst-stroke);border-radius:12px;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y}' +
    '.kst-scroll svg{display:block;width:100%;min-width:860px;height:auto}' +
    '.kst-node .kst-box{transition:stroke .15s,stroke-width .15s}' +
    '.kst-node:hover .kst-box,.kst-node:focus-visible .kst-box{stroke:var(--kst-accent);stroke-width:1.8}' +
    '.kst-node,.kst-edge{transition:opacity .2s}' +
    '.kst.has-sel .kst-node:not(.on){opacity:.28}' +
    '.kst.has-sel .kst-edge:not(.on){opacity:.12}' +
    '.kst-node.sel .kst-box{stroke:var(--kst-accent);stroke-width:2.2}' +
    '.kst-edge.on .kst-line{stroke-width:2.2;stroke-dasharray:6 4;animation:kst-flow .9s linear infinite}' +
    '@keyframes kst-flow{to{stroke-dashoffset:-20}}' +
    '@media (prefers-reduced-motion:reduce){.kst-edge.on .kst-line{animation:none}}' +
    '.kst-card{position:absolute;z-index:5;width:300px;max-width:calc(100% - 24px);box-sizing:border-box;padding:14px 16px;border-radius:10px;background:var(--kst-card);border:1px solid var(--kst-stroke);color:var(--kst-text);box-shadow:0 10px 30px rgba(0,0,0,.18);font-size:13px;line-height:1.55}' +
    '.kst-card[hidden]{display:none}' +
    '.kst-card h4{margin:0 0 6px;font-size:14px;font-weight:650}' +
    '.kst-card .kst-cat{font-family:' + MONO + ';font-size:10px;letter-spacing:.1em;opacity:.7;margin-bottom:2px}' +
    '.kst-card p{margin:0;font-family:' + MONO + ';font-size:12px;opacity:.9}' +
    '.kst-card .kst-links{margin-top:8px;font-family:' + MONO + ';font-size:11px;opacity:.7}' +
    '.kst-card .kst-x{position:absolute;top:8px;right:8px;width:28px;height:28px;border:0;background:transparent;color:inherit;font-size:16px;cursor:pointer;border-radius:6px}' +
    '.kst-card.sheet{left:12px!important;right:12px;bottom:12px;top:auto!important;width:auto;max-width:none}';

  function mountTopology(el, options) {
    options = options || {};
    var opts = { theme: 'auto', title: 'KubeSage — AI incident copilot on Azure', filename: 'kubesage-topology' };
    for (var k in options) opts[k] = options[k];

    if (!document.getElementById('kst-style')) {
      var st = document.createElement('style'); st.id = 'kst-style'; st.textContent = CSS; document.head.appendChild(st);
    }

    el.classList.add('kst');
    el.innerHTML =
      '<div class="kst-bar"><p class="kst-hint">Tap a node to trace its connections. Tap it again to dismiss.</p></div>' +
      '<div class="kst-scroll"></div>' +
      '<div class="kst-card" role="dialog" aria-live="polite" hidden><button type="button" class="kst-x" aria-label="Close">×</button><div class="kst-cat"></div><h4></h4><p></p><div class="kst-links"></div></div>';

    var scroll = el.querySelector('.kst-scroll');
    var card = el.querySelector('.kst-card');
    var selected = null;
    var current = 'light';

    function resolveTheme() {
      if (opts.theme === 'light' || opts.theme === 'dark') return opts.theme;
      var h = document.documentElement;
      if (h.classList.contains('dark') || h.getAttribute('data-theme') === 'dark') return 'dark';
      return 'light';
    }
    function applyVars(t) {
      el.style.setProperty('--kst-card', t.cardBg);
      el.style.setProperty('--kst-stroke', t.cardStroke);
      el.style.setProperty('--kst-text', t.text);
      el.style.setProperty('--kst-accent', t.core);
      el.style.color = t.text;
    }
    function render() {
      current = resolveTheme();
      var t = THEMES[current];
      applyVars(t);
      scroll.innerHTML = renderSVG(t, opts.title);
      if (selected) select(selected, true);
    }
    function svg() { return scroll.querySelector('svg'); }

    function neighbours(id) {
      var set = {}; set[id] = true; var edges = [];
      EDGES.forEach(function (e) { if (e.from === id || e.to === id) { edges.push(e.id); set[e.from] = true; set[e.to] = true; } });
      return { set: set, edges: edges };
    }
    function clear() {
      selected = null; el.classList.remove('has-sel');
      el.querySelectorAll('.kst-node,.kst-edge').forEach(function (n) { n.classList.remove('on', 'sel'); });
      card.hidden = true;
    }
    function placeCard(n) {
      var s = svg(); if (!s) return;
      var scale = s.getBoundingClientRect().width / W;
      var elRect = el.getBoundingClientRect();
      var scRect = scroll.getBoundingClientRect();
      var offX = scRect.left - elRect.left - scroll.scrollLeft;
      var offY = scRect.top - elRect.top;
      if (el.clientWidth < 640) { card.classList.add('sheet'); return; }
      card.classList.remove('sheet');
      var cw = card.offsetWidth, ch = card.offsetHeight;
      var x = offX + n.x * scale;
      var y = offY + (n.y - VY + NH) * scale + 10;
      if (y + ch > offY + scRect.height) y = offY + (n.y - VY) * scale - ch - 10;
      x = Math.max(8, Math.min(x, el.clientWidth - cw - 8));
      card.style.left = x + 'px';
      card.style.top = Math.max(offY + 8, y) + 'px';
    }
    function select(id, keep) {
      if (!keep && selected === id) { clear(); return; }
      selected = id;
      var nb = neighbours(id);
      el.classList.add('has-sel');
      el.querySelectorAll('.kst-node').forEach(function (g) {
        g.classList.toggle('on', !!nb.set[g.dataset.node]);
        g.classList.toggle('sel', g.dataset.node === id);
      });
      el.querySelectorAll('.kst-edge').forEach(function (g) { g.classList.toggle('on', nb.edges.indexOf(g.dataset.edge) !== -1); });
      var n = NODES.filter(function (x) { return x.id === id; })[0];
      var names = Object.keys(nb.set).filter(function (x) { return x !== id; }).map(function (x) { return NODES.filter(function (y) { return y.id === x; })[0].name; });
      card.querySelector('.kst-cat').textContent = n.cat;
      card.querySelector('h4').textContent = n.name;
      card.querySelector('p').textContent = n.desc;
      card.querySelector('.kst-links').textContent = 'Connected: ' + names.join(', ');
      card.hidden = false;
      placeCard(n);
    }

    function flash(act, text) {
      var btn = el.querySelector('[data-act="' + act + '"]'); if (!btn) return;
      var old = btn.textContent; btn.textContent = text;
      setTimeout(function () { btn.textContent = old; }, 1500);
    }
    function exportString() { return renderSVG(THEMES[current], opts.title); }
    function save(blob, name) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }
    function toPng(cb) {
      var str = exportString();
      var img = new Image();
      var url = URL.createObjectURL(new Blob([str], { type: 'image/svg+xml' }));
      img.onload = function () {
        var k = 2, c = document.createElement('canvas');
        c.width = W * k; c.height = VH * k;
        var ctx = c.getContext('2d'); ctx.scale(k, k); ctx.drawImage(img, 0, 0, W, VH);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { cb(b); }, 'image/png');
      };
      img.onerror = function () { URL.revokeObjectURL(url); cb(null); };
      img.src = url;
    }
    function download(kind) {
      if (kind === 'svg') { save(new Blob([exportString()], { type: 'image/svg+xml' }), opts.filename + '.svg'); flash('svg', 'Saved'); return; }
      if (kind === 'png') { toPng(function (b) { if (b) { save(b, opts.filename + '.png'); flash('png', 'Saved'); } }); return; }
      if (kind === 'copy') { copyDiagram(); }
    }
    function copyDiagram() {
      // Prefer copying a PNG image to the clipboard; fall back to SVG markup text.
      if (navigator.clipboard && window.ClipboardItem) {
        toPng(function (b) {
          if (b) {
            navigator.clipboard.write([new window.ClipboardItem({ 'image/png': b })])
              .then(function () { flash('copy', 'Copied'); }, function () { copyText(); });
          } else copyText();
        });
      } else copyText();
    }
    function copyText() {
      var str = exportString();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(str).then(function () { flash('copy', 'SVG copied'); }, function () { flash('copy', 'Copy failed'); });
      } else { flash('copy', 'Copy failed'); }
    }

    function onClick(ev) {
      var btn = ev.target.closest('[data-act]');
      if (btn) { download(btn.dataset.act); return; }
      if (ev.target.closest('.kst-x')) { clear(); return; }
      if (ev.target.closest('.kst-card')) return;
      var node = ev.target.closest('.kst-node');
      if (node) select(node.dataset.node);
      else if (ev.target.closest('.kst-scroll')) clear();
    }
    function onKey(ev) {
      if (ev.key === 'Escape') { clear(); return; }
      var node = ev.target.closest && ev.target.closest('.kst-node');
      if (node && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); select(node.dataset.node); }
    }
    function onResize() { if (selected) placeCard(NODES.filter(function (x) { return x.id === selected; })[0]); }

    el.addEventListener('click', onClick);
    el.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    scroll.addEventListener('scroll', onResize, { passive: true });
    var mo = new MutationObserver(function () { if (resolveTheme() !== current) render(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    render();

    return {
      select: function (id) { select(id, true); },
      clear: clear,
      download: download,
      setTheme: function (th) { opts.theme = th; render(); },
      destroy: function () {
        el.removeEventListener('click', onClick);
        el.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', onResize);
        mo.disconnect();
        el.innerHTML = '';
        el.classList.remove('kst', 'has-sel');
      }
    };
  }

  window.mountTopology = mountTopology;
  window.KubeSageTopology = { NODES: NODES, EDGES: EDGES, GROUPS: GROUPS, mountTopology: mountTopology };
})();
