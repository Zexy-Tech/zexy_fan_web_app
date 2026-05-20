'use client';

import { Button } from '@/components/ui/button';
import { Apple } from 'lucide-react';
import Link from 'next/link';

export function RoleSwitchSuccessView() {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-[440px] text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl shadow-lg shadow-purple-500/20">
            ✨
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">Success!</h1>
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
              className="w-full h-[60px] bg-black border border-white/20 hover:bg-zinc-900 text-white rounded-xl flex items-center px-6 transition-colors group"
              onClick={() => window.open('#', '_blank')}
            >
              <Apple className="h-8 w-8 fill-current mr-4 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase leading-none opacity-70">Available on the</p>
                <p className="text-xl font-bold leading-tight">App Store</p>
              </div>
            </button>
            
            <button 
              className="w-full h-[60px] bg-black border border-white/20 hover:bg-zinc-900 text-white rounded-xl flex items-center px-6 transition-colors group"
              onClick={() => window.open('#', '_blank')}
            >
              <div className="mr-4 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L18.66,16.19C19.28,16.55 19.28,17.45 18.66,17.81L14.73,20.08L14.5,12.81L16.81,15.12M14.73,3.92L18.66,6.19C19.28,6.55 19.28,7.45 18.66,7.81L16.81,8.88L14.5,11.19L14.73,3.92M14.28,12L13.91,12.37L4.65,21.62C4.65,21.62 4.65,21.62 4.66,21.62L13.91,12.37L14.28,12Z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase leading-none opacity-70">GET IT ON</p>
                <p className="text-xl font-bold leading-tight">Google Play</p>
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
