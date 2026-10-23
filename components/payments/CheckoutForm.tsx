'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api, { previewOrderPricing, initiateCheckout } from '@/lib/api';
import type { CheckoutPayload, OrderPricing } from '@/types/api';
import { PricingBreakdown } from './PricingBreakdown';
import { cn } from '@/lib/utils';

interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface Props {
  listingId: string;
  awardIds: string[];
}

type PaymentMethod = 'card' | 'ach' | 'wire';

const CARD_LIMIT = 1500;

const STEPS = ['Shipping', 'Payment', 'Review'] as const;

export function CheckoutForm({ listingId, awardIds }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1 state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [shipToId, setShipToId] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [poFile, setPoFile] = useState<File | null>(null);

  // Step 2 state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  // Step 3 state
  const [pricing, setPricing] = useState<OrderPricing | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Errors
  const [step1Error, setStep1Error] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Address[]>('/accounts/addresses/')
      .then((res) => {
        setAddresses(res.data);
        if (res.data.length > 0) setShipToId(res.data[0].id);
      })
      .catch(() => {})
      .finally(() => setAddressesLoading(false));
  }, []);

  const payload: CheckoutPayload = {
    listing_id: listingId,
    award_ids: awardIds,
    ship_to_id: shipToId,
    payment_method: paymentMethod,
    ...(poNumber ? { po_number: poNumber } : {}),
  };

  useEffect(() => {
    if (step !== 2 || !shipToId) return;
    setPricingLoading(true);
    setPricingError(null);
    previewOrderPricing({ ...payload, preview: true })
      .then((res) => setPricing(res.data))
      .catch((err) => setPricingError(err instanceof Error ? err.message : 'Failed to load pricing'))
      .finally(() => setPricingLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, paymentMethod, shipToId]);

  const handleNextStep1 = () => {
    if (!shipToId) {
      setStep1Error('Please select a shipping address.');
      return;
    }
    setStep1Error(null);
    setStep(1);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await initiateCheckout(payload);
      const { order_id, client_secret } = res.data;
      if (paymentMethod === 'card' && client_secret) {
        router.push(`/dashboard/orders/${order_id}/pay?client_secret=${encodeURIComponent(client_secret)}`);
      } else {
        router.push(`/dashboard/orders/${order_id}?checkout=success`);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Checkout failed');
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, idx) => (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold',
                  idx < step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : idx === step
                    ? 'border-primary text-primary'
                    : 'border-muted text-muted-foreground',
                )}
              >
                {idx < step ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span className={cn('mt-1 text-xs', idx === step ? 'font-medium' : 'text-muted-foreground')}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn('mb-4 h-0.5 flex-1 mx-1', idx < step ? 'bg-primary' : 'bg-muted')} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Shipping */}
      {step === 0 && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold">Shipping Address</h2>

          {addressesLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saved addresses. Please add an address in your account settings.
            </p>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                    shipToId === addr.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/30',
                  )}
                >
                  <input
                    type="radio"
                    name="ship_to"
                    value={addr.id}
                    checked={shipToId === addr.id}
                    onChange={() => setShipToId(addr.id)}
                    className="mt-0.5"
                  />
                  <div className="text-sm">
                    {addr.label && <p className="font-medium">{addr.label}</p>}
                    <p className="text-muted-foreground">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state}{' '}
                      {addr.postal_code}, {addr.country}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium">
              PO Number <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value.slice(0, 60))}
              maxLength={60}
              placeholder="e.g. PO-2026-001"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">
              Upload PO document <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg"
              onChange={(e) => setPoFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
            />
            {poFile && <p className="text-xs text-muted-foreground">{poFile.name}</p>}
          </div>

          {step1Error && <p className="text-sm text-destructive">{step1Error}</p>}

          <div className="flex justify-end">
            <button
              onClick={handleNextStep1}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Payment Method */}
      {step === 1 && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold">Payment Method</h2>

          <div className="space-y-3">
            {(
              [
                { value: 'card', label: 'Credit / Debit Card' },
                { value: 'ach', label: 'ACH Bank Transfer' },
                { value: 'wire', label: 'Wire Transfer' },
              ] as { value: PaymentMethod; label: string }[]
            ).map(({ value, label }) => (
              <label
                key={value}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors',
                  paymentMethod === value ? 'border-primary bg-primary/5' : 'hover:bg-muted/30',
                )}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value={value}
                  checked={paymentMethod === value}
                  onChange={() => setPaymentMethod(value)}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium">{label}</p>
                  {value === 'card' && (
                    <p className="text-xs text-yellow-700">
                      Cards are limited to ${CARD_LIMIT.toLocaleString()} per order.
                    </p>
                  )}
                  {value === 'ach' && (
                    <p className="text-xs text-muted-foreground">
                      ACH payments require a verified business bank account. Order is confirmed when payment clears.
                    </p>
                  )}
                  {value === 'wire' && (
                    <p className="text-xs text-muted-foreground">
                      Wire instructions will be provided after order creation.
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(0)}
              className="rounded-md border px-5 py-2 text-sm font-medium hover:bg-accent"
            >
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Review Order
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6 space-y-3">
            <h2 className="text-base font-semibold">Order Summary</h2>
            <p className="text-sm text-muted-foreground">Listing ID: {listingId}</p>
            <p className="text-sm text-muted-foreground">
              {awardIds.length} award{awardIds.length !== 1 ? 's' : ''} selected
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              Payment: {paymentMethod.replace('_', ' ')}
            </p>
            {poNumber && (
              <p className="text-sm text-muted-foreground">PO: {poNumber}</p>
            )}
          </div>

          {pricingLoading && (
            <div className="h-48 animate-pulse rounded-lg bg-muted" />
          )}
          {pricingError && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {pricingError}
            </div>
          )}
          {pricing && !pricingLoading && (
            <>
              <PricingBreakdown pricing={pricing} />
              {paymentMethod === 'card' && parseFloat(pricing.card_surcharge_rate) > 0 && (
                <p className="text-xs text-muted-foreground px-1">
                  A credit card surcharge of {pricing.card_surcharge_rate}% applies to card payments.
                </p>
              )}
            </>
          )}

          {submitError && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="rounded-md border px-5 py-2 text-sm font-medium hover:bg-accent"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting || pricingLoading || !pricing}
              className="rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Processing…' : 'Confirm & Pay'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
