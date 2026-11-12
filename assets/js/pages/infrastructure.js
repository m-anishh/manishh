/* Infrastructure page — mounts the KubeSage interactive topology. */
(function () {
  var ICONS = window.ICONS;

  window.__PAGE__ = {
    id: "infra",
    build: function () {
      var today = new Date().toISOString().slice(0, 10);
      return '<div class="pb-2 reveal"><h1 class="title title--h1 title__separate">Infrastructure<span class="title--tone">.</span></h1>' +
        '<p class="terminal-intro"><strong>KubeSage</strong> — an AI incident copilot on Azure (AKS · GitOps · RAG agent). Trace how a push becomes a deploy, an alert becomes an investigation, and an investigation becomes a fix.</p></div>' +
        '<div class="reveal reveal-delay-1">' +
          '<div class="infra-status"><span class="infra-status__dot" aria-hidden="true"></span><span class="infra-status__label">Operational</span>' +
            '<span class="infra-status__sep" aria-hidden="true">·</span><span>Last verified ' + today + '</span></div>' +
          '<h2 class="title title--h2 topo-head">Topology</h2>' +
          '<div data-topo></div>' +
        '</div>';
    },
    mount: function (root) {
      var el = root.querySelector("[data-topo]");
      if (window.mountTopology && el) {
        this._topo = window.mountTopology(el, { theme: "auto", title: "KubeSage — AI incident copilot on Azure", filename: "kubesage-topology" });
      } else if (el) {
        el.innerHTML = '<p class="topo-hint">Topology module failed to load.</p>';
      }
    }
  };
})();
