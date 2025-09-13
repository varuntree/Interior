/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'deifkwefumgah.cloudfront.net',
        pathname: '/shadcnblocks/**',
      },
    ],
  },
};

module.exports = nextConfig;

