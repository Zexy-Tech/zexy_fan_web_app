/**
 * Exclusive Content Card
 * 
 * Displays a single exclusive content item with lock overlay for premium content.
 */

'use client';

import { ExclusiveContent } from '@/types/creator-profile';
import { Lock, Play, Image as ImageIcon, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExclusiveContentCardProps {
  content: ExclusiveContent;
  onUnlock: (contentId: number) => void;
  isAuthenticated: boolean;
}

/**
 * Get icon for content type
 */
function getContentIcon(media_type: 'image' | 'video' | 'audio') {
  switch (media_type) {
    case 'video':
      return Play;
    case 'audio':
      return Music;
    default:
      return ImageIcon;
  }
}

/**
 * Exclusive content card component
 * 
 * @param content - Content data
 * @param onUnlock - Callback when unlock button is clicked
 * @param isAuthenticated - Whether user is authenticated
 */
export function ExclusiveContentCard({ 
  content, 
  onUnlock, 
  isAuthenticated 
}: ExclusiveContentCardProps) {
  const Icon = getContentIcon(content.media_type);
  
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden group">
      {/* Thumbnail/Preview */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          background: content.isLocked
            ? 'linear-gradient(to bottom right, var(--profile-gradient-start), var(--profile-gradient-end))'
            : 'linear-gradient(to bottom right, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))',
        }}
      >
        <Icon className="h-12 w-12 text-white/50" />
      </div>
      
      {/* Locked Overlay */}
      {content.isLocked && (
        <div className="absolute inset-0 backdrop-blur-sm bg-black/30 flex flex-col items-center justify-center gap-3 p-4">
          <Lock className="h-8 w-8 text-white" />
          <p className="text-white font-semibold text-center text-sm">
            {content.title}
          </p>
          <Button
            size="sm"
            onClick={() => onUnlock(content.id)}
            className="bg-white text-black hover:bg-white/90"
          >
            {isAuthenticated ? (
              <>Join to Unlock</>
            ) : (
              <>Login to Unlock</>
            )}
          </Button>
        </div>
      )}
      
      {/* Unlocked Content Info */}
      {!content.isLocked && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white text-sm font-medium truncate">
            {content.title}
          </p>
        </div>
      )}
    </div>
  );
}
