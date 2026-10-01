import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
    reactStrictMode: true,
    devIndicators: false,
    allowedDevOrigins: ['192.168.10.105'],
    async rewrites() {
        return [{ source: '/api/:path*', destination: 'https://format-studio-api.onrender.com/api/:path*' }];
    },
};
export default nextConfig;
