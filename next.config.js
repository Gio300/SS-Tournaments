/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' && process.env.GITHUB_REPO ? `/${process.env.GITHUB_REPO}` : '',
  assetPrefix: process.env.NODE_ENV === 'production' && process.env.GITHUB_REPO ? `/${process.env.GITHUB_REPO}/` : undefined,
  images: { unoptimized: true },
};

module.exports = nextConfig;
