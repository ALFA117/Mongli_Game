import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['three'],
  },
}

export default config
