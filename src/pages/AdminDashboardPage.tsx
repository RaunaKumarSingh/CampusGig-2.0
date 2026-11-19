import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Database, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { TransactionStatusLabel, VerificationText } from '../components/StatusIndicator';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { clearDemoDataInFirestore, seedDemoDataInFirestore } from '../data/demoData';
import {
  confirmPaymentRelease,
  moderateTaskRemoval,
  resolveDispute,
  setUserSuspension,
  setUserVerification,
  updateAdminSettings,
} from '../services/campusgigService';
import {
  GIG_CATEGORIES,
  PILOT_TARGETS,
  VENTURE_ASSUMPTIONS,
  formatInr,
  toJsDate,
} from '../types/campusgig';

type AdminTab =
  | 'verification'
  | 'users'
  | 'tasks'
  | 'payments'
  | 'disputes'
  | 'settings';

export function AdminDashboardPage() {
  const { firebaseUser, isAdmin } = useAuth();
  const {
    tasks,
    usersPublic,
    usersPrivate,
    applications,
    transactions,
    reviews,
    disputes,
    adminSettings,
  } = useData();
  const { showToast } = useToast();

  const [tab, setTab] = useState<AdminTab>('verification');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateWindow, setDateWindow] = useState<'all' | '7d' | '30d'>('all');
  const [includeDemoInMetrics, setIncludeDemoInMetrics] = useState(true);
  const [busy, setBusy] = useState(false);

  // Settings state
  const [commissionPct, setCommissionPct] = useState(String(adminSettings.commissionRatePct));
  const [variableCost, setVariableCost] = useState(String(adminSettings.variableCostInr));
  const [fixedCost, setFixedCost] = useState(String(adminSettings.monthlyFixedCostInr));
  const [demoBanner, setDemoBanner] = useState(adminSettings.demoModeBanner);

  const filteredByWindowAndCat = useMemo(() => {
    const now = Date.now();
    const cutoff =
      dateWindow === '7d'
        ? now - 7 * 86400000
        : dateWindow === '30d'
        ? now - 30 * 86400000
        : 0;

    const filterTask = (t: (typeof tasks)[number]) => {
      if (!includeDemoInMetrics && t.isDemo) return false;
      if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
      if (cutoff > 0) {
        const d = toJsDate(t.createdAt)?.getTime() || now;
        if (d < cutoff) return false;
      }
      return true;
    };

    const filteredTasks = tasks.filter(filterTask);
    const taskIds = new Set(filteredTasks.map((t) => t.id));
    const filteredTxns = transactions.filter(
      (tx) =>
        (includeDemoInMetrics || !tx.isDemo) &&
        (categoryFilter === 'All' || tx.taskCategory === categoryFilter || taskIds.has(tx.taskId))
    );

    return { filteredTasks, filteredTxns };
  }, [tasks, transactions, categoryFilter, dateWindow, includeDemoInMetrics]);

  if (!firebaseUser || !isAdmin) {
    return (
      <AppLayout title="Admin Console">
        <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-2xl p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400 mx-auto" />
          <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
            Authorized Administrator Access Only
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Access to CampusGig moderation, verification approval, and financial analytics is
            restricted at the database level to verified administrator accounts.
          </p>
          <Link
            to="/dashboard"
            className="mt-5 inline-flex px-4 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Actual Database Metrics Calculation
  const activeUsers = usersPublic.filter((u) => includeDemoInMetrics || !u.isDemo);
  const verifiedUsers = activeUsers.filter((u) => u.verificationStatus === 'verified');
  const activePosters = new Set(
    filteredByWindowAndCat.filteredTasks.map((t) => t.posterId)
  ).size;
  const completedGigs = filteredByWindowAndCat.filteredTasks.filter(
    (t) => t.status === 'completed'
  );
  const cancelledGigs = filteredByWindowAndCat.filteredTasks.filter(
    (t) => t.status === 'cancelled'
  );
  const activeApplications = applications.filter((a) => includeDemoInMetrics || !a.isDemo);
  const acceptedApps = activeApplications.filter((a) => a.status === 'accepted');

  const completedTxns = filteredByWindowAndCat.filteredTxns.filter(
    (t) => t.status === 'completed'
  );
  const grossTaskValue = completedTxns.reduce((s, t) => s + t.grossAmountInr, 0);
  const platformRevenue = completedTxns.reduce((s, t) => s + t.platformCommissionInr, 0);
  const totalVariableCosts = completedTxns.reduce((s, t) => s + t.variableCostInr, 0);
  const netPlatformContribution = completedTxns.reduce((s, t) => s + t.netContributionInr, 0);

  const relevantReviews = reviews.filter((r) => includeDemoInMetrics || !r.isDemo);
  const avgSatisfaction =
    relevantReviews.length > 0
      ? (relevantReviews.reduce((s, r) => s + r.rating, 0) / relevantReviews.length) * 20
      : 0;
  const openDisputesCount = disputes.filter(
    (d) => (includeDemoInMetrics || !d.isDemo) && d.status === 'open'
  ).length;

  const verificationRate =
    activeUsers.length > 0 ? Math.round((verifiedUsers.length / activeUsers.length) * 100) : 0;
  const acceptanceRate =
    activeApplications.length > 0
      ? Math.round((acceptedApps.length / activeApplications.length) * 100)
      : 0;
  const completionRate =
    filteredByWindowAndCat.filteredTasks.length > 0
      ? Math.round(
          (completedGigs.length / filteredByWindowAndCat.filteredTasks.length) * 100
        )
      : 0;

  const pendingVerifications = usersPublic.filter(
    (u) => u.verificationStatus === 'pending' || u.verificationStatus === 'unverified'
  );

  const handleSeedDemo = async () => {
    setBusy(true);
    try {
      window.localStorage.removeItem('campusgig_demo_cleared');
      const count = await seedDemoDataInFirestore(firebaseUser.uid);
      showToast('Demo data seeded to Firestore', 'success', `${count} records written.`);
    } catch (err) {
      showToast('Seed failed', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const handleClearDemo = async () => {
    setBusy(true);
    try {
      window.localStorage.setItem('campusgig_demo_cleared', 'true');
      const deleted = await clearDemoDataInFirestore();
      showToast('Demo records removed', 'info', `${deleted} demo records deleted from Firestore.`);
    } catch (err) {
      showToast('Clear failed', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateAdminSettings(firebaseUser.uid, {
        commissionRatePct: Math.max(0, Math.min(40, Number(commissionPct) || 15)),
        variableCostInr: Math.max(0, Number(variableCost) || 5),
        monthlyFixedCostInr: Math.max(0, Number(fixedCost) || 8000),
        categories: adminSettings.categories?.length
          ? adminSettings.categories
          : [...GIG_CATEGORIES],
        demoModeBanner: demoBanner,
      });
      showToast('Platform settings saved');
    } catch (err) {
      showToast('Save failed', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout title="Admin Analytics & Moderation">
      {/* Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={dateWindow}
            onChange={(e) => setDateWindow(e.target.value as 'all' | '7d' | '30d')}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
          >
            <option value="All">All Categories</option>
            {GIG_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDemoInMetrics}
              onChange={(e) => setIncludeDemoInMetrics(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-600 text-violet-700"
            />
            Include DEMO records in database metrics
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={handleSeedDemo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 disabled:opacity-50 transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            Seed 16 DGU Demo Gigs
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleClearDemo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove Demo Records
          </button>
        </div>
      </div>

      {/* Section A: Actual Database Performance */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
            Actual Platform Metrics (Database Records)
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {includeDemoInMetrics ? 'Includes DEMO + Live records' : 'Live non-demo records only'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Registered Users</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100 font-display tabular-nums">
              {activeUsers.length}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {verifiedUsers.length} verified ({verificationRate}%)
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Active Posters / Total Gigs</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100 font-display tabular-nums">
              {activePosters} / {filteredByWindowAndCat.filteredTasks.length}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {activeApplications.length} apps ({acceptanceRate}% accepted)
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Completed / Cancelled</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100 font-display tabular-nums">
              {completedGigs.length} / {cancelledGigs.length}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {completionRate}% completion rate
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Gross Task Value</p>
            <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100 font-display tabular-nums">
              {formatInr(grossTaskValue)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {completedTxns.length} confirmed txns
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Commission / Net Contribution
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-400 font-display tabular-nums">
              {formatInr(platformRevenue)} / {formatInr(netPlatformContribution)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              Var. costs: {formatInr(totalVariableCosts)}
            </p>
          </div>
        </div>
      </div>

      {/* Section B: Pilot Validation Targets vs Venture Plan Projections (Strictly Separated!) */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
              14-Day DGU Pilot Targets (Validation Benchmarks)
            </h3>
            <span className="text-[11px] font-mono text-violet-700 dark:text-violet-400 font-semibold">
              TARGET BENCHMARKS
            </span>
          </div>
          <div className="mt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                Completed Micro-Gigs (14-Day Target)
              </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {completedGigs.length} / {PILOT_TARGETS.targetCompletedGigs14Days} target
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                Satisfaction Rating (&gt;85% Target)
              </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {avgSatisfaction.toFixed(0)}% actual vs &gt;{PILOT_TARGETS.targetSatisfactionPct}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                Open Payment / Task Disputes (0 Target)
              </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {openDisputesCount} open vs {PILOT_TARGETS.targetMaxDisputes} target
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
              Venture-Plan Financial Assumptions (Projected Model)
            </h3>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
              PLAN ASSUMPTIONS
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs tabular-nums">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Avg Task / Fee</span>
              <strong className="text-slate-900 dark:text-slate-100">
                ₹{VENTURE_ASSUMPTIONS.avgTaskValueInr} / ₹{VENTURE_ASSUMPTIONS.referenceCommissionInr}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Contribution / Txn</span>
              <strong className="text-slate-900 dark:text-slate-100">
                ₹{VENTURE_ASSUMPTIONS.contributionMarginPerTxnInr} (₹
                {VENTURE_ASSUMPTIONS.variableCostPerTxnInr} var.)
              </strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Monthly Fixed Cost</span>
              <strong className="text-slate-900 dark:text-slate-100">
                {formatInr(VENTURE_ASSUMPTIONS.monthlyFixedOperatingCostInr)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Break-Even Volume</span>
              <strong className="text-slate-900 dark:text-slate-100">
                {VENTURE_ASSUMPTIONS.breakEvenTransactions} txns (~
                {VENTURE_ASSUMPTIONS.breakEvenCustomers} users)
              </strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Base Case (900 txns)</span>
              <strong className="text-slate-900 dark:text-slate-100">
                {formatInr(VENTURE_ASSUMPTIONS.baseMonthlyGrossRevenueInr)} rev
              </strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Operating Surplus</span>
              <strong className="text-emerald-700 dark:text-emerald-400">
                {formatInr(VENTURE_ASSUMPTIONS.baseMonthlyOperatingSurplusInr)} / mo
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Management Tabs */}
      <div className="mt-7 flex items-center gap-1.5 overflow-x-auto pb-1">
        {(
          [
            { key: 'verification', label: `Verification Queue (${pendingVerifications.length})` },
            { key: 'users', label: `Users (${usersPublic.length})` },
            { key: 'tasks', label: `Task Moderation (${tasks.length})` },
            { key: 'payments', label: `Payments (${transactions.length})` },
            { key: 'disputes', label: `Disputes (${disputes.length})` },
            { key: 'settings', label: 'Platform Settings' },
          ] as Array<{ key: AdminTab; label: string }>
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              tab === t.key
                ? 'bg-violet-700 dark:bg-violet-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {tab === 'verification' && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingVerifications.length === 0 ? (
              <p className="p-8 text-sm text-slate-500 dark:text-slate-400 text-center">
                No pending verification requests right now.
              </p>
            ) : (
              pendingVerifications.map((u) => {
                const priv = usersPrivate.find((p) => p.uid === u.uid);
                return (
                  <div
                    key={u.uid}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {u.displayName}
                        </span>
                        <VerificationText status={u.verificationStatus} />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {u.course} · {u.department} · {u.academicYear}
                      </p>
                      {priv && (
                        <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-1">
                          ID: {priv.studentId} · Email: {priv.universityEmail} · Mob:{' '}
                          {priv.mobileNumber}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          await setUserVerification(u.uid, 'verified', 'Approved by CampusGig Admin');
                          showToast(`${u.displayName} verified`);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-700 dark:bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-800 dark:hover:bg-emerald-500"
                      >
                        Approve Verification
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await setUserVerification(
                            u.uid,
                            'rejected',
                            'Student ID or email mismatch'
                          );
                          showToast(`${u.displayName} rejected`, 'info');
                        }}
                        className="px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Course / Dept</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Account State</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usersPublic.map((u) => (
                  <tr
                    key={u.uid}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      <Link
                        to={`/profile/${u.uid}`}
                        className="hover:text-violet-700 dark:hover:text-violet-400"
                      >
                        {u.displayName}
                      </Link>
                      {u.isDemo && (
                        <span className="ml-1.5 font-mono text-[10px] text-amber-700 dark:text-amber-400">
                          DEMO
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-400">
                      {u.role}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {[u.course, u.academicYear].filter(Boolean).join(' · ')}
                    </td>
                    <td className="py-3 px-4">
                      <VerificationText status={u.verificationStatus} />
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {u.isSuspended ? (
                        <span className="text-red-700 dark:text-red-400">Suspended</span>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-400">Active</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {u.verificationStatus !== 'verified' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await setUserVerification(u.uid, 'verified');
                            showToast('User verified');
                          }}
                          className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                        >
                          Verify
                        </button>
                      )}
                      {!u.isDemo && u.uid !== firebaseUser.uid && (
                        <button
                          type="button"
                          onClick={async () => {
                            await setUserSuspension(
                              u.uid,
                              !u.isSuspended,
                              u.isSuspended ? '' : 'Suspended by Admin moderation'
                            );
                            showToast(u.isSuspended ? 'Account unsuspended' : 'Account suspended');
                          }}
                          className="text-red-700 dark:text-red-400 font-semibold hover:underline"
                        >
                          {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'tasks' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Task Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Poster</th>
                  <th className="py-3 px-4 text-right">Budget</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 max-w-[240px] truncate">
                      <Link
                        to={`/tasks/${t.id}`}
                        className="hover:text-violet-700 dark:hover:text-violet-400"
                      >
                        {t.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{t.category}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{t.posterName}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-200">
                      {formatInr(t.budgetInr)}
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-700 dark:text-slate-300">
                      {t.isRemoved ? 'Removed' : t.status}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          await moderateTaskRemoval(t.id, !t.isRemoved);
                          showToast(t.isRemoved ? 'Task restored' : 'Task removed from feed');
                        }}
                        className={`font-semibold hover:underline ${
                          t.isRemoved
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-red-700 dark:text-red-400'
                        }`}
                      >
                        {t.isRemoved ? 'Restore' : 'Remove Listing'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Poster → Worker</th>
                  <th className="py-3 px-4 text-right">Gross</th>
                  <th className="py-3 px-4 text-right">Commission</th>
                  <th className="py-3 px-4 text-right">Net Contribution</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {tx.taskTitle}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {tx.posterName} → {tx.workerName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-200">
                      {formatInr(tx.grossAmountInr)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {formatInr(tx.platformCommissionInr)} ({tx.commissionRatePct}%)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {formatInr(tx.netContributionInr)}
                    </td>
                    <td className="py-3 px-4">
                      <TransactionStatusLabel status={tx.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {tx.status === 'pending_confirmation' ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await confirmPaymentRelease(
                              tx,
                              tx.isDemo ? 'demo_simulated' : 'upi_manual',
                              `ADMIN-VERIFIED-${Date.now().toString().slice(-5)}`
                            );
                            showToast('Transaction marked confirmed');
                          }}
                          className="text-violet-700 dark:text-violet-400 font-semibold hover:underline"
                        >
                          Confirm Payout
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'disputes' && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {disputes.length === 0 ? (
              <p className="p-8 text-sm text-slate-500 dark:text-slate-400 text-center">
                Zero complaints or disputes reported.
              </p>
            ) : (
              disputes.map((d) => (
                <div
                  key={d.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {d.reason}
                      </span>
                      <span className="text-xs font-mono uppercase text-amber-700 dark:text-amber-400">
                        {d.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Reported by {d.reporterName} · {d.type}
                      {d.taskTitle ? ` · Task: ${d.taskTitle}` : ''}
                    </p>
                    <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">{d.details}</p>
                    {d.adminResolution && (
                      <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        Resolution: {d.adminResolution}
                      </p>
                    )}
                  </div>
                  {d.status === 'open' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          await resolveDispute(
                            d,
                            'resolved',
                            'Reviewed and resolved by CampusGig Admin.'
                          );
                          showToast('Dispute resolved');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-700 dark:bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-800 dark:hover:bg-emerald-500"
                      >
                        Mark Resolved
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await resolveDispute(
                            d,
                            'dismissed',
                            'Dismissed after verification check.'
                          );
                          showToast('Dispute dismissed');
                        }}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="p-6 max-w-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-700 dark:text-violet-400" />
              Configurable Commission & Financial Model Parameters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Platform Commission (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Variable Cost / Txn (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={variableCost}
                  onChange={(e) => setVariableCost(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Fixed Cost (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={fixedCost}
                  onChange={(e) => setFixedCost(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 font-mono tabular-nums"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={demoBanner}
                onChange={(e) => setDemoBanner(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-violet-700"
              />
              Display Demo Mode transparency notice banner across app
            </label>

            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
            >
              Save Platform Settings
            </button>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
