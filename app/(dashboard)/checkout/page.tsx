'use client';

import { useSearchParams } from 'next/navigation';
import { CheckoutForm } from '@/components/payments/CheckoutForm';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId') ?? '';
  const awardIdsParam = searchParams.get('awardIds') ?? '';
  const awardIds = awardIdsParam ? awardIdsParam.split(',').filter(Boolean) : [];

  if (!listingId || awardIds.length === 0) {
    return (
      <div className="rounded-md bg-destructive/10 p-6 text-destructive text-sm">
        Missing order details. Please return to the listing and try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Complete Your Order</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review your order details and complete payment.
        </p>
      </div>

      <CheckoutForm listingId={listingId} awardIds={awardIds} />
    </div>
  );
}
