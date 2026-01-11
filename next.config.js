/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable trailing slash to prevent 307 redirects on API routes
  trailingSlash: false,
  // Skip middleware for webhook routes
  skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;

