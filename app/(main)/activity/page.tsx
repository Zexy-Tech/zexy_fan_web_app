import { Metadata } from "next";

export const metadata: Metadata = { title: "Zexy", description: "Production-grade creator monetization platform" };
'use client';

import React from 'react';
import { useActivity } from '@/hooks/useActivity';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CreditCard, Lock, Package, MessageSquare, Heart, Shield, LogIn, Key, Mail, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const EVENT_CONFIG: Record<string, { icon: React.ElementType, label: string, color: string }> = {
  subscription_purchased: { icon: CreditCard, label: 'Subscription', color: 'text-purple-400' },
  content_unlocked: { icon: Lock, label: 'Content Unlock', color: 'text-pink-400' },
  product_purchased: { icon: Package, label: 'Product', color: 'text-yellow-400' },
  message_paid: { icon: MessageSquare, label: 'Paid DM', color: 'text-blue-400' },
  tip_received: { icon: Heart, label: 'Tip Sent', color: 'text-red-400' },
  login_success: { icon: LogIn, label: 'Login', color: 'text-green-400' },
  pin_setup: { icon: Shield, label: 'Security', color: 'text-green-400' },
  pin_changed: { icon: Key, label: 'Security', color: 'text-purple-400' },
  otp_sent: { icon: Mail, label: 'OTP Sent', color: 'text-blue-400' },
  session_revoked: { icon: LogOut, label: 'Logout', color: 'text-zinc-400' },
};

export default function ActivityPage() {
  const { data, isLoading } = useActivity();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const items = data?.items || [];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-bold">Activity History</h1>
        <p className="text-zinc-400 text-sm">Monitor your account activity and security events</p>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="py-10 text-center text-zinc-500">
              No activity recorded yet
            </CardContent>
          </Card>
        ) : (
          items.map((item) => {
            const config = EVENT_CONFIG[item.event_type] || { icon: Shield, label: item.event_type, color: 'text-zinc-400' };
            const Icon = config.icon;

            return (
              <Card key={item.id} className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn("p-2 rounded-xl bg-zinc-800/50", config.color)}>
                    <Icon className="size-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm capitalize">
                      {item.event_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {format(new Date(item.created_at), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>

                  {item.amount && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">₹{item.amount}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
