import Link from 'next/link';
import { IconComponent } from '@/components/ui/icons';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button-variants';

interface EmptyStatePlaceholderProps {
  icon: IconComponent;
  title: string;
  description?: string;
  /** Optional call to action, e.g. take the user to the screen where they can create the missing thing. */
  action?: { label: string; href: string };
}

export function EmptyStatePlaceholder({
  icon: Icon,
  title,
  description,
  action,
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
          {action && (
            <Link href={action.href} className={buttonVariants({ className: 'mt-4' })}>
              {action.label}
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
