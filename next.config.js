/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: 'tsconfig.json',
  },
  images: { unoptimized: true },
  webpack: (config) => {
    config.parallelism = 1;
    config.cache = false;
    return config;
  },
};

module.exports = nextConfig;
