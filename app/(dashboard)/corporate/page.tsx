'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { CompanyMember, Budget, OrderLimit, ApprovalRequest, SpendingReportRow } from '@/types/api';
import {
  getMembers,
  getBudgets,
  getApprovals,
  decideApproval,
  getSpendingReport,
} from '@/lib/api';
import { MemberCard } from '@/components/corporate/MemberCard';
import { InviteMemberForm } from '@/components/corporate/InviteMemberForm';
import { BudgetModal } from '@/components/corporate/BudgetModal';
import { OrderLimitModal } from '@/components/corporate/OrderLimitModal';
import { ApprovalCard } from '@/components/corporate/ApprovalCard';
import { SpendingChart } from '@/components/corporate/SpendingChart';

type Tab = 'team' | 'budgets' | 'approvals' | 'spending';
type ApprovalTab = 'pending' | 'decided';

const MANAGE_ROLES: CompanyMember['role'][] = ['owner', 'manager', 'finance'];
const VISIBLE_ROLES: CompanyMember['role'][] = ['owner', 'manager', 'finance'];

export default function CorporatePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useCurrentUser();
  const memberRole = (user as { memberRole?: string } | null)?.memberRole as CompanyMember['role'] | undefined;

  const [tab, setTab] = useState<Tab>('team');
  const [approvalTab, setApprovalTab] = useState<ApprovalTab>('pending');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Data
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [spendingRows, setSpendingRows] = useState<SpendingReportRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modals
  const [budgetTarget, setBudgetTarget] = useState<CompanyMember | null>(null);
  const [limitTarget, setLimitTarget] = useState<CompanyMember | null>(null);
  const [limits, setLimits] = useState<Record<string, OrderLimit>>({});

  // Redirect non-corporate roles
  useEffect(() => {
    if (!authLoading && memberRole && !VISIBLE_ROLES.includes(memberRole)) {
      router.replace('/dashboard');
    }
  }, [authLoading, memberRole, router]);

  const loadAll = useCallback(async () => {
    setLoadingData(true);
    try {
      const [membersRes, budgetsRes, approvalsRes] = await Promise.all([
        getMembers(),
        getBudgets(),
        getApprovals(),
      ]);
      setMembers(membersRes.data);
      setBudgets(budgetsRes.data);
      setApprovals(approvalsRes.data);
    } catch {
      // silently fail — errors shown per section
    } finally {
      setLoadingData(false);
    }
  }, []);

  const loadSpending = useCallback(async () => {
    const now = new Date();
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const to = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
    try {
      const res = await getSpendingReport(from, to);
      setSpendingRows(res.data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (tab === 'spending') loadSpending();
  }, [tab, loadSpending]);

  const canManage = memberRole ? MANAGE_ROLES.includes(memberRole) : false;

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const decidedApprovals = approvals.filter((a) => a.status !== 'pending');

  const getBudgetForMember = (memberId: string) =>
    budgets.find((b) => b.member === memberId);

  const handleDecide = async (id: string, approved: boolean, note: string) => {
    try {
      await decideApproval(id, approved, note);
      await loadAll();
    } catch {
      // ignore
    }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'team', label: 'Team' },
    { key: 'budgets', label: 'Budgets' },
    { key: 'approvals', label: `Approvals${pendingApprovals.length > 0 ? ` (${pendingApprovals.length})` : ''}` },
    { key: 'spending', label: 'Spending' },
  ];

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Corporate Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your team, budgets, approvals, and spending.</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loadingData && tab !== 'spending' ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <>
          {/* Team tab */}
          {tab === 'team' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                {canManage && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Invite Member
                  </button>
                )}
              </div>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members found.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {members.map((m) => (
                    <MemberCard
                      key={m.id}
                      member={m}
                      canManage={canManage}
                      onSuspend={loadAll}
                      onSetBudget={() => setBudgetTarget(m)}
                      onSetLimit={() => setLimitTarget(m)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Budgets tab */}
          {tab === 'budgets' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Member</th>
                    <th className="pb-2 font-medium">Period</th>
                    <th className="pb-2 font-medium text-right">Budget</th>
                    <th className="pb-2 font-medium text-right">Spent</th>
                    <th className="pb-2 font-medium text-right">Remaining</th>
                    {canManage && <th className="pb-2 font-medium" />}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {members.map((m) => {
                    const budget = getBudgetForMember(m.id);
                    const amount = budget ? parseFloat(budget.amount) : 0;
                    const spent = budget ? parseFloat(budget.spent_this_period) : 0;
                    const remaining = amount - spent;
                    return (
                      <tr key={m.id}>
                        <td className="py-3">
                          <p className="font-medium">{m.user.full_name}</p>
                          <p className="text-xs text-muted-foreground">{m.user.email}</p>
                        </td>
                        <td className="py-3 capitalize">{budget?.period ?? '—'}</td>
                        <td className="py-3 text-right">
                          {budget ? `$${amount.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3 text-right">
                          {budget ? `$${spent.toFixed(2)}` : '—'}
                        </td>
                        <td className={`py-3 text-right font-medium ${remaining < 0 ? 'text-red-600' : ''}`}>
                          {budget ? `$${remaining.toFixed(2)}` : '—'}
                        </td>
                        {canManage && (
                          <td className="py-3 text-right">
                            <button
                              onClick={() => setBudgetTarget(m)}
                              className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                            >
                              {budget ? 'Edit' : 'Set'}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {members.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No members found.</p>
              )}
            </div>
          )}

          {/* Approvals tab */}
          {tab === 'approvals' && (
            <div className="space-y-4">
              <div className="flex gap-2 border-b">
                {(['pending', 'decided'] as ApprovalTab[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setApprovalTab(key)}
                    className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${approvalTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                  >
                    {key === 'pending' ? `Pending (${pendingApprovals.length})` : `Decided (${decidedApprovals.length})`}
                  </button>
                ))}
              </div>
              {(approvalTab === 'pending' ? pendingApprovals : decidedApprovals).length === 0 ? (
                <p className="text-sm text-muted-foreground">No {approvalTab} approvals.</p>
              ) : (
                <div className="space-y-3">
                  {(approvalTab === 'pending' ? pendingApprovals : decidedApprovals).map((a) => (
                    <ApprovalCard
                      key={a.id}
                      approval={a}
                      canDecide={canManage && approvalTab === 'pending'}
                      onDecide={(approved, note) => handleDecide(a.id, approved, note)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Spending tab */}
          {tab === 'spending' && (
            <SpendingChart rows={spendingRows} />
          )}
        </>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-card shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-base font-semibold">Invite Team Member</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-5">
              <InviteMemberForm onSuccess={() => { setShowInviteModal(false); loadAll(); }} />
            </div>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {budgetTarget && (
        <BudgetModal
          member={budgetTarget}
          existing={getBudgetForMember(budgetTarget.id)}
          onSave={() => { setBudgetTarget(null); loadAll(); }}
          onClose={() => setBudgetTarget(null)}
        />
      )}

      {/* Order Limit Modal */}
      {limitTarget && (
        <OrderLimitModal
          member={limitTarget}
          existing={limits[limitTarget.id]}
          onSave={() => { setLimitTarget(null); }}
          onClose={() => setLimitTarget(null)}
        />
      )}
    </div>
  );
}
