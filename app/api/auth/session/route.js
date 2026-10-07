import { getSession } from '@/lib/auth';
import { json } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const s = await getSession();
    return json(s ? { authenticated: true, mustChange: s.mustChange, user: s.user } : { authenticated: false });
  } catch {
    return json({ authenticated: false });
  }
}
