'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { createListing } from '@/lib/api';
import type { PartSearchResult, CreateListingLine, ListingLine } from '@/types/api';
import { PartSearchInput } from '@/components/catalog/PartSearchInput';
import { cn } from '@/lib/utils';

// ─── Zod schemas ────────────────────────────────────────────────────────────

const step1Schema = z.object({
  title: z.string().min(1, 'Title is required'),
  kind: z.enum(['reverse', 'bom']),
  duration_minutes: z.number().int().positive(),
  currency: z.string().min(1),
});

const lineSchema = z.object({
  mpn_raw: z.string().min(1, 'MPN is required'),
  manufacturer_raw: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  target_unit_price: z.string().optional(),
  date_code_year_min: z.number().int().min(2000).max(2099).optional().nullable(),
  packaging: z
    .enum(['reel', 'cut_tape', 'tray', 'tube', 'bulk', 'other'])
    .optional()
    .nullable(),
  allow_exceptions: z.boolean(),
  allow_split: z.boolean(),
  require_as6081: z.boolean(),
  docs_required: z.boolean(),
  ncnr: z.boolean(),
});

type Step1Data = z.infer<typeof step1Schema>;
type LineData = z.infer<typeof lineSchema>;

// ─── Default line ────────────────────────────────────────────────────────────

const defaultLine = (): LineData => ({
  mpn_raw: '',
  manufacturer_raw: '',
  quantity: 1,
  target_unit_price: '',
  date_code_year_min: null,
  packaging: null,
  allow_exceptions: true,
  allow_split: true,
  require_as6081: false,
  docs_required: false,
  ncnr: false,
});

// ─── Packaging options ────────────────────────────────────────────────────────

