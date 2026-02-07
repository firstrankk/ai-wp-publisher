/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/shared'],
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
