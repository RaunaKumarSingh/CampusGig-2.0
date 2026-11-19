import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  PlusCircle,
  ClipboardList,
  Briefcase,
  Wallet,
  MessageSquare,
  User,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Plus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { seedDemoDataInFirestore } from '../data/demoData';
import { ImageWithFallback } from './ImageWithFallback';
import { ThemeToggle } from './ThemeToggle';

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function AppLayout({ title, children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { firebaseUser, userPublic, isAdmin, workspaceMode, setWorkspaceMode, signOutUser } =
    useAuth();
  const { unreadNotificationsCount, isUsingLocalDemoPreview, adminSettings } = useData();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/explore', label: 'Explore Gigs', icon: Compass },
    { to: '/post', label: 'Post a Gig', icon: PlusCircle },
    { to: '/applications', label: 'My Applications', icon: ClipboardList },
    { to: '/gigs', label: 'My Gigs', icon: Briefcase },
    { to: '/earnings', label: 'Earnings', icon: Wallet },
    {
      to: '/messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/safety', label: 'Safety Guide', icon: ShieldCheck },
  ];

  if (isAdmin) {
    navItems.push({ to: '/admin', label: 'Admin Console', icon: ShieldAlert });
  }

  const mobileTabs = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/gigs', label: 'My Gigs', icon: Briefcase },
    { to: '/messages', label: 'Inbox', icon: MessageSquare, badge: unreadNotificationsCount },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const handleLogout = async () => {
    await signOutUser();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30">
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <Link
            to="/"
            className="text-xl font-extrabold tracking-tight text-violet-700 dark:text-violet-400 font-display"
          >
            CampusGig
          </Link>
          <ThemeToggle />
        </div>

        {firebaseUser && (
          <div className="px-4 pt-4">
            <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setWorkspaceMode('student')}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  workspaceMode === 'student'
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Student View
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode('poster')}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  workspaceMode === 'poster'
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Poster View
              </button>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Primary Sidebar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              location.pathname === item.to ||
              (item.to !== '/dashboard' && location.pathname.startsWith(item.to + '/'));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </span>
                {item.badge ? (
                  <span className="text-xs font-mono font-semibold text-violet-700 dark:text-violet-400 tabular-nums">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          {firebaseUser ? (
            <div className="flex items-center justify-between gap-2">
              <Link to="/profile" className="flex items-center gap-2.5 min-w-0">
                <ImageWithFallback
                  src={userPublic?.photoUrl || firebaseUser.photoURL || undefined}
                  alt={userPublic?.displayName || 'User'}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {userPublic?.displayName || firebaseUser.displayName || 'DGU Student'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {isAdmin
                      ? 'Administrator'
                      : userPublic?.verificationStatus === 'verified'
                      ? 'Verified Student'
                      : 'Verification Needed'}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
            >
              Sign In with Google
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              className="lg:hidden text-base font-extrabold tracking-tight text-violet-700 dark:text-violet-400 font-display whitespace-nowrap shrink-0"
            >
              CampusGig
            </Link>
            <span className="lg:hidden text-slate-300 dark:text-slate-700" aria-hidden="true">
              /
            </span>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 font-display truncate">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle className="lg:hidden" />
            {firebaseUser ? (
              <>
                <Link
                  to="/messages"
                  className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Notifications and Messages"
                >
                  <MessageSquare className="w-4 h-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-violet-700 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/post"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Post a Gig
                </Link>
              </>
            ) : (
              <Link
                to="/auth"
                className="px-3.5 py-2 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Optional Demo Notice Banner */}
        {(isUsingLocalDemoPreview || adminSettings.demoModeBanner) && (
          <div className="bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 px-4 sm:px-6 lg:px-8 py-2 text-xs text-amber-950 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong className="font-semibold">Demo Mode Active:</strong> Sample DGU Dehradun gigs
              marked <span className="font-mono font-semibold">DEMO</span> are illustrative data
              and are kept separate from verified real transactions.
            </span>
            {isAdmin && (
              <div className="flex items-center gap-3">
                {isUsingLocalDemoPreview && firebaseUser && (
                  <button
                    type="button"
                    onClick={async () => {
                      window.localStorage.removeItem('campusgig_demo_cleared');
                      const count = await seedDemoDataInFirestore(firebaseUser.uid);
                      showToast('Synced to Firestore', 'success', `${count} records saved.`);
                    }}
                    className="font-semibold text-violet-800 dark:text-violet-300 hover:underline whitespace-nowrap"
                  >
                    Sync 16 Demo Gigs to Firestore
                  </button>
                )}
                <Link
                  to="/admin"
                  className="font-semibold text-violet-800 dark:text-violet-300 hover:underline whitespace-nowrap"
                >
                  Manage Demo Data
                </Link>
              </div>
            )}
          </div>
        )}

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile Floating Action Button for Post a Gig */}
      <Link
        to="/post"
        className="lg:hidden fixed right-4 bottom-20 z-30 w-12 h-12 rounded-2xl bg-violet-700 dark:bg-violet-600 text-white shadow-lg shadow-violet-900/20 flex items-center justify-center hover:bg-violet-800 active:scale-95 transition-transform"
        aria-label="Post a Gig"
      >
        <Plus className="w-6 h-6" />
      </Link>

      {/* Mobile Bottom Tab Bar (under 15% sticky height cap) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center"
        aria-label="Mobile Navigation"
      >
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const active = location.pathname === tab.to;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`relative flex flex-col items-center justify-center min-h-[44px] ${
                active
                  ? 'text-violet-700 dark:text-violet-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              {tab.badge ? (
                <span className="absolute top-1 right-4 min-w-[14px] h-3.5 px-1 rounded-full bg-violet-700 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                  {tab.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
