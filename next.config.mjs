/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Standaard lint Next alleen app/, components/, lib/ en pages/ — root-bestanden
    // als middleware.ts vielen daarbuiten. '.' pakt het hele project mee
    // (node_modules en .next worden door next lint zelf al genegeerd).
    dirs: ['.'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
