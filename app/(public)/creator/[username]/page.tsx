/**
 * Public Creator Profile Page
 * 
 * Handles device detection and routes to appropriate view:
 * - Desktop: Block page
 * - Mobile/Tablet: Mobile profile with customization
 */

'use client';

import { url } from '@/lib/validation/fields';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LinkMeCreatorProfile } from '@/components/linkme-creator-profile';
import { Loader2 } from '@/components/ui/icons';

export default function PublicCreatorProfilePage() {
  const params = useParams();
  // Profiles are linked by username, user code (ZX-CR-0042) or numeric id; anything else is not a creator.
  const username = url.username(params.username) ?? url.userRef(params.username) ?? '';
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Show loading while checking device
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!username) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 text-center text-sm text-muted-foreground">
        Creator not found.
      </div>
    );
  }

  // Render mobile profile for mobile/tablet users
  return <LinkMeCreatorProfile username={username} />;
}

