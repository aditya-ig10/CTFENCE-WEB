/** @type {import('next').NextConfig} */
const nextConfig = {
  // this repo lives under an iCloud-synced folder, which evicts .next mid-run.
  // keep the build output on local disk (see npm script "build:local" note in README).
  distDir: "/var/folders/90/z_5cnf7j6zx_mdw41mxrp5000000gn/T/opencode/cf-next",
};

export default nextConfig;
