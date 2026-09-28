import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Features from "@/components/Features";
import CaseStudies from "@/components/CaseStudies";
import Pricing from "@/components/Pricing";
import Faq from "@/components/Faq";
import SignupForm from "@/components/SignupForm";
import StickyCta from "@/components/StickyCta";
import WebPageSchema from "@/components/WebPageSchema";
import { site } from "@/content/copy";
import { baseMetadata, softwareAppSchema } from "@/lib/seo";

const HOME_TITLE = "Context Fence: DLP for AI Agents. Stop Secret Leaks Locally.";

const HOME_DESCRIPTION =
  "Context Fence is a local firewall for what AI agents send out. It checks data before it leaves your machine and blocks secrets. Today it protects MCP tools. Version 2.1 is coming.";

const HOME_KEYWORDS = [
  "context fence",
  "AI agent DLP",
  "stop AI agent secret leaks",
  "local AI agent firewall",
  "AI agent security",
  "LLM tool call guardrails",
  "local AI proxy",
  "block AI agent secrets",
  "MCP security",
  "agent audit log",
  "prompt injection defense",
  "local LLM gateway",
];

export const metadata = baseMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: "/",
  keywords: HOME_KEYWORDS,
  ogTitle: "Context Fence: DLP for AI Agents",
  ogDescription: "A local firewall for what AI agents send out. Blocks secrets before they leave your machine.",
  twitterDescription:
    "Context Fence checks what your AI agent sends out and blocks secrets before they leave. Today it protects MCP tools. Version 2.1 is coming. Free for macOS, Windows and Linux.",
});

const SOFTWARE_KEYWORDS = [
  "local AI agent firewall",
  "MCP tool call checks",
  "schema-based guardrails",
  "secret leakage blocking",
  "append-only audit log",
  "prompt injection defense",
  "allowlist connections",
];

export default function Home() {
  const appLdJson = softwareAppSchema({
    name: site.name,
    description: HOME_DESCRIPTION,
    path: "/",
    keywords: SOFTWARE_KEYWORDS,
  });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appLdJson) }}
      />
      <WebPageSchema
        name={site.name}
        description={HOME_DESCRIPTION}
        path="/"
      />
      <Hero />
      <Problem />
      <Features />
      <CaseStudies />
      <Pricing />
      <Faq />
      <SignupForm />
      <StickyCta />
    </>
  );
}