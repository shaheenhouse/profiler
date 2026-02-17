import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Profiler - Portfolio & Resume Builder',
    short_name: 'Profiler',
    description: 'Create stunning professional portfolios and AI-powered resumes',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0b',
    theme_color: '#6366f1',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
