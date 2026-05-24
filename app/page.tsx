import { Metadata } from "next";

export const metadata: Metadata = { title: "Zexy", description: "Production-grade creator monetization platform" };
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to creators page (default during development)
  redirect('/creators');
}
