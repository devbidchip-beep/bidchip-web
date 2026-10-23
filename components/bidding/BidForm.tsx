'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { placeBid } from '@/lib/api';
import type { ListingLine } from '@/types/api';
import { cn } from '@/lib/utils';

const PACKAGING_OPTIONS: Array<{ value: NonNullable<ListingLine['packaging']>; label: string }> = [
  { value: 'reel', label: 'Reel' },
  { value: 'cut_tape', label: 'Cut Tape' },
  { value: 'tray', label: 'Tray' },
  { value: 'tube', label: 'Tube' },
  { value: 'bulk', label: 'Bulk' },
  { value: 'other', label: 'Other' },
];

const schema = z.object({
  unit_price: z
    .string()
    .min(1, 'Price is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Must be greater than 0'),
  quantity_offered: z.coerce.number().int().positive('Must be a positive integer'),
  date_code_year: z.coerce
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1)
    .optional()
    .or(z.literal('')),
  packaging: z.string().optional(),
  lead_time_days: z.coerce.number().int().min(0).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  line: ListingLine;
  onSuccess: () => void;
}

export function BidForm({ line, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      unit_price: '',
      quantity_offered: line.quantity,
      date_code_year: '',
      packaging: '',
      lead_time_days: '',
    },
  });

  const unitPriceRaw = watch('unit_price');
  const qtyOffered = watch('quantity_offered');
  const dateCodeYear = watch('date_code_year');

  const unitPrice = parseFloat(unitPriceRaw) || 0;
  const qty = Number(qtyOffered) || 0;
  const total = unitPrice * qty;
  const fee = total * 0.07;
  const net = total - fee;

  // Exception checks
  const isQtyShort = qty > 0 && qty < line.quantity;
  const dateCodeNum = dateCodeYear !== '' ? Number(dateCodeYear) : null;
  const isDateCodeException =
    dateCodeNum !== null &&
    line.date_code_year_min !== null &&
    dateCodeNum < line.date_code_year_min;

  const hasException = isQtyShort || isDateCodeException;
  const exactMatchOnly = !line.allow_exceptions;
  const isBlocked = exactMatchOnly && hasException;

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    setSuccessMsg(null);
    try {
      await placeBid({
        line: line.id,
        unit_price: values.unit_price,
        quantity_offered: Number(values.quantity_offered),
        ...(values.date_code_year !== '' && values.date_code_year !== undefined
          ? { date_code_year: Number(values.date_code_year) }
          : {}),
        ...(values.packaging ? { packaging: values.packaging as ListingLine['packaging'] } : {}),
        ...(values.lead_time_days !== '' && values.lead_time_days !== undefined
          ? { lead_time_days: Number(values.lead_time_days) }
          : {}),
      });
      setSuccessMsg('Bid placed successfully!');
      onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg border bg-card p-4 text-sm"
    >
      <h3 className="font-semibold">Place a Bid — Line {line.line_no}: {line.mpn_raw}</h3>

      {/* Exception warnings */}
      {isQtyShort && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-yellow-800 text-xs">
          This is a partial quantity bid (exception bid)
        </div>
      )}
      {isDateCodeException && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-yellow-800 text-xs">
          Date code does not meet requirement (exception bid)
        </div>
      )}
      {exactMatchOnly && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-red-800 text-xs">
          This listing requires exact matches only
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Unit price */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Your price per unit (USD) <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            step="0.0001"
            min="0.0001"
            {...register('unit_price')}
            className={cn(
              'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
              errors.unit_price && 'border-destructive',
            )}
            placeholder="0.0000"
          />
          {errors.unit_price && (
            <p className="text-xs text-destructive">{errors.unit_price.message}</p>
          )}
        </div>

        {/* Quantity offered */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Quantity offered <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            min="1"
            {...register('quantity_offered')}
            className={cn(
              'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
              errors.quantity_offered && 'border-destructive',
            )}
          />
          {errors.quantity_offered && (
            <p className="text-xs text-destructive">{errors.quantity_offered.message}</p>
          )}
        </div>

        {/* Date code year */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Date code year (optional)
            {line.date_code_year_min && (
              <span className="ml-1 text-muted-foreground">
                (min: {line.date_code_year_min})
              </span>
            )}
          </label>
          <input
            type="number"
            min="1990"
            max={new Date().getFullYear() + 1}
            {...register('date_code_year')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. 2023"
          />
          {errors.date_code_year && (
            <p className="text-xs text-destructive">{String(errors.date_code_year.message)}</p>
          )}
        </div>

        {/* Packaging */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Packaging (optional)</label>
          <select
            {...register('packaging')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— Any —</option>
            {PACKAGING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Lead time */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Lead time (days, optional)
          </label>
          <input
            type="number"
            min="0"
            {...register('lead_time_days')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. 5"
          />
        </div>
      </div>

      {/* Fee preview */}
      {unitPrice > 0 && qty > 0 && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs space-y-0.5">
          <p>
            <span className="text-muted-foreground">Seller fee: 7% of total = </span>
            <span className="font-medium">${fee.toFixed(2)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">You will receive approx: </span>
            <span className="font-medium text-green-700">${net.toFixed(2)}</span>
          </p>
          <p className="text-muted-foreground italic">Final fee calculated at order time</p>
        </div>
      )}

      {submitError && (
        <p className="text-xs text-destructive">{submitError}</p>
      )}
      {successMsg && (
        <p className="text-xs text-green-700 font-medium">{successMsg}</p>
      )}

      <button
        type="submit"
        disabled={submitting || isBlocked}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {submitting ? 'Placing bid…' : 'Place Bid'}
      </button>
    </form>
  );
}
