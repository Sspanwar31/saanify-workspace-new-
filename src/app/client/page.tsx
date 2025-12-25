import { redirect } from 'next/navigation';

export default function ClientRoot() {
  // Redirect root access directly to dashboard
  redirect('/client/dashboard');
}