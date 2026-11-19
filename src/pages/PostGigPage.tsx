import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, Send } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { createTask } from '../services/campusgigService';
import {
  DGU_CAMPUS_LOCATIONS,
  GIG_CATEGORIES,
  calculateCommissionBreakdown,
  formatInr,
} from '../types/campusgig';

export function PostGigPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { firebaseUser, userPublic, needsOnboarding } = useAuth();
  const { adminSettings } = useData();

  const categories = adminSettings.categories?.length
    ? adminSettings.categories
    : [...GIG_CATEGORIES];

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [location, setLocation] = useState<string>(DGU_CAMPUS_LOCATIONS[0]);
  const [budgetInr, setBudgetInr] = useState('200');
  const [estimatedDuration, setEstimatedDuration] = useState('1 hour');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [deadline, setDeadline] = useState('Tomorrow, 04:00 PM IST');
  const [workersRequired, setWorkersRequired] = useState('1');
  const [skillsText, setSkillsText] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [attachmentLabel, setAttachmentLabel] = useState('');

  const [previewMode, setPreviewMode] = useState(false);
  const [busy, setBusy] = useState(false);

  const numericBudget = Math.max(0, Number(budgetInr) || 0);
  const breakdown = calculateCommissionBreakdown(
    numericBudget,
    adminSettings.commissionRatePct,
    adminSettings.variableCostInr
  );

  const validateForm = (): string | null => {
    if (title.trim().length < 5) return 'Task title must be at least 5 characters.';
    if (description.trim().length < 15) return 'Description must be at least 15 characters.';
    if (numericBudget < 20 || numericBudget > 50000)
      return 'Budget must be between ₹20 and ₹50,000.';
    if (!deadline.trim()) return 'Deadline is required.';
    return null;
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      showToast('Check gig details', 'error', err);
      return;
    }
    setPreviewMode(true);
  };

  const handlePublish = async () => {
    if (!firebaseUser || !userPublic) {
      navigate('/auth');
      return;
    }
    const err = validateForm();
    if (err) {
      showToast('Validation error', 'error', err);
      return;
    }

    setBusy(true);
    try {
      const taskId = await createTask(userPublic, {
        title,
        category,
        description,
        responsibilities,
        location,
        budgetInr: numericBudget,
        estimatedDuration,
        durationMinutes: Number(durationMinutes) || 60,
        deadline,
        workersRequired: Number(workersRequired) || 1,
        skillsRequired: skillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        additionalInstructions,
        attachmentLabel,
      });
      showToast('Campus gig published!', 'success', 'Verified DGU students can now browse and apply.');
      navigate(`/tasks/${taskId}`);
    } catch (error) {
      showToast(
        'Could not publish task',
        'error',
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setBusy(false);
    }
  };

  if (!firebaseUser || needsOnboarding) {
    return (
      <AppLayout title="Post a Campus Gig">
        <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
            Sign in & complete your campus profile to post a gig
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            All posters—students, clubs, departments, and local campus partners—must register an
            account before listing tasks.
          </p>
          <Link
            to="/auth"
            className="mt-5 inline-flex px-5 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
          >
            Continue to Registration
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Post a Campus Gig">
      <div className="max-w-4xl mx-auto">
        {!previewMode ? (
          <form
            onSubmit={handlePreview}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">
                Create a Task Listing
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Specify clear campus handoff details and compensation in ₹ INR. You can preview the
                listing before publishing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Help arrange chairs for DGU Entrepreneurship Talk"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-600"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Campus Location *
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-600"
                >
                  {DGU_CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Description * (min 15 chars)
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what needs to be done, where to report, and expected deliverables..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Specific Responsibilities (Optional)
              </label>
              <textarea
                rows={2}
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                placeholder="Bullet or step-by-step responsibilities..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Budget (₹ INR) *
                </label>
                <input
                  type="number"
                  min={20}
                  max={50000}
                  required
                  value={budgetInr}
                  onChange={(e) => setBudgetInr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Duration *
                </label>
                <input
                  type="text"
                  required
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  placeholder="e.g. 1.5 hours"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duration (mins)
                </label>
                <input
                  type="number"
                  min={5}
                  max={10080}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Workers Needed *
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={workersRequired}
                  onChange={(e) => setWorkersRequired(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:border-violet-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deadline (IST) *
                </label>
                <input
                  type="text"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="e.g. Tomorrow, 02:30 PM IST"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Skills Required (comma separated)
                </label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="Canva, Photography, Excel"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Instructions
                </label>
                <input
                  type="text"
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="e.g. Bring student ID card to Room 204"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Attachment Reference / Link
                </label>
                <input
                  type="text"
                  value={attachmentLabel}
                  onChange={(e) => setAttachmentLabel(e.target.value)}
                  placeholder="e.g. Drive reference brief or PDF name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600"
                />
              </div>
            </div>

            {/* Live Pricing Transparency Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Transparent Pricing Summary
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  Platform commission is {adminSettings.commissionRatePct}% upon completion (no
                  hidden charges).
                </p>
              </div>
              <div className="flex items-center gap-5 tabular-nums">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Gross Budget</span>
                  <strong className="text-slate-900 dark:text-slate-100">
                    {formatInr(breakdown.grossAmountInr)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Platform Fee</span>
                  <strong className="text-slate-900 dark:text-slate-100">
                    {formatInr(breakdown.platformCommissionInr)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Student Payout</span>
                  <strong className="text-emerald-700 dark:text-emerald-400">
                    {formatInr(breakdown.workerPayoutInr)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview Before Publishing
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">
                Listing Preview · Ready to Publish
              </span>
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Edit Details
              </button>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{category}</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
                {title}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {location} · {estimatedDuration} · Due {deadline} · {workersRequired} worker(s)
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
              {description}
            </div>

            {responsibilities && (
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Responsibilities
                </h3>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {responsibilities}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Gross {formatInr(breakdown.grossAmountInr)} · Student receives{' '}
                {formatInr(breakdown.workerPayoutInr)}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Back to Edit
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handlePublish}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 disabled:opacity-60 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {busy ? 'Publishing...' : 'Publish Campus Gig'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
