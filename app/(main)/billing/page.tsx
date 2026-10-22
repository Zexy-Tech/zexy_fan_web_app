'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { paymentService, Transaction } from '@/services/payment';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, CreditCard, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function BillingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await paymentService.getHistory();
      setTransactions(data);
    } catch {
      toast.error('Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async (id: number) => {
    setIsDownloading(id);
    try {
      await paymentService.downloadInvoice(id);
      toast.success('Invoice downloaded');
    } catch {
      toast.error('Failed to download invoice');
    } finally {
      setIsDownloading(null);
    }
  };

  if (!isMounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-3 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-purple-600/20 text-purple-500">
           <Receipt className="size-6" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Billing & Invoices</h1>
          <p className="text-muted-foreground text-sm">Manage your payments and download receipts</p>
        </div>
      </div>

      <div className="space-y-4">
        {transactions.length === 0 ? (
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="py-12 text-center">
              <CreditCard className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payment history found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {transactions.map((tx) => (
              <Card key={tx.id} className="bg-card border-border hover:bg-muted/60 transition-colors group shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <Link href={`/billing/${tx.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm capitalize text-foreground">
                        {tx.purpose.replace(/_/g, ' ')}
                      </span>
                      <span className={cn(
                        "text-[10px] uppercase tracking-tighter px-1.5 py-0.5 rounded border",
                        tx.status === 'success' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                        tx.status === 'pending' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        "bg-red-500/10 text-red-500 border-red-500/20"
                      )}>
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tx.creator_name ? `To ${tx.creator_name} • ` : ''}
                      {format(new Date(tx.created_at), 'dd MMM yyyy')}
                    </p>
                  </Link>

                  <div className="text-right">
                    <p className="font-bold text-foreground mb-1 tabular-nums">
                       {formatCurrency(tx.amount || tx.gross_amount || 0)}
                    </p>
                    <div className="flex items-center justify-end gap-2">
                       <Link href={`/billing/${tx.id}`} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Details</Link>
                       <span className="text-muted-foreground/40">•</span>
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[10px] gap-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-500/10 p-0 px-2"
                        onClick={() => handleDownloadInvoice(tx.id)}
                        disabled={isDownloading === tx.id || tx.status !== 'success'}
                      >
                        {isDownloading === tx.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Download className="size-3" />
                        )}
                        Invoice
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
