'use client';

import { Button } from '@/components/ui/button';
import { Apple, GooglePlay, Sparkles } from '@/components/ui/icons';
import Link from 'next/link';

export function RoleSwitchSuccessView() {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-[440px] text-center space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="size-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg shadow-lg shadow-purple-500/20">
            <Sparkles className="size-8 text-white" aria-hidden />
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-bold tracking-tight text-white">Success!</h1>
            <p className="text-zinc-400 text-lg">
              Your account has been upgraded to <strong>Creator</strong>.
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
          <p className="text-sm text-zinc-300">
            To start posting content and managing your fans, please download the <strong>Zexy Creator</strong> app.
          </p>
          
          <div className="space-y-4">
            <button 
              className="w-full h-[60px] bg-black border border-white/20 hover:bg-zinc-900 text-white rounded-full flex items-center px-6 group"
              onClick={() => window.open('#', '_blank')}
            >
              <Apple className="size-8 fill-current mr-4" />
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase leading-none opacity-70">Available on the</p>
                <p className="text-lg font-bold leading-tight">App Store</p>
              </div>
            </button>
            
            <button 
              className="w-full h-[60px] bg-black border border-white/20 hover:bg-zinc-900 text-white rounded-full flex items-center px-6 group"
              onClick={() => window.open('#', '_blank')}
            >
              <div className="mr-4">
                <GooglePlay className="size-8" aria-hidden />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase leading-none opacity-70">GET IT ON</p>
                <p className="text-lg font-bold leading-tight">Google Play</p>
              </div>
            </button>
          </div>
        </div>

        <Link href="/login" className="block pt-4">
          <Button variant="ghost" className="text-zinc-500 hover:text-white hover:bg-white/5">
            Back to Login
          </Button>
        </Link>
      </div>
    </div>
  );
}
