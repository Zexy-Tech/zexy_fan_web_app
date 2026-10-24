'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Copy,
  Check,
  User,
  Phone,
  FileText,
  Loader2,
} from 'lucide-react';
import { useAuthContext } from '@/hooks/useAuth';
import { usePendingPayments, useVerifyPaymentAdmin } from '@/hooks/usePayment';
import { AdminPendingPaymentItem } from '@/services/payment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminPaymentsPage() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('created');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<AdminPendingPaymentItem | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [bankRefInput, setBankRefInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = usePendingPayments(
    statusFilter,
    100,
    0
  );

  const verifyMutation = useVerifyPaymentAdmin();

  // Guard: Admin role required
  if (user && user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="p-4 bg-rose-500/10 rounded-2xl mb-4 border border-rose-500/20">
          <ShieldAlert className="size-10 text-rose-500" />
        </div>
        <h1 className="text-xl font-bold text-white">Admin Access Restricted</h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-md">
          You must be an authenticated administrator to access the direct UPI payment verification console.
        </p>
      </div>
    );
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenModal = (order: AdminPendingPaymentItem, type: 'approve' | 'reject') => {
    setSelectedOrder(order);
    setActionType(type);
    setBankRefInput(order.utr || '');
    setNotesInput('');
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setActionType(null);
    setBankRefInput('');
    setNotesInput('');
  };

  const handleSubmitVerification = async () => {
    if (!selectedOrder || !actionType) return;

    if (actionType === 'approve' && !bankRefInput.trim()) {
      toast.error('Bank Reference Number / UTR is required to approve payment');
      return;
    }

    try {
      await verifyMutation.mutateAsync({
        gatewayOrderId: selectedOrder.gateway_order_id,
        action: actionType,
        bankReference: bankRefInput.trim() || undefined,
        notes: notesInput.trim() || undefined,
      });

      if (actionType === 'approve') {
        toast.success(`Order ${selectedOrder.gateway_order_id} approved! Purchase activated.`);
      } else {
        toast.success(`Order ${selectedOrder.gateway_order_id} marked as rejected.`);
      }

      handleCloseModal();
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Action failed';
      toast.error(msg);
    }
  };

  const payments = data?.payments || [];
  const filteredPayments = payments.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.gateway_order_id.toLowerCase().includes(q) ||
      (p.user_name && p.user_name.toLowerCase().includes(q)) ||
      (p.user_username && p.user_username.toLowerCase().includes(q)) ||
      (p.user_mobile && p.user_mobile.toLowerCase().includes(q)) ||
      (p.utr && p.utr.toLowerCase().includes(q)) ||
      (p.item_title && p.item_title.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Manual Payment Verification</h1>
              <p className="text-sm text-zinc-400">
                Verify incoming UPI bank transfers and activate fan memberships & content
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 w-full sm:w-auto">
          {[
            { id: 'created', label: 'Pending Verification' },
            { id: 'paid', label: 'Approved' },
            { id: 'failed', label: 'Rejected' },
            { id: 'all', label: 'All Orders' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === tab.id
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-4 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fan, order ID, UTR..."
            className="pl-9 bg-zinc-900 border-zinc-800 text-xs text-white placeholder-zinc-500 rounded-xl"
          />
        </div>
      </div>

      {/* Payments List */}
      <Card className="bg-zinc-950 border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <CardHeader className="bg-zinc-900/40 border-b border-zinc-800/80 px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
              {statusFilter === 'created' ? 'Queue Pending Review' : 'Payment Orders'} ({filteredPayments.length})
            </CardTitle>
            <span className="text-xs text-zinc-500">Auto-refresh every 10s</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-3">
              <Loader2 className="size-8 animate-spin text-pink-500" />
              <p className="text-sm">Loading transactions...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Clock className="size-10 text-zinc-600 mb-2" />
              <p className="text-base font-semibold text-zinc-300">No payment records found</p>
              <p className="text-xs text-zinc-500 mt-1">
                {statusFilter === 'created'
                  ? 'All incoming payments are verified and up to date.'
                  : 'No transactions match the selected criteria.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-850">
              {filteredPayments.map((p) => {
                const isPending = p.status === 'created';
                const isPaid = p.status === 'paid';
                const isFailed = p.status === 'failed';

                return (
                  <div
                    key={p.id}
                    className="p-5 hover:bg-zinc-900/30 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Order & Fan Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            isPaid
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold'
                              : isFailed
                              ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold'
                              : 'border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold'
                          }
                        >
                          {isPaid ? 'CONFIRMED' : isFailed ? 'REJECTED' : 'PENDING REVIEW'}
                        </Badge>
                        <span className="text-sm font-bold text-white">{p.item_title || p.purpose}</span>
                        <span className="text-xs text-zinc-500 font-mono">
                          {format(new Date(p.created_at), 'dd MMM yyyy, HH:mm')}
                        </span>
                      </div>

                      {/* Fan Info & Order ID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <User className="size-3.5 text-zinc-500 shrink-0" />
                          <span className="text-zinc-300 font-medium">
                            {p.user_name || 'Fan'} {p.user_username ? `(@${p.user_username})` : ''}
                          </span>
                        </div>
                        {p.user_mobile && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="size-3.5 text-zinc-500 shrink-0" />
                            <span className="text-zinc-300 font-mono">{p.user_mobile}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <FileText className="size-3.5 text-zinc-500 shrink-0" />
                          <span className="text-zinc-400 font-mono">Ref: {p.gateway_order_id.slice(0, 16)}...</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.gateway_order_id, `order_${p.id}`)}
                            className="text-zinc-500 hover:text-zinc-300"
                            title="Copy Order ID"
                          >
                            {copiedId === `order_${p.id}` ? (
                              <Check className="size-3 text-emerald-400" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Submitted UTR / Notes */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {p.utr ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs">
                            <span className="text-zinc-500">Fan UTR:</span>
                            <span className="font-mono font-bold text-emerald-400">{p.utr}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(p.utr!, `utr_${p.id}`)}
                              className="text-zinc-500 hover:text-zinc-300 ml-1"
                              title="Copy UTR"
                            >
                              {copiedId === `utr_${p.id}` ? (
                                <Check className="size-3 text-emerald-400" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-500/80 italic">No UTR submitted by fan yet</span>
                        )}

                        {p.extra_data?.bank_reference && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/60 border border-zinc-800/80 text-xs">
                            <span className="text-zinc-500">Approved Ref:</span>
                            <span className="font-mono text-zinc-300">{p.extra_data.bank_reference}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-800/60">
                      <div className="text-left lg:text-right">
                        <span className="text-xs text-zinc-500">Amount</span>
                        <p className="text-2xl font-black text-white">₹{p.amount.toFixed(2)}</p>
                      </div>

                      {isPending && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleOpenModal(p, 'approve')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-950/40"
                          >
                            <CheckCircle2 className="size-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenModal(p, 'reject')}
                            className="border-zinc-800 hover:bg-rose-950/30 hover:border-rose-800 text-zinc-400 hover:text-rose-400 text-xs rounded-xl"
                          >
                            <XCircle className="size-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Dialog / Modal */}
      {selectedOrder && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl ${
                    actionType === 'approve'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {actionType === 'approve' ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <XCircle className="size-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {actionType === 'approve' ? 'Approve UPI Payment' : 'Reject Payment Order'}
                  </h3>
                  <p className="text-xs text-zinc-400">Order: {selectedOrder.gateway_order_id}</p>
                </div>
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Fan:</span>
                <span className="font-semibold text-white">
                  {selectedOrder.user_name || 'Fan'} {selectedOrder.user_username ? `(@${selectedOrder.user_username})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Item:</span>
                <span className="text-zinc-200">{selectedOrder.item_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Expected Amount:</span>
                <span className="font-bold text-pink-400 text-sm">₹{selectedOrder.amount.toFixed(2)}</span>
              </div>
            </div>

            {actionType === 'approve' ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Bank Reference Number / UTR <span className="text-rose-400">*</span>
                  </label>
                  <Input
                    value={bankRefInput}
                    onChange={(e) => setBankRefInput(e.target.value)}
                    placeholder="Enter 12-digit UTR from your bank statement"
                    className="bg-zinc-900 border-zinc-700 text-xs font-mono text-white"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Verify against your PhonePe or Google Pay bank account statement before approving.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Admin Notes (Optional)</label>
                  <Input
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="e.g. HDFC statement match verified"
                    className="bg-zinc-900 border-zinc-700 text-xs text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Rejection Reason <span className="text-rose-400">*</span>
                  </label>
                  <Input
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="e.g. Payment not received in bank statement"
                    className="bg-zinc-900 border-zinc-700 text-xs text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={verifyMutation.isPending}
                className="flex-1 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitVerification}
                disabled={verifyMutation.isPending}
                className={`flex-1 font-bold text-white ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {verifyMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                ) : null}
                {actionType === 'approve' ? 'Confirm & Activate' : 'Reject Order'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
