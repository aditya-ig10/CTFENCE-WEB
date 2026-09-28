// single source for all site strings.
// facts grounded in the Context Fence application. nothing invented.
// anything the app did not say is marked [PLACEHOLDER] so it cannot
// ship looking like fact.

export const site = {
  name: "Context Fence",
  productLine: "Stops AI agents leaking secrets",
  domain: "contextfence.dev",
  location: "New Delhi, India",
  slaReply: "We reply within 4 business hours",
};

export const nav = {
  links: [
    { label: "Evidence", href: "/evidence" },
    { label: "Downloads", href: "/downloads" },
    { label: "Blog", href: "/blog" },
  ],
  cta: { label: "Download now", href: "/downloads" },
};

// download links mirror the live release manifest
// (aditya-ig10/context-fence-releases/main/release.json). every platform's
// assets — dmg, exe, AppImage/deb/rpm — ship from that single PUBLIC repo;
// the main context-fence repo is private.
// these are fallbacks only — /downloads reads the live release.json first.
export const downloads = {
  version: "2.0.0",
  released: "sep 1, 2026",
  mac: {
    label: "macOS · universal dmg",
    sub: "Universal dmg for Intel and Apple silicon — drag to /Applications.",
    href: "https://github.com/aditya-ig10/context-fence-releases/releases/download/v2.0.0/Context-Fence-2.0.0-universal.dmg",
    size: "264.7 mb",
    sha256: "e823802eb8ea7e370101ad378bc41e6b3d56e3a52b032232f0e9c42f378291f5",
    cta: "Download",
    unsigned:
      "unsigned · ad-hoc signed, not notarized — if Gatekeeper blocks it, right-click → open.",
  },
  brew: {
    label: "macOS · homebrew",
    sub: "maintained cask from the aditya-ig10/context-fence tap",
    install: "brew install aditya-ig10/context-fence/context-fence",
    update: "brew update && brew upgrade --cask context-fence",
  },
  windows: {
    label: "Windows x64",
    sub: "NSIS installer, per-user install — the full app, no store required.",
    href: "https://github.com/aditya-ig10/context-fence-releases/releases/download/v2.0.0/Context-Fence-Setup-2.0.0-x64.exe",
    size: "114.4 mb",
    sha256: "f176ce67bfbd07e9de2c782fdb4a40b913dbd0a9c65d19a98d7606fb68740ccc",
    cta: "Download",
    unsigned:
      "signed · Authenticode — SmartScreen may still prompt until reputation builds.",
  },
  linux: {
    label: "Linux x64",
    sub: "AppImage runs anywhere — chmod +x and launch, no install. Deb for Debian/Ubuntu, rpm for Fedora/RHEL.",
    href: "https://github.com/aditya-ig10/context-fence-releases/releases/download/v2.0.0/Context-Fence-2.0.0-x86_64.AppImage",
    size: "146.4 mb",
    sha256: "7675f191a091da55f03c2ded48ee092a959445d1dada47234ae756c41580f575",
    cta: "Download AppImage",
    unsigned: "unsigned · verify the sha256 after download.",
    debHref:
      "https://github.com/aditya-ig10/context-fence-releases/releases/download/v2.0.0/Context-Fence-2.0.0-amd64.deb",
    rpmHref:
      "https://github.com/aditya-ig10/context-fence-releases/releases/download/v2.0.0/Context-Fence-2.0.0-x86_64.rpm",
  },
  cli: {
    label: "CLI",
    sub: "ships inside the app — a standalone cf binary is not packaged yet",
  },
};

export const hero = {
  tag: "Context Fence: DLP for AI agents",
  titleLines: [
    { text: "Stop your AI agent", accent: false, dim: false, highlight: false },
    { text: "from leaking", accent: true, dim: false, highlight: false },
    { text: "your secrets.", accent: false, dim: false, highlight: false },
  ],
  sub: "Context Fence runs on your computer. It checks what your AI agent sends out and blocks secrets before they leave. Today it protects MCP tools. More is coming in v2.1.",
  primaryCta: { label: "Download now", href: "/downloads" },
  slaBadge: site.slaReply,
  terminal: {
    title: "context-fence — local policy proxy",
    lines: [
      { prompt: "cf", at: "@local", tild: "~", cmd: "cf init" },
      { out: "wrote cf.policy.yml (17 rules)" },
      { prompt: "cf", at: "@local", tild: "~", cmd: "cf run --review" },
      { out: "evaluating policy against ~/.mcp-servers/github.json" },
      { out: "4 tool schemas inspected in 0.8ms" },
      { prompt: "cf", at: "@local", tild: "~", cmd: "cf agent --watch" },
      { out: "[23:04:12] agent requested: read /proj/.env" },
      { key: "  policy", val: "secrets.deny -> redacted (2 values stripped)" },
      { out: "[23:04:13] agent requested: github.mcp.call create-issue" },
      { blocked: "blocked: .env read -> github.mcp.call [DENIED]" },
      { prompt: "cf", at: "@local", tild: "~", cursor: true },
    ],
  },
};


