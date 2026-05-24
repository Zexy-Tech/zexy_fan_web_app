import { Metadata } from "next";

export const metadata: Metadata = { title: "Zexy", description: "Production-grade creator monetization platform" };
/**
 * Desktop Block Page
 * 
 * Displayed to desktop users attempting to access mobile-only creator profiles.
 * Provides clear messaging that the content is only available on mobile devices.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone } from 'lucide-react';

export default function DesktopBlockPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 size-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Smartphone className="size-8 text-white" />
          </div>
          <CardTitle className="text-lg">Mobile Only</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            This creator profile is optimized for mobile devices only.
          </p>
          <p className="text-muted-foreground">
            Please open this page on your smartphone or tablet to view the content.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
