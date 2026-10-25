'use client';

import { useState } from 'react';
import type { Inspection, InspectionPhoto, LabTest } from '@/types/api';
import { cn } from '@/lib/utils';

const LEVEL_BADGE: Record<Inspection['level'], string> = {
  standard: 'bg-blue-100 text-blue-800',
  extended: 'bg-purple-100 text-purple-800',
  full_lab: 'bg-orange-100 text-orange-800',
};

const LEVEL_LABEL: Record<Inspection['level'], string> = {
  standard: 'Standard',
  extended: 'Extended',
  full_lab: 'Full Lab',
};

const RESULT_BADGE: Record<NonNullable<Inspection['result']>, string> = {
  passed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  partial: 'bg-yellow-100 text-yellow-800',
};

const LAB_RESULT_BADGE: Record<NonNullable<LabTest['result']>, string> = {
  pass: 'bg-green-100 text-green-800',
  fail: 'bg-red-100 text-red-800',
  inconclusive: 'bg-yellow-100 text-yellow-800',
};

function PhotoModal({ photo, onClose }: { photo: InspectionPhoto; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full bg-card rounded-lg overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 rounded-full bg-black/50 text-white px-2 py-1 text-xs hover:bg-black/70"
        >
          Close
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.file_url}
          alt={photo.caption || 'Inspection photo'}
          className="w-full object-contain max-h-[70vh]"
        />
        {photo.caption && (
          <p className="px-4 py-2 text-sm text-muted-foreground">{photo.caption}</p>
        )}
      </div>
    </div>
  );
}

interface InspectionPanelProps {
  inspection: Inspection | null;
  supplierOrderId: string;
  labTests?: LabTest[];
  expectedQuantity?: number;
}

export function InspectionPanel({
  inspection,
  supplierOrderId: _supplierOrderId,
  labTests = [],
  expectedQuantity,
}: InspectionPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [activePhoto, setActivePhoto] = useState<InspectionPhoto | null>(null);

  if (!inspection) {
    return (
      <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">No inspection on record.</p>
        <button
          disabled
          className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground cursor-not-allowed"
          title="Warehouse staff only"
        >
          Start Inspection
        </button>
      </div>
    );
  }

  return (
    <>
      {activePhoto && (
        <PhotoModal photo={activePhoto} onClose={() => setActivePhoto(null)} />
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Collapsed header / toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Inspection</span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                LEVEL_BADGE[inspection.level],
              )}
            >
              {LEVEL_LABEL[inspection.level]}
            </span>
            {inspection.result && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                  RESULT_BADGE[inspection.result],
                )}
              >
                {inspection.result}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{expanded ? 'Collapse ▲' : 'Expand ▼'}</span>
        </button>

        {expanded && (
          <div className="border-t px-4 py-4 space-y-4">
            {/* Counts + notes */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Counted Qty</p>
                <p className="font-medium">{inspection.counted_quantity ?? '—'}</p>
              </div>
              {expectedQuantity != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Expected Qty</p>
                  <p className="font-medium">{expectedQuantity.toLocaleString()}</p>
                </div>
              )}
              {inspection.inspected_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Inspected At</p>
                  <p className="font-medium">
                    {new Date(inspection.inspected_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>

            {inspection.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{inspection.notes}</p>
              </div>
            )}

            {/* Photo grid */}
            {inspection.photos.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Photos ({inspection.photos.length})</p>
                <div className="grid grid-cols-2 gap-2">
                  {inspection.photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setActivePhoto(photo)}
                      className="group relative overflow-hidden rounded-md border bg-muted aspect-video"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.file_url}
                        alt={photo.caption || 'Inspection photo'}
                        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                      />
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                          <p className="text-[10px] text-white truncate">{photo.caption}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lab tests */}
            {inspection.level === 'full_lab' && labTests.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Lab Test Results</p>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                        <th className="px-3 py-2">Method</th>
                        <th className="px-3 py-2">Result</th>
                        <th className="px-3 py-2">Completed</th>
                        <th className="px-3 py-2">Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labTests.map((test) => (
                        <tr key={test.id} className="border-b last:border-0">
                          <td className="px-3 py-2">{test.method}</td>
                          <td className="px-3 py-2">
                            {test.result ? (
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                                  LAB_RESULT_BADGE[test.result],
                                )}
                              >
                                {test.result}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">Pending</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {test.completed_at
                              ? new Date(test.completed_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td className="px-3 py-2">
                            {test.report ? (
                              <a
                                href={test.report}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                View ↗
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
