'use client';

import { useEffect } from 'react';
import { useAuthContext } from '@/hooks/useAuth';
import { toUserCode } from '@/lib/userCode';
import { useSecurity } from '@/hooks/useSecurity';

export function SecurityShield() {
  useEffect(() => {
    // 1. Disable Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Disable Keyboard Shortcuts (Inspect, Save, Print)
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD/CTRL + S (Save)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
      }
      // CMD/CTRL + P (Print)
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
      }
      // CMD/CTRL + U (View Source)
      if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
        e.preventDefault();
      }
      // F12 or CMD/CTRL + SHIFT + I (Inspect)
      if (e.key === 'F12' || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
      }
    };

    // 3. Disable Drag and Drop of media
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG' || (e.target as HTMLElement).tagName === 'VIDEO') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return null;
}

export function Watermark() {
  const { user } = useAuthContext();
  const { watermarkEnabled } = useSecurity();

  if (!user || !watermarkEnabled) return null;

  const userCode = user.user_code || toUserCode(user.id, user.role);
  const watermarkText = `ZEXY | ${user.username || userCode} | ${new Date().toLocaleDateString()}`;

  return (
    <div 
      className="pointer-events-none fixed inset-0 z-[9999] flex select-none items-center justify-center overflow-hidden opacity-[0.03]"
      style={{ transform: 'rotate(-30deg)' }}
    >
      <div className="flex flex-wrap gap-20 whitespace-nowrap text-3xl font-bold text-foreground">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i}>{watermarkText}</span>
        ))}
      </div>
    </div>
  );
}
