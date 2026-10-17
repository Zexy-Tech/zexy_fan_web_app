'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '@/services/auth';
import { getPendingTruecallerNonce, clearPendingTruecallerNonce } from '@/lib/truecaller';
import { hasAllMandatoryDetails } from '@/lib/mockAuth';
import { Button } from '@/components/ui/button';

function TruecallerCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isCancelled = false;

    async function handleVerification() {
      try {
        // Extract parameters from URL or hash
        const urlAccessToken = searchParams.get('access_token') || searchParams.get('accessToken');
        const urlRequestId = searchParams.get('request_id') || searchParams.get('requestId') || searchParams.get('requestNonce');
        const error = searchParams.get('error') || searchParams.get('error_description');

        if (error) {
          throw new Error(error || 'Truecaller authorization was cancelled or declined.');
        }

        // Check hash fragment as well (some OAuth / Truecaller flows pass token in hash)
        let hashAccessToken: string | null = null;
        let hashRequestId: string | null = null;
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
          hashAccessToken = hashParams.get('access_token') || hashParams.get('accessToken');
          hashRequestId = hashParams.get('request_id') || hashParams.get('requestId');
        }

        const accessToken = urlAccessToken || hashAccessToken;
        const pendingNonce = getPendingTruecallerNonce();
        const requestId = urlRequestId || hashRequestId || pendingNonce;

        if (!accessToken && !requestId) {
          throw new Error('No verification credentials received from Truecaller.');
        }

        // Send to backend Truecaller callback
        const tokenData = await authService.truecallerCallback({
          access_token: accessToken || undefined,
          request_id: requestId || undefined,
          role: 'fan',
        });

        if (isCancelled) return;

        // Save session tokens
        localStorage.setItem('auth_token', tokenData.access_token);
        if (tokenData.refresh_token) {
          localStorage.setItem('refresh_token', tokenData.refresh_token);
        }
        if (tokenData.session_token) {
          localStorage.setItem('session_token', tokenData.session_token);
        }

        clearPendingTruecallerNonce();
        setStatus('success');

        // Fetch current profile
        const me = await authService.getMe();

        if (isCancelled) return;

        // Check if onboarding is complete
        if (me.has_completed_onboarding && hasAllMandatoryDetails(me)) {
          router.replace('/creators');
        } else {
          router.replace('/login?step=complete_profile');
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        setStatus('error');
        const msg = (err as { message?: string })?.message || 'Truecaller verification failed. Please try again.';
        setErrorMessage(msg);
      }
    }

    handleVerification();

    return () => {
      isCancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-white p-4">
      <div className="w-full max-w-sm p-6 rounded-2xl bg-[#121214] border border-zinc-800 text-center space-y-4 shadow-xl">
        <div className="size-14 rounded-full bg-[#0087FF]/10 text-[#0087FF] mx-auto flex items-center justify-center">
          {status === 'verifying' && <Loader2 className="size-7 animate-spin" />}
          {status === 'success' && <CheckCircle2 className="size-7 text-emerald-500" />}
          {status === 'error' && <AlertCircle className="size-7 text-red-500" />}
        </div>

        <div>
          <h2 className="text-lg font-bold">
            {status === 'verifying' && 'Verifying with Truecaller'}
            {status === 'success' && 'Verified Successfully!'}
            {status === 'error' && 'Verification Failed'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {status === 'verifying' && 'Confirming your identity with Truecaller. Please wait...'}
            {status === 'success' && 'Redirecting to your dashboard...'}
            {status === 'error' && (errorMessage || 'Something went wrong during Truecaller verification.')}
          </p>
        </div>

        {status === 'error' && (
          <Button
            type="button"
            onClick={() => router.replace('/login')}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2 rounded-xl text-sm"
          >
            Back to Login
          </Button>
        )}
      </div>
    </div>
  );
}

export default function TruecallerCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
          <Loader2 className="size-8 animate-spin text-purple-500" />
        </div>
      }
    >
      <TruecallerCallbackContent />
    </Suspense>
  );
}
