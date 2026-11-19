import { Link } from 'react-router-dom';
import { ArrowRight, Bell, Compass, PlusCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { TaskCard } from '../components/TaskCard';
import { VerificationText } from '../components/StatusIndicator';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { formatInr, formatIst } from '../types/campusgig';
import { markNotificationRead } from '../services/campusgigService';

export function DashboardPage() {
  const { firebaseUser, userPublic, isAdmin, needsOnboarding, workspaceMode } = useAuth();
  const { tasks, applications, transactions, notifications } = useData();

  const uid = firebaseUser?.uid || '';
  const openTasks = tasks.filter((t) => t.status === 'open' && !t.isRemoved);

  const myApps = applications.filter((a) => a.applicantId === uid);
  const activeApps = myApps.filter((a) => a.status === 'pending' || a.status === 'shortlisted');
  const acceptedGigs = tasks.filter(
    (t) =>
      t.assignedWorkerId === uid &&
      ['accepted', 'in_progress', 'submitted'].includes(t.status)
  );
  const completedStudentGigs = tasks.filter(
    (t) => t.assignedWorkerId === uid && t.status === 'completed'
  );
  const workerTxns = transactions.filter((t) => t.workerId === uid);
  const totalEarnings = workerTxns
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.workerPayoutInr, 0);
  const pendingPayments = workerTxns
    .filter((t) => t.status === 'pending_confirmation')
    .reduce((sum, t) => sum + t.workerPayoutInr, 0);

  const myPostedTasks = tasks.filter((t) => t.posterId === uid && !t.isRemoved);
  const incomingApps = applications.filter(
    (a) => a.posterId === uid && (a.status === 'pending' || a.status === 'shortlisted')
  );
  const posterSpend = transactions
    .filter((t) => t.posterId === uid && t.status === 'completed')
    .reduce((sum, t) => sum + t.grossAmountInr, 0);

  const userSkills = (userPublic?.skills || []).map((s) => s.toLowerCase());
  const recommendedGigs = [...openTasks]
    .filter((t) => t.posterId !== uid)
    .sort((a, b) => {
      const aMatch = (a.skillsRequired || []).some((sk) =>
        userSkills.some((u) => sk.toLowerCase().includes(u) || u.includes(sk.toLowerCase()))
      )
        ? 1
        : 0;
      const bMatch = (b.skillsRequired || []).some((sk) =>
        userSkills.some((u) => sk.toLowerCase().includes(u) || u.includes(sk.toLowerCase()))
      )
        ? 1
        : 0;
      return bMatch - aMatch;
    })
    .slice(0, 4);

  const recentNotifications = [...notifications].slice(0, 5);

  const cardSurface =
    'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl';

  return (
    <AppLayout title={workspaceMode === 'poster' ? 'Poster Dashboard' : 'Student Dashboard'}>
      {!firebaseUser ? (
        <div
          className={`mb-6 ${cardSurface} p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
        >
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Sign in with Google to access your CampusGig workspace
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              You can browse open DGU campus gigs freely, or sign in to verify your student ID,
              apply for tasks, and track ₹ INR earnings.
            </p>
          </div>
          <Link
            to="/auth"
            className="px-5 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 whitespace-nowrap self-start sm:self-center"
          >
            Sign In / Register
          </Link>
        </div>
      ) : needsOnboarding ? (
        <div className="mb-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-amber-950 dark:text-amber-200 font-display">
              Complete your DGU student registration
            </h2>
            <p className="mt-1 text-sm text-amber-900 dark:text-amber-300">
              Add your enrollment ID, course, and Indian mobile number to request verification.
            </p>
          </div>
          <Link
            to="/auth"
            className="px-4 py-2.5 rounded-xl bg-amber-900 dark:bg-amber-700 text-white text-xs font-semibold hover:bg-amber-950 whitespace-nowrap"
          >
            Complete Onboarding
          </Link>
        </div>
      ) : null}

      {/* Welcome Header */}
      <div
        className={`${cardSurface} p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
              Welcome back{userPublic?.displayName ? `, ${userPublic.displayName}` : ''}
            </h2>
            {userPublic && <VerificationText status={userPublic.verificationStatus} />}
          </div>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            {workspaceMode === 'poster'
              ? 'Manage your posted campus gigs, review student applicants, and confirm task handoffs.'
              : 'Find flexible micro-gigs around DBS Global University between your lectures.'}
          </p>
          {userPublic && userPublic.verificationStatus !== 'verified' && (
            <p className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Only verified students can apply for gigs.{' '}
              <Link to="/profile" className="underline font-semibold">
                Update verification details
              </Link>
              {isAdmin && (
                <>
                  {' · '}
                  <Link
                    to="/admin"
                    className="underline font-semibold text-violet-700 dark:text-violet-400"
                  >
                    Approve in Admin Console
                  </Link>
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors whitespace-nowrap"
          >
            <Compass className="w-4 h-4" />
            Find Gigs
          </Link>
          <Link
            to="/post"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm font-semibold hover:border-violet-300 dark:hover:border-violet-600 transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            Post a Gig
          </Link>
        </div>
      </div>

      {/* KPI Summary Strip */}
      {workspaceMode === 'student' ? (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className={`${cardSurface} p-4`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">Available Gigs</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white font-display tabular-nums">
              {openTasks.length}
            </p>
          </div>
          <div className={`${cardSurface} p-4`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">Active Applications</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white font-display tabular-nums">
              {activeApps.length}
            </p>
          </div>
          <div className={`${cardSurface} p-4`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">Accepted / Active</p>
            <p className="mt-1 text-2xl font-bold text-violet-700 dark:text-violet-400 font-display tabular-nums">
              {acceptedGigs.length}
            </p>
          </div>
          <div className={`${cardSurface} p-4`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">Completed Gigs</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white font-display tabular-nums">
              {completedStudentGigs.length}
            </p>
          </div>
          <div className={`${cardSurface} p-4`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Earnings</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-display tabular-nums">
              {formatInr(totalEarnings)}
            </p>
          </div>
          <div className={`${cardSurface} p-4`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pending Payments</p>
            <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400 font-display tabular-nums">
              {formatInr(pendingPayments)}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${cardSurface} p-4`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">My Posted Gigs</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white font-display tabular-nums">
              {myPostedTasks.length}
            </p>
          </div>
          <div className={`${cardSurface} p-4`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">Applicants to Review</p>
            <p className="mt-1 text-2xl font-bold text-violet-700 dark:text-violet-400 font-display tabular-nums">
              {incomingApps.length}
            </p>
          </div>
          <div className={`${cardSurface} p-4`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">Completed Tasks</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-display tabular-nums">
              {myPostedTasks.filter((t) => t.status === 'completed').length}
            </p>
          </div>
          <div className={`${cardSurface} p-4`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">Confirmed Payouts</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white font-display tabular-nums">
              {formatInr(posterSpend)}
            </p>
          </div>
        </div>
      )}

      {/* Main Split: Recommended Gigs & Notifications */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              {workspaceMode === 'poster'
                ? 'Your Recent Posted Gigs'
                : 'Recommended Campus Gigs'}
            </h3>
            <Link
              to={workspaceMode === 'poster' ? '/gigs' : '/explore'}
              className="text-xs font-semibold text-violet-700 dark:text-violet-400 hover:underline inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {workspaceMode === 'poster' ? (
            myPostedTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myPostedTasks.slice(0, 4).map((task) => (
                  <TaskCard key={task.id} task={task} isOwnTask />
                ))}
              </div>
            ) : (
              <div className={`${cardSurface} p-8 text-center`}>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No gigs posted yet
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Create your first task listing for DGU students in under 2 minutes.
                </p>
                <Link
                  to="/post"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800"
                >
                  <PlusCircle className="w-4 h-4" />
                  Post a Gig
                </Link>
              </div>
            )
          ) : recommendedGigs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedGigs.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  alreadyApplied={myApps.some(
                    (a) => a.taskId === task.id && a.status !== 'withdrawn'
                  )}
                  isOwnTask={task.posterId === uid}
                />
              ))}
            </div>
          ) : (
            <div className={`${cardSurface} p-8 text-center`}>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No open gigs right now
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Check back shortly or post a gig for fellow students.
              </p>
            </div>
          )}
        </section>

        <aside className="lg:col-span-4 space-y-5">
          <div className={`${cardSurface} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <Bell className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                Recent Notifications
              </h3>
              <Link
                to="/messages"
                className="text-xs font-semibold text-violet-700 dark:text-violet-400 hover:underline"
              >
                Inbox
              </Link>
            </div>

            {recentNotifications.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                No notifications yet. Activity updates on applications, tasks, and payments appear
                here.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentNotifications.map((n) => (
                  <li key={n.id} className="py-3 first:pt-1 last:pb-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={n.linkPath || '/dashboard'}
                        onClick={() => {
                          if (!n.isRead) markNotificationRead(n.id);
                        }}
                        className="text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-violet-700 dark:hover:text-violet-400"
                      >
                        {n.title}
                      </Link>
                      {!n.isRead && (
                        <span className="text-[10px] font-mono font-semibold text-violet-700 dark:text-violet-400 shrink-0">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {n.body}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      {formatIst(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`${cardSurface} p-5`}>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              Campus Trust Reminder
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Always complete handoffs in public campus spaces (Library, Academic Blocks, Food
              Court, Hostel Gate) and confirm completion inside CampusGig before payment release.
            </p>
            <Link
              to="/safety"
              className="mt-3 inline-block text-xs font-semibold text-violet-700 dark:text-violet-400 hover:underline"
            >
              View Safety Guidelines
            </Link>
          </div>
        </aside>
      </div>
    </AppLayout>
  );
}
