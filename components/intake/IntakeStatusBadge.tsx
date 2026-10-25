import type { IntakeMessage } from '@/types/api';
import { cn } from '@/lib/utils';

type Status = IntakeMessage['status'];

const STATUS_CONFIG: Record<Status, { label: string; className: string; pulse?: boolean }> = {
  received: {
    label: 'Received',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  extracting: {
    label: 'Extracting',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    pulse: true,
  },
  needs_review: {
    label: 'Needs Review',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  draft_created: {
    label: 'Draft Created',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
  rejected_sender: {
    label: 'Rejected Sender',
    className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
};

interface IntakeStatusBadgeProps {
  status: Status;
  className?: string;
}

export function IntakeStatusBadge({ status, className }: IntakeStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
        </span>
      )}
      {config.label}
    </span>
  );
}
