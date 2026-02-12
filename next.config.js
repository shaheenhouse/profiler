/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Allow local images from /uploads directory
    unoptimized: false,
  },
  // Enable static export for file-based deployment if needed
  // output: 'export',
}

module.exports = nextConfig
