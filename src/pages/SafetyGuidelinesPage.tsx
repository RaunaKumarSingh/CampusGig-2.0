import { Link } from 'react-router-dom';
import { Lock, ShieldCheck, AlertTriangle, FileCheck2 } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';

export function SafetyGuidelinesPage() {
  return (
    <AppLayout title="Campus Trust & Safety Guidelines">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            DBS Global University Community Standards
          </div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
            How CampusGig Protects Students and Task Posters
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            CampusGig is built exclusively for verified university community members in Dehradun.
            Every workflow enforces identity verification, privacy isolation, and accountable task
            handoffs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <Lock className="w-5 h-5 text-violet-700 dark:text-violet-400" />
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              1. Privacy & Restricted Contact Sharing
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Student enrollment IDs, personal emails, and mobile numbers are stored in an
              isolated private collection accessible only to the account owner and platform
              administrators. Coordinate through task-scoped in-app messaging until handoff.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <ShieldCheck className="w-5 h-5 text-violet-700 dark:text-violet-400" />
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              2. Verification Before Participation
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Unverified accounts may browse public gigs, but only verified students (via university
              email or admin ID verification) can submit applications. Duplicate applications and
              self-applications are blocked at the database rule level.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <FileCheck2 className="w-5 h-5 text-violet-700 dark:text-violet-400" />
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              3. Completion Proof & Fair Cancellation Policy
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Workers submit completion notes or proof references before a poster confirms
              completion. Posters may cancel open or accepted tasks only with a documented reason;
              repeated late cancellations are flagged by moderators.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              4. Prohibited Tasks & Academic Integrity
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Academic dishonesty (writing graded exams, proxy attendance, falsifying lab records),
              off-campus late-night errands, or unsafe requests are strictly prohibited and will
              result in immediate listing removal and account suspension.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
              Need to report a suspicious gig or dispute?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Use the “Report Suspicious Task” button on any gig page or “Raise Dispute” inside My
              Gigs.
            </p>
          </div>
          <Link
            to="/explore"
            className="px-4 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
          >
            Back to Campus Gigs
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
