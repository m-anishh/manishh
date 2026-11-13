/* ---------------------------------------------------------------------
   content/site.js  —  Site-wide demo content (all data is fictional).
   Owner / author: Manish Bista
   Edit this file to change the profile, navigation, stats, work areas,
   clients and portfolio projects.
   --------------------------------------------------------------------- */
window.SITE = {
  profile: {
    firstName: "Manish",
    lastName: "Bista",
    role: "Network · Cloud · DevOps · AI",
    tagline: "Network · Cloud · DevOps · AI",
    location: "Bhaktapur, NP",
    experience: "2 years",
    email: "manishhbsta11@gmail.com",
    phone: "+977 9763216231",
    avatar: null,  // put your photo URL or a local path like "/assets/img/manish.jpg"
    // No CV yet. When ready, drop a PDF in assets/cv/ and set the path(s) here —
    // e.g. cv: { main: "/assets/cv/manish-bista-cv.pdf" } — and the Download CV
    // button reappears automatically. "main" = Download CV, "ats" = ATS button.
    cv: {},
    availability: { status: "Available for projects", meta: "Replies within 24h" }
  },

  copyright: "© 2026 Manish Bista",

  // Blog admin panel (admin.html). The passcode is a light client-side gate only
  // — NOT real security (anyone can read it in the source). Set to "" to disable.
  admin: { passcode: "manish123" },

  /* Navigation — order controls both the desktop rail and the mobile dock.
     'dock' marks the 5 items shown directly on the mobile bottom dock. */
  nav: [
    { id: "about",    label: "About",          icon: "about",     href: "/index.html",          dock: true },
    { id: "portfolio",label: "Portfolio",      icon: "portfolio", href: "/portfolio.html",      dock: true },
    { id: "blog",     label: "Blog",           icon: "blog",      href: "/blog/blog.html",     dock: true },
    { id: "contact",  label: "Contact",        icon: "contact",   href: "/contact.html",        dock: true },
    { id: "terminal", label: "Terminal",       icon: "terminal",  href: "/terminal.html",       dock: false },
    { id: "infra",    label: "Infrastructure", icon: "infra",     href: "/infrastructure/infrastructure.html", dock: false },
    { id: "design",   label: "Design System",  icon: "design",    href: "/system-design/design-system.html",  dock: false }
  ],

  socials: [
    { label: "LinkedIn",  icon: "linkedin",  href: "https://www.linkedin.com/in/manish-bista" },
    { label: "GitHub",    icon: "github",    href: "https://github.com/m-anishh" },
    { label: "X",         icon: "x",         href: "#" },
    { label: "Facebook",  icon: "facebook",  href: "https://www.facebook.com/share/1GbNygcv42/" },
    { label: "Instagram", icon: "instagram", href: "https://www.instagram.com/cr.7_manishh/" }
  ],

  about: {
    facts: [
      { label: "Focus",      value: "Cloud · DevOps · AI" },
      { label: "Location",   value: "Bhaktapur, NP" },
      { label: "Experience", value: "2 years" }
    ],
    lead: "I'm a Network Security, Cloud, and DevOps Engineer with a strong interest in building secure, scalable, and intelligent technology solutions.",
    paragraphs: [
      "My expertise includes network engineering and security, AWS and Azure cloud infrastructure, DevOps practices, infrastructure automation, and modern cloud-native technologies. I focus on designing, implementing, securing, and managing reliable IT infrastructure using industry-standard tools and technologies.",
      "Beyond traditional infrastructure engineering, I'm actively working with Artificial Intelligence and Agentic AI, exploring intelligent agents, AI-powered automation, autonomous workflows, and the integration of AI into modern engineering environments."
    ],
    closing: "I believe the future of technology lies in bringing together network security, cloud infrastructure, DevOps automation, and Agentic AI to build smarter, more secure, and resilient systems.",
    ctaLabel: "See the engineering portfolio",
    ctaHref: "/portfolio.html"
  },

  stats: [
    { value: "2",   label: "Years Experience", href: "/portfolio.html" },
    { value: "14+", label: "Projects Done",     href: "/portfolio.html" },
    { value: "40+", label: "Technologies",      href: "/portfolio.html" },
    { value: "5",   label: "Certifications",    href: "/portfolio.html" }
  ],

  scope: [
    { index: "01", title: "Network Engineering", type: "Network", icon: "globe",
      desc: "Designing and operating reliable networks — VPC and multi-account design, routing and segmentation, VPN and Direct Connect, DNS, load balancing, and secure connectivity across cloud and on-prem." },
    { index: "02", title: "Cloud Engineering", type: "Cloud", icon: "cloud",
      desc: "Secure, cost-efficient environments on AWS and GCP — Landing Zone setup, IAM governance, multi-account networking, and right-sizing with Graviton and savings plans." },
    { index: "03", title: "DevOps", type: "Delivery", icon: "terminal",
      desc: "CI/CD pipelines with security built in, GitOps delivery, infrastructure as code, and observability — automation that removes toil instead of adding dashboards nobody reads." },
    { index: "04", title: "Agentic AI", type: "Autonomous", icon: "cpu",
      desc: "Building with intelligent agents and Agentic AI — tool-using agents, autonomous workflows, AI-powered automation, and integrating AI into modern engineering environments." }
  ],

  experience: [
    {
      role: "System & Network Engineer",
      company: "Green Cube Technologies Pvt. Ltd.",
      location: "Nepal",
      period: "2026 – Present",
      bullets: [
        "Work on enterprise network infrastructure, system administration, and IT infrastructure deployment.",
        "Configure and troubleshoot network devices, including routers, switches, wireless access points, and firewalls.",
        "Work with VLANs, routing protocols, network segmentation, and network connectivity.",
        "Participate in server room infrastructure, network deployment, configuration, and maintenance.",
        "Support enterprise networking projects, infrastructure testing, and technical documentation.",
        "Collaborate with technical teams to implement reliable and secure IT solutions."
      ]
    },
    {
      role: "Network Security Intern",
      company: "IT Concerns Pvt. Ltd.",
      location: "Nepal",
      period: "2025",
      bullets: [
        "Gained practical exposure to network security operations and enterprise IT infrastructure.",
        "Assisted with network monitoring, firewall implementation, and security configurations.",
        "Participated in vulnerability assessment and network troubleshooting activities.",
        "Developed practical knowledge of network security concepts, infrastructure protection, and IT support."
      ]
    }
  ],

  /* Portfolio projects. The first entry marked feature:true spans full width. */
  projectCategories: ["All", "Projects", "Certifications"],
  projects: [
    {
      feature: true, category: "Projects", title: "Trail — Observability Platform",
      desc: "A self-service observability platform for internal teams: Prometheus + Thanos for long-term metrics, Loki for logs, and a Grafana portal with golden-signal dashboards generated from service manifests.",
      image: "/assets/img/covers/trail.svg",
      links: [
        { label: "View project", href: "/portfolio.html", primary: true },
        { label: "Website", href: "#", external: true },
        { label: "Github", href: "#", external: true }
      ]
    },
    {
      feature: true, category: "Projects", title: "Sherpa — GitOps Delivery",
      desc: "An Argo CD based delivery pipeline with progressive rollouts, automatic rollback on SLO burn, and preview environments spun up per pull request.",
      image: "/assets/img/covers/sherpa.svg",
      links: [
        { label: "View project", href: "/portfolio.html", primary: true },
        { label: "Github", href: "#", external: true }
      ]
    },
    {
      category: "Projects", title: "Annapurna — RAG Assistant Platform",
      desc: "A retrieval-augmented assistant platform: vector search, GPU-backed model serving, prompt and version tracking, guardrails, and an evaluation harness wired into CI.",
      image: "/assets/img/covers/annapurna.svg",
      links: [ { label: "View project", href: "/portfolio.html", primary: true }, { label: "Github", href: "#", external: true } ]
    },
    {
      category: "Projects", title: "Basecamp — Landing Zone",
      desc: "Terraform modules for an AWS multi-account Landing Zone with SSO, guardrails and centralised logging.",
      image: "/assets/img/covers/basecamp.svg",
      links: [ { label: "View project", href: "/portfolio.html", primary: true }, { label: "Github", href: "#", external: true } ]
    },
    {
      category: "Projects", title: "Yeti — Cost Explorer Bot",
      desc: "A Slack bot that posts weekly AWS cost anomalies and right-sizing suggestions pulled from Cost Explorer and Compute Optimizer.",
      image: "/assets/img/covers/yeti.svg",
      links: [ { label: "View project", href: "/portfolio.html", primary: true }, { label: "Website", href: "#", external: true } ]
    },
    {
      category: "Projects", title: "Pokhara — Static Image Proxy",
      desc: "An on-the-fly image resizing proxy backed by S3 and a CDN, trimming origin egress and page weight across the fleet.",
      image: "/assets/img/covers/pokhara.svg",
      links: [ { label: "View project", href: "/portfolio.html", primary: true }, { label: "Github", href: "#", external: true } ]
    },
    {
      category: "Projects", title: "Lumbini — Incident Timeline",
      desc: "A lightweight incident tracker that assembles a timeline from alert, chat and deploy events for faster post-mortems.",
      image: "/assets/img/covers/lumbini.svg",
      links: [ { label: "View project", href: "/portfolio.html", primary: true } ]
    },
    {
      category: "Certifications", title: "AWS Certified Solutions Architect – Associate",
      desc: "Designing resilient, cost-optimised architectures on AWS. Credential verifiable on request.",
      image: "/assets/img/covers/aws-saa.svg",
      links: [ { label: "Verify", href: "#", external: true, primary: true } ]
    },
    {
      category: "Certifications", title: "Certified Kubernetes Administrator (CKA)",
      desc: "Cluster administration, workloads, networking and troubleshooting on upstream Kubernetes.",
      image: "/assets/img/covers/cka.svg",
      links: [ { label: "Verify", href: "#", external: true, primary: true } ]
    },
    {
      category: "Certifications", title: "HashiCorp Certified: Terraform Associate",
      desc: "Infrastructure as code workflows, modules and state management with Terraform.",
      image: "/assets/img/covers/terraform.svg",
      links: [ { label: "Verify", href: "#", external: true, primary: true } ]
    }
  ]
};
