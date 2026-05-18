'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CreatorCard } from '@/components/creator-card';
import { getCategoryBySlug, getCreatorsByCategorySlug } from '@/services/creatorCategories';

export default function CategoryCreatorsPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const category = getCategoryBySlug(slug);
  const creators = getCreatorsByCategorySlug(slug);

  if (!category) {
    return (
      <div className="-mt-2 py-12 text-center">
        <p className="text-sm text-muted-foreground">Category not found.</p>
        <Link href="/categories" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Back to Categories
        </Link>
      </div>
    );
  }

  if (creators.length === 0) {
    return (
      <div className="-mt-2 py-12 text-center">
        <p className="text-sm text-muted-foreground">No creators in this category yet.</p>
        <Link href="/categories" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Back to Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="-mt-2 space-y-4">
      <p className="text-sm text-muted-foreground">{category.description}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {creators.map((creator) => (
          <Link key={creator.id} href={`/creator/${creator.username}`} className="block">
            <CreatorCard creator={creator} />
          </Link>
        ))}
      </div>
    </div>
  );
}
