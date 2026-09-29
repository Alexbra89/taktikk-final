import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [], 
  },
  // ESLint er en egen sjekk (npm run lint), ikke en del av bygget: en lint-regel
  // skal ikke kunne stoppe en deploy. Typene sjekkes fortsatt av bygget.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);