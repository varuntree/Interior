/** @type {import('next').NextConfig} */
const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').hostname || undefined
  } catch {
    return undefined
  }
})()

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Existing remote pattern
      {
        protocol: 'https',
        hostname: 'deifkwefumgah.cloudfront.net',
        pathname: '/shadcnblocks/**',
      },
      // Allow Supabase Storage public URLs
      ...(SUPABASE_HOST
        ? [
            {
              protocol: 'https',
              hostname: SUPABASE_HOST,
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig;
