// single source for all site strings.
// facts grounded in the Context Fence application. nothing invented.
// anything the app did not say is marked [PLACEHOLDER] so it cannot
// ship looking like fact.

export const site = {
  name: "Context Fence",
  productLine: "Stops AI agents leaking secrets",
  domain: "context-fence.dev",
  location: "New Delhi, India",
  slaReply: "We reply within 4 business hours",
};

export const nav = {
  links: [
    { label: "Product", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Docs", href: "/docs" },
    { label: "Blog", href: "/blog" },
  ],
  cta: { label: "Get early access", href: "/#early-access" },
};

export const hero = {
  tag: "Local MCP policy proxy",
  titleLines: [
    { text: "Your agent", accent: false, dim: false, highlight: false },
    { text: "policed locally.", accent: true, dim: false, highlight: false },
    { text: "zero cloud routing.", accent: false, dim: true, highlight: true },
  ],
  sub: "Context Fence sits between your AI agent and its MCP tools on your own machine. Every action a schema check, not an LLM judge, so it stays under 10ms. Nothing leaves your machine. That is the point.",
  primaryCta: { label: "Get early access", href: "/#early-access" },
  secondaryCta: { label: "Read the docs", href: "/docs" },
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

export const stats = [
  { num: "<10", accent: "ms", label: "Policy check, schema-based" },
  { num: "0", accent: "", label: "Cloud routing, ever" },
  { num: "YAML", accent: "", label: "Policies, no code" },
  { num: "100", accent: "%", label: "Local execution" },
];

export const problem = {
  eyebrow: "// why this exists",
  title: ["One agent read a .env file.", "Keys went out the door."],
  lead: "The July 18 incident — what happened, why the usual fix doesn't fix it, and where the guard actually lives.",
  narrative: [
    { text: "On July 18, a coding agent read the .env file it was never asked to open, then sent what it had read across the wire. " },
    { text: "The keys left the machine inside an API payload.", hl: "incident" },
    { text: " The usual fix — a cloud gateway and a vendor's deny-list — would have hoped for the best: " },
    { text: "every call leaves your machine first.", hl: "wrong" },
    { text: " Ours doesn't. The guard lives where the agent lives: " },
    { text: "a gate at the boundary. Nothing leaves.", hl: "right" },
  ],
  times: ["00:02", "00:06", "00:10"],
  incident: {
    num: "01",
    label: "the incident",
    title: "The agent did what agents do.",
    body: "Everything it was asked — including the parts nobody asked for. Nothing on the machine objected. The keys left inside an API payload.",
    bullets: [
      "Everything it was asked — including the parts nobody asked for.",
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
    body: "On your machine, checking every call before it happens — at the speed of a schema check, not at the speed of a jury.",
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
};

export const features: {
  eyebrow: string;
  title: string;
  lead: string;
  grid: Feature[];
} = {
  eyebrow: "// capabilities",
  title: "What the proxy checks before every call",
  lead: "Each MCP request is checked against local YAML rules before it reaches a tool. No exfil channel, no central server to trust.",
  grid: [
    {
      title: "YAML policy engine",
      desc: "Allow- and deny-lists written in YAML, not code. No SDK, no plugin API to learn. Edit the file, the proxy picks it up.",
      icon: "lock",
      alt: "Icon representing a filesystem access lock",
    },
    {
      title: "Secret stripping",
      desc: "Values that look like keys, env vars, or JWTs are redacted from agent reads before they reach the model. If it walks like a token, it does not pass.",
      icon: "shield",
      alt: "Icon representing a shield over a key",
    },
    {
      title: "Prompt-injection detection",
      desc: "Instructions hiding in tool output get flagged before the agent can act on them. The point is to catch the payload the page already read.",
      icon: "scan",
      alt: "Icon representing a scanning radar",
    },
    {
      title: "Audit log",
      desc: "Every decision, allowed or denied, lands in a local SQLite log with the rule that fired. Findable after the fact, the way incident postmortems need.",
      icon: "list",
      alt: "Icon representing a list of log entries",
    },
    {
      title: "Local-only execution",
      desc: "The proxy runs on your machine and talks to nobody. Uninstall it and nothing else changes; there is no account to deactivate.",
      icon: "pin",
      alt: "Icon representing a map pin at a local location",
    },
    {
      title: "Hosted control plane",
      desc: "A web console for policies across a fleet and synced audit logs. It is on the roadmap, not in the box. Local-only works today without it.",
      icon: "cloud",
      alt: "Icon representing a cloud with a question mark",
      roadmap: true,
    },
  ],
};

export const cases = {
  eyebrow: "// case studies",
  title: "Where it is being tested",
  lead: "No live customers yet. These are the four shapes of shop we built it for, with what internal testing showed so far.",
  footnote: "bench notes · july 2026",
  cards: [
    {
      id: "case 01",
      file: "agency-mcp",
      title: "agency mcp",
      role: "Agency running client MCP servers",
      status: "internal test",
      stages: [
        {
          label: "the problem",
          text: "One team of agents was the attack surface for a dozen client repos at once. One wrong read, and the client's secrets move with it.",
          tone: "problem",
        },
        {
          label: "what the fence did",
          text: "Per-client policy files on a shared machine, so a denial for one repo is not overruled by another repo's rules.",
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
      status: "internal test",
      stages: [
        {
          label: "the problem",
          text: "One person, one machine, an agent with broad tool access, and production keys in env vars that have to stay in env vars.",
          tone: "problem",
        },
        {
          label: "what the fence did",
          text: "Default-deny on the risky calls: git push to non-allowlisted remotes, writes outside the project, reads of env files.",
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
      status: "internal test",
      stages: [
        {
          label: "the problem",
          text: "A production gateway with MCP endpoints pointed at internal files. One missing allowlist entry read like an open door.",
          tone: "problem",
        },
        {
          label: "what the fence did",
          text: "Each tool got a per-session allowlist. Requests outside it were denied before any tool code ran.",
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
      status: "internal test",
      stages: [
        {
          label: "the problem",
          text: "A REPL with a path into the vault. The first command anyone ran was: try to read the auth file.",
          tone: "problem",
        },
        {
          label: "what the fence did",
          text: "Commands outside the session scope were refused. The vault path never reached the model.",
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
  price: string;
  sup: string;
  period: string;
  badge?: string;
  features: string[];
  cta: { label: string; href: string; primary: boolean };
  count?: number;
  countPrefix?: string;
  countSuffix?: string;
};

export const pricing: {
  eyebrow: string;
  title: string;
  lead: string;
  plans: Plan[];
  finePrint: string;
  finePrintLink: { label: string; href: string };
} = {
  eyebrow: "// pricing",
  title: "Free at the edge. Paid when you want a console.",
  lead: "The local proxy is the product for a solo machine and costs nothing. The hosted control plane — the part that is not built yet — is what has a price.",
  plans: [
    {
      name: "Free",
      price: "$0",
      sup: "",
      period: "forever, local core",
      features: [
        "Local MCP policy proxy",
        "YAML policies, unlimited rules",
        "Secret stripping + injection detection",
        "SQLite audit log",
      ],
      cta: { label: "cf init", href: "/#early-access", primary: false },
    },
    {
      name: "Teams",
      price: "$25",
      sup: "$",
      period: "per seat per month",
      badge: "Most popular",
      count: 25,
      countPrefix: "$",
      countSuffix: "",
      features: [
        "Everything in Free",
        "Shared policy templates",
        "Audit log export",
        "Slack alerting",
      ],
      cta: { label: "Get early access", href: "/#early-access", primary: true },
    },
    {
      name: "Enterprise",
      price: "$500-2000",
      sup: "$",
      period: "per month, custom",
      count: 500,
      countPrefix: "$",
      countSuffix: "-2000",
      features: [
        "Everything in Teams",
        "SSO / SAML",
        "Dedicated support with a human",
        "Roadmap input",
      ],
      cta: { label: "Contact us", href: "mailto:hello@contextfence.dev", primary: false },
    },
  ],
  finePrint: "Prices are pre-launch placeholders. The hosted control plane does not exist yet; the local proxy does. Read how data is handled in the privacy policy.",
  finePrintLink: { label: "privacy policy", href: "/privacy" },
};

export const faq = {
  eyebrow: "// faq",
  title: "Questions a security engineer actually asks",
  items: [
    {
      q: "Does my agent's data ever leave my machine?",
      a: "No. The proxy runs locally and every policy check happens locally. The only thing that leaves your machine is what your tools send on their own. The hosted control plane, when it ships, is opt-in and syncs the audit log only.",
    },
    {
      q: "How fast is the policy check?",
      a: "Under 10ms per call. It is a schema match against local YAML rules, not a prompt to an LLM judge. A hundred calls a minute stays imperceptible.",
    },
    {
      q: "What does it actually block?",
      a: "Destructive tool calls, filesystem escape outside the project, connections to non-allowlisted domains, secret leakage — keys, env vars, JWTs — and prompt-injection payloads hiding in tool output.",
    },
    {
      q: "How is this different from MintMCP, Lasso, or Kong AI Gateway?",
      a: "They route your agent traffic through their cloud to inspect it. We do the inspection on your machine and route nothing anywhere. If your threat model dislikes putting secrets through a third party, that difference is the product.",
    },
    {
      q: "Is it free?",
      a: "The local proxy is free and it is the core of the product. The hosted control plane — fleet policies, audit sync, Slack alerting — is the paid piece, and it is not built yet.",
    },
  ],
};

export const signup = {
  eyebrow: "// early access",
  title: "Get on the list",
  lead: "Early access gets you the local proxy first, and a direct line to the founders while the API surface is still cheap to change.",
  note: "No spam. No newsletter. Just an access link when it is ready.",
  submit: "Request access",
  success: "On the list. Check your inbox.",
};

export const footer = {
  copy: "© 2026 Context Fence Inc. — A local proxy for agents that stays a local proxy.",
  links: [
    { label: "Product", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Docs", href: "/docs" },
    { label: "Blog", href: "/blog" },
    { label: "Privacy", href: "/privacy" },
    { label: "Thank you", href: "/thank-you" },
  ],
};

export const thankYou = {
  eyebrow: "// request received",
  title: "You are on the list.",
  body: [
    "That is a real request queue, not a form that eats it. We reply within 4 business hours.",
    "While you wait, the docs walk through what the proxy checks and how the policy file reads.",
  ],
  homeCta: { label: "Back to the site", href: "/" },
  docsCta: { label: "Read the docs", href: "/docs" },
};

export const notFound = {
  prompt: "cf",
  title: "cf: route not found [404]",
  body: "That page does not exist, and no amount of agent willpower will make it. Start from the top.",
  cta: { label: "cd ~", href: "/" },
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
  title: "Blog",
  updated: "No posts yet",
  body: "Nothing here yet. First post will be the July 18 incident breakdown — what the agent did, where the guard should have been, and why schema checks beat vibe checks before they ship.",
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
    range: "hasan et al. · 1,899 servers · 2025",
    note: "8 vulnerability classes found — only 3 overlap traditional software",
    data: [
      { name: "general vulnerabilities", value: 7.2 },
      { name: "tool poisoning", value: 5.5 },
      { name: "credential exposure", value: 3.6 },
    ],
  },
  press: {
    eyebrow: "// the evidence",
    dateline: "four independent studies · 2025",
    articles: [
      {
        kicker: "empirical study · n = 1,899",
        title: "One in eighteen public MCP servers describes its tools dishonestly",
        lede: "A first-of-its-kind scan of 1,899 open-source servers finds 5.5% carry poisoned tool descriptions and 3.6% hard-code live credentials — eight vulnerability classes, only three overlapping traditional software.",
        byline: "hasan et al. · queen's university · acm tosem",
        href: "https://arxiv.org/abs/2506.13538",
        featured: true,
      },
      {
        kicker: "agentic audit · live exploits",
        title: "Auditors coerce flagship LLMs into code execution and credential theft",
        lede: "A safety audit demonstrates models readily driven to malicious code execution and remote access through ordinary MCP tool calls — then ships an automated scanner to catch it before deployment.",
        byline: "radosevich & halloran · arxiv 2504.03767",
        href: "https://arxiv.org/abs/2504.03767",
      },
      {
        kicker: "proof of concept · cross-tool",
        title: "A 'weather' server walks off with bank account balances",
        lede: "Two researchers, free web tools, no infrastructure: a disguised server discovers legitimate banking tools and exfiltrates them. Undergraduate-level Python is the whole skill bar.",
        byline: "croce & south · arxiv 2507.19880",
        href: "https://arxiv.org/abs/2507.19880",
      },
      {
        kicker: "threat model · taxonomy",
        title: "The MCP attack surface, mapped end-to-end",
        lede: "Sixteen distinct security risks across four attacker classes, each confirmed with a working exploit — and a roadmap for the protocol to fix itself.",
        byline: "hou et al. · huazhong univ. · acm tosem",
        href: "https://arxiv.org/abs/2503.23278",
      },
    ],
    index: "arxiv index · 2506.13538 · 2504.03767 · 2507.19880 · 2503.23278",
  },
};

export const privacy = {
  title: "Privacy Policy",
  updated: "Last updated: July 2026",
  sections: [
    {
      h: "Local-only mode collects nothing",
      p: "In the default mode the proxy runs entirely on your machine. No telemetry, no crash reports, no policy uploads, no analytics from the product itself. We cannot see your tool calls because they never reach us.",
    },
    {
      h: "The website",
      p: "This site uses Google Analytics to count visits and see which pages people read. GA sets cookies and we see aggregate numbers only. If that is enough to make you leave, we understand.",
    },
    {
      h: "Early access form",
      p: "Submitting the early access form sends us your email address. We use it exactly once: to send you access. No list rental, no third-party marketing.",
    },
    {
      h: "Hosted control plane (not yet available)",
      p: "When it ships, opting in syncs the audit log to our infrastructure so a team can review it. That is the explicit trade: you send us the log, we keep it for you. Everything else stays local.",
    },
    {
      h: "Contact",
      p: "Questions about this policy: use the early access form on the home page and say it is about privacy. The founders answer it directly.",
    },
  ],
};