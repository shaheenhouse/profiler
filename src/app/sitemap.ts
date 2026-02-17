import { MetadataRoute } from 'next';
import { getAllPublicPortfolios } from '@/lib/storage';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://profiler.app';

  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/auth/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic portfolio pages
  try {
    const portfolios = await getAllPublicPortfolios();
    const portfolioRoutes: MetadataRoute.Sitemap = portfolios.map((p) => ({
      url: `${baseUrl}/p/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
    return [...staticRoutes, ...portfolioRoutes];
  } catch {
    return staticRoutes;
  }
}
