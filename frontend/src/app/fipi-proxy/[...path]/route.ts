import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export async function GET(request: NextRequest) {
  const targetUrl =
    request.nextUrl.pathname.replace(/^\/fipi-proxy/, 'https://ege.fipi.ru') +
    request.nextUrl.search;

  return new Promise<NextResponse>((resolve) => {
    https
      .get(
        targetUrl,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
          rejectUnauthorized: false,
        },
        (res) => {
          const chunks: Buffer[] = [];

          res.on('data', (chunk) => chunks.push(chunk));

          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const headers = new Headers();

            if (res.headers['content-type']) {
              headers.set('Content-Type', res.headers['content-type']);
            }
            headers.set('Cache-Control', 'public, max-age=31536000, immutable');

            resolve(
              new NextResponse(buffer, {
                status: res.statusCode || 200,
                headers,
              }),
            );
          });
        },
      )
      .on('error', (err) => {
        console.error('FIPI Proxy Error:', err);
        resolve(new NextResponse('Proxy Error', { status: 500 }));
      });
  });
}
