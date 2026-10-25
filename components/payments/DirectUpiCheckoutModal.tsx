'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';
import {
  ShieldCheck,
  X,
  Copy,
  Check,
  QrCode,
  Smartphone,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Clock,
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CreateIntentResponse } from '@/services/payment';
import {
  SUPPORTED_UPI_APPS,
  UPI_CONFIG,
  buildUpiUrl,
  launchUpiIntent,
  UpiAppOption,
} from '@/constants/payment';
import { useOrderStatus, useSubmitUtr } from '@/hooks/usePayment';

interface DirectUpiCheckoutModalProps {
  isOpen: boolean;
  intent: CreateIntentResponse | null;
  itemName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const DirectUpiCheckoutModal: React.FC<DirectUpiCheckoutModalProps> = ({
  isOpen,
  intent,
  itemName = 'Creator Subscription',
  onClose,
  onSuccess,
}) => {
  const [selectedScheme, setSelectedScheme] = useState<string>('phonepe');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [utrInput, setUtrInput] = useState<string>('');
  const [utrSubmitted, setUtrSubmitted] = useState<boolean>(false);

  // Attempt tracking to ensure unique transaction reference per payment attempt (Req 5)
  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [hasLaunchedApp, setHasLaunchedApp] = useState<boolean>(false);
  const [showBankLimitHelp, setShowBankLimitHelp] = useState<boolean>(false);
  const [limitReported, setLimitReported] = useState<boolean>(false);

  const orderId = intent?.gateway_order_id;
  const merchantUpiId = intent?.merchant_upi_id || UPI_CONFIG.upiId;
  const payeeName = intent?.payee_name || UPI_CONFIG.merchantName;

  // Poll authoritative status from backend (Req 11, 12)
  const { data: orderStatus, refetch: refetchStatus, isFetching: isCheckingStatus } = useOrderStatus(
    orderId,
    isOpen
  );

  const submitUtrMutation = useSubmitUtr();

  // Helper to generate a unique transaction reference for each payment attempt (Req 5)
  // Max length is 35 chars per NPCI standard.
  const getAttemptRef = (baseId: string, attempt: number): string => {
    if (attempt <= 1) {
      return baseId.slice(0, 35);
    }
    const cleanBase = baseId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
    return `${cleanBase}_A${attempt}`.slice(0, 35);
  };

  // Generate QR Code data URL when order intent is ready (Req 7, 8)
  useEffect(() => {
    if (!intent) return;
    // Always use clean buildUpiUrl (omits mc & mode=02 for personal accounts)
    const cleanQrUrl = buildUpiUrl({
      payeeVpa: merchantUpiId,
      payeeName: payeeName,
      amount: intent.amount,
      transactionRef: getAttemptRef(intent.gateway_order_id, attemptCount),
      transactionNote: `Zexy: ${itemName}`,
      scheme: 'upi',
    });

    QRCode.toDataURL(cleanQrUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('[Direct UPI] Failed to generate UPI QR code:', err));
  }, [intent, merchantUpiId, payeeName, itemName, attemptCount]);

  // App switching & tab return detection (Req 10): refetch status when returning from UPI app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasLaunchedApp && orderId) {
        console.info('[Direct UPI] Fan returned from UPI app, checking authoritative status for:', orderId);
        refetchStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasLaunchedApp, orderId, refetchStatus]);

  // Handle successful status transition strictly from authoritative backend (Req 11, 12)
  useEffect(() => {
    if (orderStatus?.status === 'success') {
      toast.success('Payment verified successfully! Access granted.');
      const timeout = setTimeout(() => {
        onSuccess();
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [orderStatus?.status, onSuccess]);

  if (!isOpen || !intent) return null;

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(merchantUpiId);
    setCopied(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLaunchUpi = (scheme: string) => {
    const currentAttemptRef = getAttemptRef(intent.gateway_order_id, attemptCount);

    // Safe diagnostic logging (Req 13) - never logs credentials
    console.info('[Direct UPI] Launching UPI payment attempt:', {
      orderId: intent.gateway_order_id,
      attemptNumber: attemptCount,
      transactionRef: currentAttemptRef,
      amount: intent.amount.toFixed(2),
      scheme,
      payeeVpa: merchantUpiId,
      timestamp: new Date().toISOString(),
    });

    setHasLaunchedApp(true);
    // Increment attempt count for next launch so reference is never reused (Req 5)
    setAttemptCount((prev) => prev + 1);

    launchUpiIntent({
      payeeVpa: merchantUpiId,
      payeeName: payeeName,
      amount: intent.amount,
      transactionRef: currentAttemptRef,
      transactionNote: `Zexy: ${itemName}`,
      scheme: scheme,
    });
  };

  // Safe report of "Bank limit exceeded" error (Req 13, 15)
  const handleReportBankLimit = () => {
    setLimitReported(true);
    console.warn('[Payment Diagnostics] "Bank limit exceeded" reported by user:', {
      orderId: intent.gateway_order_id,
      attemptNumber: attemptCount,
      transactionRef: getAttemptRef(intent.gateway_order_id, attemptCount),
      amount: intent.amount,
      payeeVpa: merchantUpiId,
      selectedScheme,
      timestamp: new Date().toISOString(),
      failureType: 'BANK_LIMIT_EXCEEDED',
    });
    toast('Limit issue logged. Please review the guidance below.', { icon: 'ℹ️' });
  };

  const handleRetryFreshAttempt = () => {
    const nextRef = getAttemptRef(intent.gateway_order_id, attemptCount);
    console.info('[Direct UPI] Fan initiated fresh payment retry with new ref:', nextRef);
    handleLaunchUpi(selectedScheme);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = utrInput.trim();
    if (!clean || clean.length < 6) {
      toast.error('Please enter a valid 12-digit UPI reference number / UTR');
      return;
    }

    try {
      console.info('[Direct UPI] Submitting fan UTR reference for verification:', {
        orderId: intent.gateway_order_id,
        utrLength: clean.length,
        maskedUtr: clean.slice(0, 4) + '****' + clean.slice(-4),
      });

      await submitUtrMutation.mutateAsync({
        gatewayOrderId: intent.gateway_order_id,
        utr: clean,
      });
      setUtrSubmitted(true);
      toast.success('UTR submitted! Waiting for authoritative verification.');
      refetchStatus();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to submit UTR. Please check the number and try again.';
      toast.error(errorMsg);
    }
  };

  const isSuccess = orderStatus?.status === 'success';
  const isFailed = orderStatus?.status === 'failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 bg-gradient-to-r from-zinc-900/60 to-zinc-900/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base leading-tight">Direct UPI Checkout</h3>
              <p className="text-xs text-zinc-400">Zero gateway fees • Direct verified payment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* SUCCESS BANNER */}
          {isSuccess && (
            <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="text-lg font-bold text-white">Payment Confirmed!</h4>
              <p className="text-sm text-emerald-300/80">
                Your payment of ₹{intent.amount.toFixed(2)} was verified. Your access has been activated.
              </p>
            </div>
          )}

          {/* FAILED BANNER */}
          {isFailed && (
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm text-red-200">
                <p className="font-semibold">Payment not completed or rejected</p>
                <p className="text-xs text-red-300/80 mt-0.5">
                  The payment order could not be verified. You can retry with a valid UPI payment.
                </p>
              </div>
            </div>
          )}

          {/* Order Summary Box */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-pink-400 uppercase tracking-wider">Purchase</span>
                <h4 className="font-semibold text-white text-base">{itemName}</h4>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-400">Amount</span>
                <p className="text-2xl font-black text-white">₹{intent.amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-zinc-500">Ref:</span>
                <span className="text-zinc-300">
                  {getAttemptRef(intent.gateway_order_id, attemptCount).slice(0, 22)}...
                </span>
                {attemptCount > 1 && (
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-pink-400 font-sans">
                    Attempt #{attemptCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span>Payee:</span>
                <span className="font-medium text-zinc-200">{merchantUpiId}</span>
                <button
                  type="button"
                  onClick={handleCopyUpiId}
                  className="p-1 hover:text-pink-400 transition"
                  title="Copy UPI ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {!isSuccess && (
            <>
              {/* Returned from UPI app prompt */}
              {hasLaunchedApp && !utrSubmitted && (
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-pink-500/30 flex items-start gap-2.5 animate-in fade-in duration-200">
                  <Sparkles className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-zinc-300 space-y-1">
                    <p className="font-semibold text-white">Returned from your UPI app?</p>
                    <p className="text-[11px] text-zinc-400">
                      If you completed the payment of ₹{intent.amount.toFixed(2)}, enter your 12-digit UTR below to confirm access.
                    </p>
                  </div>
                </div>
              )}

              {/* Select UPI App */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                    Open in UPI App
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQr(!showQr)}
                    className="text-xs font-medium text-pink-400 hover:text-pink-300 flex items-center gap-1 transition"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    {showQr ? 'Hide QR Code' : 'Show QR Code'}
                  </button>
                </div>

                {/* UPI Apps Grid */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {SUPPORTED_UPI_APPS.map((app: UpiAppOption) => {
                    const isSelected = selectedScheme === app.scheme;
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => {
                          setSelectedScheme(app.scheme);
                          handleLaunchUpi(app.scheme);
                        }}
                        className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${
                          isSelected
                            ? 'bg-gradient-to-b from-zinc-800 to-zinc-900 border-pink-500/80 shadow-md shadow-pink-500/10'
                            : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800/60 hover:border-zinc-700'
                        }`}
                      >
                        {app.badge && (
                          <span className="absolute -top-1.5 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-pink-500 text-white tracking-wide uppercase">
                            {app.badge}
                          </span>
                        )}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-inner font-bold text-white text-sm"
                          style={{ backgroundColor: app.primaryColor }}
                        >
                          {app.name.charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-white">{app.name}</span>
                        <span className="text-[10px] text-zinc-400 flex items-center gap-0.5 mt-0.5">
                          Launch <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* QR Code view toggle (Desktop / Fallback) */}
              {showQr && qrDataUrl && (
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col items-center text-center space-y-3 animate-in fade-in duration-200">
                  <div className="p-3 bg-white rounded-2xl shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="Scan UPI QR Code" className="w-48 h-48 object-contain" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-200">Scan with your camera (not Gallery)</p>
                    <p className="text-[11px] text-amber-200/90 leading-snug">
                      Do not upload this QR from Photos/Gallery in Google Pay or PhonePe — that triggers
                      &quot;pay up to ₹2,000 with QR codes via gallery&quot; even for small amounts. Use the
                      button below or point your UPI app camera at this screen.
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Amount: <span className="font-semibold text-white">₹{intent.amount.toFixed(2)}</span> • Payee: {merchantUpiId}
                    </p>
                  </div>
                </div>
              )}

              {/* Main Pay Now Action */}
              <button
                type="button"
                onClick={() => handleLaunchUpi(selectedScheme)}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/25 transition active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Pay ₹{intent.amount.toFixed(2)} with UPI App
              </button>

              {/* Bank Limit & Payment Issues Assistant (Req 15) */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowBankLimitHelp(!showBankLimitHelp)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/40 transition"
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Payment error in Google Pay / PhonePe?</span>
                  </span>
                  {showBankLimitHelp ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </button>

                {showBankLimitHelp && (
                  <div className="p-4 pt-1 border-t border-zinc-800/60 space-y-3 text-xs text-zinc-400">
                    <p className="font-semibold text-amber-300">
                      PhonePe: &quot;You can pay up to ₹2,000 with QR codes via gallery&quot;
                    </p>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      That message appears when a payment is started from a <strong className="text-zinc-200">saved QR screenshot (Gallery)</strong>.
                      Instead, tap the <strong className="text-zinc-200">Pay with UPI App</strong> button above to launch directly via app link,
                      or scan this QR live using the camera scanner on another device.
                    </p>
                    <p className="font-semibold text-amber-300 pt-1">
                      Google Pay: &quot;Bank limit exceeded&quot; or transaction failed?
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-zinc-300 leading-relaxed">
                      <li>
                        <strong className="text-zinc-200">Direct P2P Routing Active:</strong> Merchant tracking parameters (`mc`, `mode=02`, `tr`) have been removed for personal accounts so Google Pay and PhonePe process payments as clean peer-to-peer transfers.
                      </li>
                      <li>
                        <strong className="text-zinc-200">Bank 24-Hour Cooling Limit:</strong> If you recently registered on PhonePe/Google Pay, swapped SIM cards, or reset your UPI PIN, your bank caps transfers for 24–72 hours.
                      </li>
                      <li>
                        <strong className="text-zinc-200">Direct UPI ID Option:</strong> You can always copy the UPI ID directly at the top, pay in your UPI app, and enter your 12-digit UTR below.
                      </li>
                    </ul>

                    <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] space-y-1.5 text-zinc-400">
                      <span className="font-semibold text-zinc-200">Recommended Steps:</span>
                      <p>• Switch to another bank account linked inside your UPI app.</p>
                      <p>• Try selecting a different UPI app above (Google Pay, PhonePe, Paytm, or Generic).</p>
                      <p>• Tap <strong>&quot;Retry Fresh Attempt&quot;</strong> below to issue a new unique transaction reference.</p>
                      <p className="text-[10px] text-zinc-500 italic">
                        * Note: Per financial safety rules, Zexy cannot automatically reduce the order amount or fabricate success.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleRetryFreshAttempt}
                        className="flex-1 min-w-[140px] py-2 px-3 rounded-xl text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center gap-1.5 transition border border-zinc-700"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-pink-400" />
                        Retry Fresh Attempt
                      </button>
                      <button
                        type="button"
                        onClick={handleReportBankLimit}
                        disabled={limitReported}
                        className="py-2 px-3 rounded-xl text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition border border-zinc-800 disabled:opacity-50"
                      >
                        {limitReported ? 'Limit Logged' : 'Log Diagnostic Report'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* UTR Submission Form */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300">
                    Already paid in your UPI app?
                  </label>
                  <span className="text-[11px] text-zinc-500">12-digit UTR / Ref No.</span>
                </div>

                <form onSubmit={handleSubmitUtr} className="flex gap-2">
                  <input
                    type="text"
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    placeholder="Enter 12-digit UTR (e.g. 4028...)"
                    maxLength={24}
                    className="flex-1 bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition font-mono"
                  />
                  <button
                    type="submit"
                    disabled={submitUtrMutation.isPending || !utrInput.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white border border-zinc-700 transition shrink-0"
                  >
                    {submitUtrMutation.isPending ? 'Submitting...' : utrSubmitted ? 'Updated' : 'Submit UTR'}
                  </button>
                </form>

                {utrSubmitted && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> UTR recorded! Verification in progress.
                  </p>
                )}
              </div>

              {/* Live Polling Status Indicator */}
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>
                    Status:{' '}
                    <span className="font-semibold text-amber-300 uppercase tracking-wide">
                      {orderStatus?.status || 'Pending'}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => refetchStatus()}
                  disabled={isCheckingStatus}
                  className="p-1 hover:text-white transition flex items-center gap-1 text-[11px]"
                  title="Check latest status"
                >
                  <RefreshCw className={`w-3 h-3 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-zinc-950/80 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
          <span>NPCI Direct UPI • Safe & Secure</span>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-zinc-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
