'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { uploadIntakeFile } from '@/lib/api';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const SUPPORTED_FORMATS = [
  { ext: 'Excel', mime: '.xlsx,.xls' },
  { ext: 'CSV', mime: '.csv' },
  { ext: 'PDF', mime: '.pdf' },
  { ext: 'Images', mime: '.png,.jpg,.jpeg,.webp' },
  { ext: 'Plain text', mime: '.txt' },
];

const ACCEPT = SUPPORTED_FORMATS.map((f) => f.mime).join(',');

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function IntakeUploader() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ intake_id: string; status: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = (f: File) => {
    setError(null);
    setResult(null);
    if (f.size > MAX_FILE_SIZE) {
      setError(`File is too large (${formatBytes(f.size)}). Maximum size is 10 MB.`);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSet(dropped);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) validateAndSet(picked);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadIntakeFile(file);
      setResult(res.data);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && inputRef.current?.click()}
        className={[
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/40',
          uploading ? 'cursor-not-allowed opacity-60' : '',
        ].join(' ')}
      >
        {/* Upload icon */}
        <svg
          className="mb-4 h-12 w-12 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>

        <p className="text-lg font-semibold text-foreground">
          Drop your BOM, spreadsheet, PDF or email here
        </p>
        <p className="mt-1 text-sm text-muted-foreground">or click to browse files</p>

        {/* Supported formats */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SUPPORTED_FORMATS.map((f) => (
            <span
              key={f.ext}
              className="rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
            >
              {f.ext}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Max file size: 10 MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {/* Selected file info */}
      {file && !uploading && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Remove file"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Processing state */}
      {uploading && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <svg
            className="h-5 w-5 animate-spin text-primary"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-sm font-medium text-primary">AI is extracting parts…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      {/* Success */}
      {result && (
        <div className="flex items-center justify-between rounded-lg border border-green-300 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Upload successful! AI extraction is in progress.
          </p>
          <Link
            href={`/dashboard/intake/${result.intake_id}`}
            className="ml-4 whitespace-nowrap text-sm font-semibold text-green-700 underline hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
          >
            View results
          </Link>
        </div>
      )}

      {/* Upload button */}
      {!result && (
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading ? 'Uploading…' : 'Upload & Extract with AI'}
        </button>
      )}
    </div>
  );
}
