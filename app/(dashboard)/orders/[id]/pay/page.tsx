'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
);

// ─── Inner form (needs to be inside Elements) ───────────────────────────────

function PaymentForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/orders/${orderId}?payment=success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message ?? 'Payment failed.');
      setProcessing(false);
    } else {
      router.push(`/dashboard/orders/${orderId}?payment=success`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMessage && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}
      <button
        type="submit"
        disabled={processing || !stripe || !elements}
        className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {processing ? 'Processing payment…' : 'Pay Now'}
      </button>
    </form>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OrderPayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;

  const clientSecret = searchParams.get('client_secret');

  if (!clientSecret) {
    return (
      <div className="rounded-md bg-destructive/10 p-6 text-destructive text-sm">
        Missing payment session. Please return to your order and try again.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Complete Payment</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your card details to finalize your order.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: { theme: 'stripe' },
          }}
        >
          <PaymentForm orderId={orderId} />
        </Elements>
      </div>
    </div>
  );
}
