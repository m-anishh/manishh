/* =====================================================================
   content/posts.js  —  Blog content + publishing flow
   ---------------------------------------------------------------------
   HOW TO PUBLISH A POST
   ---------------------------------------------------------------------
   Each entry below is one post. To add a post, copy an existing object,
   change the fields, and save this file — no build step required.

   Fields:
     slug        unique url id            -> opens at  post.html?slug=<slug>
     title       headline
     description one-line summary (listing + search)
     date        "YYYY-MM-DD" publish date
     status      "published" | "draft"
       - "draft"       : never shown on the listing/search (work in progress)
       - "published"   : shown once its date is today or earlier
       - a published post with a FUTURE date stays hidden until that date
         (scheduled publishing).
     lang        "EN" | "ID"   (shown as a marker in the meta line)
     tags        array of topic strings (drive the tag filter)
     cover       image url
     featured    true on the newest post -> rendered as the large hero row
     body        HTML string. Use <h2 id="...">/<h3 id="..."> for the
                 auto-generated table of contents, and
                 <pre data-lang="bash"><code> ... </code></pre> for code
                 blocks (rendered with a copy button). Reading time is
                 computed automatically from this content.

   All content below is fictional demo content authored by Manish Bista.
   ===================================================================== */
window.POSTS = [
  {
    slug: "thanos-long-term-metrics-multi-cluster-eks",
    title: "Prometheus + Thanos: Long-Term Metrics Across Multi-Cluster EKS",
    description: "Extending Prometheus retention across several EKS clusters with Thanos — the architecture, the trade-offs, and what it actually costs to keep a year of metrics.",
    date: "2026-09-18",
    status: "published",
    lang: "EN",
    tags: ["Observability", "Kubernetes", "AWS", "Prometheus"],
    cover: "/assets/img/covers/post-thanos.svg",
    featured: true,
    body: `
<p>Prometheus is excellent at <em>recent</em> data and deliberately bad at history: local TSDB retention is measured in weeks, and it has no idea that your other five clusters exist. Once you run more than one cluster, two questions show up on the same day — "where do I query all of them at once?" and "why did we page at 3am last quarter?" Thanos answers both.</p>

<h2 id="the-shape-of-the-problem">The shape of the problem</h2>
<p>We ran five EKS clusters across two regions. Each had its own Prometheus, its own Grafana, and its own definition of "up". Dashboards were copy-pasted and drifted. Nobody could answer a question that spanned clusters without opening five tabs.</p>
<blockquote><p>A metric you cannot query across the fleet is a metric you will argue about during an incident.</p></blockquote>

<h2 id="how-thanos-fits">How Thanos fits</h2>
<p>Thanos bolts onto Prometheus rather than replacing it. The pieces that matter:</p>
<ul>
  <li><strong>Sidecar</strong> — sits next to each Prometheus, uploads TSDB blocks to object storage, and exposes recent data over gRPC.</li>
  <li><strong>Store Gateway</strong> — makes historical blocks in S3 queryable.</li>
  <li><strong>Querier</strong> — fans a single PromQL query out to every sidecar and store, then deduplicates.</li>
  <li><strong>Compactor</strong> — downsamples old blocks so a year of data stays cheap to scan.</li>
</ul>

<h3 id="the-sidecar">Wiring the sidecar</h3>
<p>The sidecar needs the Prometheus data directory and a bucket config. On EKS, give it an IRSA role rather than static keys:</p>
<pre data-lang="yaml"><code>- name: thanos-sidecar
  image: quay.io/thanos/thanos:v0.36.1
  args:
    - sidecar
    - --tsdb.path=/prometheus
    - --prometheus.url=http://localhost:9090
    - --objstore.config-file=/etc/thanos/bucket.yaml
  volumeMounts:
    - { name: prometheus-data, mountPath: /prometheus }
    - { name: thanos-bucket,   mountPath: /etc/thanos }</code></pre>

<h3 id="the-querier">A single query plane</h3>
<p>The Querier is where the multi-cluster magic happens. Point it at every sidecar and store, enable deduplication on your replica label, and Grafana finally has one data source for the whole fleet:</p>
<pre data-lang="bash"><code>thanos query \
  --query.replica-label=replica \
  --store=dnssrv+_grpc._tcp.thanos-sidecar.monitoring.svc \
  --store=thanos-store.monitoring.svc:10901</code></pre>

<h2 id="what-it-costs">What it actually costs</h2>
<p>The honest answer: object storage is cheap, the Store Gateway's memory is not. Downsampling with the Compactor (5m and 1h resolutions) is what keeps long-range dashboards responsive without a giant store cache.</p>
<table>
  <thead><tr><th>Retention tier</th><th>Resolution</th><th>Backed by</th></tr></thead>
  <tbody>
    <tr><td>0–14 days</td><td>raw</td><td>Prometheus local + sidecar</td></tr>
    <tr><td>14–90 days</td><td>5m</td><td>S3 + Store Gateway</td></tr>
    <tr><td>90 days–1 year</td><td>1h</td><td>S3 (downsampled)</td></tr>
  </tbody>
</table>

<h2 id="takeaways">Takeaways</h2>
<p>Thanos is not free complexity — you are now running four more components and an object store. But the moment you have more than one cluster, the alternative is worse: siloed history and incident retros built on screenshots. Start with the sidecar and querier, add the store and compactor once you actually need the history.</p>
`
  },

  {
    slug: "loki-vs-elk-log-aggregation",
    title: "Grafana Loki vs. the ELK Stack: A Cost and Query Deep Dive",
    description: "A practical comparison of Loki and Elasticsearch for logs — storage cost, query flexibility, and the cardinality mistakes that quietly wreck both.",
    date: "2026-09-02",
    status: "published",
    lang: "EN",
    tags: ["Observability", "Logging", "DevOps"],
    cover: "/assets/img/covers/post-loki.svg",
    featured: false,
    body: `
<p>"Just ship the logs to Elasticsearch" is advice that ages badly around the time your storage bill does. Loki takes the opposite bet: index as little as possible. Here is how that choice plays out in practice.</p>

<h2 id="the-core-difference">The core difference</h2>
<p>ELK indexes the full text of every log line. Loki indexes only a small set of labels and stores the raw lines compressed in object storage. That single decision drives every trade-off below.</p>

<h2 id="cost">Cost</h2>
<p>Loki's index is tiny, so most of your spend is cheap object storage. Elasticsearch keeps a large inverted index on hot nodes, which is fast but expensive to scale. For high-volume, low-query workloads — think debug logs you read only during incidents — Loki usually wins decisively.</p>

<h2 id="query-power">Query power</h2>
<p>This is where ELK earns its keep. Full-text search and aggregations are first-class. In Loki you filter by label first, then grep the stream with LogQL:</p>
<pre data-lang="logql"><code>{app="checkout", env="prod"} |= "payment failed" | json | status_code >= 500</code></pre>
<p>Fast when your labels narrow the search; slow if you force Loki to scan everything because your labels are useless.</p>

<h2 id="the-cardinality-trap">The cardinality trap</h2>
<p>Both systems punish high-cardinality labels, but Loki punishes you immediately. Never put a request ID, user ID or timestamp in a label — it explodes the number of streams.</p>
<blockquote><p>Rule of thumb: labels are for things you <em>filter</em> by, not things you <em>search</em> for.</p></blockquote>

<h2 id="which-one">Which one?</h2>
<ul>
  <li><strong>Pick Loki</strong> for cost-sensitive, Kubernetes-native logging where you mostly filter by service and tail streams.</li>
  <li><strong>Pick ELK</strong> when ad-hoc full-text search and rich aggregations are the point — security analytics, audit trails, product search over logs.</li>
</ul>
`
  },

  {
    slug: "github-actions-docker-cache",
    title: "GitHub Actions Docker Cache: gha vs. registry vs. inline",
    description: "Three ways to cache Docker layers in GitHub Actions, when each one is faster, and the gotcha that makes your cache silently do nothing.",
    date: "2026-04-21",
    status: "published",
    lang: "EN",
    tags: ["CI/CD", "Docker", "DevOps"],
    cover: "/assets/img/covers/post-gha-docker.svg",
    featured: false,
    body: `
<p>A cold Docker build in CI is a tax you pay on every push. Buildx gives you three cache backends, and the right one depends on where your images live and how your branches behave.</p>

<h2 id="the-three-options">The three options</h2>
<h3 id="gha-cache">type=gha</h3>
<p>Uses the GitHub Actions cache. Zero infrastructure, scoped per repo, and limited to 10 GB before eviction kicks in. Best default for most projects:</p>
<pre data-lang="yaml"><code>- uses: docker/build-push-action@v6
  with:
    push: true
    tags: ghcr.io/manishbista/app:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max</code></pre>

<h3 id="registry-cache">type=registry</h3>
<p>Stores the cache as a separate image tag in your registry. Shared across repos and runners, no 10 GB ceiling, but it's another artifact to manage and pull.</p>

<h3 id="inline-cache">type=inline</h3>
<p>Embeds cache metadata into the image itself. Simplest to reason about, but only works with <code>mode=min</code>, so intermediate build stages are not cached.</p>

<h2 id="the-gotcha">The gotcha</h2>
<p><code>mode=max</code> caches every layer including intermediate stages; <code>mode=min</code> caches only the final image. If your multi-stage build keeps "missing" the cache, you almost certainly want <code>mode=max</code>.</p>

<h2 id="verdict">Verdict</h2>
<p>Start with <code>type=gha, mode=max</code>. Move to <code>type=registry</code> only when you need cache shared across many repositories or you keep hitting the Actions cache ceiling.</p>
`
  },

  {
    slug: "zero-downtime-cloud-migration-notes",
    title: "Notes From a Zero-Downtime Cloud Migration",
    description: "Field notes from moving a live payments platform between clouds without a maintenance window — DNS, dual-writes, and the cutover checklist.",
    date: "2026-03-10",
    status: "published",
    lang: "EN",
    tags: ["AWS", "Migration"],
    cover: "/assets/img/covers/post-migration.svg",
    featured: false,
    body: `
<p>"Zero downtime" is less a technique and more a budget: you spend engineering effort to buy the absence of a maintenance window. Here is where we spent it.</p>

<h2 id="strangle-dont-switch">Strangle, don't switch</h2>
<p>Big-bang cutovers fail in the most expensive way possible. We routed traffic gradually behind a weighted DNS record and a shared load balancer, moving one service at a time and watching error budgets at each step.</p>

<h2 id="data-is-the-hard-part">Data is the hard part</h2>
<p>Stateless services move easily; databases do not. We ran a dual-write window where the application wrote to both clouds, backfilled history with replication, then flipped reads once lag was consistently near zero.</p>
<blockquote><p>You can roll back code in seconds. You cannot roll back a half-migrated database — so make the data migration reversible or don't start it.</p></blockquote>

<h2 id="the-cutover-checklist">The cutover checklist</h2>
<ul>
  <li>Lower DNS TTLs <em>days</em> ahead, not hours.</li>
  <li>Dashboards side-by-side for both environments, same scale.</li>
  <li>A written, rehearsed rollback — tested on staging the week before.</li>
  <li>One decision-maker on the call. Migrations die by committee.</li>
</ul>

<h2 id="what-id-do-differently">What I'd do differently</h2>
<p>Start the observability work first. We migrated services faster than we could compare them, and for a few tense hours "is it slower now?" was a matter of opinion rather than a graph.</p>
`
  },

  {
    slug: "terraform-module-structure-that-scales",
    title: "A Terraform Module Structure That Survives Growth",
    description: "How to lay out Terraform so a two-person project still makes sense at twenty — composition over copy-paste, and where to draw the state boundaries.",
    date: "2025-11-14",
    status: "published",
    lang: "EN",
    tags: ["Terraform", "IaC", "Cloud"],
    cover: "/assets/img/covers/post-terraform.svg",
    featured: false,
    body: `
<p>Most Terraform messes start the same way: one giant root module, one enormous state file, and a plan that takes four minutes and touches everything. The fix is boundaries.</p>

<h2 id="three-layers">Three layers</h2>
<ul>
  <li><strong>Resources</strong> — thin wrappers around provider resources with sane defaults.</li>
  <li><strong>Modules</strong> — composable units like "a VPC" or "an EKS cluster" built from resources.</li>
  <li><strong>Stacks</strong> — per-environment roots that wire modules together and hold state.</li>
</ul>

<h2 id="state-boundaries">Where to split state</h2>
<p>Split state along the blast radius you can tolerate. Networking, data and application layers should not share a state file — a typo in an app variable should never be able to propose destroying a subnet.</p>
<pre data-lang="hcl"><code>module "network" {
  source = "../../modules/network"
  cidr   = "10.20.0.0/16"
  azs    = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
}</code></pre>

<h2 id="the-rule">The one rule</h2>
<blockquote><p>If two things are deployed on different schedules or by different people, they belong in different states.</p></blockquote>
<p>Everything else — naming, tagging, remote backends — is detail you can refactor later. The state boundaries are the decision you can't easily undo.</p>
`
  },

  {
    slug: "slo-error-budgets-in-practice",
    title: "SLOs and Error Budgets, Minus the Theory",
    description: "Turning the SRE book's SLO chapter into something a team actually uses on a Tuesday — picking SLIs, setting targets, and spending the budget.",
    date: "2025-06-27",
    status: "published",
    lang: "EN",
    tags: ["Reliability", "Observability"],
    cover: "/assets/img/covers/post-slo.svg",
    featured: false,
    body: `
<p>SLOs fail in teams for a boring reason: they get written once, pasted into a wiki, and never looked at again. A useful SLO is one that changes a decision.</p>

<h2 id="pick-one-sli">Pick one SLI that users feel</h2>
<p>Start with a single service-level indicator your users would actually notice — successful request ratio or latency at the 95th percentile. Resist the urge to track twenty.</p>

<h2 id="set-an-honest-target">Set an honest target</h2>
<p>99.9% is four nines of aspiration and three nines of reality. Base the target on current performance plus a small stretch, not on a number that looks impressive in a deck.</p>

<h2 id="spend-the-budget">Spend the budget</h2>
<p>The error budget is the point. If you have budget left, ship faster and take more risk. If you've burned it, freeze features and fix reliability. Make that rule explicit and automatic:</p>
<blockquote><p>An error budget nobody is allowed to spend is just a stricter uptime target with extra steps.</p></blockquote>
`
  },

  {
    slug: "kubernetes-resource-requests-that-make-sense",
    title: "Setting Kubernetes Requests and Limits That Make Sense",
    description: "Why your pods are either getting OOM-killed or quietly wasting half the cluster, and a simple method to right-size requests and limits.",
    date: "2025-05-18",
    status: "published",
    lang: "EN",
    tags: ["Kubernetes", "Cost"],
    cover: "/assets/img/covers/post-k8s.svg",
    featured: false,
    body: `
<p>Requests and limits are the two most misunderstood numbers in a Kubernetes manifest. Get them wrong and you either throttle healthy apps or pay for a cluster that's 40% air.</p>

<h2 id="requests-vs-limits">Requests vs. limits</h2>
<p><strong>Requests</strong> are what the scheduler reserves and bills you for. <strong>Limits</strong> are the ceiling before throttling (CPU) or an OOM kill (memory). They are not the same knob and should rarely be equal.</p>

<h2 id="a-method">A method that works</h2>
<ul>
  <li>Set memory request = memory limit. Memory is incompressible; bursting into it just gets you killed later.</li>
  <li>Set CPU request to the steady-state usage, and either a generous CPU limit or none at all.</li>
  <li>Measure with the Vertical Pod Autoscaler in recommendation mode before you guess.</li>
</ul>

<pre data-lang="yaml"><code>resources:
  requests: { cpu: "250m", memory: "512Mi" }
  limits:   {            memory: "512Mi" }</code></pre>

<h2 id="the-payoff">The payoff</h2>
<p>Right-sized requests are the single biggest lever on cluster cost, because they decide how tightly the scheduler can pack nodes. This is boring work with an unreasonably good ROI.</p>
`
  },

  {
    slug: "reading-a-postmortem-well",
    title: "How to Read a Post-Mortem Well",
    description: "Blameless post-mortems are only as good as the reading. A short guide to extracting the real lessons instead of the comfortable ones.",
    date: "2025-02-22",
    status: "published",
    lang: "EN",
    tags: ["Culture"],
    cover: "/assets/img/covers/post-postmortem.svg",
    featured: false,
    body: `
<p>Most teams have learned to <em>write</em> blameless post-mortems. Fewer have learned to read them in a way that changes anything.</p>

<h2 id="look-for-the-surprise">Look for the surprise</h2>
<p>The most valuable line in any post-mortem is the moment someone was surprised — a metric they trusted that lied, an alert that never fired. That gap between the mental model and reality is the actual lesson.</p>

<h2 id="count-the-action-items">Count the action items honestly</h2>
<p>Ten action items is not thoroughness; it's a to-do list that will rot. Two or three that genuinely remove a class of failure beat a wall of tickets nobody owns.</p>

<blockquote><p>A good post-mortem makes one future incident impossible, not ten future incidents slightly less likely.</p></blockquote>
`
  },

  {
    slug: "service-mesh-without-the-hype",
    title: "Do You Actually Need a Service Mesh?",
    description: "Draft — weighing mTLS, traffic shaping and observability against the operational cost of running a mesh you might not need yet.",
    date: "2026-11-30",
    status: "draft",
    lang: "EN",
    tags: ["Kubernetes", "Networking"],
    cover: "/assets/img/covers/post-mesh.svg",
    featured: false,
    body: `
<p>This post is still a draft — it is intentionally hidden from the listing and search to demonstrate the publishing flow. Flip <code>status</code> to <code>"published"</code> in <code>content/posts.js</code> and it will appear automatically.</p>
<h2 id="outline">Outline</h2>
<ul><li>What a mesh actually gives you</li><li>The sidecar tax</li><li>When ingress + libraries are enough</li></ul>
`
  }
];
