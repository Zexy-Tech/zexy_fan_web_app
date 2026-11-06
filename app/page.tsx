import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to creators page (default during development)
  redirect('/creators');
}
