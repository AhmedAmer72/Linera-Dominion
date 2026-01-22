/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  
  // Environment variables for production build
  env: {
    NEXT_PUBLIC_APP_ID: process.env.NEXT_PUBLIC_APP_ID || '441310d20f19153c90b5b13974b02ffcedd98d74614afec6ea208061c332cc9d',
    NEXT_PUBLIC_LINERA_APP_ID: process.env.NEXT_PUBLIC_LINERA_APP_ID || '441310d20f19153c90b5b13974b02ffcedd98d74614afec6ea208061c332cc9d',
    NEXT_PUBLIC_LINERA_FAUCET_URL: process.env.NEXT_PUBLIC_LINERA_FAUCET_URL || 'https://faucet.testnet-conway.linera.net',
  },
  
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
};

module.exports = nextConfig;
