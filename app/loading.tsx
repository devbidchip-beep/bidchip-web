export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200"
        style={{ borderTopColor: '#f97316' }}
        aria-label="Loading"
      />
    </div>
  );
}
