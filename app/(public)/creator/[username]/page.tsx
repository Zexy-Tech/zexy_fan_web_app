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
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    setIsChecking(false);
  }, []);
  
  // Show loading while checking device
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Render mobile profile for mobile/tablet users
  return <LinkMeCreatorProfile username={username} />;
}

// Old implementation (kept for reference, can be removed later)
/*
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCreatorByUsername, useCreatorContentByUsername } from '@/hooks/useFeed';
import { useCreatorPlans } from '@/hooks/useSubscriptions';
import { useAuthContext } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Lock, Users, LogIn } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

export default function PublicCreatorProfilePageOld() {
*/
