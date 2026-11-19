import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Flag,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { ApplicationStatusLabel, TaskStatusLabel } from '../components/StatusIndicator';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import {
  applyToTask,
  cancelTask,
  confirmTaskCompletion,
  raiseDispute,
  startTask,
  submitTaskCompletion,
  updateApplicationStatus,
} from '../services/campusgigService';
import { calculateCommissionBreakdown, formatInr } from '../types/campusgig';

export function TaskDetailsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { firebaseUser, userPublic, isAdmin } = useAuth();
  const { tasks, applications, adminSettings, isUsingLocalDemoPreview } = useData();

  const task = tasks.find((t) => t.id === taskId);
  const uid = firebaseUser?.uid || '';

  const [applyMessage, setApplyMessage] = useState('');
  const [busy, setBusy] = useState(false);

  // Proof & cancellation & report modal states
  const [proofNote, setProofNote] = useState('');
  const [proofRef, setProofRef] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Suspicious or misleading task');
  const [reportDetails, setReportDetails] = useState('');
  const [showCancelBox, setShowCancelBox] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (!task) {
    return (
      <AppLayout title="Task Not Found">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center max-w-lg mx-auto">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
            Gig not found
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            This gig may have been removed or is no longer available.
          </p>
          <Link
            to="/explore"
            className="mt-5 inline-flex px-4 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
          >
            Back to Explore Gigs
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isPoster = uid !== '' && task.posterId === uid;
  const isAssignedWorker = uid !== '' && task.assignedWorkerId === uid;
  const canManageAsPoster = isPoster || isAdmin;
  const myApplication = applications.find(
    (a) => a.taskId === task.id && a.applicantId === uid
  );
  const taskApplications = applications.filter((a) => a.taskId === task.id);

  const feeBreakdown = calculateCommissionBreakdown(
    task.budgetInr,
    adminSettings.commissionRatePct,
    adminSettings.variableCostInr
  );

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !userPublic) {
      navigate('/auth');
      return;
    }
    if (isUsingLocalDemoPreview) {
      showToast(
        'Seed Demo Data first to apply interactively',
        'info',
        'Sign in as Admin or ask Admin to seed demo gigs into Firestore.'
      );
      return;
    }
    if (applyMessage.trim().length < 5) {
      showToast('Please add a brief note (at least 5 characters)', 'error');
      return;
    }

    setBusy(true);
    try {
      await applyToTask(task, userPublic, applyMessage);
      setApplyMessage('');
      showToast('Application submitted!', 'success', 'The task poster has been notified.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to apply.';
      showToast('Cannot apply', 'error', msg);
    } finally {
      setBusy(false);
    }
  };

  const handleDecision = async (
    appId: string,
    decision: 'shortlisted' | 'accepted' | 'rejected'
  ) => {
    const app = taskApplications.find((a) => a.id === appId);
    if (!app) return;
    setBusy(true);
    try {
      await updateApplicationStatus(app, decision, task.posterName);
      showToast(`Applicant marked ${decision}`);
    } catch (err) {
      showToast('Update failed', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !userPublic) {
      navigate('/auth');
      return;
    }
    if (reportDetails.trim().length < 5) {
      showToast('Please provide details for the report', 'error');
      return;
    }
    setBusy(true);
    try {
      await raiseDispute({
        task,
        reporterId: userPublic.uid,
        reporterName: userPublic.displayName,
        reportedUserId: task.posterId,
        type: 'task_report',
        reason: reportReason,
        details: reportDetails,
      });
      setShowReportModal(false);
      setReportDetails('');
      showToast('Report submitted to CampusGig Admin');
    } catch (err) {
      showToast('Report failed', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout title="Task Details">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explore Gigs
        </Link>

        {firebaseUser && !isPoster && (
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            Report Suspicious Task
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Task Details */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-semibold text-violet-700 dark:text-violet-400 flex items-center gap-2">
                <span>{task.category}</span>
                {task.isDemo && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="font-mono text-amber-700 dark:text-amber-400">
                      DEMO LISTING
                    </span>
                  </>
                )}
              </div>
              <TaskStatusLabel status={task.status} />
            </div>

            <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 font-display text-balance">
              {task.title}
            </h2>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Gross Budget</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100 font-display tabular-nums">
                  {formatInr(task.budgetInr)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Estimated Time</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {task.estimatedDuration}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400 shrink-0" />
                  <span className="truncate">{task.location}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Deadline</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1 tabular-nums">
                  <CalendarClock className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400 shrink-0" />
                  <span className="truncate">{task.deadline}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                  Task Description
                </h3>
                <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {task.description}
                </p>
              </div>

              {task.responsibilities && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                    Key Responsibilities
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {task.responsibilities}
                  </p>
                </div>
              )}

              {task.skillsRequired && task.skillsRequired.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
                    Skills Required
                  </h3>
                  <div className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 flex flex-wrap gap-x-2 gap-y-1">
                    {task.skillsRequired.map((skill, idx) => (
                      <span key={skill}>
                        {skill}
                        {idx < (task.skillsRequired?.length || 0) - 1 && (
                          <span
                            className="ml-2 text-slate-300 dark:text-slate-700"
                            aria-hidden="true"
                          >
                            ·
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {task.additionalInstructions && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Additional Instructions
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {task.additionalInstructions}
                  </p>
                </div>
              )}

              {task.completionProofNote && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Submitted Completion Proof
                  </p>
                  <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                    {task.completionProofNote}
                  </p>
                  {task.completionProofRef && (
                    <p className="mt-1 text-xs font-mono text-emerald-700 dark:text-emerald-400">
                      Ref: {task.completionProofRef}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Worker Lifecycle Actions (when assigned to current user) */}
          {isAssignedWorker && ['accepted', 'in_progress'].includes(task.status) && (
            <div className="bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                Your Assigned Gig Actions
              </h3>
              {task.status === 'accepted' ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Ready to begin? Mark this task as In Progress when you start working on campus.
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await startTask(task);
                        showToast('Task marked In Progress');
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
                  >
                    Start Task
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (proofNote.trim().length < 5) {
                      showToast('Add a completion note first', 'error');
                      return;
                    }
                    setBusy(true);
                    try {
                      await submitTaskCompletion(task, proofNote, proofRef);
                      showToast('Completion proof submitted for poster review');
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="mt-4 space-y-3"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Completion Proof Summary *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={proofNote}
                      onChange={(e) => setProofNote(e.target.value)}
                      placeholder="Describe handoff location, work completed, or coordinator confirmation..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Optional Drive Link / Reference Code
                    </label>
                    <input
                      type="text"
                      value={proofRef}
                      onChange={(e) => setProofRef(e.target.value)}
                      placeholder="e.g. Drive folder URL or handoff slip #12"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 dark:bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-colors"
                  >
                    Submit for Completion Confirmation
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Poster / Admin Management & Applicant Review Panel */}
          {canManageAsPoster && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                    Manage Applications & Lifecycle
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAdmin && !isPoster ? 'Admin Moderation View · ' : ''}
                    {taskApplications.length} total applications received
                  </p>
                </div>

                {task.status === 'submitted' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await confirmTaskCompletion(task, adminSettings);
                        showToast(
                          'Completion confirmed!',
                          'success',
                          'Payment record created in Earnings & Payments.'
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 dark:bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-800 dark:hover:bg-emerald-500 transition-colors"
                  >
                    Confirm Completion & Generate Payout
                  </button>
                )}

                {['open', 'accepted'].includes(task.status) && (
                  <button
                    type="button"
                    onClick={() => setShowCancelBox((v) => !v)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel Task
                  </button>
                )}
              </div>

              {showCancelBox && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Cancellation Policy: Explain why this task is being cancelled.
                  </p>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancellation..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy || cancelReason.trim().length < 3}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await cancelTask(task, cancelReason);
                          setShowCancelBox(false);
                          showToast('Task cancelled');
                        } finally {
                          setBusy(false);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirm Cancellation
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelBox(false)}
                      className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {taskApplications.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center border-t border-slate-100 dark:border-slate-800">
                  No student applications yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
                  {taskApplications.map((app) => (
                    <div
                      key={app.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/profile/${app.applicantId}`}
                            className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-violet-700 dark:hover:text-violet-400"
                          >
                            {app.applicantName}
                          </Link>
                          {app.applicantVerified && (
                            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                          <ApplicationStatusLabel status={app.status} />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {app.applicantCourse || 'DGU Student'} · Rating{' '}
                          {(app.applicantRating || 0).toFixed(1)}
                        </p>
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                          {app.message}
                        </p>
                      </div>

                      {task.status === 'open' &&
                        (app.status === 'pending' || app.status === 'shortlisted') && (
                          <div className="flex items-center gap-2 shrink-0">
                            {app.status === 'pending' && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleDecision(app.id, 'shortlisted')}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              >
                                Shortlist
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleDecision(app.id, 'accepted')}
                              className="px-3.5 py-1.5 rounded-lg bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
                            >
                              Select Worker
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleDecision(app.id, 'rejected')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Apply Box, Payout Breakdown, Poster Profile, Safety */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Application Box */}
          {!isPoster && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                Apply for This Gig
              </h3>

              {!firebaseUser ? (
                <div className="mt-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Sign in and verify your DGU student profile to submit an application.
                  </p>
                  <Link
                    to="/auth"
                    className="mt-4 w-full inline-flex justify-center py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
                  >
                    Sign In to Apply
                  </Link>
                </div>
              ) : userPublic?.verificationStatus !== 'verified' ? (
                <div className="mt-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <p className="font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    Student Verification Required
                  </p>
                  <p>
                    Only verified DBS Global University students can apply. Current status:{' '}
                    <strong>{userPublic?.verificationStatus || 'Incomplete'}</strong>.
                  </p>
                  <Link
                    to="/profile"
                    className="inline-block font-semibold text-violet-800 dark:text-violet-300 underline"
                  >
                    Complete verification
                  </Link>
                </div>
              ) : myApplication ? (
                <div className="mt-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Application Submitted
                  </p>
                  <ApplicationStatusLabel status={myApplication.status} />
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    “{myApplication.message}”
                  </p>
                  <Link
                    to="/applications"
                    className="inline-block text-xs font-semibold text-violet-800 dark:text-violet-300 hover:underline pt-1"
                  >
                    Manage in My Applications
                  </Link>
                </div>
              ) : task.status !== 'open' ? (
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                  This task is currently <strong>{task.status}</strong> and no longer accepting new
                  applications.
                </p>
              ) : (
                <form onSubmit={handleApply} className="mt-3 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Short Pitch / Availability Note *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={applyMessage}
                      onChange={(e) => setApplyMessage(e.target.value)}
                      placeholder="Mention your free lecture window, relevant experience, or campus location..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-3 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 disabled:opacity-60 transition-colors"
                  >
                    {busy ? 'Submitting...' : 'Apply Now'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Transparent Fee Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
              Transparent Earnings Breakdown
            </h3>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <dt>Gross Gig Value</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatInr(feeBreakdown.grossAmountInr)}
                </dd>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <dt>Platform Fee ({feeBreakdown.commissionRatePct}%)</dt>
                <dd className="tabular-nums">− {formatInr(feeBreakdown.platformCommissionInr)}</dd>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold text-slate-900 dark:text-slate-100 text-sm">
                <dt>Student Net Payout</dt>
                <dd className="text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {formatInr(feeBreakdown.workerPayoutInr)}
                </dd>
              </div>
            </dl>
            <p className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
              No hidden fees. Commission applies only after task completion is confirmed.
            </p>
          </div>

          {/* Poster Profile Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
              Posted By
            </h3>
            <div className="mt-3 flex items-center gap-3">
              <ImageWithFallback
                src={task.posterAvatar}
                alt={task.posterName}
                className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <div className="min-w-0">
                <Link
                  to={`/profile/${task.posterId}`}
                  className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-violet-700 dark:hover:text-violet-400 flex items-center gap-1 truncate"
                >
                  <span className="truncate">{task.posterName}</span>
                  {task.posterVerified && (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {task.posterType} ·{' '}
                  <span className="inline-flex items-center gap-0.5 tabular-nums">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    {(task.posterRating || 4.8).toFixed(1)}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Users className="w-3.5 h-3.5" />
                {task.applicantCount} applicants
              </span>
              <span className="tabular-nums">{task.workersRequired} worker(s) needed</span>
            </div>
          </div>

          {/* Safety Guidelines */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
              Campus Safety Checklist
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>1. Meet only in public DGU campus zones during daylight/open hours.</li>
              <li>2. Do not share personal phone numbers until assigned inside CampusGig.</li>
              <li>3. Confirm task completion in-app before releasing or settling UPI payments.</li>
            </ul>
            <Link
              to="/safety"
              className="mt-3 inline-block text-xs font-semibold text-violet-700 dark:text-violet-400 hover:underline"
            >
              Read full Trust & Safety Guidelines
            </Link>
          </div>
        </aside>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
              Report Suspicious Task or Poster
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Reports are reviewed directly by CampusGig administrators.
            </p>
            <form onSubmit={handleReportSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option>Suspicious or misleading task</option>
                  <option>Academic dishonesty / exam proxy request</option>
                  <option>Off-campus unsafe location</option>
                  <option>Harassment or policy violation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Explain what seems unsafe or violates DGU guidelines..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
