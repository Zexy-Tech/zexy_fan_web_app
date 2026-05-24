import { Metadata } from "next";

export const metadata: Metadata = { title: "Zexy", description: "Production-grade creator monetization platform" };
'use client';

import { useState, useEffect } from 'react';
import { paymentService, Transaction } from '@/services/payment';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, CreditCard, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
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
          <h1 className="text-lg font-semibold">Billing & Invoices</h1>
          <p className="text-zinc-400 text-sm">Manage your payments and download receipts</p>
        </div>
      </div>

      <div className="space-y-4">
        {transactions.length === 0 ? (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="py-12 text-center">
              <CreditCard className="size-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No payment history found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {transactions.map((tx) => (
              <Card key={tx.id} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm capitalize">
                        {tx.purpose.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] uppercase tracking-tighter px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">
                        {tx.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {tx.creator_name ? `To ${tx.creator_name} • ` : ''}
                      {format(new Date(tx.created_at), 'dd MMM yyyy')}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-white mb-1">
                       {formatCurrency(tx.gross_amount)}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] gap-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 p-0 px-2"
                      onClick={() => handleDownloadInvoice(tx.id)}
                      disabled={isDownloading === tx.id}
                    >
                      {isDownloading === tx.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Download className="size-3" />
                      )}
                      Invoice
                    </Button>
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
