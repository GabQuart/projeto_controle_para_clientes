import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Permite qualquer caminho local (assets estáticos, rotas de API,
    // query strings como ?kind=folder). "search" omitido = qualquer query string permitida.
    localPatterns: [
      {
        pathname: '/**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'www.googleapis.com',
      },
    ],
  },
}

export default nextConfig