export const problem = {
  eyebrow: "// why this exists",
  title: ["One agent read a .env file.", "Keys went out the door."],
  lead: "The July 18 incident: what happened, why the usual fix doesn't fix it, and where the guard actually lives.",
  narrative: [
    { text: "On July 18, a coding agent read a .env file it was never asked to open. " },
    { text: "The keys left the machine.", hl: "incident" },
    { text: " AI agents often hold real secrets, like keys and passwords. Nobody sees what they do with them. " },
    { text: "You find out later, if at all.", hl: "incident" },
    { text: " Most teams just trust the agent. The fence checks first." },
  ],
  times: ["00:02", "00:06", "00:10"],
  incident: {
    num: "01",
    label: "the incident",
    title: "The agent did what agents do.",
      body: "Everything it was asked, including the parts nobody asked for. Nothing on the machine objected. The keys left inside an API payload.",
      bullets: [
        "Everything it was asked, including the parts nobody asked for.",
      "Nothing on the machine objected.",
      "The keys left inside an API payload.",
    ],
  },
  wrong: {
    num: "02",
    label: "the wrong response",
    title: "Cloud gateway, hope, and a vendor's list.",
    body: "Route all agent traffic through a cloud gateway and hope the vendor's list of bad things is good enough. Every call leaves your machine first.",
    bullets: [
      "Every call leaves your machine first.",
      "You trust a deny-list you never see.",
      "Your agent's traffic is someone else's data.",
    ],
  },
  right: {
    num: "03",
    label: "the right response",
    title: "The guard lives where the agent lives.",
      body: "On your machine, checking every call before it happens. Schema speed, not jury speed.",
    bullets: [
      "Local policy, zero cloud routing.",
      "Schema checks, not LLM judges.",
      "Under 10ms per call.",
    ],
  },
};

export type FeatureIconName = "lock" | "shield" | "scan" | "list" | "pin" | "cloud";

export type Feature = {
  title: string;
  desc: string;
  icon: FeatureIconName;
  alt: string;
  roadmap?: boolean;
  tag?: string;
};

export const features: {
  eyebrow: string;
  title: string;
  lead: string;
  grid: Feature[];
} = {
  eyebrow: "// capabilities",
  title: "What Context Fence protects",
  lead: "What your agent sends out, checked on your machine. No cloud in the path.",
  grid: [
    {
      title: "Secrets",
      desc: "Strips keys and tokens from what agents read. If it looks like a secret, it does not pass.",
      icon: "shield",
      alt: "Icon representing a shield over a key",
    },
    {
      title: "MCP tools",
      desc: "Checks every MCP tool call before it runs. Plain rules decide in under 10ms.",
      icon: "lock",
      alt: "Icon representing a filesystem access lock",
    },
    {
      title: "Hidden instructions",
      desc: "Flags tricks hidden in tool output. The agent never acts on them.",
      icon: "scan",
      alt: "Icon representing a scanning radar",
    },
    {
      title: "The log",
      desc: "A record of every decision. Each row names the rule that fired.",
      icon: "list",
      alt: "Icon representing a list of log entries",
    },
    {
      title: "Prompts and files",
      desc: "Checks what is sent to AI models and what agents read and write.",
      icon: "pin",
      alt: "Icon representing a document being checked",
    },
    {
      title: "Browsers, coding agents, and other tools",
      desc: "Wider coverage for how agents work today.",
      icon: "cloud",
      alt: "Icon representing connected tools",
    },
  ],
};

export const cases = {
  eyebrow: "// case studies",
  title: "Example situations",
  lead: "Four patterns where the fence proves its value, from solo dev to agency fleet. These are examples, not customer stories.",
  footnote: "bench notes · july 2026",
  cards: [
    {
      id: "case 01",
      file: "agency-mcp",
      title: "agency mcp",
      role: "Agency running client MCP servers",
      status: "",
      stages: [
        {
          label: "the problem",
          text: "One team of agents touches client repos all day. One wrong read can send a client's secrets out.",
          tone: "problem",
        },
        {
          label: "what the fence did",
          text: "Each client gets its own rule file. A no for one client stays a no.",
          tone: "fence",
        },
        {
          label: "the finding",
          text: "Every denied call logged with the rule that fired. The agents run exactly as before.",
          tone: "finding",
        },
      ],
      signals: ["per-client policies", "every denial logged", "zero agent changes"],
    },
    {
      id: "case 02",
      file: "solo-claude",
      title: "solo claude",
      role: "Solo dev shipping with Claude Code agents",
      status: "",
      stages: [
        {
          label: "the problem",
          text: "One dev, one laptop, and keys that must stay in env vars. The agent can read any file.",
          tone: "problem",
        },
        {
          label: "what the fence did",
          text: "Risky calls are denied by default. Bad pushes, stray writes, and env reads are stopped.",
          tone: "fence",
        },
        {
          label: "the finding",
          text: "Tripped the fence in the first hour. The SQLite log named the rule and the line of output.",
          tone: "finding",
        },
      ],
      signals: ["tripped in hour one", "default-deny", "sqlite log"],
    },
    {
      id: "case 03",
      file: "mcp-gateway",
      title: "mcp gateway",
      role: "Gateway fronting every MCP endpoint they expose",
      status: "",
      stages: [
        {
          label: "the problem",
          text: "A gateway opens private files to outside tools. One gap reads like an open door.",
          tone: "problem",
        },
        {
          label: "what the fence did",
          text: "Each tool gets a short allow list. Other calls are denied first.",
          tone: "fence",
        },
        {
          label: "the finding",
          text: "The denied requests showed up in the log as one repeating line: the same probe, four different paths.",
          tone: "finding",
        },
      ],
      signals: ["per-session allowlists", "denied before tools run", "probes logged"],
    },
    {
      id: "case 04",
      file: "repl-auth",
      title: "repl auth",
      role: "A REPL that could reach the vault",
      status: "",
      stages: [
        {
          label: "the problem",
          text: "A coding helper could reach the secret vault. The first test tried to read the keys.",
          tone: "problem",
        },
        {
          label: "what the fence did",
          text: "Out of scope commands are refused. The vault path never reaches the model.",
          tone: "fence",
        },
        {
          label: "the finding",
          text: "The refusal arrived as plain text in the REPL. No retry, no workaround, no special case.",
          tone: "finding",
        },
      ],
      signals: ["session-scoped commands", "vault never reached", "plain-text refusal"],
    },
  ],
};

