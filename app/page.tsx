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

const HOME_TITLE = "Context Fence — Local MCP Policy Proxy for AI Coding Agents";

const HOME_DESCRIPTION =
  "Context Fence is a local MCP policy proxy for AI coding agents: schema-based checks under 10ms, secret stripping, append-only audit log, zero cloud routing.";

const HOME_KEYWORDS = [
  "context fence",
  "MCP policy proxy",
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
  ogTitle: "Context Fence — MCP Policy Proxy",
  ogDescription: "Local MCP policy proxy that stops AI agents leaking secrets.",
  twitterDescription:
    "Context Fence is a local MCP policy proxy for AI coding agents: schema-based tool call checks under 10ms, secret stripping, append-only audit log, zero cloud routing. Free for macOS, Windows and Linux.",
});

const SOFTWARE_KEYWORDS = [
  "local policy proxy",
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