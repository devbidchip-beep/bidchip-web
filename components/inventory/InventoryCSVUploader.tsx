'use client';

import { useState, useRef } from 'react';
import { uploadInventoryCSV } from '@/lib/api';

const TEMPLATE_HEADERS =
  'mpn_raw,manufacturer_raw,quantity,date_code_year,packaging,unit_price,ship_from_country\n' +
  'GRM155R61A104KA01D,Murata,1000,2024,reel,0.025,US\n';

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_HEADERS], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventory_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

interface InventoryCSVUploaderProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InventoryCSVUploader({ onSuccess, onCancel }: InventoryCSVUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ import_id: string; status: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) {
      setFile(picked);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadInventoryCSV(file);
      setResult(res.data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">CSV Format</p>
        <p className="mt-0.5">
          Required columns: <code className="font-mono text-xs">mpn_raw</code>,{' '}
          <code className="font-mono text-xs">quantity</code>. Optional:{' '}
          <code className="font-mono text-xs">manufacturer_raw</code>,{' '}
          <code className="font-mono text-xs">date_code_year</code>,{' '}
          <code className="font-mono text-xs">packaging</code>,{' '}
          <code className="font-mono text-xs">unit_price</code>,{' '}
          <code className="font-mono text-xs">ship_from_country</code>.
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary underline underline-offset-2 hover:text-primary/80"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download template CSV
        </button>
      </div>

      {/* File input */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Select CSV file</label>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-4 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary-foreground hover:file:bg-primary/90 focus:outline-none"
        />
      </div>

      {/* Selected file */}
      {file && !uploading && (
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{file.name}</span>
        </p>
      )}

      {/* Uploading state */}
      {uploading && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <svg className="h-4 w-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-sm text-primary">Uploading and processing…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {/* Success */}
      {result && (
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            CSV uploaded successfully. Import is processing (ID: {result.import_id}).
          </p>
          <p className="mt-0.5 text-xs text-green-700 dark:text-green-400">
            Inventory will be updated shortly. Refresh the page to see results.
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Cancel
          </button>
        )}
        {!result && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload CSV'}
          </button>
        )}
        {result && onSuccess && (
          <button
            type="button"
            onClick={onSuccess}
            className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}
