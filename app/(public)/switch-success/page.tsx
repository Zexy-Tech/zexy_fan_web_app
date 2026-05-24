import { Metadata } from "next";

export const metadata: Metadata = { title: "Zexy", description: "Production-grade creator monetization platform" };
'use client';

import { RoleSwitchSuccessView } from '@/components/profile/role-switch-success-view';

export default function SwitchSuccessPage() {
  return <RoleSwitchSuccessView />;
}
