import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Listings',
};

export default function ListingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listings</h1>
          <p className="text-muted-foreground">Manage your component listings</p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          New Listing
        </button>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-6">
          <p className="text-sm text-muted-foreground">
            No listings found. Create your first listing to get started.
          </p>
        </div>
      </div>
    </div>
  );
}
