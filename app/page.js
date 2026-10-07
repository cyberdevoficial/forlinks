import LinkPage from './components/LinkPage';
import { getPublicConfig } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const c = await getPublicConfig();
  return {
    title: c.seo.title,
    description: c.seo.description,
    openGraph: { title: c.seo.title, description: c.seo.description, type: 'website' },
  };
}

export default async function Page() {
  const config = await getPublicConfig();
  return <LinkPage config={config} />;
}
