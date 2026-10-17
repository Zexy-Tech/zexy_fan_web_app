'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoginVerificationPopup } from '@/components/auth/login-verification-popup';
import { useAuthContext, useDeleteAccount } from '@/hooks/useAuth';
import { useFanCommonProfile } from '@/hooks/useFanCommonProfile';

function getAxiosErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const r = (error as { response?: { data?: { error?: { message?: string }; message?: string } } }).response?.data;
    const m = r?.error?.message ?? r?.message;
    if (typeof m === 'string' && m.length > 0) {
      const parts = m.split(' - ');
      if (parts.length >= 3) return parts.slice(2).join(' - ');
      return m;
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export default function DeleteAccountPage() {
  const router = useRouter();
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionSuccess, setDeletionSuccess] = useState<{
    open: boolean;
    message: string;
    scheduled_deletion_date?: string;
  } | null>(null);

  const { user, logout } = useAuthContext();
  const { data: profile } = useFanCommonProfile();
  const deleteAccount = useDeleteAccount();

  const prefilledMobile = profile?.mobile ?? user?.mobile ?? null;

  const handleVerified = async ({
    otp,
    token,
  }: {
    mobile: string;
    otp: string;
    token?: string;
  }) => {
    setIsDeleting(true);
    try {
      const response = await deleteAccount.mutateAsync({ otp, token });

      const dateStr = response?.scheduled_deletion_date
        ? new Date(response.scheduled_deletion_date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : undefined;

      const message =
        response?.message ||
        'Your account has been scheduled for permanent deletion in 30 days. No cancellation is permitted and you cannot log in during this period.';

      // Open the success confirmation popup with OK button
      setDeletionSuccess({
        open: true,
        message,
        scheduled_deletion_date: dateStr,
      });
    } catch (err: unknown) {
      const msg = getAxiosErrorMessage(err, 'Failed to process account deletion.');
      toast.error(msg);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmOk = () => {
    try {
      logout();
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('session_token');
      localStorage.removeItem('auth_user');
      router.push('/login');
    }
  };

  return (
    <div className="-mt-2 max-w-xl mx-auto space-y-6 pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Profile
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Trash2 className="size-6 text-red-500" />
          Permanently Delete Account
        </h1>
      </div>

      {/* Permanent Deletion Notice (30 Days) */}
      <div className="rounded-xl border border-red-500/25 bg-red-950/20 p-5 space-y-2">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-5 shrink-0 text-red-400 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-white">
              Permanently Delete Account
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              Your account has been scheduled for permanent deletion in 30 days. No cancellation is permitted and you cannot log in during this period.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Button */}
      <div className="pt-2">
        <Button
          type="button"
          variant="destructive"
          className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-lg shadow-red-600/20 active:scale-[0.98]"
          onClick={() => setVerificationOpen(true)}
          disabled={isDeleting || deleteAccount.isPending}
        >
          {isDeleting || deleteAccount.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Deleting Account…
            </>
          ) : (
            <>
              <Trash2 className="mr-2 size-4" />
              Delete Account
            </>
          )}
        </Button>
      </div>

      {/* Verification Popup */}
      <LoginVerificationPopup
        open={verificationOpen}
        onClose={() => setVerificationOpen(false)}
        onVerified={handleVerified}
        title="Verify Mobile"
        description="Enter your mobile number to receive a verification code."
        prefilledMobile={prefilledMobile}
        allowEditMobile={true}
      />

      {/* Post-Deletion Confirmation Popup with OK Button */}
      {deletionSuccess?.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-[420px] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-red-500/30 bg-zinc-900/95 text-white backdrop-blur-xl shadow-2xl">
              <CardContent className="p-6 text-center space-y-5">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-500/10 text-red-500 ring-8 ring-red-500/5">
                  <Trash2 className="size-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    Your account has been deleted
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-300">
                    {deletionSuccess.message}
                  </p>
                  {deletionSuccess.scheduled_deletion_date && (
                    <p className="text-xs text-zinc-400 pt-1">
                      Scheduled permanent deletion date:{' '}
                      <span className="font-semibold text-white">
                        {deletionSuccess.scheduled_deletion_date}
                      </span>
                    </p>
                  )}
                </div>
                <div className="pt-2">
                  <Button
                    type="button"
                    className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-lg shadow-red-600/25 active:scale-[0.98]"
                    onClick={handleConfirmOk}
                  >
                    OK
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
