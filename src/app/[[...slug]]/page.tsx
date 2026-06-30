import ClientApp from './ClientApp';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || [];
  
  if (slug.length > 0) {
    const lastSegment = slug[slug.length - 1];
    if (lastSegment.includes('.js') || lastSegment.includes('.tsx') || lastSegment.includes('.ts') || lastSegment.includes('.map')) {
      return {};
    }
  }
  
  if (slug[0] === 'article' && slug[1]) {
    try {
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/deshache-lok-auth/databases/(default)/documents/articles/${slug[1]}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.fields) {
           const title = data.fields.title?.stringValue || '';
           const excerpt = data.fields.excerpt?.stringValue || data.fields.content?.stringValue?.substring(0, 150) || '';
           const imageUrl = data.fields.imageUrl?.stringValue || '';
           
           return {
              title: title,
              description: excerpt,
              openGraph: {
                title: title,
                description: excerpt,
                images: imageUrl ? [imageUrl] : undefined,
              },
              twitter: {
                card: 'summary_large_image',
                title: title,
                description: excerpt,
                images: imageUrl ? [imageUrl] : undefined,
              }
           };
        }
      }
    } catch (e) {
      console.error("Error fetching article metadata via REST:", e);
    }
  }
  
  return {
    title: "देशाचे लोक - News",
    description: "Latest news and updates",
  };
}

export default async function CatchAllRoute({ params }: { params: Promise<{ slug?: string[] }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || [];
  
  if (slug.length > 0) {
    const lastSegment = slug[slug.length - 1];
    if (lastSegment.includes('.js') || lastSegment.includes('.tsx') || lastSegment.includes('.ts') || lastSegment.includes('.map') || lastSegment.includes('.css')) {
      notFound();
    }
  }

  return <ClientApp />;
}
