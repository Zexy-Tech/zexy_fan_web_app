import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStatePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyStatePlaceholder({
  icon: Icon,
  title,
  description,
}: EmptyStatePlaceholderProps) {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            <Icon className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">{title}</p>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
