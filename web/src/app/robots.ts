import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://safar.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/account/',
          '/dashboard/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
          '/verify-2fa',
          '/messages/',
          '/payments/',
          '/subscriptions/',
          '/notifications/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

