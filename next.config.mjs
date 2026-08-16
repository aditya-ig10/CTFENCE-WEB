/** @type {import('next').NextConfig} */
const nextConfig = {
  // this repo lives under an iCloud-synced folder, which evicts .next mid-run.
  // keep the build output on local disk when developing (see "build:local" in README).
  // Vercel builds expect the default .next output directory, so never override it there.
  ...(process.env.VERCEL
    ? {}
    : { distDir: "/var/folders/90/z_5cnf7j6zx_mdw41mxrp5000000gn/T/opencode/cf-next" }),
  async headers() {
    return [
      // llms.txt and its full dump must read as markdown for AI crawlers
      {
        source: "/llms.txt",
        headers: [{ key: "Content-Type", value: "text/markdown; charset=utf-8" }],
      },
      {
        source: "/llms-full.txt",
        headers: [{ key: "Content-Type", value: "text/markdown; charset=utf-8" }],
      },
      // llms files are for machines; keep them out of index
      {
        source: "/llms.txt",
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
      {
        source: "/llms-full.txt",
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
    ];
  },
};

export default nextConfig;
