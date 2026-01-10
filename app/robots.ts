import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/dashboard/', '/settings/', '/inbox/', '/api/'],
        },
        sitemap: 'https://verality.io/sitemap.xml',
    };
}
