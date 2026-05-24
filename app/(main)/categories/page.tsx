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
  BookOpen,
  Coffee,
  Plane,
  Palette,
  Laptop,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { Loader2 } from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  fitness: Dumbbell,
  music: Music,
  comedy: Users,
  education: BookOpen,
  lifestyle: Coffee,
  gaming: Gamepad2,
  fashion: Shirt,
  food: UtensilsCrossed,
  travel: Plane,
  art: Palette,
  tech: Laptop,
  sports: Trophy,
  other: Sparkles,
};

const CATEGORY_ICON_STYLES: Record<string, string> = {
  fitness: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  music: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  comedy: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  education: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  lifestyle: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  gaming: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  fashion: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
  food: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  travel: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  art: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  tech: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
  sports: 'bg-red-500/15 text-red-600 dark:text-red-400',
  other: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  fitness: 'Workout routines, personal training, and health advice',
  music: 'Original songs, covers, and behind-the-scenes music creation',
  comedy: 'Stand-up clips, skits, and hilarious commentary',
  education: 'Tutorials, courses, and educational content',
  lifestyle: 'Daily vlogs, routines, and lifestyle inspiration',
  gaming: 'Gameplay streams, reviews, and gaming community',
  fashion: 'Style tips, lookbooks, and fashion trends',
  food: 'Recipes, cooking tutorials, and food reviews',
  travel: 'Travel guides, adventures, and exploration',
  art: 'Digital art, traditional painting, and creative processes',
  tech: 'Gadget reviews, coding tutorials, and tech news',
  sports: 'Sports highlights, training, and commentary',
  other: 'Diverse and unique content from various creators',
};

export default function CategoriesPage() {
  const { data: categories, isLoading, error } = useCategories();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !categories) {
    return (
      <div className="-mt-2 py-12 text-center text-muted-foreground">
        Failed to load categories. Please try again.
      </div>
    );
  }

  return (
    <div className="-mt-2 divide-y divide-border">
      {categories.map((category) => {
        const Icon = CATEGORY_ICONS[category.slug] ?? Sparkles;
        const iconStyle = CATEGORY_ICON_STYLES[category.slug] ?? 'bg-muted text-muted-foreground';
        const description = CATEGORY_DESCRIPTIONS[category.slug] ?? `Explore ${category.display_name} creators`;

        return (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="-mx-4 flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40 sm:-mx-0 sm:px-0"
          >
            <div
              className={cn(
                'flex size-14 shrink-0 items-center justify-center rounded-lg',
                iconStyle
              )}
            >
              <Icon className="size-7" aria-hidden />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold leading-tight">{category.display_name}</p>
              <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{description}</p>
            </div>

            <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        );
      })}
    </div>
  );
}
