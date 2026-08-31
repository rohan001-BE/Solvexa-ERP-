/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pg", "pg-cloudflare"],
};

export default nextConfig;