export type Plan = {
  name: string;
  // monthly base price in INR (the pricing currency); null → "Contact us".
  // USD-anchored: Starter $22/mo monthly · $18/mo annual ($216/yr),
  // Teams $105/mo monthly · $90/mo annual ($1080/yr).
  // 1 USD = 95.878915 INR (2026-09-27): Starter 2109, Teams 10070.
  priceInr: number | null;
  period: string;
  badge?: string;
  status: "ready" | "soon";
  nodes: string;
  retention: string;
  overage?: string;
  features: string[];
  cta: { label: string; href: string; primary: boolean };
};

// pricing v2 — post-council review. primary axis is NODES (enforcement
// points), not seats; policy count is unlimited everywhere (not a pricing
// lever). enterprise carries no indicative number until real deals close.
export const pricing: {
  eyebrow: string;
  title: string;
  lead: string;
  plans: Plan[];
  finePrint: string;
  finePrintLink: { label: string; href: string };
} = {
  eyebrow: "// pricing",
  title: "Simple pricing. Pay per machine, not per seat.",
  lead: "A node is one machine that runs Context Fence. Unlimited rules on every plan.",
  plans: [
    {
      name: "Free",
      priceInr: 0,
      period: "forever · local core",
      status: "ready",
      nodes: "1 node · local only",
      retention: "7-day audit retention",
      features: [
        "Full local protection for MCP tools",
        "Unlimited rules",
        "1 machine (local only)",
        "7 day log history",
        "Works on Mac, Windows, and Linux",
        "Slack alerts",
        "CSV export",
        "Shared rule templates (browse only)",
        "Community support",
      ],
      cta: { label: "Start for free", href: "/downloads", primary: false },
    },
    {
      name: "Starter",
      priceInr: 2109,
      period: "per month · 3 nodes",
      status: "ready",
      nodes: "3 nodes",
      retention: "30-day audit retention",
      features: [
        "Everything in Free",
        "Unlimited rules",
        "3 machines included",
        "30 day log history",
        "Cloud backup of your settings",
        "Manage your agents",
        "Publish and share rules",
        "Email support",
      ],
      cta: { label: "Get Starter", href: "/checkout?plan=starter&cycle=yearly", primary: false },
    },
    {
      name: "Teams",
      priceInr: 10070,
      period: "per month flat · includes 10 nodes",
      badge: "Most popular",
      status: "ready",
      nodes: "10 nodes included",
      retention: "90-day audit retention",
      overage: "+ extra nodes billed per node / month beyond 10",
      features: [
        "Everything in Starter",
        "Unlimited rules",
        "10 machines included",
        "90 day log history",
        "Admin control over agents",
        "Send logs to Splunk, Datadog, or ELK",
        "Sync rules from Git",
        "Approval step for risky actions",
        "Fleet dashboard",
        "Priority email support",
      ],
      cta: { label: "Get Teams", href: "/checkout?plan=teams&cycle=yearly", primary: true },
    },
    {
      name: "Enterprise",
      priceInr: null,
      period: "annual · custom",
      status: "soon",
      nodes: "Unlimited nodes",
      retention: "180-day+ audit retention",
      features: [
        "Everything in Teams",
        "Unlimited rules and machines",
        "180+ day log history",
        "Single sign on and roles",
        "Rule version history",
        "Tamper proof log",
        "Compliance report packs",
        "Safe test mode",
        "Incident replay",
        "Dedicated support SLA",
      ],
      cta: { label: "Contact us", href: "mailto:hello@synthrun.site", primary: false },
    },
  ],
  finePrint: "Nodes, not seats. Monthly or annual billing — prices converted to your currency live.",
  finePrintLink: { label: "privacy policy", href: "/privacy" },
};

export const faq = {
  eyebrow: "// faq",
  title: "Questions a security engineer actually asks",
  lead: "",
  more: {
    text: "Still curious?",
    cta: "Subscribe to the newsletter",
    href: "/#early-access",
  },
  items: [
    {
      q: "Does my data leave my machine?",
      a: "No. All checks run on your computer. Nothing is sent anywhere to be checked.",
    },
    {
      q: "How fast is it?",
      a: "Under 10ms per check. It uses plain rules, not an AI judge. You will not feel it.",
    },
    {
      q: "What does it block?",
      a: "Keys and tokens. Unsafe file reads like .env files. Risky tool calls and hidden tricks in tool output. More coverage is coming in v2.1.",
    },
    {
      q: "How is it different from other tools?",
      a: "Old DLP tools and cloud gateways send your traffic to their servers to inspect it. We check everything on your machine. Nothing is sent anywhere.",
    },
    {
      q: "Is it free?",
      a: "Yes, the local proxy is free. Paid plans add more machines, longer log history, and team features. The hosted control plane is not built yet.",
    },
    {
      q: "When is v2.1 coming?",
      a: "Soon. It widens Context Fence from MCP tools to full protection for AI agents. Join the newsletter to hear when it ships.",
    },
  ],
};

