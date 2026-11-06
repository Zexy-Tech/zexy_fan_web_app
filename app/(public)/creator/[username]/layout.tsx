export default function CreatorPublicLayout({ children }: { children: React.ReactNode }) {
  // This route matches a LinkMe-like full-bleed experience.
  // We intentionally do not render the shared public Header/Footer here.
  return <>{children}</>;
}

