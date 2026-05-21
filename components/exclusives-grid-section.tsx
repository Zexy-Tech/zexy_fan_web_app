/**
 * Exclusives Grid Section
 * 
 * Displays exclusive content in a responsive grid layout.
 */

'use client';

import { Content } from '@/services/feed';
import { ExclusiveContentCard } from '@/components/exclusive-content-card';
import { Lock, ImageOff } from 'lucide-react';
import { useAuthContext } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface ExclusivesGridSectionProps {
  content: Content[];
}

/**
 * Exclusives grid section component
 * 
 * @param content - Array of content items (filtered to locked/premium only)
 */
export function ExclusivesGridSection({ content }: ExclusivesGridSectionProps) {
  const { isAuthenticated } = useAuthContext();
  const router = useRouter();
  
  // Filter to only locked/premium content
  const exclusiveContent = content.filter(item => item.is_locked || item.is_paid);

  const handleUnlock = (contentId: number) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    router.push(`/content/${contentId}`);
  };
  
  return (
    <div className="px-4 py-6 space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Lock className="h-5 w-5" style={{ color: 'var(--profile-primary)' }} />
        <h2 className="text-lg font-bold">Exclusives</h2>
      </div>
      
      {/* Content Grid or Empty State */}
      {exclusiveContent.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {exclusiveContent.map((item) => (
            <ExclusiveContentCard
              key={item.id}
              content={{
                id: item.id,
                title: item.title,
                isLocked: item.is_locked,
                media_type: item.media?.[0]?.media_type || 'image',
                thumbnail_url: item.thumbnail_url,
                url: item.url,
              }}
              onUnlock={handleUnlock}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      ) : (
        <div className="py-10 flex flex-col items-center justify-center text-center space-y-3 bg-muted/30 rounded-xl border border-border/50 border-dashed">
          <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
            <ImageOff className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-sm">No exclusive content yet</p>
            <p className="text-xs text-muted-foreground">Check back soon — something exciting is coming!</p>
          </div>
        </div>
      )}
    </div>
  );
}