export const team = {
  barLeft: "the people edition",
  barMid: "sunday, august 16, 2026",
  barRight: "vol. i — no. 004 · price: 5¢",
  nameplate: "The Builders",
  tagline: "five hands. one fence. printed for your machine.",
  ticker: [
    "breaking — the fence is holding",
    "agent traffic inspected at the protocol layer",
    "all local — nothing leaves the machine",
    "the desk is warm, the typewriter is typing",
    "est. to keep agents honest",
  ],
  headline: "Five Hands Hold the Fence",
  kicker: "staff profiles · the people edition",
  byline: "By The Context Fence Staff — The Desk",
  lead: "Context Fence is a machine, but it is not a machine alone. Five people built it, and five people keep it honest: two founders at the protocol layer, three more holding the build together. The desk asked each of them what they do, and — for once — got straight answers.",
  founders: [
    {
      name: "Aditya Srivastava",
      role: "[Founder]",
      headline: "The founder who built the runtime",
      tagline: "Final-year CS undergraduate, SRM.",
      bio: "Builds the runtime proxy, policy engine, and audit pipeline, focused on making agent traffic inspectable and enforceable at the protocol layer.",
      bioLarge: true,
      quote:
        "Make agent traffic inspectable and enforceable at the protocol layer — that is the whole bet.",
      caption: "Mr. Srivastava at the runtime. Nothing leaves the machine.",
      photo: {
        dark: "/pfps/aditya/aditya_dark.jpeg",
        light: "/pfps/aditya/aditya_light.jpeg",
      },
    },
    {
      name: "Saniya Saw",
      role: "[Co-founder]",
      headline: "The co-founder who laid the stack",
      tagline: "Final-year CS undergraduate, VIT.",
      bio: "Built the core implementation stack and pipeline design on Context Fence.",
      bioLarge: true,
      quote: "Pipeline design is where the fence starts. The stack is the story.",
      caption: "Ms. Saw with the pipeline. Every call passes through here.",
      photo: {
        dark: "/pfps/saniya/saniya_dark.jpeg",
        light: "/pfps/saniya/saniya_light.jpeg",
      },
    },
  ],
  boardEyebrow: "the board",
  boardLead:
    "Operations, research, and the testing that keeps every release boring — the three hands that hold the build up.",
  crew: [
    {
      name: "Ashray S.",
      role: "Leads Business Operations",
      blurb: "Keeps the books, the ships, and the meetings honest.",
      photo: {
        dark: "/pfps/ashray/ashray_dark.jpeg",
        light: "/pfps/ashray/ashray_light.jpeg",
      },
    },
    {
      name: "Ayush V.",
      role: "Leads Research & Development",
      blurb: "Turns research questions into working systems.",
      photo: {
        dark: "/pfps/ayush/ayush_dark.jpeg",
        light: "/pfps/ayush/ayush_light.jpeg",
      },
    },
    {
      name: "Samridhi K.",
      role: "Owns Debugging & Testing",
      blurb: "Breaks builds on purpose so the users never have to.",
      photo: {
        dark: "/pfps/samridhi/samridhi_dark.jpeg",
        light: "/pfps/samridhi/samridhi_light.jpeg",
      },
    },
  ],
};

export const signup = {
  eyebrow: "// newsletter",
  title: "Subscribe to the newsletter",
  lead: "One honest issue a month: what the fence blocked, what agents did next, and the occasional early-access invite before the crowd.",
  submit: "Subscribe",
  success: "Subscribed. The first issue is on its way.",
};

