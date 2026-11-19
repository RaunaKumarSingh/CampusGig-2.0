import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Star } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { TaskStatusLabel } from '../components/StatusIndicator';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import {
  confirmPaymentRelease,
  confirmTaskCompletion,
  raiseDispute,
  startTask,
  submitReview,
  submitTaskCompletion,
} from '../services/campusgigService';
import { CampusTask, formatInr } from '../types/campusgig';

type GigTab =
  | 'applied'
  | 'accepted'
  | 'in_progress'
  | 'submitted'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export function MyGigsPage() {
  const { firebaseUser, userPublic } = useAuth();
  const { tasks, applications, transactions, reviews, adminSettings } = useData();
  const { showToast } = useToast();

  const [roleView, setRoleView] = useState<'worker' | 'poster'>('worker');
  const [activeTab, setActiveTab] = useState<GigTab>('accepted');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Proof modal state
  const [proofTask, setProofTask] = useState<CampusTask | null>(null);
  const [proofNote, setProofNote] = useState('');
  const [proofRef, setProofRef] = useState('');

  // Review modal state
  const [reviewTask, setReviewTask] = useState<CampusTask | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // UPI Confirmation modal state
  const [payTask, setPayTask] = useState<CampusTask | null>(null);
  const [upiRef, setUpiRef] = useState('');

  const uid = firebaseUser?.uid || '';

  const appliedTaskIds = new Set(
    applications
      .filter((a) => a.applicantId === uid && a.status !== 'withdrawn')
      .map((a) => a.taskId)
  );

  const relevantTasks =
    roleView === 'worker'
      ? tasks.filter((t) =>
          activeTab === 'applied'
            ? appliedTaskIds.has(t.id) && t.status === 'open'
            : t.assignedWorkerId === uid && t.status === activeTab
        )
      : tasks.filter((t) => {
          if (t.posterId !== uid) return false;
          if (activeTab === 'applied') return t.status === 'open';
          return t.status === activeTab;
        });

  const tabs: Array<{ key: GigTab; label: string }> = [
    { key: 'applied', label: roleView === 'worker' ? 'Applied' : 'Open Listings' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'submitted', label: 'Submitted for Completion' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'disputed', label: 'Disputed' },
  ];

  return (
    <AppLayout title="My Gigs & Lifecycle">
      {!firebaseUser ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Sign in to manage your gigs
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
          {/* Worker vs Poster Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setRoleView('worker')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  roleView === 'worker'
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Gigs I Work On
              </button>
              <button
                type="button"
                onClick={() => setRoleView('poster')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  roleView === 'poster'
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Gigs I Posted
              </button>
            </div>

            <Link
              to="/post"
              className="px-4 py-2 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
            >
              + Post New Gig
            </Link>
          </div>

          {/* Lifecycle Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  activeTab === tab.key
                    ? 'bg-violet-700 dark:bg-violet-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tasks List */}
          {relevantTasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                No gigs in “{tabs.find((t) => t.key === activeTab)?.label}”
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Tasks move through each stage as applications are accepted, started, submitted, and
                confirmed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {relevantTasks.map((task) => {
                const txn = transactions.find((tx) => tx.taskId === task.id);
                const alreadyReviewed = reviews.some(
                  (r) => r.taskId === task.id && r.reviewerId === uid
                );

                return (
                  <div
                    key={task.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-violet-700 dark:hover:text-violet-400"
                        >
                          {task.title}
                        </Link>
                        <TaskStatusLabel status={task.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatInr(task.budgetInr)} · {task.location} ·{' '}
                        {roleView === 'worker'
                          ? `Poster: ${task.posterName}`
                          : task.assignedWorkerName
                          ? `Worker: ${task.assignedWorkerName}`
                          : `${task.applicantCount} applicants`}
                      </p>
                      {task.completionProofNote && (
                        <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-1.5 inline-block">
                          Proof: {task.completionProofNote}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Link
                        to={`/tasks/${task.id}`}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Details
                      </Link>

                      {['accepted', 'in_progress', 'submitted'].includes(task.status) && (
                        <Link
                          to="/messages"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Chat
                        </Link>
                      )}

                      {/* Worker Actions */}
                      {roleView === 'worker' && task.status === 'accepted' && (
                        <button
                          type="button"
                          disabled={busyId === task.id}
                          onClick={async () => {
                            setBusyId(task.id);
                            try {
                              await startTask(task);
                              showToast('Task started!');
                              setActiveTab('in_progress');
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
                        >
                          Start Task
                        </button>
                      )}

                      {roleView === 'worker' && task.status === 'in_progress' && (
                        <button
                          type="button"
                          onClick={() => {
                            setProofTask(task);
                            setProofNote('');
                            setProofRef('');
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-700 dark:bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-colors"
                        >
                          Submit Completion
                        </button>
                      )}

                      {/* Poster Actions */}
                      {roleView === 'poster' && task.status === 'submitted' && (
                        <button
                          type="button"
                          disabled={busyId === task.id}
                          onClick={async () => {
                            setBusyId(task.id);
                            try {
                              await confirmTaskCompletion(task, adminSettings);
                              showToast('Completion confirmed! Release payment next.');
                              setActiveTab('completed');
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-700 dark:bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-colors"
                        >
                          Confirm Completion
                        </button>
                      )}

                      {roleView === 'poster' &&
                        task.status === 'completed' &&
                        txn &&
                        txn.status === 'pending_confirmation' && (
                          <button
                            type="button"
                            onClick={() => {
                              setPayTask(task);
                              setUpiRef('');
                            }}
                            className="px-4 py-2 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
                          >
                            Confirm UPI / Demo Payout
                          </button>
                        )}

                      {/* Dispute Action */}
                      {['accepted', 'in_progress', 'submitted'].includes(task.status) && (
                        <button
                          type="button"
                          disabled={busyId === task.id}
                          onClick={async () => {
                            if (!userPublic) return;
                            setBusyId(task.id);
                            try {
                              await raiseDispute({
                                task,
                                reporterId: userPublic.uid,
                                reporterName: userPublic.displayName,
                                reportedUserId:
                                  roleView === 'worker' ? task.posterId : task.assignedWorkerId,
                                type: 'completion_dispute',
                                reason: 'Lifecycle / completion disagreement',
                                details: 'Flagged by task participant for CampusGig Admin review.',
                              });
                              showToast('Dispute raised for Admin review');
                              setActiveTab('disputed');
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          Raise Dispute
                        </button>
                      )}

                      {/* Rating & Review Action */}
                      {task.status === 'completed' && !alreadyReviewed && (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewTask(task);
                            setRating(5);
                            setComment('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors"
                        >
                          <Star className="w-3.5 h-3.5" />
                          Leave Review
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Submit Proof Modal */}
      {proofTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
              Submit Completion Proof
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{proofTask.title}</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (proofNote.trim().length < 5) return;
                setBusyId(proofTask.id);
                try {
                  await submitTaskCompletion(proofTask, proofNote, proofRef);
                  setProofTask(null);
                  setActiveTab('submitted');
                  showToast('Submitted for poster confirmation');
                } finally {
                  setBusyId(null);
                }
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Handoff / Completion Note *
                </label>
                <textarea
                  rows={3}
                  required
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="Describe work finished and handoff location..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Proof Reference / Link (Optional)
                </label>
                <input
                  type="text"
                  value={proofRef}
                  onChange={(e) => setProofRef(e.target.value)}
                  placeholder="Google Drive link or receipt number"
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProofTask(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 dark:bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-800 dark:hover:bg-emerald-500"
                >
                  Submit Proof
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm UPI / Demo Payment Modal */}
      {payTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
              Confirm Gig Payment Release
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              MVP manual UPI confirmation (or DEMO simulation). Never mark a real payment completed
              until UPI transfer is actually sent.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const txn = transactions.find((tx) => tx.taskId === payTask.id);
                if (!txn) return;
                setBusyId(payTask.id);
                try {
                  await confirmPaymentRelease(
                    txn,
                    payTask.isDemo ? 'demo_simulated' : 'upi_manual',
                    upiRef || `DEMO-UPI-${Date.now().toString().slice(-6)}`
                  );
                  setPayTask(null);
                  showToast('Payment confirmed & recorded!');
                } finally {
                  setBusyId(null);
                }
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  UPI Transaction Reference / UTR (or leave blank for DEMO)
                </label>
                <input
                  type="text"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  placeholder="e.g. 432910885122 or DEMO-REF"
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayTask(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewTask && userPublic && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
              Rate & Review
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{reviewTask.title}</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const isWorker = reviewTask.assignedWorkerId === uid;
                const revieweeId = isWorker
                  ? reviewTask.posterId
                  : reviewTask.assignedWorkerId || '';
                const revieweeName = isWorker
                  ? reviewTask.posterName
                  : reviewTask.assignedWorkerName || 'Student';
                if (!revieweeId) return;

                setBusyId(reviewTask.id);
                try {
                  await submitReview({
                    task: reviewTask,
                    reviewerId: uid,
                    reviewerName: userPublic.displayName,
                    reviewerRole: isWorker ? 'student' : 'poster',
                    revieweeId,
                    revieweeName,
                    rating,
                    comment,
                  });
                  setReviewTask(null);
                  showToast('Review published!');
                } catch (err) {
                  showToast('Review error', 'error', err instanceof Error ? err.message : undefined);
                } finally {
                  setBusyId(null);
                }
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Rating (1–5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold tabular-nums transition-colors ${
                        rating >= star
                          ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {star} ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Feedback Comment *
                </label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share punctuality, communication, and quality feedback..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewTask(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
