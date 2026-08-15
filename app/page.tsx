import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Problem from "@/components/Problem";
import Features from "@/components/Features";
import CaseStudies from "@/components/CaseStudies";
import Pricing from "@/components/Pricing";
import Faq from "@/components/Faq";
import SignupForm from "@/components/SignupForm";
import StickyCta from "@/components/StickyCta";
import { site } from "@/content/copy";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: site.name,
  description:
    "A local MCP policy proxy for AI coding agents. Schema-based checks under 10ms, secret stripping, zero cloud routing.",
  path: "/",
});

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
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