export const footer = {
  copy: "© 2026 Synthrun — Context Fence is a product of Synthrun. A local proxy for agents that stays a local proxy.",
  links: [
    { label: "Product", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Team", href: "/team" },
    { label: "Blog", href: "/blog" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

export const thankYou = {
  title: "All set.",
  line: "You are on the list — the first issue lands within the month.",
  homeCta: { label: "Back to the site", href: "/" },
};

export const docs = {
  title: "Docs",
  updated: "Quickstart",
  sections: [
    {
      h: "Install",
      p: "Install the proxy, point it at your MCP server config, and it applies cf.policy.yml to every tool call. Full CLI reference lands with the first early-access drop.",
    },
    {
      h: "The policy file",
      p: "Allow- and deny-lists in YAML. Rules match tool schemas on name, argument shape, and destination domain. A deny rule beats an allow rule, always.",
    },
    {
      h: "What is checked",
      p: "Destructive tool calls, filesystem escape, non-allowlisted domains, secret-shaped values, and prompt-injection payloads in tool output. The warning you got in the terminal is the same check the proxy runs.",
    },
    {
      h: "The audit log",
      p: "SQLite, local, append-only. Every allowed and denied call with the rule that decided it. Query it directly; there is no cloud copy to wait for.",
    },
    {
      h: "Roadmap",
      p: "Hosted control plane (fleet policies, audit sync, Slack alerting) is next but not built. Local-only is complete and stays the default.",
    },
  ],
};

export const blog = {
  eyebrow: "// the press room",
  title: "The press room is still setting up.",
  updated: "Last updated: August 2026",
  sub: "first edition lands soon. the editors are fact-checking their own hype.",
  typed: [
    "> first post: the july 18 incident breakdown — what the agent did, where the guard should have been, and why schema checks beat vibe checks.",
    "> the desk is drafting. the typewriter is warm. the fence is holding.",
  ],
  comingSoon: "coming soon",
  draftsEyebrow: "// on the editor's desk",
  drafts: [
    {
      no: "draft no. 001",
      title: "The July 18 incident breakdown",
      blurb:
        "What the agent actually did, which guard should have stopped it, and the exact rule that would have.",
      status: "fact-checking",
    },
    {
      no: "draft no. 002",
      title: "Schema checks beat vibe checks",
      blurb:
        "Why a 2 KB policy file outperforms a 100k-token prompt about being careful.",
      status: "on the editor's desk",
    },
    {
      no: "draft no. 003",
      title: "Eight ways a server can lie",
      blurb:
        "The full tour of the survey behind the evidence page — poisoned descriptions, hard-coded credentials, and six more.",
      status: "being investigated",
    },
    {
      no: "draft no. 004",
      title: "The audit log, queried",
      blurb:
        "Seventeen rules, one SQLite file, zero cloud. A hands-on walk through the rows your agents leave behind.",
      status: "scheduled",
    },
  ],
  ticker: [
    "the fence holds",
    "policy files over prompts",
    "zero cloud routing",
    "schema checks under 10ms",
    "local by default",
    "seventeen rules shipped",
    "audit log stays yours",
  ],
  mailEyebrow: "// press mailing list",
  mailTitle: "Get the first issue before the world does.",
  mailNote: "No newsletter spam. One email per issue, maybe. We reply within 4 business hours.",
  mailPlaceholder: "your@email.dev",
  mailCta: "Put me on the list",
  mailDone: "You are on the list. The first issue will find you.",
};

export const issue = {
  eyebrow: "// the current issue",
  title: "The exposure gap keeps widening",
  lead: "The SDK now clocks tens of millions of monthly downloads. The number of exposed, unsecured instances climbs right alongside it — adoption without a fence just makes the attack surface bigger.",
  footnote: "telemetry · nov 2024 → mar 2026",
  seriesDownloads: "sdk downloads (monthly)",
  seriesExposed: "exposed unsecured instances",
  data: [
    { date: "Nov 2024", downloads: 0, exposed: 0 },
    { date: "Apr 2025", downloads: 8, exposed: 5 },
    { date: "Dec 2025", downloads: 10, exposed: 60 },
    { date: "Mar 2026", downloads: 97, exposed: 200 },
  ],
  findings: {
    title: "share of public servers with vulnerabilities",
    range: "1,899 servers · field survey · 2025",
    note: "8 vulnerability classes found — only 3 overlap traditional software",
    data: [
      { name: "general vulnerabilities", value: 7.2 },
      { name: "tool poisoning", value: 5.5 },
      { name: "credential exposure", value: 3.6 },
    ],
  },
  press: {
    edition: "est. 2026 · reality edition",
    dateline: "monday, 2 mar 2026 · vol. 1 · no. 1",
    tagline: "Reporting from the supply chain, where the models live.",
    date: { range: "nov 2024 → mar 2026", price: "price: one deployment cycle" },
    lead: {
      kicker: "lead story · investigated",
      title: "One in eighteen public MCP servers describes its tools dishonestly",
      lede: "A first-of-its-kind scan of 1,899 open-source servers finds 5.5% carry poisoned tool descriptions and 3.6% hard-code live credentials — eight vulnerability classes, only three overlapping traditional software.",
      body: [
        "The survey's 1,899 public instances split into eight identifiable failure classes — and only three of them have a direct counterpart in traditional software. The other five are peculiar to the agent stack: the way models pick tools, trust descriptions, and chain calls together.",
        "None of the eight required advanced skill. That is the finding's real weight: every class was demonstrated with ordinary tooling, and the credential play in the survey was pulled off with undergraduate-level Python in an afternoon.",
      ],
      byline: "by m. hasan · the evidence bureau",
      source: { href: "https://arxiv.org/abs/2506.13538" },
    },
    factbox: {
      title: "the scan at a glance",
      rows: [
        { label: "public servers surveyed", value: "1,899" },
        { label: "poisoned tool descriptions", value: "5.5%" },
        { label: "hard-coded credentials", value: "3.6%" },
        { label: "general vulnerabilities", value: "7.2%" },
        { label: "failure classes", value: "8 · 5 new" },
        { label: "attack surface mapped", value: "16 risks" },
        { label: "sdk downloads · mar 2026", value: "97M/mo" },
      ],
    },
    photoLead: {
      src: "https://images.pexels.com/photos/17489163/pexels-photo-17489163.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
      caption: "Public servers advertise production readiness. The survey suggests otherwise.",
      credit: "photo: pexels · server aisle",
    },
    ticker: [
      "5.5% of servers misdescribe their own tools",
      "3.6% hard-code live credentials",
      "8 failure modes · only 3 overlap traditional software",
      "97M monthly downloads · 0 mandatory review",
      "context fence: schema checks under 10ms · zero cloud routing",
      "local core ships today · cf.policy.yml, 17 rules",
    ],
    briefs: [
      {
        kicker: "agentic audit",
        title: "Auditors coerce flagship LLMs into code execution and credential theft",
        lede: "A safety audit drives flagship models into malicious code execution and remote access through ordinary tool calls — then ships a scanner to catch it before deployment.",
        body: "In repeated trials all three flagship models accepted the chain when the calls were phrased as ordinary tool use — executing code, reading files, opening remote access. The scanner makes the same chain detectable before deployment.",
        src: "https://images.pexels.com/photos/5380589/pexels-photo-5380589.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
        caption: "keystrokes, weaponized",
        source: { href: "https://arxiv.org/abs/2504.03767" },
      },
      {
        kicker: "proof of concept",
        title: "A 'weather' server, a vault of credentials",
        lede: "Free web tools and an afternoon of work: a disguised server walks off with bank account balances. Undergraduate-level Python is the whole skill bar.",
        body: "The server advertised one harmless tool and sat behind it with a vault of harvested credentials, filled by calls the model made on its own after a single plausible request.",
        src: "https://images.pexels.com/photos/31130767/pexels-photo-31130767.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
        caption: "clear skies, empty accounts",
        source: { href: "https://arxiv.org/abs/2507.19880" },
      },
      {
        kicker: "threat taxonomy",
        title: "When MCP servers attack: the malicious-server playbook",
        lede: "The first systematic taxonomy of what malicious servers actually do — capability smuggling, tool chaining, full system compromise — each staged as a working exploit.",
        body: "Sixteen risks grouped into four attacker classes, each staged as a working exploit against a production-configured server — and each mapped to the control that closes it.",
        src: "https://images.pexels.com/photos/1432675/pexels-photo-1432675.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
        caption: "chip-scale trust",
        source: { href: "https://arxiv.org/abs/2509.24272" },
      },
      {
        kicker: "no payload required",
        title: "MPMA: preference manipulation bends MCP tool choice",
        lede: "Crafted preference entries nudge models toward the attacker's own tools — no payload, no prompt injection, just statistics.",
        body: "No payload, no injected prompt: the manipulation worked through preference statistics alone, which makes it invisible to every detector that watches for text patterns.",
        src: "https://images.pexels.com/photos/37709121/pexels-photo-37709121.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
        caption: "the quiet channel",
        source: { href: "https://arxiv.org/abs/2505.11154" },
      },
      {
        kicker: "ecosystem sweep",
        title: "Mind your server: parasitic toolchains in the MCP ecosystem",
        lede: "Parasitic toolchains ride legitimate servers' reputation to funnel models into attacker-controlled tools — a sweep measures how deep the infection goes.",
        body: "Parasites live in the shadow of well-known servers — same reputation, different endpoint. Models follow the trail because the ecosystem has no provenance signal to check.",
        src: "https://images.pexels.com/photos/1181354/pexels-photo-1181354.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
        caption: "reputation as attack surface",
        source: { href: "https://arxiv.org/abs/2509.06572" },
      },
      {
        kicker: "supply-chain defense",
        title: "Tool squatting and rug pulls get a protocol-level answer",
        lede: "OAuth-scoped tool definitions and policy-based access control close the supply-chain gap the ecosystem scans keep finding.",
        body: "Scoped tool definitions, OAuth, and policy-based access turn the supply chain from a trust exercise into an authorization one — the protocol-level answer to everything else on this page.",
        src: "https://images.pexels.com/photos/7641991/pexels-photo-7641991.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
        caption: "scopes over promises",
        source: { href: "https://arxiv.org/abs/2506.01333" },
      },
    ],
    feature: {
      kicker: "feature · threat model",
      title: "The MCP attack surface, mapped end-to-end",
      lede: "Sixteen distinct security risks across four attacker classes, each confirmed with a working exploit — and a roadmap for the protocol to fix itself.",
      crosshead: "four attacker classes, sixteen doors",
      body: [
        "Sixteen distinct risks, grouped by who carries them: the protocol layer, server authors, model providers, and the client itself. Every one is confirmed with a working exploit rather than a hypothetical — some as blunt as credential theft, others as quiet as preference statistics that nudge a model toward an attacker's tool without ever injecting a prompt.",
        "The same curve keeps compounding the gap: monthly SDK downloads grew tenfold across the survey window while exposed instances grew fortyfold. Adoption without a fence just makes the attack surface bigger — the numbers on this page are the proof of that sentence.",
      ],
      byline: "hou et al. · huazhong univ.",
      source: { href: "https://arxiv.org/abs/2503.23278" },
    },
    fig1: {
      label: "fig 1 · telemetry",
      sub: "sdk downloads vs. exposed instances",
      range: "gap widens 16× month-over-month",
    },
    analysis: {
      kicker: "analysis · governance & controls",
      title: "Securing MCP: risks, controls, and governance for production agents",
      lede: "Three adversary classes — content injection, compromised supply chains, and overstepping agents — plus the control stack to stop them: scoped authorization, provenance, sandboxing, and central governance.",
      body: [
        "The control stack the authors propose is deliberately unglamorous: scoped authorization so a tool can only do what it was hired for, provenance so a tool is only as trustworthy as its publisher, sandboxing so a bad tool is boring, and central governance so a team can say no in one place. Familiar controls, applied to a new surface.",
        "The first and last of those need nothing from the model provider. A policy proxy running on the machine can enforce both locally, before any call leaves the box.",
      ],
      byline: "errico, ngiam & sojan",
      source: { href: "https://arxiv.org/abs/2511.20920" },
      quote: "A model is only as trustworthy as the last server it trusted.",
    },
    response: {
      kicker: "the response · zero cloud routing",
      title: "A policy proxy sits in front of the tools",
      lede: "Seventeen rules, checks under ten milliseconds, and nothing leaves the machine.",
      body: [
        "Where the survey found eight ways a server can lie, the response is deliberately simple: every tool call is checked against a policy before the model sees it. The checks are schema work — types, scopes, provenance — not an LLM judge, which is why they stay under ten milliseconds.",
        "The policy is a single file on disk, the audit log is a file on disk, and the proxy runs entirely on the machine. There is no telemetry endpoint, no control plane in the default path, and no dependency on a model provider to enforce any of it.",
      ],
      spec: [
        { label: "policy engine", value: "cf.policy.yml" },
        { label: "rules shipped", value: "17" },
        { label: "per-check latency", value: "< 10ms" },
        { label: "routing", value: "zero cloud" },
        { label: "telemetry", value: "none" },
        { label: "current build", value: "v1.1.6-c" },
      ],
      cta: { label: "download the fence", href: "/downloads" },
    },
    listicle: {
      kicker: "the ledger · eight ways a server can lie",
      items: [
        "Poisoned tool descriptions",
        "Hard-coded credentials",
        "Over-permissive scopes",
        "Credential exfiltration paths",
        "Prompt-injection seams",
        "Unbounded tool chains",
        "Dependency confusion",
        "Impersonated publishers",
      ],
      note: "none required advanced skill — all eight demonstrated with ordinary tooling.",
    },
    fig2: { label: "fig 2 · findings", sub: "share of public servers with vulnerabilities" },
    classifieds: {
      title: "classifieds",
      items: [
        { h: "WANTED", b: "Sandbox for misbehaving agents. Must respect boundaries. Pays in tokens." },
        { h: "FOR SALE", b: "One (1) trust model, gently used. Previous owner over-relied on it." },
        { h: "LOST", b: "1,899 server descriptions. Last seen promising more than they deliver." },
        { h: "SERVICES", b: "Local policy proxy. Schema checks under 10ms, zero cloud routing. Full story above." },
      ],
    },
    index: "the evidence bureau · reporting fictional, the exposure gap is not · context fence answers it locally · nov 2024 → mar 2026",
  },
};

export const privacy = {
  eyebrow: "// privacy policy",
  title: "What crosses the fence.",
  sub: "The short version: in the default mode, nothing does. Read the long version anyway — it is honest, and it should be.",
  updated: "Last updated: September 2026",
  tldr: [],
  who: {
    h: "Who we are",
    p: "Context Fence is a product of Synthrun. Synthrun builds and maintains the Context Fence proxy, this website, the Homebrew tap that distributes the macOS build, the Windows release pipeline, and — one day — the hosted control plane. Everything in this policy covers all of those. If a service is ours, this policy applies; if it is not listed here, it is not part of the product.",
  },
  flow: {
    h: "Follow the packets",
    p: "Pick a mode and watch what actually leaves your machine. This is the whole policy in one drawing.",
    modes: [
      { id: "local", label: "local mode · default", note: "every packet bounces off the fence. nothing leaves." },
      { id: "web", label: "the website", note: "aggregate visit counts leave. your tool calls do not." },
      { id: "cloud", label: "hosted plane · future", note: "opt-in audit sync. you send the log, we keep it." },
    ],
  },
  sections: [
    {
      h: "Local-only mode collects nothing",
      p: "In the default mode the proxy runs entirely on your machine. No telemetry, no crash reports, no policy uploads, no analytics from the product itself. We cannot see your tool calls because they never reach us. The audit log, the policy file, and every secret-shaped value the fence strips — all of it stays on your disk.",
    },
    {
      h: "What never leaves the machine",
      items: [
        "Every tool call the agent makes, allowed or denied",
        "The audit log rows and the rules that decided them",
        "Your cf.policy.yml — we never see a policy file",
        "Secrets the fence strips before they reach a model or a tool",
        "Anything the model, your tools, or the proxy print to a local log",
      ],
    },
    {
      h: "What the website sees",
      p: "This site uses Google Analytics to count visits and see which pages people read. GA sets cookies and we see aggregate numbers only: rough visitor counts, popular pages, broad geography. We do not see your identity through it, and we do not try to. The downloads page itself reads a public release manifest from GitHub — that is a public file any visitor can read, and it contains only version numbers, file sizes, and checksums.",
    },
    {
      h: "Cookie policy",
      p: "The website stores the minimum and asks before anything optional. Essential storage is always on: your theme preference and your consent choice itself (cf-consent), kept in your browser's local storage — no tracking, no expiry that matters, delete it any time and we simply ask again. Analytics (Google Analytics) is strictly opt-in: until you press Accept, no analytics script loads and no analytics cookie is set. With consent, GA sets _ga (2 years) and _ga_<container-id> (2 years) to count visits in aggregate — rough visitor counts, popular pages, broad geography. We never see your identity through it. Change your mind any time via Cookie settings in the footer; declining later stops future collection (already-set GA cookies can be cleared in your browser). A Global Privacy Control signal is honored as a decline. Signing in with Google stores a Firebase auth session so you stay signed in — Google's own privacy policy covers their side of that handshake.",
    },
    {
      h: "Do Not Track and Global Privacy Control",
      p: "We honor Global Privacy Control as a decline of analytics: with the signal present, analytics stays off and the customize panel says so. Do Not Track headers are treated the same way. Essential storage is unaffected — the site cannot remember your theme or your choice without it.",
    },
    {
      h: "International transfers",
      p: "The product keeps everything on your machine, so there is nothing to transfer. The only cross-border processing is Google Analytics, and only after you opt in: Google may process aggregate visit data on infrastructure outside India, including the US, under its own terms. No other website data leaves the region by design — email replies stay with the founders.",
    },
    {
      h: "The early access form",
      p: "Submitting the early access form sends us your email address. We use it exactly once: to reply about access. No list rental, no third-party marketing, no drip campaigns. The reply comes from the founders directly, within 4 business hours. If you later ask us to delete it, we delete it — one message is enough.",
    },
    {
      h: "Hosted control plane (not yet available)",
      p: "When it ships, opting in syncs the audit log to our infrastructure so a team can review it in one place. That is the explicit trade: you send us the log, we keep it for you. The sync is off by default, the log remains on your machine regardless, and the local mode keeps collecting nothing. Fleet policies, audit sync, and Slack alerting are planned features of that plane — none of them exist in the default path.",
    },
    {
      h: "What we never collect",
      items: [
        "Children's data — the product is for developers; we do not knowingly collect anything from anyone under 13",
        "Biometrics, precise location, or contacts",
        "Your chat history, prompts, or agent conversations",
        "Model outputs, generated code, or anything the agent produces",
        "Credentials or secrets — the fence's entire job is stopping those from leaking",
      ],
    },
    {
      h: "Security",
      p: "The product is local-first by construction: no telemetry endpoint, no control plane in the default path, no dependency on a model provider to enforce anything. The macOS build is ad-hoc signed and the Windows build is unsigned by design; both are published with their sha256 checksums so you can verify what you installed. We cannot claim a cloud we do not have.",
    },
    {
      h: "Retention",
      p: "Email addresses from the early access form are kept until you ask us to delete them. Website analytics are aggregate counters; there is no per-person record to retain. The audit log is yours — retention is your decision, on your disk.",
    },
    {
      h: "Your rights",
      p: "Ask us anything: what we hold about you, why, and for how long. In local mode there is no account to delete — uninstalling the app deletes everything but your own files. If the hosted plane exists by the time you read this, the same rights apply to your synced copy.",
    },
    {
      h: "Changes to this policy",
      p: "If this policy changes, the date at the top changes and this page is the notice. We will not quietly change what crosses the fence. For the default, local mode: nothing does.",
    },
  ],
  contact: {
    h: "Questions?",
    p: "Use the early access form on the home page and say it is about privacy. The founders answer it directly — no support desk, no ticket queue.",
    cta: { label: "Ask us", href: "mailto:thecontextfence@gmail.com" },
  },
  ticker: "nothing leaves the machine · nothing leaves the machine · ",
};

export const terms = {
  eyebrow: "// terms of service",
  title: "The ground rules.",
  sub: "Short version: use the fence, keep it local, and do not pretend we promise what we do not promise.",
  updated: "Last updated: August 2026",
  tldr: [
    "It is a local proxy, not a cloud",
    "Free to use; future console sold separately",
    "We give no warranty — verify your builds",
    "Your secrets stay on your machine",
  ],
  modeLabel: { legal: "legalese", plain: "plain speak" },
  sections: [
    {
      h: "Who we are",
      legal:
        "These terms are between you and Synthrun, the developer of Context Fence (\"the Product\"). The Product includes the proxy application, the policy file format, the Homebrew tap and release pipeline, this website, and any future hosted services. By downloading, installing, or using the Product or this website, you agree to these terms.",
      plain: "Context Fence is made by Synthrun. Use it, and you are agreeing to these rules.",
    },
    {
      h: "What the product is",
      legal:
        "The Product is a local policy proxy for AI agent tool calls. In its default configuration it operates entirely on your machine: it reads a policy file (cf.policy.yml), evaluates tool calls against it, writes an append-only audit log to local SQLite, and routes nothing to Synthrun or any third party. Nothing in these terms grants or implies any right to use the Product as a hosted service unless separately agreed.",
      plain: "It is a fence that sits on your machine and checks every tool call. By default it sends nothing anywhere.",
    },
    {
      h: "License",
      legal:
        "The local core is free to use, for individuals and companies, including commercial use. You may not resell or sublicense the proxy itself, or wrap it into a product that competes with the Product, without written permission. The hosted control plane, when it ships, is a separate service with its own terms and pricing; the local core keeps working regardless.",
      plain: "The local app is free, even at work. Do not resell the fence itself. The future hosted console will be a separate, paid thing — the local app stays free.",
    },
    {
      h: "Your account and the early access form",
      legal:
        "Where you provide an email address (for example, the early access form), you warrant that it is yours and that you consent to being contacted about the Product at it. Access to early builds is at our discretion and may be revoked at any time.",
      plain: "Only give us an email you own. Early access is a privilege, not a contract.",
    },
    {
      h: "Acceptable use",
      legal:
        "You agree not to use the Product to violate applicable law, to misrepresent it as another product, to redistribute modified builds under the Product's name, or to use the website or release infrastructure to attack, scrape, or abuse the Product or its users. You are responsible for the behavior of the agents you run behind the fence.",
      plain: "Do not use the fence for illegal stuff, do not ship fake copies under our name, and remember the agent is yours.",
    },
    {
      h: "Build status and signatures",
      legal:
        "The macOS build is ad-hoc signed and the Windows build is unsigned by design. You acknowledge that unsigned or ad-hoc-signed software may be blocked by your operating system, and that you install it at your own risk. We publish sha256 checksums for every release so you can verify that what you installed is what we published.",
      plain: "The builds are not notarized — Gatekeeper may complain. Check the checksum on the downloads page; that is how you know it is ours.",
    },
    {
      h: "No warranty",
      legal:
        "The Product is provided \"as is\" and \"as available\", without warranty of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. The fence reduces risk; it does not eliminate it. A misconfigured policy file, a model that finds a new way around, or an agent with write access can still cause harm.",
      plain: "We are honest about this: the fence helps, but no tool can promise an agent never misbehaves. Policy files are your responsibility.",
    },
    {
      h: "Limitation of liability",
      legal:
        "To the maximum extent permitted by law, Synthrun shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, data, or secrets, arising out of or related to the Product or these terms. Our total liability for any claim is limited to the amount you paid us in the twelve months preceding the claim — which, for the free local core, is zero.",
      plain: "If the fence ever fails you, the most we owe you is what you paid us. For the free app, that is nothing. We take responsibility seriously, but we will not promise the impossible.",
    },
    {
      h: "The hosted console (future)",
      legal:
        "Pricing and feature pages describing a hosted console are plans, not commitments. Features may ship late, differently, or not at all. When the console ships, its use is governed by separate terms presented at signup.",
      plain: "Prices on the site are planned, not final. The console is not built yet; do not build a business on it today.",
    },
    {
      h: "Changes to these terms",
      legal:
        "We may update these terms from time to time. The date at the top of this page is the notice; continuing to use the Product after an update constitutes acceptance. Material changes will be flagged in the changelog.",
      plain: "If the rules change, the date at the top changes. Keep using the fence, and you accept the new rules.",
    },
    {
      h: "Termination",
      legal:
        "You may terminate this agreement at any time by deleting the Product and ceasing use of the website. The Product is local software; there is nothing to return and no account to close in local mode. Sections on warranty, liability, and governing law survive termination.",
      plain: "Done with the fence? Delete the app. That is the whole termination process.",
    },
    {
      h: "Governing law",
      legal:
        "These terms are governed by the laws of the Republic of India, without regard to conflict-of-law principles. Any disputes will be resolved in the courts of New Delhi.",
      plain: "Made in New Delhi, India. Indian law applies.",
    },
    {
      h: "Contact",
      legal:
        "Questions about these terms: use the early access form on the home page and say it is about the terms. The founders answer it directly.",
      plain: "Ask us anything via the form on the home page. A human answers within 4 business hours.",
    },
  ],
};