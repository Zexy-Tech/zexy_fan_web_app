'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronRight,
  Dumbbell,
  Gamepad2,
  Music,
  Shirt,
  Sparkles,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoryCreatorCount, getCreatorCategories } from '@/services/creatorCategories';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  fitness: Dumbbell,
  fashion: Shirt,
  music: Music,
  beauty: Sparkles,
  gaming: Gamepad2,
  food: UtensilsCrossed,
};

const CATEGORY_ICON_STYLES: Record<string, string> = {
  fitness: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  fashion: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
  music: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  beauty: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  gaming: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  food: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
};

export default function CategoriesPage() {
  const categories = getCreatorCategories();

  return (
    <div className="-mt-2 divide-y divide-border">
      {categories.map((category) => {
        const count = getCategoryCreatorCount(category.slug);
        const Icon = CATEGORY_ICONS[category.slug] ?? Sparkles;
        const iconStyle = CATEGORY_ICON_STYLES[category.slug] ?? 'bg-muted text-muted-foreground';

        return (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="-mx-4 flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40 sm:-mx-0 sm:px-0"
          >
            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-lg',
                iconStyle
              )}
            >
              <Icon className="h-7 w-7" aria-hidden />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold leading-tight">{category.name}</p>
              <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{category.description}</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>
                  {count} creator{count === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        );
      })}
    </div>
  );
}
