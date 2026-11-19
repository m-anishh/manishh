# Manish Bista — Portfolio & Blog

A framework-free personal portfolio + blog, containerized with Nginx and deployed
to **AWS EKS** through a **GitHub Actions** pipeline, fronted by **Cloudflare**
for DNS and HTTPS. Plain HTML, CSS and JavaScript — no build step, no dependencies.

**Live:** https://manishbista11.com.np

> **Pipeline in one line:**
> `git push` → GitHub Actions builds a Docker image → pushes to **ECR** →
> deploys to **EKS** → **ALB** serves it → **Cloudflare** adds DNS + HTTPS → visitor.

---

## Table of contents

- [Part A — The application](#part-a--the-application)
  - [Quick start](#quick-start)
  - [Project structure](#project-structure)
  - [Editing content](#editing-content)
  - [Blog: writing & publishing](#blog-writing--publishing)
  - [What's implemented](#whats-implemented)
- [Part B — Deployment & infrastructure](#part-b--deployment--infrastructure)
  - [The container image](#1-the-container-image)
  - [AWS infrastructure](#2-aws-infrastructure-terraform)
  - [Kubernetes manifest](#3-kubernetes-manifest)
  - [GitHub Actions pipeline](#4-github-actions-pipeline)
  - [DNS & HTTPS — Cloudflare](#5-dns--https--cloudflare)
  - [First-time setup](#6-first-time-setup)
  - [Day-2 operations](#7-day-2-operations)
  - [Request flow](#8-request-flow-end-to-end)
  - [Why this architecture](#9-why-this-architecture)

---
---

# Part A — The application

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

The repo splits cleanly into **the application** (what users see) and
**`deploy/`** (how it ships). Everything outside `deploy/` is plain static web
content; everything inside `deploy/` is infrastructure and automation.

```text
.
├── frontend/                 # Static HTML pages (the site entrypoints)
│   ├── index.html            #   About / Home — served at /
│   ├── portfolio.html        #   Projects + certifications
│   ├── contact.html          #   Contact form (client-side validation)
│   ├── terminal.html         #   Interactive in-browser terminal
│   ├── admin.html            #   Blog admin panel (write/publish posts)
│   ├── blog/                 #   Blog listing and post template
│   ├── infrastructure/       #   Interactive topology diagram
│   └── system-design/        #   Live token + component reference
│
├── assets/                   # CSS, JS, images, CV — served under /assets
│   ├── css/styles.css        #   the whole design system (tokens, layout, components)
│   ├── js/
│   │   ├── icons.js          #   shared SVG stroke-icon set
│   │   ├── layout.js         #   app shell: header, nav, search, theme, footer
│   │   ├── kubesage-topology.js  # interactive topology component
│   │   └── pages/            #   one module per page (home, blog, portfolio, …)
│   ├── cv/                   #   CV PDF
│   └── img/                  #   images
│
├── content/                  # Site data
│   ├── site.js               #   profile, nav, stats, projects, admin passcode
│   └── posts.js              #   blog posts + publishing flow
│
├── deploy/                   # ← ALL deployment lives here (see Part B)
│   ├── docker/
│   │   ├── Dockerfile        #   builds the Nginx image
│   │   └── nginx.conf        #   static serving + /healthz endpoint
│   ├── k8s/
│   │   └── portfolio.yaml    #   Deployment + Service + Ingress
│   ├── automations/
│   │   └── deploy.sh         #   kubectl apply + rollout wait
│   └── terraform/            #   all AWS infrastructure as code
│       ├── main.tf           #   VPC, EKS, node group, ECR
│       ├── iam.tf            #   GitHub OIDC provider + deploy role
│       ├── alb-controller.tf #   Load Balancer Controller (IRSA + Helm)
│       └── variables.tf  outputs.tf  versions.tf  terraform.tfvars
│
├── .github/workflows/
│   └── deploy.yml            # CI/CD pipeline (build → push → deploy)
│
├── reference/                # standalone source references
├── robots.txt  sitemap.xml
└── README.md                 # this file
```

Each HTML page loads the shared CSS/JS plus its own `pages/*.js` module; `layout.js`
builds the chrome (header, navigation, footer, search) and mounts the page content.

---

## Editing content

- **Who you are / nav / projects / admin passcode:** `content/site.js`
- **Blog posts:** `content/posts.js`
- **Profile photo:** `profile.avatar` in `content/site.js`
- **CV / resume:** drop a PDF in `assets/cv/` and set `profile.cv` paths
- **Images:** drop files in `assets/img/` and reference them from the content files
- **Colours / type / spacing:** CSS variables at the top of `assets/css/styles.css`

Everything data-bearing ships as placeholder/demo content so you can swap in real
data without touching code.

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
   `admin.passcode`; a light client-side gate, not real security).
2. Write a post in the form — live preview updates as you type.
3. **Save draft (local)** stores it in your browser (`localStorage`).
4. **Export posts.js** downloads a complete `content/posts.js`. **Replace
   `content/posts.js` with it and redeploy to publish for everyone.**

So: *write → preview live → export → replace the file → published.*

---

## What's implemented

- Sidebar rail → tablet bar → mobile bottom dock + drawer (fully responsive)
- Light/dark theme (persisted, no flash, follows OS by default)
- Ctrl/⌘ + K search over pages and posts (keyboard navigable)
- Blog: tag + year filters, search, load-more, featured hero, reading progress,
  table of contents, share buttons, admin panel
- Portfolio: category-filtered project grid
- Contact: validated form with a demo success state (nothing is sent)
- Terminal: interactive shell (`help`, `cd`, `cat`, `blog`, `projects`, …)
- Infrastructure: interactive, copy/export-able topology diagram
- Design System: live swatches, type scale, spacing, components

---
---

# Part B — Deployment & infrastructure

How the site goes from source in Git to a live HTTPS website. Region: **eu-north-1**.

## 1. The container image

A single Nginx container serves the static site. `deploy/docker/Dockerfile`:

```dockerfile
FROM nginx:1.27-alpine
COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend  /usr/share/nginx/html
COPY assets    /usr/share/nginx/html/assets
COPY content   /usr/share/nginx/html/content
EXPOSE 80
```

`nginx.conf` serves the files and adds one special route — `GET /healthz` returns
`200 "ok"` — plus cache and security headers. The container listens on **port 80
only** (this decides the Cloudflare SSL mode later).

**Why `/healthz`:** Kubernetes and the ALB need a cheap URL to check "is this pod
alive?" without loading the full page.

## 2. AWS infrastructure (Terraform)

All in `deploy/terraform/`, created with `terraform apply`. Tagged
`Project=portfolio, ManagedBy=terraform`.

### Networking — VPC (`main.tf`)

| Resource | Value | Why |
|---|---|---|
| VPC CIDR | `10.20.0.0/16` | Private network for the whole stack |
| Public subnets | 3 (one per AZ) | Hold the internet-facing ALB |
| Private subnets | 3 (one per AZ) | Hold the worker nodes (not directly reachable) |
| NAT gateway | 1 (single) | Private nodes pull images / reach internet outbound |

Private nodes + public ALB is the standard secure pattern: nodes have no public
IP, so all inbound traffic must pass through the ALB. A single NAT gateway keeps
cost down for a small site.

### Compute — EKS (`main.tf`)

| Resource | Value | Why |
|---|---|---|
| EKS cluster | `portfolio`, Kubernetes **1.33** | Managed control plane |
| Endpoint | Public access | CI and your laptop can reach the API |
| Node group | **2× t3.small** (min 2, max 3), AL2023 | Runs the pods; 2 nodes for HA |
| Add-ons | vpc-cni, coredns, kube-proxy, eks-pod-identity-agent | Core networking & DNS |

### Image registry — ECR (`main.tf`)

Private Docker registry (`portfolio`): **immutable tags** (a `sha-<commit>` tag
maps to exactly one commit), **scan on push**, and a **lifecycle policy** (keep
latest 20 `sha-` images, delete untagged).

### Deploy identity — GitHub OIDC (`iam.tf`)

How GitHub Actions authenticates to AWS **with no stored keys**:

- OIDC provider trusts tokens from `token.actions.githubusercontent.com`.
- `portfolio-github-actions` role is assumable only if audience =
  `sts.amazonaws.com` **and** the token subject matches this repo on `main`.
- Permissions: push to the `portfolio` ECR repo + `eks:DescribeCluster`.

> **Note:** GitHub issues the subject with numeric IDs
> (`repo:m-anishh@<id>/manishh@<id>:ref:refs/heads/main`), so the trust policy
> accepts **both** the plain and ID-suffixed forms. Matching only the plain form
> rejects the real token — this was a real bug we fixed.

### Cluster access — EKS access entries (`main.tf`)

Map AWS identities to Kubernetes permissions:

| Principal | K8s access | Why |
|---|---|---|
| `test-role` | cluster-admin | So you can run `kubectl` |
| `portfolio-github-actions` | cluster-admin | So CI can `kubectl apply` |

> **Gotcha:** the principal must be the **role ARN**, not an assumed-role session
> ARN. Terraform resolves it with `data "aws_iam_session_context"`.

### Ingress brain — AWS Load Balancer Controller (`alb-controller.tf`)

A controller inside the cluster that watches `Ingress` objects and creates real
AWS **ALBs** to match. Installed via **Helm**, permissioned via **IRSA** (a
dedicated IAM role the controller's pod assumes through the cluster's OIDC
provider). You describe the load balancer as an Ingress annotation; it builds the
ALB, target group, listener, and security group — no manual AWS clicking.

## 3. Kubernetes manifest

`deploy/k8s/portfolio.yaml` defines three objects:

| Object | Role |
|---|---|
| **Deployment** | Runs **2 replicas** of the Nginx image; probes hit `/healthz`. `${IMAGE}` is substituted with the exact ECR image at deploy time. |
| **Service** (ClusterIP) | Stable internal address load-balancing across the pods. |
| **Ingress** (class `alb`) | Tells the controller to build an **internet-facing** ALB, target type **ip**, listening **HTTP:80**, health-checking `/healthz`, routing requests where **Host = `${DOMAIN}`** to the Service. |

**Host-based routing matters:** the Ingress only forwards traffic when the
request's `Host` header equals your domain. Hitting the raw ALB URL returns 404 —
that's expected. `${IMAGE}` and `${DOMAIN}` are filled by `envsubst` at deploy time.

## 4. GitHub Actions pipeline

`.github/workflows/deploy.yml` — triggers on every push to `main`:

```
┌─────────┐  OIDC   ┌──────────┐  build  ┌──────┐  kubectl  ┌──────┐
│git push │───────▶ │ AWS auth │───────▶ │ ECR  │─────────▶ │ EKS  │
│ to main │(no keys)│ (role)   │ & push  │image │  apply    │ pods │
└─────────┘         └──────────┘         └──────┘           └──────┘
```

1. **Check out source**
2. **Configure AWS credentials** — assumes the role via OIDC (`id-token: write`;
   role ARN from the `AWS_DEPLOY_ROLE_ARN` secret)
3. **Log in to Amazon ECR**
4. **Build and push image** — `docker build`, tagged `sha-<commit>`, pushed to ECR
5. **Install kubectl**
6. **Deploy to EKS** — runs `deploy/automations/deploy.sh`:
   ```bash
   aws eks update-kubeconfig --region "$AWS_REGION" --name "$EKS_CLUSTER_NAME"
   envsubst < deploy/k8s/portfolio.yaml | kubectl apply -f -
   kubectl rollout status deployment/portfolio --timeout=180s
   ```

**GitHub config:** Variables `AWS_REGION`, `ECR_REPOSITORY`, `EKS_CLUSTER_NAME`,
`DOMAIN`, `CERTIFICATE_ARN`; Secret `AWS_DEPLOY_ROLE_ARN` =
`arn:aws:iam::135438495833:role/portfolio-github-actions`.

## 5. DNS & HTTPS — Cloudflare

The domain is delegated to Cloudflare nameservers (set at the `.com.np`
registrar). **One DNS record** (Cloudflare → DNS → Records):

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `@` | `<ALB-hostname>.eu-north-1.elb.amazonaws.com` | 🟠 Proxied |

**SSL/TLS mode:** set to **Flexible** (Cloudflare → SSL/TLS → Overview).

**Why Flexible:** the ALB listens on **HTTP:80 only**. Any "Full" mode makes
Cloudflare dial the origin on 443, which times out. Flexible = HTTPS from visitor
to Cloudflare, HTTP from Cloudflare to the ALB; the visitor still sees a padlock
via Cloudflare's managed edge certificate.

```
Visitor ──HTTPS──▶ Cloudflare ──HTTP:80──▶ AWS ALB ──▶ EKS pods (Nginx)
         (padlock)  (Flexible)              (host-routed)
```

> **Future end-to-end TLS:** validate the ACM certificate (`CERTIFICATE_ARN` is
> already wired in), add an HTTPS:443 listener to the Ingress, then switch
> Cloudflare to **Full (strict)**.

## 6. First-time setup

**Prerequisites:** AWS admin creds (`test-role`), Terraform, Docker, kubectl, a
GitHub repo, a Cloudflare-managed domain.

```bash
# 1. Provision AWS infrastructure
cd deploy/terraform
export AWS_PROFILE=test-role          # bash  (PowerShell: $env:AWS_PROFILE="test-role")
terraform init
terraform plan -out=tfplan            # review
terraform apply tfplan                # VPC, EKS, ECR, IAM, ALB controller

# 2. Read the outputs
terraform output                      # ecr_repository_url, github_actions_role_arn, …

# 3. Configure GitHub
#    Secret  AWS_DEPLOY_ROLE_ARN = github_actions_role_arn
#    Variables: AWS_REGION, ECR_REPOSITORY, EKS_CLUSTER_NAME, DOMAIN

# 4. Deploy the app
git push origin main                  # triggers the pipeline

# 5. Point DNS
kubectl get ingress portfolio         # copy the ADDRESS (ALB hostname)
#    Cloudflare: CNAME @ → that ALB hostname, Proxied
#    Cloudflare: SSL/TLS mode → Flexible
```

> **Always set `AWS_PROFILE=test-role` first.** Without it, Terraform runs as the
> minimal `manish1` gateway user and fails with `AccessDenied` on reads (it
> changes nothing, it just can't plan).

## 7. Day-2 operations

```bash
export AWS_PROFILE=test-role
aws eks update-kubeconfig --region eu-north-1 --name portfolio

# Health
kubectl get pods -l app.kubernetes.io/name=portfolio -o wide
kubectl get ingress portfolio
kubectl logs -l app.kubernetes.io/name=portfolio --tail=50

# Deploy a change
git push origin main                  # pipeline does the rest

# Roll back
kubectl rollout undo deployment/portfolio

# Verify serving (host header required — ALB routes by host)
curl -H "Host: manishbista11.com.np" http://<ALB-hostname>/
```

## 8. Request flow (end to end)

```
  Browser
    │  https://manishbista11.com.np
    ▼
  Cloudflare edge  ── TLS terminates here, caches static assets
    │  http://<ALB-hostname>   (Flexible SSL, Host header preserved)
    ▼
  AWS ALB (public subnets)  ── routes on Host = manishbista11.com.np, HC /healthz
    │  → target group (pod IPs, type: ip)
    ▼
  EKS Service (ClusterIP)  ── load-balances across replicas
    │
    ▼
  Nginx pods ×2 (private subnets)  ── serve frontend/ + assets/ + content/
```

## 9. Why this architecture

- **Static site, container-delivered** — no build step; Nginx just serves files,
  so the image is tiny and fast.
- **EKS over plain EC2** — managed control plane, rolling deploys, self-healing
  pods, trivial rollback.
- **OIDC over access keys** — zero long-lived AWS credentials in GitHub.
- **Terraform for everything** — the environment is reproducible and reviewable.
- **Cloudflare in front** — free managed HTTPS, global CDN caching, DDoS
  protection, via a single DNS record.

The trade-off: EKS carries a baseline cost (control plane + 2 nodes + NAT + ALB).
For a personal site that's deliberate — it doubles as a production-grade reference
environment. A cheaper alternative (S3 + CloudFront) would serve the same files
for pennies but wouldn't demonstrate the Kubernetes platform this project showcases.

---

## Notes

- Social links and the contact form are demo placeholders; add real endpoints
  when deploying.
- `admin.html` is marked `noindex` and is a client-side convenience, not a
  secured backend.
