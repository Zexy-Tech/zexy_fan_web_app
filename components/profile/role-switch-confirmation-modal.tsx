'use client';

import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface RoleSwitchConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function RoleSwitchConfirmationModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: RoleSwitchConfirmationModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="w-full max-w-[400px]" onClick={(e) => e.stopPropagation()}>
        <Card className="border-white/10 bg-zinc-950 text-white shadow-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="size-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="size-6 text-amber-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold tracking-tight">Become a Creator?</h3>
                <p className="text-sm text-zinc-400">
                  Switching to a creator account will <strong>log you out</strong> from all active sessions. 
                  You will need to login again to access your new creator tools.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="border-white/10 hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Switching...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
