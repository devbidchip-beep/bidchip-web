'use client';

import { useState, useRef } from 'react';
import { CheckCircle2, Clock, Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type DocStatus = 'pending' | 'uploaded' | 'approved';

interface DocItem {
  key: string;
  label: string;
  description: string;
  type: 'file' | 'link';
  linkLabel?: string;
  linkHref?: string;
}

const DOCUMENTS: DocItem[] = [
  {
    key: 'incorporation',
    label: 'Incorporation documents',
    description: 'Articles of incorporation, certificate of formation, or equivalent.',
    type: 'file',
  },
  {
    key: 'tax',
    label: 'W-9 / W-8BEN-E',
    description: 'IRS W-9 for US entities or W-8BEN-E for foreign entities.',
    type: 'file',
  },
  {
    key: 'identity',
    label: 'Identity verification',
    description: 'Verify the identity of a beneficial owner via our third-party provider.',
    type: 'link',
    linkLabel: 'Start identity verification',
    linkHref: '#identity-verification',
  },
  {
    key: 'review',
    label: 'BidChip review',
    description: 'Our compliance team reviews your documents (typically 1–2 business days).',
    type: 'file', // review step — no upload needed; status driven by backend
  },
];

function StatusBadge({ status }: { status: DocStatus }) {
  if (status === 'approved') {
    return (
      <span className="flex items-center gap-1 text-sm font-medium text-green-600">
        <CheckCircle2 className="h-4 w-4" /> Approved
      </span>
    );
  }
  if (status === 'uploaded') {
    return (
      <span className="flex items-center gap-1 text-sm font-medium text-blue-600">
        <Clock className="h-4 w-4" /> Under review
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-sm text-gray-400">
      <Clock className="h-4 w-4" /> Pending
    </span>
  );
}

function FileUploadRow({ doc, status, onUpload }: {
  doc: DocItem;
  status: DocStatus;
  onUpload: (key: string, file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(doc.key, file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 rounded-lg border p-4',
        status === 'approved'
          ? 'border-green-100 bg-green-50'
          : status === 'uploaded'
            ? 'border-blue-100 bg-blue-50'
            : 'border-gray-100 bg-white',
      )}
    >
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{doc.label}</p>
        <p className="mt-0.5 text-xs text-gray-500">{doc.description}</p>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-2">
        <StatusBadge status={status} />
        {status === 'pending' && doc.type === 'file' && doc.key !== 'review' && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleChange}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              Upload
            </button>
          </>
        )}
        {status === 'pending' && doc.type === 'link' && (
          <a
            href={doc.linkHref}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            {doc.linkLabel}
          </a>
        )}
      </div>
    </div>
  );
}

export default function CompanyVerifyPage() {
  const [statuses, setStatuses] = useState<Record<string, DocStatus>>({
    incorporation: 'pending',
    tax: 'pending',
    identity: 'pending',
    review: 'pending',
  });

  const handleUpload = async (key: string, file: File) => {
    const formData = new FormData();
    formData.append('document_type', key);
    formData.append('file', file);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/accounts/company/documents/`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        },
      );
      if (res.ok) {
        setStatuses((prev) => ({ ...prev, [key]: 'uploaded' }));
      }
    } catch {
      // silently fail — user can retry
    }
  };

  const allUploaded = ['incorporation', 'tax', 'identity'].every(
    (k) => statuses[k] !== 'pending',
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold" style={{ color: '#1e2a4a' }}>
        Verify your company
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        Complete the steps below to unlock full trading access on BidChip.
      </p>

      <div className="space-y-3">
        {DOCUMENTS.map((doc) => (
          <FileUploadRow
            key={doc.key}
            doc={doc}
            status={statuses[doc.key] ?? 'pending'}
            onUpload={handleUpload}
          />
        ))}
      </div>

      {allUploaded && (
        <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-700">
          <p className="font-medium">Your account is under review.</p>
          <p className="mt-1">You'll receive an email at your registered address when approved.</p>
        </div>
      )}
    </div>
  );
}
