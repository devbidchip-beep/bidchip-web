import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <p className="text-7xl font-extrabold" style={{ color: '#1e2a4a' }}>
        404
      </p>
      <h1 className="mt-4 text-2xl font-semibold text-gray-900">Page not found</h1>
      <p className="mt-2 text-sm text-gray-500">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-md px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: '#1e2a4a' }}
      >
        Back to dashboard
      </Link>
    </div>
  );
}
