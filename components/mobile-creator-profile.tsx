/**
 * Mobile Creator Profile
 * 
 * Main component for mobile-only creator profiles with customizable UI/UX.
 */

'use client';

import { useMemo } from 'react';
import { useCreatorByUsername, useCreatorContentByUsername } from '@/hooks/useFeed';
import { useCreatorProfileConfig } from '@/hooks/useCreatorProfile';
import { useCreatorPlans } from '@/hooks/useSubscriptions';
import { ProfileThemeProvider } from '@/components/profile-theme-provider';
import { CreatorIntroSection } from '@/components/creator-intro-section';
import { ActionButtonsSection } from '@/components/action-buttons-section';
import { ExclusivesGridSection } from '@/components/exclusives-grid-section';
import { SubscriptionCardSection } from '@/components/subscription-card-section';
import { BottomNavigation } from '@/components/bottom-navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getDefaultTheme } from '@/lib/validation/profile-config';
import { getDemoCreatorMembershipPlans } from '@/services/subscriptions';
import { getMediaUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MembershipPopup } from '@/components/membership-popup';
import { queryClient } from '@/lib/queryClient';

interface MobileCreatorProfileProps {
  username: string;
}

/**
 * Mobile creator profile component
 * 
 * @param username - Creator username
 */
export function MobileCreatorProfile({ username }: MobileCreatorProfileProps) {
  const router = useRouter();
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const { data: creator, isLoading: creatorLoading, error: creatorError } = useCreatorByUsername(username);
  const { data: config, isLoading: configLoading } = useCreatorProfileConfig(username);
  const { data: content, isLoading: contentLoading } = useCreatorContentByUsername(username);
  const { data: plans } = useCreatorPlans(creator?.id || 0);

  const membershipPlans = useMemo(() => {
    if (!creator) return [];
    if (plans?.length) return plans;
    return getDemoCreatorMembershipPlans(creator.id);
  }, [creator, plans]);
  
  // Loading state
  if (creatorLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Error state
  if (creatorError || !creator) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Creator not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Use default theme if config not available
  const theme = config?.theme || getDefaultTheme();
  const sections = config?.sections || [];
  const bottomNav = config?.bottomNav || [];
  
  // Sort and filter enabled sections
  const enabledSections = sections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);
  const hasActionsSection = enabledSections.some((s) => s.type === 'actions');
  const hasSubscriptionSection = enabledSections.some((s) => s.type === 'subscription' || s.type === 'membership');

  const handleSubscribeClick = () => {
    setIsMembershipOpen(true);
  };

  const handleMessageClick = () => {
    router.push(`/messages/${creator.id}`);
  };
  
  return (
    <ProfileThemeProvider theme={theme}>
      <div className="min-h-screen pb-20">
        <div className="min-h-screen bg-background/95 backdrop-blur-sm">
          {/* Render sections in order */}
          {enabledSections.map((section) => {
            switch (section.type) {
              case 'intro':
                return config?.intro ? (
                  <CreatorIntroSection
                    key={section.id}
                    creator={creator}
                    config={config.intro}
                    isLive={config.is_live}
                    onLiveClick={() => router.push(`/live/${config.active_room_id}`)}
                    showSubscribeButton={!creator.is_subscribed && hasSubscriptionSection}
                    onSubscribeClick={handleSubscribeClick}
                    showMessageButton={creator.is_subscribed}
                    onMessageClick={handleMessageClick}
                  />
                ) : null;
              
              case 'actions':
                return config?.actionButtons && config.actionButtons.length > 0 ? (
                  <ActionButtonsSection
                    key={section.id}
                    buttons={config.actionButtons}
                    creatorId={creator.id}
                    isSubscribed={creator.is_subscribed}
                  />
                ) : (
                  /* Config can omit action section; still show Message when subscribed */
                  creator.is_subscribed ? (
                    <ActionButtonsSection
                      key={`${section.id}-subscribed-chat`}
                      buttons={[]}
                      creatorId={creator.id}
                      isSubscribed
                    />
                  ) : null
                );
              
              case 'exclusives':
                return content ? (
                  <ExclusivesGridSection
                    key={section.id}
                    content={content}
                  />
                ) : null;
              
              case 'subscription':
              case 'membership':
                return (
                  <div key={section.id} id={section.type === 'membership' ? 'membership-section' : 'subscription-section'}>
                    <SubscriptionCardSection
                      plans={membershipPlans}
                      isSubscribed={creator.is_subscribed}
                      creatorName={creator.name || creator.username}
                      creatorUsername={creator.username}
                      creatorAvatarUrl={getMediaUrl(creator.avatar)}
                    />
                  </div>
                );
              
              default:
                return null;
            }
          })}
          {/* Fallback: even if config omits actions section entirely, still show Message when subscribed */}
          {!hasActionsSection && creator.is_subscribed && (
            <ActionButtonsSection
              key="fallback-subscribed-chat"
              buttons={[]}
              creatorId={creator.id}
              isSubscribed
            />
          )}
          
          {/* Loading state for content */}
          {contentLoading && (
            <div className="px-4 py-6 flex justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        
        {isMembershipOpen && (
          <MembershipPopup
            open={isMembershipOpen}
            creatorName={creator.name || creator.username}
            creatorUsername={creator.username}
            creatorAvatarUrl={getMediaUrl(creator.avatar)}
            plans={membershipPlans}
            onClose={() => setIsMembershipOpen(false)}
            onSuccess={() => {
              void queryClient.invalidateQueries({ queryKey: ['creator', 'username', username] });
              void queryClient.invalidateQueries({ queryKey: ['subscriptions', 'my'] });
            }}
          />
        )}

        {/* Bottom Navigation */}
        {bottomNav.length > 0 && (
          <BottomNavigation items={bottomNav} />
        )}
      </div>
    </ProfileThemeProvider>
  );
}
