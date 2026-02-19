/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@fundi-wangu/api-client',
    '@fundi-wangu/shared-types',
    '@fundi-wangu/ui-components',
    '@fundi-wangu/utils',
  ],
};

module.exports = nextConfig;
