import { Metadata } from "next";

export const metadata: Metadata = { title: "Zexy", description: "Production-grade creator monetization platform" };
'use client';

import { SavedContentView } from '@/components/saved-content-view';

export default function SavedPage() {
  return <SavedContentView />;
}
