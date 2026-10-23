import type { Metadata } from 'next';
import { CreateListingForm } from '@/components/listings/CreateListingForm';

export const metadata: Metadata = {
  title: 'Post a Reverse Auction',
};

export default function NewListingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Post a Reverse Auction</h1>
        <p className="text-muted-foreground">
          Create a listing and let suppliers compete to fulfill your component needs.
        </p>
      </div>
      <CreateListingForm />
    </div>
  );
}
