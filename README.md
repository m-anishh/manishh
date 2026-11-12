# Manish Bista — Portfolio & Blog

A framework-free personal portfolio + blog with a sidebar-rail layout, light/dark
themes, a Ctrl+K search, an interactive terminal, an infrastructure topology, and
a file-driven blog with a browser-based admin panel. Plain HTML, CSS and
JavaScript — no build step, no dependencies.

---

## Quick start

From this folder, start any static server and open the URL it prints.

```bash
python -m http.server 8000
```
Open **http://localhost:8000/**

(Node alternative: `npx serve .`). The deployed site entrypoint is `frontend/index.html`.

### Preview on a phone (same Wi-Fi)
```bash
python -m http.server 8000 --bind 0.0.0.0
```
Find your PC's IPv4 (`ipconfig`) and open `http://<your-ip>:8000/` on the phone.

---

## Project structure

```text
.
├── frontend/
│   ├── index.html          # About / Home
│   ├── portfolio.html      # Projects + certifications
│   ├── contact.html        # Contact form (client-side validation)
│   ├── terminal.html       # Interactive in-browser terminal
│   ├── admin.html          # Blog admin panel (write/publish posts)
│   ├── blog/               # Blog listing and post template
│   ├── infrastructure/     # Interactive topology diagram
│   └── system-design/      # Live token + component reference
├── deploy/
│   ├── docker/             # Container image and Nginx configuration
│   ├── k8s/                # Kubernetes manifests
│   └── automations/        # Deployment scripts
│
├── assets/
│   ├── css/
│   │   └── styles.css       # The whole design system (tokens, layout, components)
│   ├── js/
│   │   ├── icons.js         # Shared SVG stroke-icon set
│   │   ├── layout.js        # App shell: header, nav, search, theme, footer
│   │   ├── kubesage-topology.js  # Interactive topology component
│   │   └── pages/           # One module per page (sets window.__PAGE__)
│   │       ├── home.js  blog.js  post.js  portfolio.js  contact.js
│   │       ├── terminal.js  infrastructure.js  design.js  admin.js
│   ├── cv/
│   │   └── manish-bista-cv.pdf   # placeholder CV (replace with your real one)
│   └── img/                 # put your own images here (empty by default)
│
├── content/
│   ├── site.js              # Profile, nav, stats, work areas, projects, admin passcode
│   └── posts.js             # Blog posts + publishing flow
│
├── reference/
│   └── kubesage-topology.html   # original standalone topology (source reference)
├── robots.txt
└── sitemap.xml
```

Each HTML page loads the shared CSS/JS plus its own `pages/*.js` module; `layout.js`
builds the chrome (header, navigation, footer, search) and mounts the page content.

## Deployment

The Docker image is built from `deploy/docker/Dockerfile`. It serves the
`frontend/`, `assets/`, and `content/` directories through Nginx.

The EKS resources are in `deploy/k8s/portfolio.yaml`, and the deployment helper
is `deploy/automations/deploy.sh`. GitHub Actions uses
`.github/workflows/deploy.yml` to build the image, push it to ECR, and update EKS.

---

## Editing content

- **Who you are / nav / projects / admin passcode:** `content/site.js`
- **Blog posts:** `content/posts.js`
- **Profile photo:** `profile.avatar` in `content/site.js` (currently a default silhouette)
- **CV / resume:** drop a PDF in `assets/cv/` and set `profile.cv` paths
- **Images:** drop files in `assets/img/` and reference them from the content files
- **Colours / type / spacing:** CSS variables at the top of `assets/css/styles.css`

Everything data-bearing ships as placeholder/demo content (picsum.photos images,
a placeholder CV) so you can swap in real data without touching code.

---

## Blog: writing & publishing

Posts live in **`content/posts.js`**. Each post has a `status` (`draft` |
`published`) and a `date`:

- `draft` → never shown on the listing/search.
- `published` with a past/today date → visible.
- `published` with a future date → hidden until that date (scheduled).

Bodies use `<h2 id="…">`/`<h3 id="…">` (auto table of contents) and
`<pre data-lang="bash"><code>…</code></pre>` (code block with Copy). Reading time
is computed automatically.

### Admin panel — `admin.html`
A browser-based editor for the file-driven blog (no server/database):

1. Open **`/admin.html`** and enter the passcode (`content/site.js` →
   `admin.passcode`, default `manish123`; a light client-side gate, not real security).
2. Write a post in the form — live preview updates as you type.
3. **Save draft (local)** stores it in your browser (`localStorage`) and it appears
   on your blog immediately (for preview — only in this browser).
4. **Export posts.js** downloads a complete `content/posts.js` (your drafts merged
   over the existing posts). **Replace `content/posts.js` with it to publish for
   everyone**, then redeploy.

So: *write → preview live → export → replace the file → published.*

---

## What's implemented

- Sidebar rail → tablet bar → mobile bottom dock + drawer (fully responsive, touch-friendly)
- Light/dark theme (persisted, no flash, follows OS by default)
- Ctrl/⌘ + K search over pages and posts (keyboard navigable)
- Blog: tag + year filters, search, load-more, featured hero row, per-post reading
  progress, table of contents, share buttons, admin panel
- Portfolio: category-filtered project grid
- Contact: validated form with a demo success state (nothing is sent)
- Terminal: interactive shell (`help`, `cd`, `cat`, `blog`, `projects`, …)
- Infrastructure: interactive, copy/export-able topology diagram
- Design System: live swatches, type scale, spacing, components

---

## Notes

- Social links and the contact form are demo placeholders; add real endpoints when deploying.
- `admin.html` is marked `noindex` and is a client-side convenience, not a secured backend.
