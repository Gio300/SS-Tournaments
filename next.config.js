/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.GITHUB_REPO ? `/${process.env.GITHUB_REPO}` : '',
  assetPrefix: process.env.GITHUB_REPO ? `/${process.env.GITHUB_REPO}/` : undefined,
  images: { unoptimized: true },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
