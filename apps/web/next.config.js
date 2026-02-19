/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@fundi-wangu/api-client',
    '@fundi-wangu/shared-types',
    '@fundi-wangu/ui-components',
    '@fundi-wangu/utils',
    '@fundi-wangu/i18n-strings',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.fundiwangu.co.tz' },
      { protocol: 'https', hostname: '*.cloudinary.com' },
    ],
  },
  async rewrites() {
    return [
      { source: '/sw/:path*', destination: '/:path*' },
    ];
  },
};

module.exports = nextConfig;
