/**
 * Public Creator Profile Page
 * 
 * Handles device detection and routes to appropriate view:
 * - Desktop: Block page
 * - Mobile/Tablet: Mobile profile with customization
 */

'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LinkMeCreatorProfile } from '@/components/linkme-creator-profile';
import { Loader2 } from 'lucide-react';

export default function PublicCreatorProfilePage() {
  const params = useParams();
  const username = params.username as string;
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
  
  // Render mobile profile for mobile/tablet users
  return <LinkMeCreatorProfile username={username} />;
}

