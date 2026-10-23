import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Admin layout placeholder.
 * In production, staff users are redirected to the Django admin panel.
 * This layout provides a thin wrapper for any Next.js admin views.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Only staff users can access admin routes
  if (!session.user?.staffRole) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
