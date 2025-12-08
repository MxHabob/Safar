import { MetadataRoute } from 'next';
import { listListingsApiV1ListingsGet } from '@/generated/actions/listings';
import { getGuidesApiV1TravelGuidesGet } from '@/generated/actions/travelGuides';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://safar.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/listings`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/travel`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Dynamic listings
  let listingPages: MetadataRoute.Sitemap = [];
  try {
    const listingsResult = await listListingsApiV1ListingsGet({
      query: { status: 'active', limit: 1000 },
    }).catch(() => null);

    const listings = listingsResult?.data?.items || [];
    listingPages = listings.map((listing: any) => ({
      url: `${baseUrl}/listings/${listing.id}`,
      lastModified: listing.updated_at ? new Date(listing.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error fetching listings for sitemap:', error);
  }

  // Dynamic travel guides
  let travelPages: MetadataRoute.Sitemap = [];
  try {
    const guidesResult = await getGuidesApiV1TravelGuidesGet({
      query: { status: 'published', limit: 1000 },
    }).catch(() => null);

    const guides = Array.isArray(guidesResult) ? guidesResult : guidesResult?.data || [];
    travelPages = guides.map((guide: any) => ({
      url: `${baseUrl}/travel/${encodeURIComponent(guide.city || guide.id)}`,
      lastModified: guide.updated_at ? new Date(guide.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Error fetching travel guides for sitemap:', error);
  }

  return [...staticPages, ...listingPages, ...travelPages];
}

