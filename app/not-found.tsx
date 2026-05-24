import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileQuestion className="size-6 text-muted-foreground" />
            <CardTitle>Page Not Found</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex gap-2">
            <Link href="/" className="flex-1">
              <Button className="w-full">Go home</Button>
            </Link>
            <Link href="/creators" className="flex-1">
              <Button variant="outline" className="w-full">Browse creators</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
