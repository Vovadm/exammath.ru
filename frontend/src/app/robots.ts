import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/tasks'],
        disallow: ['/admin', '/profile', '/variants', '/api/'],
      },
    ],
    sitemap: 'https://exammath.ru/sitemap.xml',
    host: 'https://exammath.ru',
  };
}
