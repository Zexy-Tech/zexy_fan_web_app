/**
 * Q&A Item Component
 * 
 * Displays a single question and answer with expand/collapse functionality.
 */

'use client';

import { useState } from 'react';
import { QAItem } from '@/types/creator-profile';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface QAItemProps {
  item: QAItem;
}

/**
 * Q&A item component with expand/collapse
 * 
 * @param item - Q&A item data
 */
export function QAItemComponent({ item }: QAItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-start justify-between gap-3 hover:bg-accent/50 transition-colors text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <p className="font-medium">{item.question}</p>
          {isExpanded && item.answer && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {item.answer}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 pt-1">
          {isExpanded ? (
            <ChevronUp className="size-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-5 text-muted-foreground" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-3 text-xs text-muted-foreground">
          {new Date(item.createdAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
