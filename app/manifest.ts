import type { MetadataRoute } from "next";
import { site } from "@/content/copy";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.productLine}`,
    short_name: "Context Fence",
    description:
      "A local proxy that protects AI agents from leaking secrets. Today it covers MCP tool calls. Version 2.1 is coming.",
    start_url: "/",
    display: "standalone",
    background_color: "#050507",
    theme_color: "#050507",
    lang: "en",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
