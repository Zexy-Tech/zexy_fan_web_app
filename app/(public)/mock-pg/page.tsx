'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export default function MockPhonePePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const orderId = searchParams.get('order_id') || 'order_mock_12345';
  const amountPaise = searchParams.get('amount_paise') || '49900';
  const currency = searchParams.get('currency') || 'INR';
  const amount = (parseInt(amountPaise) / 100).toFixed(2);

  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const handlePay = () => {
    setStatus('processing');
    // Simulate PG delay
    setTimeout(() => {
      setStatus('success');
      // After success, redirect back to the app's confirmation/verification page
      setTimeout(() => {
        const callbackUrl = `/payment-confirmation?order_id=${orderId}&payment_id=pay_mock_${Date.now()}&status=success`;
        router.push(callbackUrl);
      }, 1500);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-[400px] border-none shadow-2xl overflow-hidden">
        <div className="bg-[#5f259f] p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
             <div className="bg-white rounded-md p-1">
                <Image src="/zexy_z_letter_logo_nobg.png" alt="PhonePe Mock" width={24} height={24} />
             </div>
             <span className="font-bold tracking-tight text-lg">PhonePe</span>
          </div>
          <div className="text-right">
             <p className="text-[10px] opacity-70 uppercase font-bold">Amount to pay</p>
             <p className="text-lg font-bold">{currency === 'INR' ? '₹' : currency} {amount}</p>
          </div>
        </div>

        <CardHeader className="pt-8 text-center">
          <CardTitle className="text-lg">Zexy Platform</CardTitle>
          <CardDescription>Order ID: {orderId}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === 'idle' && (
            <div className="space-y-4">
               <div className="p-4 bg-zinc-100 rounded-lg flex items-center gap-4">
                  <div className="size-10 bg-white rounded-full flex items-center justify-center border border-zinc-200">
                    <Smartphone className="size-5 text-[#5f259f]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">UPI / GPay / PhonePe</p>
                    <p className="text-xs text-zinc-500">Pay using any UPI app</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-2 text-[10px] text-zinc-400 justify-center">
                  <ShieldCheck className="size-3" />
                  SECURE PAYMENTS BY PHONEPE
               </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="size-12 animate-spin text-[#5f259f] mx-auto" />
              <p className="font-medium text-zinc-600">Processing your payment...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8 text-center space-y-4">
              <CheckCircle2 className="size-16 text-emerald-500 mx-auto animate-bounce" />
              <p className="font-bold text-lg text-emerald-700">Payment Successful!</p>
              <p className="text-sm text-zinc-500">Redirecting you back to Zexy...</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="pb-8">
          {status === 'idle' && (
            <Button 
              className="w-full bg-[#5f259f] hover:bg-[#4d1e82] text-white h-12 rounded-lg text-lg font-bold"
              onClick={handlePay}
            >
              Pay Now
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