const PACKAGING_OPTIONS: { value: ListingLine['packaging']; label: string }[] = [
  { value: null, label: 'Any' },
  { value: 'reel', label: 'Reel' },
  { value: 'cut_tape', label: 'Cut Tape' },
  { value: 'tray', label: 'Tray' },
  { value: 'tube', label: 'Tube' },
  { value: 'bulk', label: 'Bulk' },
  { value: 'other', label: 'Other' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepIndicator({ step, current }: { step: number; current: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
              s === current
                ? 'bg-primary text-primary-foreground'
                : s < current
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {s}
          </div>
          {s < 3 && (
            <div
              className={cn('mx-2 h-0.5 w-10', s < current ? 'bg-primary/40' : 'bg-muted')}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function LineRow({
  line,
  index,
  onChange,
  onRemove,
}: {
  line: LineData;
  index: number;
  onChange: (i: number, data: Partial<LineData>) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Line {index + 1}</span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-xs text-destructive hover:underline"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium">MPN *</label>
          <input
            type="text"
            value={line.mpn_raw}
            onChange={(e) => onChange(index, { mpn_raw: e.target.value })}
            placeholder="e.g. LM358DR"
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Manufacturer</label>
          <input
            type="text"
            value={line.manufacturer_raw ?? ''}
            onChange={(e) => onChange(index, { manufacturer_raw: e.target.value })}
            placeholder="e.g. Texas Instruments"
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Quantity *</label>
          <input
            type="number"
            min={1}
            value={line.quantity}
            onChange={(e) => onChange(index, { quantity: parseInt(e.target.value) || 1 })}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Target Unit Price</label>
          <input
            type="text"
            value={line.target_unit_price ?? ''}
            onChange={(e) => onChange(index, { target_unit_price: e.target.value })}
            placeholder="e.g. 0.45"
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Date Code Year (min)</label>
          <input
            type="number"
            min={2000}
            max={2099}
            value={line.date_code_year_min ?? ''}
            onChange={(e) =>
              onChange(index, {
                date_code_year_min: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            placeholder="e.g. 2022"
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Packaging</label>
          <select
            value={line.packaging ?? ''}
            onChange={(e) =>
              onChange(index, {
                packaging: (e.target.value as ListingLine['packaging']) || null,
              })
            }
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PACKAGING_OPTIONS.map((o) => (
              <option key={o.value ?? 'null'} value={o.value ?? ''}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {(
          [
            { key: 'allow_exceptions', label: 'Allow Exceptions' },
            { key: 'allow_split', label: 'Allow Split' },
            { key: 'require_as6081', label: 'Require AS6081' },
            { key: 'docs_required', label: 'Require Full Docs' },
            { key: 'ncnr', label: 'NCNR' },
          ] as { key: keyof LineData; label: string }[]
        ).map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={line[key] as boolean}
              onChange={(e) => onChange(index, { [key]: e.target.checked })}
              className="rounded border-input"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Main form ───────────────────────────────────────────────────────────────

export function CreateListingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data>({
    title: '',
    kind: 'reverse',
    duration_minutes: 72 * 60,
    currency: 'USD',
  });
  const [lines, setLines] = useState<LineData[]>([defaultLine()]);
  const [step1Errors, setStep1Errors] = useState<Partial<Record<keyof Step1Data, string>>>({});
  const [step2Errors, setStep2Errors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 submit
  const handleStep1Next = () => {
    const result = step1Schema.safeParse(step1Data);
    if (!result.success) {
      const errs: Partial<Record<keyof Step1Data, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof Step1Data;
        errs[key] = issue.message;
      }
      setStep1Errors(errs);
      return;
    }
    setStep1Errors({});
    setStep(2);
  };

  // Step 2 submit
  const handleStep2Next = () => {
    const errs: string[] = [];
    for (const [i, line] of lines.entries()) {
      const result = lineSchema.safeParse(line);
      if (!result.success) {
        errs.push(
          `Line ${i + 1}: ${result.error.issues.map((e) => e.message).join(', ')}`,
        );
      }
    }
    setStep2Errors(errs);
    if (errs.length === 0) setStep(3);
  };

  // Part search select handler — pre-fill MPN/manufacturer
  const handlePartSelect = (part: PartSearchResult) => {
    setLines((prev) => [
      ...prev,
      {
        ...defaultLine(),
        mpn_raw: part.mpn,
        manufacturer_raw: part.manufacturer_name,
      },
    ]);
  };

  const updateLine = (i: number, data: Partial<LineData>) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...data } : l)));
  };

  const removeLine = (i: number) => {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  };

  // Final submit
  const handleSubmit = async () => {
    setApiError(null);
    setSubmitting(true);
    try {
      const payload = {
        title: step1Data.title,
        kind: step1Data.kind,
        duration_minutes: step1Data.duration_minutes,
        currency: step1Data.currency,
        lines: lines.map(
          (l): CreateListingLine => ({
            mpn_raw: l.mpn_raw,
            manufacturer_raw: l.manufacturer_raw || undefined,
            quantity: l.quantity,
            target_unit_price: l.target_unit_price || undefined,
            date_code_year_min: l.date_code_year_min ?? undefined,
            packaging: l.packaging ?? undefined,
            allow_exceptions: l.allow_exceptions,
            allow_split: l.allow_split,
            require_as6081: l.require_as6081,
            docs_required: l.docs_required,
            ncnr: l.ncnr,
          }),
        ),
      };
      const res = await createListing(payload);
      router.push(`/dashboard/listings/${res.data.id}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <StepIndicator step={step} current={step} />

      {/* ── Step 1: Details ── */}
      {step === 1 && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Listing Details</h2>

          <div>
            <label className="mb-1 block text-sm font-medium">Title *</label>
            <input
              type="text"
              value={step1Data.title}
              onChange={(e) => setStep1Data((d) => ({ ...d, title: e.target.value }))}
              placeholder="e.g. Q4 Shortfall Components"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {step1Errors.title && (
              <p className="mt-1 text-xs text-destructive">{step1Errors.title}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Type</label>
            <div className="flex gap-4">
              {(
                [
                  { value: 'reverse', label: 'Reverse Auction', desc: 'Suppliers compete to sell' },
                  { value: 'bom', label: 'BOM', desc: 'Bill of materials RFQ' },
                ] as { value: 'reverse' | 'bom'; label: string; desc: string }[]
              ).map(({ value, label, desc }) => (
                <label
                  key={value}
                  className={cn(
                    'flex flex-1 cursor-pointer flex-col rounded-md border p-3 transition-colors',
                    step1Data.kind === value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent/50',
                  )}
                >
                  <input
                    type="radio"
                    name="kind"
                    value={value}
                    checked={step1Data.kind === value}
                    onChange={() => setStep1Data((d) => ({ ...d, kind: value }))}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="mt-0.5 text-xs text-muted-foreground">{desc}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Duration</label>
              <select
                value={step1Data.duration_minutes}
                onChange={(e) =>
                  setStep1Data((d) => ({ ...d, duration_minutes: parseInt(e.target.value) }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value={48 * 60}>48 hours</option>
                <option value={72 * 60}>72 hours</option>
                <option value={96 * 60}>96 hours</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Currency</label>
              <select
                value={step1Data.currency}
                onChange={(e) => setStep1Data((d) => ({ ...d, currency: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleStep1Next}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Next: Add Parts
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Lines ── */}
      {step === 2 && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Add Parts</h2>

          <div>
            <label className="mb-1 block text-sm font-medium">Search catalog to add a line</label>
            <PartSearchInput onSelect={handlePartSelect} />
            <p className="mt-1 text-xs text-muted-foreground">
              Or fill in MPN manually below.
            </p>
          </div>

          {lines.length === 0 && (
            <p className="text-sm text-muted-foreground">No lines yet. Add at least one part.</p>
          )}

          <div className="space-y-3">
            {lines.map((line, i) => (
              <LineRow
                key={i}
                line={line}
                index={i}
                onChange={updateLine}
                onRemove={removeLine}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, defaultLine()])}
            className="text-sm text-primary hover:underline"
          >
            + Add line manually
          </button>

          {step2Errors.length > 0 && (
            <ul className="rounded-md bg-destructive/10 p-3 text-xs text-destructive space-y-1">
              {step2Errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-md border px-5 py-2 text-sm font-medium hover:bg-accent"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleStep2Next}
              disabled={lines.length === 0}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Next: Review
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review ── */}
      {step === 3 && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Review & Submit</h2>

          <div className="rounded-md bg-muted/50 p-4 text-sm space-y-1">
            <div className="flex gap-2">
              <span className="font-medium w-24 shrink-0">Title:</span>
              <span>{step1Data.title}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium w-24 shrink-0">Type:</span>
              <span className="capitalize">{step1Data.kind}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium w-24 shrink-0">Duration:</span>
              <span>{step1Data.duration_minutes / 60}h</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium w-24 shrink-0">Currency:</span>
              <span>{step1Data.currency}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3">#</th>
                  <th className="pb-2 pr-3">MPN</th>
                  <th className="pb-2 pr-3">Manufacturer</th>
                  <th className="pb-2 pr-3">Qty</th>
                  <th className="pb-2 pr-3">Target $</th>
                  <th className="pb-2">Packaging</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 pr-3 font-medium">{l.mpn_raw}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{l.manufacturer_raw || '—'}</td>
                    <td className="py-2 pr-3">{l.quantity.toLocaleString()}</td>
                    <td className="py-2 pr-3">{l.target_unit_price || '—'}</td>
                    <td className="py-2 capitalize">{l.packaging?.replace('_', ' ') || 'Any'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {apiError && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{apiError}</p>
          )}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-md border px-5 py-2 text-sm font-medium hover:bg-accent"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Posting…' : 'Post Listing'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
