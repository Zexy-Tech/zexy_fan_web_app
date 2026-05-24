'use client';

import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImageViewerProps {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
}

export function ImageViewer({ src, alt, open, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setScale(1);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{alt || 'Image Preview'}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleZoomOut}>
            <ZoomOut className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleZoomIn}>
            <ZoomIn className="size-5" />
          </Button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 size-10" onClick={onClose}>
            <X className="size-6" />
          </Button>
        </div>
      </div>

      {/* Image Area */}
      <div 
        className="flex-1 overflow-auto flex items-center justify-center p-4 cursor-zoom-out"
        onClick={onClose}
      >
        <div 
          className="transition-transform duration-200 ease-out shadow-2xl"
          style={{ 
            transform: `scale(${scale})`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={src} 
            alt={alt} 
            className="max-w-full max-h-[85vh] rounded-sm object-contain select-none pointer-events-none"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>

      {/* Footer / Status */}
      <div className="p-4 text-center">
        <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
          Scale: {Math.round(scale * 100)}%
        </p>
      </div>
    </div>
  );
}
