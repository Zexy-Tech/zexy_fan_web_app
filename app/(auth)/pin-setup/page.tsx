'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSetupPIN } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Instagram, Twitter, Facebook } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AxiosError } from 'axios';
import Image from 'next/image';

function PinSetupPageContent() {
  const router = useRouter();
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const setupPIN = useSetupPIN();

  const handlePinChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value !== '') return;

    const target = step === 'create' ? pin : confirmPin;
    const setter = step === 'create' ? setPin : setConfirmPin;
    
    const newPin = [...target];
    newPin[index] = digit;
    setter(newPin);

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newPin.every(d => d !== '') && digit) {
      const code = newPin.join('');
      if (step === 'create') {
        setTimeout(() => {
            setStep('confirm');
            inputRefs.current[0]?.focus();
        }, 300);
      } else {
        setTimeout(() => handleFinish(code), 100);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && (step === 'create' ? !pin[index] : !confirmPin[index]) && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFinish = async (manualConfirmCode?: string) => {
    const pinCode = pin.join('');
    const confirmCode = manualConfirmCode || confirmPin.join('');

    if (pinCode !== confirmCode) {
      toast.error('PINs do not match. Try again.');
      setConfirmPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
      return;
    }

    try {
      await setupPIN.mutateAsync({ pin: pinCode });
      toast.success('PIN setup successful!');
      router.push('/feed');
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      toast.error(axiosError.response?.data?.error?.message || 'Failed to setup PIN');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white p-4 font-inter">
      <div className="w-full max-w-[400px] space-y-10">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="size-24 flex items-center justify-center mb-2 relative overflow-hidden group">
            <Image 
              src="/zexy_z_letter_logo_nobg.png" 
              alt="Zexy logo" 
              width={80} 
              height={80} 
              priority
              className="object-contain drop-shadow-[0_0_15px_rgba(140,61,241,0.3)]"
            />
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-black tracking-[0.1em] uppercase italic bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">ZEXY</h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.5em] pl-[0.5em]">
              {step === 'create' ? 'Secure Account' : 'Confirm PIN'}
            </p>
          </div>
        </div>

        <Card className="border-zinc-800/50 bg-[#121214]/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#8c3df1] to-transparent opacity-50 group-hover:opacity-100" />
          <CardContent className="p-8">
            <div className="flex flex-col gap-8">
              <div className="flex justify-between gap-3">
                {(step === 'create' ? pin : confirmPin).map((digit, index) => (
                  <input
                    key={`pin-setup-${index}`}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="password"
                    inputMode="numeric"
                    value={digit}
                    aria-label={`PIN digit ${index + 1}`}
                    onChange={(e) => handlePinChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className={cn(
                      "w-full h-16 bg-[#1c1c1f] border-2 border-zinc-800 rounded-xl text-center text-2xl font-bold focus:border-[#8c3df1] focus:ring-2 focus:ring-[#8c3df1]/30 outline-none",
                      digit && "border-[#8c3df1] bg-[#1c1c1f]"
                    )}
                    disabled={setupPIN.isPending}
                    maxLength={1}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-4 pt-2">
                <Button 
                  onClick={step === 'create' ? () => pin.join('').length === 4 && setStep('confirm') : () => handleFinish()}
                  className="w-full h-14 bg-[#521c98] hover:bg-[#5f259f] text-white font-bold rounded-xl text-base" 
                  disabled={setupPIN.isPending || (step === 'create' ? pin.join('').length < 4 : confirmPin.join('').length < 4)}
                >
                  {setupPIN.isPending ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    step === 'create' ? 'Continue' : 'Finish Setup'
                  )}
                </Button>
                
                {step === 'confirm' && (
                  <button 
                    type="button" 
                    className="w-full text-center text-sm text-zinc-500 hover:text-purple-400" 
                    onClick={() => { setStep('create'); setConfirmPin(['','','','']); }}
                  >
                    Change PIN
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Links */}
        <div className="flex flex-col items-center gap-6 pt-4">
          <div className="flex items-center gap-4 w-full">
            <div className="h-px flex-1 bg-zinc-800/50" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">Connect with us</span>
            <div className="h-px flex-1 bg-zinc-800/50" />
          </div>
          
          <div className="flex items-center gap-6">
            <a 
              href="https://instagram.com/zexy.live" 
              target="_blank" 
              rel="noopener noreferrer"
              className="size-12 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-[#e789ff] hover:border-[#e789ff]/30 hover:bg-[#e789ff]/5 group"
            >
              <Instagram className="size-5" />
            </a>
            <a 
              href="https://twitter.com/zexylive" 
              target="_blank" 
              rel="noopener noreferrer"
              className="size-12 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-[#e789ff] hover:border-[#e789ff]/30 hover:bg-[#e789ff]/5 group"
            >
              <Twitter className="size-5" />
            </a>
            <a 
              href="https://facebook.com/zexylive" 
              target="_blank" 
              rel="noopener noreferrer"
              className="size-12 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-[#e789ff] hover:border-[#e789ff]/30 hover:bg-[#e789ff]/5 group"
            >
              <Facebook className="size-5" />
            </a>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest text-zinc-500 uppercase opacity-60">
             <a href="https://zexy.live/privacy-policy" className="hover:text-zinc-300">Privacy</a>
             <div className="size-1 rounded-full bg-zinc-800" />
             <a href="https://zexy.live/terms-of-service" className="hover:text-zinc-300">Terms</a>
             <div className="size-1 rounded-full bg-zinc-800" />
             <span className="cursor-default">© 2026 ZEXY</span>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function PinSetupPage() {
  return (
    <Suspense fallback={null}>
      <PinSetupPageContent />
    </Suspense>
  );
}
