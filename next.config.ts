
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/v1/create-qr-code/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
      "https://9000-firebase-studio-1747293640453.cluster-l6vkdperq5ebaqo3qy4ksvoqom.cloudworkstations.dev"
    ]
  }
};

export default nextConfig;
