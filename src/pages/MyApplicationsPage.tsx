import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { ApplicationStatusLabel } from '../components/StatusIndicator';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { withdrawApplication } from '../services/campusgigService';
import { ApplicationStatus, formatInr, formatIst } from '../types/campusgig';

export function MyApplicationsPage() {
  const { firebaseUser } = useAuth();
  const { applications, tasks } = useData();
  const { showToast } = useToast();

  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const uid = firebaseUser?.uid || '';
  const myApps = applications.filter((a) => a.applicantId === uid);
  const filtered = filter === 'all' ? myApps : myApps.filter((a) => a.status === filter);

  const tabs: Array<{ key: 'all' | ApplicationStatus; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'withdrawn', label: 'Withdrawn' },
  ];

  const handleWithdraw = async (appId: string) => {
    const app = myApps.find((a) => a.id === appId);
    if (!app) return;
    const task = tasks.find((t) => t.id === app.taskId);
    setBusyId(appId);
    try {
      await withdrawApplication(app, task);
      showToast('Application withdrawn');
    } catch (err) {
      showToast('Could not withdraw', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppLayout title="My Applications">
      {!firebaseUser ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Sign in to track your applications
          </p>
          <Link
            to="/auth"
            className="mt-4 inline-flex px-4 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
          >
            Sign In
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {tabs.map((tab) => {
              const count =
                tab.key === 'all'
                  ? myApps.length
                  : myApps.filter((a) => a.status === tab.key).length;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    filter === tab.key
                      ? 'bg-violet-700 dark:bg-violet-600 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label} <span className="tabular-nums opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                No applications in this status
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Browse open DGU campus gigs and submit your first application.
              </p>
              <Link
                to="/explore"
                className="mt-4 inline-flex px-4 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
              >
                Explore Gigs
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((app) => (
                <div
                  key={app.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        to={`/tasks/${app.taskId}`}
                        className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-violet-700 dark:hover:text-violet-400"
                      >
                        {app.taskTitle}
                      </Link>
                      <ApplicationStatusLabel status={app.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      Budget {formatInr(app.taskBudgetInr)} · {app.taskLocation || 'DGU Campus'} ·
                      Applied {formatIst(app.createdAt)}
                    </p>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                      “{app.message}”
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/tasks/${app.taskId}`}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      View Gig
                    </Link>
                    {(app.status === 'pending' || app.status === 'shortlisted') && (
                      <button
                        type="button"
                        disabled={busyId === app.id}
                        onClick={() => handleWithdraw(app.id)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 transition-colors"
                      >
                        {busyId === app.id ? 'Withdrawing...' : 'Withdraw'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
