import { Metadata } from "next";

export const metadata: Metadata = { title: "Zexy", description: "Production-grade creator monetization platform" };
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { commonProfileService } from '@/services/commonProfile';
import { RoleSwitchConfirmationModal } from '@/components/profile/role-switch-confirmation-modal';
import { useAuthContext } from '@/hooks/useAuth';

export default function SwitchToCreatorPage() {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuthContext();

  const handleSwitch = async () => {
    setIsLoading(true);
    try {
      await commonProfileService.switchToCreator();
      toast.success('Successfully switched to creator!');
      // Backend invalidates sessions, clear local state and go to success page
      logout();
      router.push('/switch-success');
    } catch (error: unknown) {
      const message = error instanceof Error ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message || error.message : 'Failed to switch to creator';
      toast.error(message);
    } finally {
      setIsLoading(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="-mt-2 space-y-8 pb-8">
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Q. What is Creator?</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A Creator is a user who creates and shares content on the platform to engage, entertain, educate, or influence
          their audience. Creators can grow followers, receive support from fans, and build their personal brand.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Q. Top Five Creators on Our Platform?</h2>
        <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-muted-foreground">
          <li>Aarav Sharma</li>
          <li>Priya Verma</li>
          <li>Rohan Mehta</li>
          <li>Neha Kapoor</li>
          <li>Kunal Singh</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Q. What Happens to My Fan Account if I Become a Creator?</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your existing fan account will be upgraded to a creator account. Your profile, followers, and account data
          will remain safe, and you will gain access to creator features and tools.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Q. Benefits of Becoming a Creator</h2>
        <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-muted-foreground">
          <li>Share and promote your content</li>
          <li>Grow your audience and followers</li>
          <li>Receive tips and fan support</li>
          <li>Build your personal brand</li>
          <li>Access creator tools and analytics</li>
          <li>Increase engagement with your community</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Q. Can I Switch Back to Fan if I Become a Creator?</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Yes, you can switch back to a fan account anytime from your account settings, subject to platform policies and
          verification requirements.
        </p>
      </section>

      <Button
        type="button"
        className="w-full"
        size="lg"
        onClick={() => setIsConfirmOpen(true)}
      >
        Make Me Creator
      </Button>

      <RoleSwitchConfirmationModal
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSwitch}
        isLoading={isLoading}
      />
    </div>
  );
}
