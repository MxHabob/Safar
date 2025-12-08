import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Safar - Travel Guides & Stories',
    short_name: 'Safar',
    description: 'Discover amazing travel destinations, stories, and guides. Share your travel experiences and explore the world with Safar.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['travel', 'lifestyle', 'photography'],
    shortcuts: [
      {
        name: 'Browse Listings',
        short_name: 'Listings',
        description: 'Browse available accommodations',
        url: '/listings',
        icons: [{ src: '/logo.png', sizes: '96x96' }],
      },
      {
        name: 'Discover',
        short_name: 'Discover',
        description: 'Discover new destinations',
        url: '/discover',
        icons: [{ src: '/logo.png', sizes: '96x96' }],
      },
    ],
  }
}

