'use client';

import { useState } from 'react';
import type { CompanyMember } from '@/types/api';
import { suspendMember } from '@/lib/api';

interface Props {
  member: CompanyMember;
  canManage: boolean;
  onSuspend: () => void;
  onSetBudget?: () => void;
  onSetLimit?: () => void;
}

const ROLE_COLORS: Record<CompanyMember['role'], string> = {
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  finance: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  manager: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  buyer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  seller: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  read_only: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const ROLE_LABELS: Record<CompanyMember['role'], string> = {
  owner: 'Owner',
  finance: 'Finance',
  manager: 'Manager',
  buyer: 'Buyer',
  seller: 'Seller',
  read_only: 'Read Only',
};

const STATUS_COLORS: Record<CompanyMember['status'], string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  left: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function MemberCard({ member, canManage, onSuspend, onSetBudget, onSetLimit }: Props) {
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuspend = async () => {
    setLoading(true);
    setError(null);
    try {
      await suspendMember(member.id);
      onSuspend();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend member.');
    } finally {
      setLoading(false);
      setConfirmSuspend(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{member.user.full_name}</p>
          <p className="truncate text-sm text-muted-foreground">{member.user.email}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[member.role]}`}>
            {ROLE_LABELS[member.role]}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[member.status]}`}>
            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
          </span>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {canManage && (
        <div className="mt-3 flex flex-wrap gap-2">
          {onSetBudget && (
            <button
              onClick={onSetBudget}
              className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Set Budget
            </button>
          )}
          {onSetLimit && (
            <button
              onClick={onSetLimit}
              className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Set Order Limit
            </button>
          )}
          {member.status === 'active' && (
            <>
              {confirmSuspend ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Suspend this member?</span>
                  <button
                    onClick={handleSuspend}
                    disabled={loading}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? 'Suspending…' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setConfirmSuspend(false)}
                    className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmSuspend(true)}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Suspend
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
