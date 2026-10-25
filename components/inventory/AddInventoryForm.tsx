'use client';

import { useState } from 'react';
import { addInventoryItem } from '@/lib/api';
import type { InventoryItem, PartSearchResult } from '@/types/api';
import { PartSearchInput } from '@/components/catalog/PartSearchInput';

const PACKAGING_OPTIONS = [
  { value: '', label: '— Select packaging —' },
  { value: 'reel', label: 'Reel' },
  { value: 'cut_tape', label: 'Cut Tape' },
  { value: 'tray', label: 'Tray' },
  { value: 'tube', label: 'Tube' },
  { value: 'bulk', label: 'Bulk' },
  { value: 'other', label: 'Other' },
];

const COUNTRY_OPTIONS = [
  { value: '', label: '— Select country —' },
  { value: 'US', label: 'United States' },
  { value: 'CN', label: 'China' },
  { value: 'DE', label: 'Germany' },
  { value: 'JP', label: 'Japan' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'IN', label: 'India' },
  { value: 'CA', label: 'Canada' },
  { value: 'MX', label: 'Mexico' },
  { value: 'SG', label: 'Singapore' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'FR', label: 'France' },
  { value: 'OTHER', label: 'Other' },
];

interface FormValues {
  mpn_raw: string;
  manufacturer_raw: string;
  quantity: string;
  date_code_year: string;
  packaging: string;
  unit_price: string;
  ship_from_country: string;
}

interface FormErrors {
  mpn_raw?: string;
  quantity?: string;
  date_code_year?: string;
  unit_price?: string;
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.mpn_raw.trim()) errors.mpn_raw = 'MPN is required';
  const qty = Number(values.quantity);
  if (!values.quantity || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
    errors.quantity = 'Quantity must be a positive integer';
  }
  if (values.date_code_year) {
    const year = Number(values.date_code_year);
    if (isNaN(year) || year < 2000 || year > 2099) {
      errors.date_code_year = 'Enter a valid year (2000–2099)';
    }
  }
  if (values.unit_price) {
    const price = Number(values.unit_price);
    if (isNaN(price) || price < 0) {
      errors.unit_price = 'Enter a valid price';
    }
  }
  return errors;
}

interface AddInventoryFormProps {
  onSuccess: (item: InventoryItem) => void;
  onCancel: () => void;
}

export function AddInventoryForm({ onSuccess, onCancel }: AddInventoryFormProps) {
  const [values, setValues] = useState<FormValues>({
    mpn_raw: '',
    manufacturer_raw: '',
    quantity: '',
    date_code_year: '',
    packaging: '',
    unit_price: '',
    ship_from_country: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handlePartSelect = (part: PartSearchResult) => {
    setValues((v) => ({
      ...v,
      mpn_raw: part.mpn,
      manufacturer_raw: part.manufacturer_name,
    }));
  };

  const handleChange = (field: keyof FormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const payload: Partial<InventoryItem> = {
        mpn_raw: values.mpn_raw.trim(),
        manufacturer_raw: values.manufacturer_raw.trim(),
        quantity: Number(values.quantity),
        date_code_year: values.date_code_year ? Number(values.date_code_year) : null,
        packaging: values.packaging || null,
        unit_price: values.unit_price || null,
        ship_from_country: values.ship_from_country,
      };
      const res = await addInventoryItem(payload);
      onSuccess(res.data);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* MPN with autocomplete */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          MPN <span className="text-destructive">*</span>
        </label>
        <PartSearchInput onSelect={handlePartSelect} placeholder="Search catalog or type MPN…" />
        {/* Fallback manual input shown if part selected or typed directly */}
        <input
          type="text"
          value={values.mpn_raw}
          onChange={handleChange('mpn_raw')}
          placeholder="MPN (e.g. GRM155R61A104KA01D)"
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.mpn_raw && <p className="mt-1 text-xs text-destructive">{errors.mpn_raw}</p>}
      </div>

      {/* Manufacturer */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Manufacturer</label>
        <input
          type="text"
          value={values.manufacturer_raw}
          onChange={handleChange('manufacturer_raw')}
          placeholder="e.g. Murata"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Quantity + Date Code */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Quantity <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            value={values.quantity}
            onChange={handleChange('quantity')}
            min="1"
            step="1"
            placeholder="e.g. 1000"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.quantity && <p className="mt-1 text-xs text-destructive">{errors.quantity}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Date Code Year</label>
          <input
            type="number"
            value={values.date_code_year}
            onChange={handleChange('date_code_year')}
            min="2000"
            max="2099"
            placeholder="e.g. 2024"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.date_code_year && (
            <p className="mt-1 text-xs text-destructive">{errors.date_code_year}</p>
          )}
        </div>
      </div>

      {/* Packaging */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Packaging</label>
        <select
          value={values.packaging}
          onChange={handleChange('packaging')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {PACKAGING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Unit Price + Ship From */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Unit Price (USD)</label>
          <input
            type="number"
            value={values.unit_price}
            onChange={handleChange('unit_price')}
            min="0"
            step="0.0001"
            placeholder="e.g. 0.0250"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.unit_price && <p className="mt-1 text-xs text-destructive">{errors.unit_price}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Ship From Country</label>
          <select
            value={values.ship_from_country}
            onChange={handleChange('ship_from_country')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {COUNTRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {serverError && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Add Item'}
        </button>
      </div>
    </form>
  );
}
