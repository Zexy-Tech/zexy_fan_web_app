'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { paymentService, Transaction } from '@/services/payment';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ArrowLeft, Receipt, CheckCircle2, Clock, XCircle, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

function InvoiceDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      const data = await paymentService.getDetail(id);
      setTransaction(data);
    } catch {
      toast.error('Failed to load invoice details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (Number.isFinite(id)) {
      loadDetail();
    }
  }, [id, loadDetail]);

  const handleDownload = async () => {
    if (!transaction) return;
    setIsDownloading(true);
    try {
      await paymentService.downloadInvoice(transaction.id);
      toast.success('Invoice downloaded');
    } catch {
      toast.error('Failed to download invoice');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="size-10 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <XCircle className="size-16 text-zinc-700" />
        <p className="text-zinc-500 font-medium">Invoice not found</p>
        <Button variant="outline" onClick={() => router.push('/billing')}>
          Back to Billing
        </Button>
      </div>
    );
  }

  const isSuccess = transaction.status === 'success';
  const isPending = transaction.status === 'pending';
  const isFailed = transaction.status === 'failed' || transaction.status === 'error';

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push('/billing')}
          className="rounded-full bg-card border border-border shadow-sm text-foreground hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Invoice Details</h1>
      </div>

      <Card className="border-border bg-card shadow-lg overflow-hidden">
        {/* Status Banner */}
        <div className={cn(
          "px-6 py-4 flex items-center justify-between",
          isSuccess && "bg-emerald-500/10 border-b border-emerald-500/20",
          isPending && "bg-amber-500/10 border-b border-amber-500/20",
          isFailed && "bg-red-500/10 border-b border-red-500/20"
        )}>
          <div className="flex items-center gap-3">
            {isSuccess && <CheckCircle2 className="size-5 text-emerald-500" />}
            {isPending && <Clock className="size-5 text-amber-500" />}
            {isFailed && <XCircle className="size-5 text-red-500" />}
            <span className={cn(
              "font-bold uppercase tracking-wider text-xs",
              isSuccess && "text-emerald-500",
              isPending && "text-amber-500",
              isFailed && "text-red-500"
            )}>
              Payment {transaction.status}
            </span>
          </div>
          <span className="text-muted-foreground text-xs font-mono font-medium">
            #{transaction.id}
          </span>
        </div>

        <CardContent className="p-0">
          {/* Main Info */}
          <div className="p-8 text-center space-y-1">
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.3em] mb-3 pl-[0.3em]">Total Amount</p>
            <h2 className="text-4xl font-black text-foreground tabular-nums">
              {formatCurrency(transaction.amount || transaction.gross_amount || 0)}
            </h2>
            <p className="text-muted-foreground text-sm font-medium pt-2">
              {format(new Date(transaction.created_at), 'dd MMM yyyy, hh:mm a')}
            </p>
          </div>

          <div className="px-8 pb-8 space-y-8">
             {/* Breakdown Section */}
             <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                   <Receipt className="size-4 text-purple-500" />
                   <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Transaction Summary</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground text-sm">Purpose</span>
                    <span className="text-foreground text-sm font-semibold capitalize">{transaction.purpose.replace(/_/g, ' ')}</span>
                  </div>

                  {transaction.creator_name && (
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground text-sm">Creator</span>
                      <div className="flex flex-col items-end">
                        <span className="text-foreground text-sm font-semibold">{transaction.creator_name}</span>
                        <span className="text-muted-foreground text-xs">@{transaction.creator_username}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground text-sm">Gateway ID</span>
                    <span className="text-muted-foreground text-xs font-mono break-all max-w-[180px] text-right">
                       {transaction.gateway_payment_id || '—'}
                    </span>
                  </div>
                </div>
             </div>

             {/* Security Note */}
             <div className="p-4 rounded-xl bg-muted/40 border border-border flex gap-4">
                <div className="p-2 rounded-lg bg-muted h-fit">
                   <ShieldCheck className="size-5 text-purple-400" />
                </div>
                <div>
                   <p className="text-xs font-bold text-foreground mb-1 uppercase tracking-wide">Secure Transaction</p>
                   <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Your payment information is encrypted and handled by authorized payment gateways. 
                      This invoice serves as proof of purchase for digital services.
                   </p>
                </div>
             </div>
          </div>
        </CardContent>

        {/* Footer Actions */}
        <div className="p-6 bg-muted/30 border-t border-border flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleDownload}
            disabled={isDownloading || !isSuccess}
            className="flex-1 h-12 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl gap-2"
          >
            {isDownloading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Download className="size-5" />
            )}
            Download PDF Invoice
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/creators')}
            className="flex-1 h-12 border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted font-bold rounded-xl"
          >
            Browse Creators
          </Button>
        </div>
      </Card>

      <div className="text-center py-4">
        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.4em]">© 2026 ZEXY PLATFORM</p>
      </div>
    </div>
  );
}

export default function InvoiceDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="size-10 animate-spin text-purple-500" />
      </div>
    }>
      <InvoiceDetailPageContent />
    </Suspense>
  );
}
