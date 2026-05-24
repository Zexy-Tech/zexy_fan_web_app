import { Metadata } from "next";

export const metadata: Metadata = { title: "Zexy", description: "Production-grade creator monetization platform" };
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoginVerificationPopup } from '@/components/auth/login-verification-popup';
import { useAuthContext, useDeleteAccount, useLogout } from '@/hooks/useAuth';
import { useFanCommonProfile } from '@/hooks/useFanCommonProfile';
import { toast } from 'sonner';

export default function DeleteAccountPage() {
  const [verificationOpen, setVerificationOpen] = useState(false);
  const { user } = useAuthContext();
  const { data: profile } = useFanCommonProfile();
  const deleteAccount = useDeleteAccount();
  const logoutMut = useLogout();

  const prefilledMobile = profile?.mobile ?? user?.mobile ?? null;

  const handleVerified = async ({ otp }: { mobile: string; otp: string }) => {
    await deleteAccount.mutateAsync({ otp });
    toast.success('Your account has been deleted.');
    await logoutMut.mutateAsync();
  };

  return (
    <div className="-mt-2 space-y-6">
      <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
        <p className="text-sm leading-relaxed text-foreground">
          Warning: Once you delete your account, all your data will be permanently removed. This action cannot be
          reversed.
        </p>
      </div>

      <Button type="button" variant="destructive" className="w-full" onClick={() => setVerificationOpen(true)}>
        Delete account
      </Button>

      <LoginVerificationPopup
        open={verificationOpen}
        onClose={() => setVerificationOpen(false)}
        onVerified={handleVerified}
        title="Confirm deletion"
        description="Enter the verification code sent to your mobile. After verification, your account will be permanently deleted."
        prefilledMobile={prefilledMobile}
      />
    </div>
  );
}
