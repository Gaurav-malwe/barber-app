/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip lint failures during production builds in Amplify
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
