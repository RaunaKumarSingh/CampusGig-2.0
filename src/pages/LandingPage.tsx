import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  IndianRupee,
  MapPin,
  CheckCircle2,
  Briefcase,
  Lock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { DEMO_TESTIMONIALS, GENERATED_IMAGES } from '../data/demoData';
import { GIG_CATEGORIES, formatInr } from '../types/campusgig';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { ThemeToggle } from '../components/ThemeToggle';

export function LandingPage() {
  const { firebaseUser } = useAuth();
  const { tasks } = useData();

  const openTasks = tasks.filter((t) => t.status === 'open' && !t.isRemoved);
  const featuredGigs = openTasks.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <Link
            to="/"
            className="text-xl font-extrabold tracking-tight text-violet-700 dark:text-violet-400 font-display whitespace-nowrap shrink-0"
          >
            CampusGig
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link
              to="/explore"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Explore Gigs
            </Link>
            <a
              href="#how-it-works"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#categories"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Categories
            </a>
            <Link
              to="/safety"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Trust & Safety
            </Link>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />
            <Link
              to={firebaseUser ? '/dashboard' : '/auth'}
              className="px-4 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs sm:text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors whitespace-nowrap shrink-0"
            >
              {firebaseUser ? 'Open Dashboard' : 'Get Started'}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-semibold tracking-wide text-violet-700 dark:text-violet-400">
              DBS Global University · Dehradun, Uttarakhand
            </p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display leading-[1.1] text-balance">
              Your Campus. Your Time. Your Earnings.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Find flexible campus gigs, help your fellow students, and earn money between lectures.
              Turn your free time between lectures into pocket money without leaving campus.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to={firebaseUser ? '/dashboard' : '/auth'}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors whitespace-nowrap"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold hover:border-violet-300 dark:hover:border-violet-600 hover:text-violet-800 dark:hover:text-violet-300 transition-colors whitespace-nowrap"
              >
                Explore Gigs
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span>University-Verified Students</span>
              <span aria-hidden="true">·</span>
              <span>Hyper-Local DGU Campus Only</span>
              <span aria-hidden="true">·</span>
              <span>Transparent ₹ INR Payouts</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[280px] lg:min-h-[380px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
              <ImageWithFallback
                src={GENERATED_IMAGES.heroCampus}
                alt="Aerial view of DBS Global University and Doon Business School campus in Dehradun"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs font-medium text-violet-200">
                  Hyper-Local Campus Marketplace · IST
                </p>
                <p className="mt-1 text-base sm:text-lg font-bold font-display">
                  DBS Global University Campus — Academic Blocks, Hostels & Library
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column KPI / Platform Highlights Strip */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Average Micro-Gig Budget
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white font-display tabular-nums">
              ₹200
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              ₹50 – ₹500 short tasks
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Typical Task Duration
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white font-display tabular-nums">
              20–120 mins
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Fits lecture gaps cleanly
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Live Open Demo Gigs
            </p>
            <p className="mt-1 text-2xl font-bold text-violet-700 dark:text-violet-400 font-display tabular-nums">
              {openTasks.length}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Across 12 campus categories
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Campus Coverage
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white font-display">
              DGU Dehradun
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Verified students & clubs only
            </p>
          </div>
        </div>
      </section>

      {/* Featured Open Gigs Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
              Live Campus Gig Feed
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Sample DGU campus opportunities currently open for browsing (labeled DEMO until live
              campus launch).
            </p>
          </div>
          <Link
            to="/explore"
            className="text-sm font-semibold text-violet-700 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 inline-flex items-center gap-1 whitespace-nowrap"
          >
            Browse all {openTasks.length} gigs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {featuredGigs.map((gig) => (
            <Link
              key={gig.id}
              to={`/tasks/${gig.id}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-violet-300 dark:hover:border-violet-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">
                    {gig.category}
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white font-display tabular-nums">
                    {formatInr(gig.budgetInr)}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {gig.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                  {gig.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span className="truncate">{gig.location}</span>
                <span className="shrink-0 ml-2 tabular-nums">{gig.estimatedDuration}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-slate-200 dark:border-slate-800"
      >
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
            How CampusGig Works
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
            A structured, accountable workflow built around university lecture schedules and campus
            trust.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01. Verify Campus Identity',
              body: 'Register with Google Sign-In and your DGU enrollment ID. Verification ensures every worker and poster belongs to campus.',
            },
            {
              step: '02. Discover or Post a Gig',
              body: 'Students filter tasks by block, budget, and duration; clubs, faculty, and peers post short tasks in under two minutes.',
            },
            {
              step: '03. Complete & Submit Proof',
              body: 'Selected students coordinate via task-scoped in-app chat, mark work started, and submit completion proof on handoff.',
            },
            {
              step: '04. Confirm & Release ₹ Payout',
              body: 'Poster confirms completion, transparent platform commission is recorded, and both parties rate each other.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                {item.step}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Dual Benefits Split with Generated Editorial Photography */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="h-56 overflow-hidden">
              <ImageWithFallback
                src={GENERATED_IMAGES.collaboration}
                alt="University students collaborating with laptops in a bright campus lounge"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                  Built for Student Gig Workers
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-violet-700 dark:text-violet-400 shrink-0 mt-0.5" />
                    <span>
                      Pick up 30–90 minute tasks right between lectures without leaving DGU.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <IndianRupee className="w-4 h-4 text-violet-700 dark:text-violet-400 shrink-0 mt-0.5" />
                    <span>
                      Clear ₹ INR payout visibility and transparent commission math upfront.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-violet-700 dark:text-violet-400 shrink-0 mt-0.5" />
                    <span>
                      Tasks pinned to known campus zones: Library, Block A/B, Auditorium, Hostels.
                    </span>
                  </li>
                </ul>
              </div>
              <Link
                to="/auth"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300"
              >
                Register as a Student Worker
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="h-56 overflow-hidden">
              <ImageWithFallback
                src={GENERATED_IMAGES.eventCrew}
                alt="Student photographer covering a university club seminar in the auditorium"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                  Built for Campus Posters, Clubs & Departments
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <Briefcase className="w-4 h-4 text-violet-700 dark:text-violet-400 shrink-0 mt-0.5" />
                    <span>
                      Review verified student applicants, check course & ratings, and select cleanly.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-violet-700 dark:text-violet-400 shrink-0 mt-0.5" />
                    <span>
                      Confirm work completion before releasing payment—zero guesswork.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-violet-700 dark:text-violet-400 shrink-0 mt-0.5" />
                    <span>
                      Private contact details stay protected via task-scoped in-app messaging.
                    </span>
                  </li>
                </ul>
              </div>
              <Link
                to="/post"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300"
              >
                Post a Campus Gig
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section
        id="categories"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-slate-200 dark:border-slate-800"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
          Popular Campus Categories
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Select any category to filter live DGU opportunities.
        </p>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {GIG_CATEGORIES.map((category) => (
            <Link
              key={category}
              to={`/explore?category=${encodeURIComponent(category)}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:border-violet-400 dark:hover:border-violet-600 hover:text-violet-800 dark:hover:text-violet-300 transition-colors flex items-center justify-between gap-2"
            >
              <span className="truncate">{category}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* Trust & Safety + Demo Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              Campus Trust & Safety Architecture
            </div>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-display">
              University-Exclusive Access & Dispute Safeguards
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Phone numbers, enrollment IDs, and private emails are never exposed publicly. Only
              verified accounts can apply for gigs, duplicate applications are blocked at the
              database level, and admins moderate suspicious listings and payment disputes.
            </p>
          </div>
          <Link
            to="/safety"
            className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:border-violet-400 dark:hover:border-violet-600 hover:text-violet-800 dark:hover:text-violet-300 transition-colors whitespace-nowrap shrink-0 self-start md:self-center"
          >
            Read Safety Guidelines
          </Link>
        </div>

        <div className="mt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
              Illustrative Campus Scenarios
            </h2>
            <span className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-400">
              DEMO CONTENT — ILLUSTRATIVE EXAMPLES ONLY
            </span>
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            {DEMO_TESTIMONIALS.map((t) => (
              <blockquote
                key={t.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between"
              >
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  “{t.quote}”
                </p>
                <footer className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <ImageWithFallback
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.role} · {t.outcome}
                    </p>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <span className="font-bold text-slate-900 dark:text-white font-display text-sm">
              CampusGig
            </span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>DBS Global University Pilot · Dehradun, India (IST / ₹ INR)</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/safety" className="hover:text-slate-900 dark:hover:text-white">
              Terms & Cancellation Policy
            </Link>
            <Link to="/safety" className="hover:text-slate-900 dark:hover:text-white">
              Privacy & PII Protection
            </Link>
            <Link to="/safety" className="hover:text-slate-900 dark:hover:text-white">
              Campus Support
            </Link>
            <a
              href="mailto:support@campusgig.dgu.edu.in"
              className="hover:text-slate-900 dark:hover:text-white"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
