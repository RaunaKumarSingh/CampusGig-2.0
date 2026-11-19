import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ShieldAlert, SlidersHorizontal, X } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { TaskCard } from '../components/TaskCard';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { DGU_CAMPUS_LOCATIONS, GIG_CATEGORIES, toJsDate } from '../types/campusgig';

export function ExploreGigsPage() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const { firebaseUser, userPublic } = useAuth();
  const { tasks, applications, adminSettings, dataLoading } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [locationFilter, setLocationFilter] = useState('All');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [maxDuration, setMaxDuration] = useState('all');
  const [deadlineFilter, setDeadlineFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest_pay'>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const categories = adminSettings.categories?.length
    ? adminSettings.categories
    : [...GIG_CATEGORIES];

  const uid = firebaseUser?.uid || '';

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const minB = minBudget ? Number(minBudget) : 0;
    const maxB = maxBudget ? Number(maxBudget) : Infinity;

    const list = tasks.filter((t) => {
      if (t.isRemoved || t.status !== 'open') return false;
      if (category !== 'All' && t.category !== category) return false;
      if (locationFilter !== 'All' && t.location !== locationFilter) return false;
      if (t.budgetInr < minB || t.budgetInr > maxB) return false;

      if (maxDuration === 'under_60' && (t.durationMinutes || 60) > 60) return false;
      if (maxDuration === 'under_120' && (t.durationMinutes || 60) > 120) return false;

      if (deadlineFilter === 'today' && !t.deadline.toLowerCase().includes('today')) return false;
      if (
        deadlineFilter === 'tomorrow' &&
        !t.deadline.toLowerCase().includes('today') &&
        !t.deadline.toLowerCase().includes('tomorrow')
      ) {
        return false;
      }

      if (q) {
        const haystack = [
          t.title,
          t.description,
          t.category,
          t.location,
          t.posterName,
          ...(t.skillsRequired || []),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'highest_pay') {
        return b.budgetInr - a.budgetInr;
      }
      const dateA = toJsDate(a.createdAt)?.getTime() || 0;
      const dateB = toJsDate(b.createdAt)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [
    tasks,
    searchQuery,
    category,
    locationFilter,
    minBudget,
    maxBudget,
    maxDuration,
    deadlineFilter,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setCategory('All');
    setLocationFilter('All');
    setMinBudget('');
    setMaxBudget('');
    setMaxDuration('all');
    setDeadlineFilter('all');
    setSortBy('newest');
  };

  const controlClass =
    'px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-violet-600 dark:focus:border-violet-400';

  return (
    <AppLayout title="Explore Campus Gigs">
      {(!firebaseUser || userPublic?.verificationStatus !== 'verified') && (
        <div className="mb-5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Verification required before applying
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                You can browse all open DGU tasks now. Complete student verification to submit gig
                applications.
              </p>
            </div>
          </div>
          <Link
            to={firebaseUser ? '/profile' : '/auth'}
            className="px-4 py-2 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 whitespace-nowrap self-start sm:self-center"
          >
            {firebaseUser ? 'Verify Profile' : 'Sign In & Verify'}
          </Link>
        </div>
      )}

      {/* Search & Controls Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by task title, skill (Canva, Python, Photography), or block..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:border-violet-600 dark:focus:border-violet-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'highest_pay')}
              aria-label="Sort gigs"
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-violet-600"
            >
              <option value="newest">Newest Listings</option>
              <option value="highest_pay">Highest Paying (₹)</option>
            </select>

            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Category Quick Strip */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              category === 'All'
                ? 'bg-violet-700 dark:bg-violet-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                category === cat
                  ? 'bg-violet-700 dark:bg-violet-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Expanded Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Campus Location
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className={`w-full ${controlClass}`}
              >
                <option value="All">All DGU Locations</option>
                {DGU_CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Min Budget (₹)
              </label>
              <input
                type="number"
                min={0}
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                placeholder="e.g. 100"
                className={`w-full tabular-nums ${controlClass}`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Max Budget (₹)
              </label>
              <input
                type="number"
                min={0}
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="e.g. 500"
                className={`w-full tabular-nums ${controlClass}`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Task Duration
              </label>
              <select
                value={maxDuration}
                onChange={(e) => setMaxDuration(e.target.value)}
                className={`w-full ${controlClass}`}
              >
                <option value="all">Any Duration</option>
                <option value="under_60">1 hour or less</option>
                <option value="under_120">2 hours or less</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Deadline
              </label>
              <select
                value={deadlineFilter}
                onChange={(e) => setDeadlineFilter(e.target.value)}
                className={`w-full ${controlClass}`}
              >
                <option value="all">Any Deadline</option>
                <option value="today">Today</option>
                <option value="tomorrow">Today or Tomorrow</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mt-5 mb-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="tabular-nums">
          Showing <strong className="text-slate-900 dark:text-white">{filteredTasks.length}</strong>{' '}
          open campus gigs
        </span>
        {(category !== 'All' ||
          locationFilter !== 'All' ||
          searchQuery ||
          minBudget ||
          maxBudget ||
          maxDuration !== 'all' ||
          deadlineFilter !== 'all') && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-violet-700 dark:text-violet-400 font-semibold hover:underline"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Gig Grid */}
      {dataLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="h-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 animate-pulse"
            />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
            No matching campus gigs found
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Try clearing your category or budget filters to view all open DGU opportunities.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              alreadyApplied={applications.some(
                (a) => a.taskId === task.id && a.applicantId === uid && a.status !== 'withdrawn'
              )}
              isOwnTask={task.posterId === uid}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
