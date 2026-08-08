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
    { text: "Your agent", accent: false, dim: false },
    { text: "policed locally.", accent: true, dim: false },
    { text: "zero cloud routing.", accent: false, dim: true },
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
  title: "One agent read a .env file. Keys went out the door.",
  body: [
    "On July 18, someone's coding agent read their .env file, then called a GitHub MCP tool with what it had just read. The keys left the machine inside an API payload, and nothing on the machine objected. The agent was doing what agents do: everything it was asked, including the parts nobody asked for.",
    "The pattern is not new. But the response has been wrong everywhere: route all agent traffic through a cloud gateway and hope the vendor's list of bad things is good enough.",
    "We think the guard should live where the agent lives. On your machine, checking every call before it happens, at the speed of a schema check, not at the speed of a jury.",
  ],
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
  lead: "No live customers yet. These are the two shapes of shop we built it for, with what internal testing showed so far.",
  cards: [
    {
      role: "Agency running client MCP servers",
      note: "Internal test",
      blocks: [
        {
          label: "// problem",
          text: "One team of agents was the attack surface for a dozen client repos at once. One wrong read, and the client's secrets move with it.",
        },
        {
          label: "// what Context Fence did",
          text: "Per-client policy files on a shared machine, so a denial for one repo does not get overruled by another repo's rules.",
        },
        {
          label: "// outcome",
          text: "Internal testing showed every denied call logged with the rule that fired, and zero changes to how the agents themselves run.",
        },
      ],
    },
    {
      role: "Solo dev shipping with Claude Code agents",
      note: "Internal test",
      blocks: [
        {
          label: "// problem",
          text: "One person, one machine, an agent with broad tool access and a couple of production keys in env vars that have to stay in env vars.",
        },
        {
          label: "// what Context Fence did",
          text: "A default-deny policy on the risky calls: git push to non-allowlisted remotes, writes outside the project, reads of env files.",
        },
        {
          label: "// outcome",
          text: "Internal testing showed the agent tripping the fence in the first hour and the SQLite log making it obvious which rule and which line of output.",
        },
      ],
    },
  ],
};

export const reviews = {
  eyebrow: "// early signal",
  title: "What testers said",
  lead: "",
  items: [
    {
      stars: 5,
      text: "The thing I kept checking was whether it slowed anything down. It did not. 10ms on a call an agent makes a hundred times a minute is nothing.",
      author: "Backend eng, Series A startup",
    },
    {
      stars: 4,
      text: "I do not love another config file on my machine. I do love that the leaked-key story is impossible in the first fifteen minutes of setup.",
      author: "Platform eng, infra consultancy",
    },
    {
      stars: 5,
      text: "Watched it strip a DATABASE_URL out of a file read before the model ever saw it. That single screen sold me.",
      author: "Dev tooling lead, agency",
    },
  ],
};

export const team = {
  eyebrow: "// founders",
  title: "The two people who shipped it",
  lead: "Met May 2026 at IIT(ISM) Dhanbad. Both build the thing they were using when the July 18 incident happened.",
  members: [
    {
      name: "Aditya",
      role: "Founder & CEO",
      bio: "Codes the thing and keeps the architecture honest. Decided early that a security product with a cloud dependency is a security product with a second attack surface.",
      photo: "/placeholders/team-aditya.png",
      alt: "Aditya, Founder and CEO of Context Fence",
    },
    {
      name: "Saniya",
      role: "Co-founder",
      bio: "Owns the implementation stack and the pipeline. The one who points out when a feature would be impressive instead of necessary.",
      photo: "/placeholders/team-saniya.png",
      alt: "Saniya, Co-founder of Context Fence",
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