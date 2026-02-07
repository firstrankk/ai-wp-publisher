import { redirect } from 'next/navigation';

export default function HomePage() {
  // DEV MODE: Skip login
  redirect('/dashboard');
}
