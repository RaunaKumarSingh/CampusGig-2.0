import { Link } from 'react-router-dom';
import { ShieldCheck, Wallet } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { TransactionStatusLabel } from '../components/StatusIndicator';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { confirmPaymentRelease } from '../services/campusgigService';
import { formatInr, formatIst } from '../types/campusgig';

export function EarningsPaymentsPage() {
  const { firebaseUser } = useAuth();
  const { transactions, adminSettings } = useData();
  const { showToast } = useToast();

  const uid = firebaseUser?.uid || '';
  const myTxns = transactions.filter((t) => t.workerId === uid || t.posterId === uid);
  const workerTxns = transactions.filter((t) => t.workerId === uid);

  const totalEarnings = workerTxns
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.workerPayoutInr, 0);
  const pendingEarnings = workerTxns
    .filter((t) => t.status === 'pending_confirmation')
    .reduce((sum, t) => sum + t.workerPayoutInr, 0);
  const totalCommissionPaid = workerTxns
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.platformCommissionInr, 0);
  const completedCount = myTxns.filter((t) => t.status === 'completed').length;

  return (
    <AppLayout title="Earnings & Payments">
      {!firebaseUser ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Sign in to view your earnings and payment ledger
          </p>
          <Link
            to="/auth"
            className="mt-4 inline-flex px-4 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
          >
            Sign In
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Confirmed Earnings</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-display tabular-nums">
                {formatInr(totalEarnings)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Available / Settled</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 font-display tabular-nums">
                {formatInr(totalEarnings)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Pending Confirmation</p>
              <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400 font-display tabular-nums">
                {formatInr(pendingEarnings)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Completed Transactions</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 font-display tabular-nums">
                {completedCount}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Platform Commission ({adminSettings.commissionRatePct}%)
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 font-display tabular-nums">
                {formatInr(totalCommissionPaid)}
              </p>
            </div>
          </div>

          {/* Modular Payment Architecture Notice */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Wallet className="w-5 h-5 text-violet-700 dark:text-violet-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                  Transparent MVP Payment Workflow (Manual UPI & Demo Tracking)
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                  For the DGU pilot MVP, payouts are settled via direct UPI with manual reference
                  confirmation (or marked <span className="font-mono font-semibold">DEMO</span> for
                  simulated sample gigs). CampusGig never claims funds were transferred without an
                  explicit confirmation. The transaction schema is modular and ready for Razorpay
                  Route / Payouts API integration.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
              <ShieldCheck className="w-4 h-4" />
              No Hidden Fees
            </span>
          </div>

          {/* Transaction History Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                Transaction History
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {myTxns.length} records
              </span>
            </div>

            {myTxns.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  No transactions recorded yet
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Transactions are automatically generated when a gig completion is confirmed.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/60">
                      <th className="py-3 px-4">Task</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-right">Gross (₹)</th>
                      <th className="py-3 px-4 text-right">Fee</th>
                      <th className="py-3 px-4 text-right">Net Payout</th>
                      <th className="py-3 px-4">Method & Reference</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date (IST)</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {myTxns.map((txn) => {
                      const isWorker = txn.workerId === uid;
                      return (
                        <tr
                          key={txn.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100 max-w-[220px] truncate">
                            <Link
                              to={`/tasks/${txn.taskId}`}
                              className="hover:text-violet-700 dark:hover:text-violet-400"
                            >
                              {txn.taskTitle}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                            {isWorker ? 'Earned (Worker)' : 'Paid (Poster)'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-200">
                            {formatInr(txn.grossAmountInr)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                            {formatInr(txn.platformCommissionInr)} ({txn.commissionRatePct}%)
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                            {formatInr(txn.workerPayoutInr)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {txn.isDemo || txn.paymentMethod === 'demo_simulated'
                              ? 'DEMO_SIMULATED'
                              : 'UPI_MANUAL'}
                            {txn.upiReference ? ` · ${txn.upiReference}` : ''}
                          </td>
                          <td className="py-3.5 px-4">
                            <TransactionStatusLabel status={txn.status} />
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                            {formatIst(txn.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {txn.posterId === uid && txn.status === 'pending_confirmation' ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  await confirmPaymentRelease(
                                    txn,
                                    txn.isDemo ? 'demo_simulated' : 'upi_manual',
                                    txn.isDemo
                                      ? `DEMO-${Date.now().toString().slice(-5)}`
                                      : `UPI-${Date.now().toString().slice(-6)}`
                                  );
                                  showToast('Payment marked confirmed');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-violet-700 dark:bg-violet-600 text-white text-[11px] font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 whitespace-nowrap"
                              >
                                Confirm Transfer
                              </button>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
