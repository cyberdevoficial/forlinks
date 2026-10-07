import { getMedia } from '@/lib/store';
import { isMediaName } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { name } = await params;
  if (!isMediaName(name)) return new Response('Not found', { status: 404 });
  try {
    const r = await getMedia(name);
    if (!r || r.statusCode !== 200) return new Response('Not found', { status: 404 });
    return new Response(r.stream, {
      headers: {
        'Content-Type': r.blob.contentType,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
