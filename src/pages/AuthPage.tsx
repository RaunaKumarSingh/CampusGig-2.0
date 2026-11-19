import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { GENERATED_IMAGES } from '../data/demoData';
import { HostelStatus, PosterType } from '../types/campusgig';
import { ThemeToggle } from '../components/ThemeToggle';

type AuthTab = 'login' | 'student_register' | 'poster_register' | 'forgot';

export function AuthPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    firebaseUser,
    userPublic,
    userPrivate,
    needsOnboarding,
    signInWithGoogle,
    registerWithEmail,
    loginWithEmail,
    sendPasswordReset,
    resendVerificationEmail,
    refreshAuthUser,
    saveProfile,
  } = useAuth();

  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(
    userPublic?.displayName || firebaseUser?.displayName || ''
  );
  const [role, setRole] = useState<'student' | 'poster'>(
    tab === 'poster_register' ? 'poster' : 'student'
  );
  const [posterType, setPosterType] = useState<PosterType>('student');
  const [universityEmail, setUniversityEmail] = useState(
    userPrivate?.universityEmail || firebaseUser?.email || ''
  );
  const [studentId, setStudentId] = useState(userPrivate?.studentId || '');
  const [mobileNumber, setMobileNumber] = useState(userPrivate?.mobileNumber || '+91 ');
  const [course, setCourse] = useState(userPublic?.course || 'B.Tech CSE');
  const [department, setDepartment] = useState(
    userPublic?.department || 'School of Engineering & Technology'
  );
  const [academicYear, setAcademicYear] = useState(userPublic?.academicYear || '2nd Year');
  const [hostelStatus, setHostelStatus] = useState<HostelStatus>(
    userPublic?.hostelStatus || 'hostel_resident'
  );
  const [skillsText, setSkillsText] = useState(
    userPublic?.skills?.join(', ') || 'Canva, PowerPoint, Event Support'
  );
  const [bio, setBio] = useState(userPublic?.bio || '');
  const [photoUrl, setPhotoUrl] = useState(
    userPublic?.photoUrl || firebaseUser?.photoURL || GENERATED_IMAGES.avatarMale
  );

  const handleGoogle = async () => {
    setBusy(true);
    setAuthNotice(null);
    try {
      await signInWithGoogle();
      showToast('Signed in with Google');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setAuthNotice(msg);
      showToast('Sign-in failed', 'error', msg);
    } finally {
      setBusy(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setAuthNotice(null);
    try {
      if (tab === 'login') {
        await loginWithEmail(email, password);
        showToast('Signed in successfully');
      } else if (tab === 'forgot') {
        await sendPasswordReset(email);
        setAuthNotice('Password reset instructions sent if this email is registered.');
        showToast('Password reset email sent');
      } else {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await registerWithEmail(email, password, fullName);
        setRole(tab === 'poster_register' ? 'poster' : 'student');
        setDisplayName(fullName);
        setUniversityEmail(email);
        showToast('Account created', 'info', 'Please check your inbox to verify your email.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication error.';
      if (msg.includes('operation-not-allowed')) {
        setAuthNotice(
          'Email/Password sign-in is not yet enabled in Firebase Console (Authentication -> Sign-in method -> Email/Password). Use "Continue with Google" above for instant access!'
        );
      } else {
        setAuthNotice(msg);
      }
      showToast('Authentication notice', 'error', msg);
    } finally {
      setBusy(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !studentId.trim() || !mobileNumber.trim()) {
      showToast('Please complete all required fields', 'error');
      return;
    }
    const cleanPhone = mobileNumber.replace(/\s+/g, '');
    if (!/^(\+91)?[6-9]\d{9}$/.test(cleanPhone)) {
      showToast(
        'Enter a valid Indian mobile number',
        'error',
        'Format: +91 98XXXXXXXX (10 digits starting with 6–9)'
      );
      return;
    }

    setBusy(true);
    try {
      await saveProfile(
        {
          displayName: displayName.trim(),
          role,
          posterType: role === 'poster' ? (posterType === 'none' ? 'club' : posterType) : 'student',
          universityEmail: universityEmail.trim() || firebaseUser?.email || '',
          studentId: studentId.trim(),
          mobileNumber: cleanPhone,
          course: course.trim(),
          department: department.trim(),
          academicYear: academicYear.trim(),
          hostelStatus,
          skills: skillsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          bio: bio.trim(),
          photoUrl,
        },
        true
      );
      showToast('Campus profile saved to Firestore!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save profile.';
      showToast('Profile error', 'error', msg);
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:border-violet-600 dark:focus:border-violet-400';

  if (firebaseUser && !needsOnboarding && userPublic && firebaseUser.emailVerified) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-white font-display">
            You are signed in as {userPublic.displayName}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Verification status:{' '}
            <strong className="text-slate-900 dark:text-white">
              {userPublic.verificationStatus}
            </strong>
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              to="/dashboard"
              className="w-full py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/explore"
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Explore Campus Gigs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="max-w-xl w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to CampusGig Home
          </Link>
          <ThemeToggle />
        </div>

        {/* Case 1: Signed in, email not verified */}
        {firebaseUser && !firebaseUser.emailVerified && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white font-display">
              Verify Your Email Address
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              We sent a verification link to <strong>{firebaseUser.email}</strong>. Click the link
              in your inbox and then click Refresh Status below.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={refreshAuthUser}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500"
              >
                <RefreshCw className="w-4 h-4" />
                I Verified — Refresh Status
              </button>
              <button
                type="button"
                onClick={async () => {
                  await resendVerificationEmail();
                  showToast('Verification email resent');
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Resend Email
              </button>
            </div>
          </div>
        )}

        {/* Case 2: Signed in + Email Verified + Needs Campus Onboarding */}
        {firebaseUser && firebaseUser.emailVerified && needsOnboarding && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 dark:text-violet-400">
              <ShieldCheck className="w-4 h-4" />
              DBS Global University Onboarding
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-display">
              Complete Your Campus Profile
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Your Enrollment ID, email, and mobile number remain private and are never shown on
              public gig listings.
            </p>

            <form onSubmit={handleOnboardingSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    role === 'student'
                      ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Student / Gig Worker
                </button>
                <button
                  type="button"
                  onClick={() => setRole('poster')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    role === 'poster'
                      ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Task Poster (Club / Dept / Peer)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Aarav Rawat"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student ID / Enrollment No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. DGU2024BT041"
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    University Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={universityEmail}
                    onChange={(e) => setUniversityEmail(e.target.value)}
                    placeholder="name@dgu.ac.in"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number (India) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>

              {role === 'poster' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Poster Organization Type
                  </label>
                  <select
                    value={posterType}
                    onChange={(e) => setPosterType(e.target.value as PosterType)}
                    className={inputClass}
                  >
                    <option value="student">Individual Student</option>
                    <option value="club">Campus Student Club</option>
                    <option value="department">University Department / Cell</option>
                    <option value="business">Approved Campus Local Business</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course
                  </label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="B.Tech / BBA / MBA"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Engineering / Management"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className={inputClass}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Faculty / Staff">Faculty / Staff</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Campus Residence Status
                  </label>
                  <select
                    value={hostelStatus}
                    onChange={(e) => setHostelStatus(e.target.value as HostelStatus)}
                    className={inputClass}
                  >
                    <option value="hostel_resident">Hostel Resident (DGU H1/H2)</option>
                    <option value="day_scholar">Day Scholar</option>
                    <option value="campus_entity">Department / Club / Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Profile Photo Preset
                  </label>
                  <select
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className={inputClass}
                  >
                    {firebaseUser.photoURL && (
                      <option value={firebaseUser.photoURL}>Google Account Photo</option>
                    )}
                    <option value={GENERATED_IMAGES.avatarMale}>Campus Portrait A</option>
                    <option value={GENERATED_IMAGES.avatarFemale}>Campus Portrait B</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="Canva, Photography, Python, Delivery"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Short Bio
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your free lecture slots or campus experience..."
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 disabled:opacity-60 transition-colors"
              >
                {busy ? 'Saving Campus Profile...' : 'Save & Submit for Verification'}
              </button>
            </form>
          </div>
        )}

        {/* Case 3: Not Signed In */}
        {!firebaseUser && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
            <div className="text-center">
              <span className="text-xl font-extrabold text-violet-700 dark:text-violet-400 font-display">
                CampusGig
              </span>
              <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-display">
                {tab === 'login'
                  ? 'Sign In to Your Campus Account'
                  : tab === 'forgot'
                  ? 'Reset Your Password'
                  : tab === 'poster_register'
                  ? 'Register as a Task Poster'
                  : 'Register as a DGU Student'}
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                DBS Global University, Dehradun · Firebase Auth & Cloud Firestore
              </p>
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={handleGoogle}
              className="mt-6 w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-3 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              <span>or use email credentials</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold mb-5">
              <button
                type="button"
                onClick={() => setTab('login')}
                className={`py-2 rounded-lg transition-colors ${
                  tab === 'login'
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setTab('student_register')}
                className={`py-2 rounded-lg transition-colors ${
                  tab === 'student_register'
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Student Signup
              </button>
              <button
                type="button"
                onClick={() => setTab('poster_register')}
                className={`py-2 rounded-lg transition-colors ${
                  tab === 'poster_register'
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Poster Signup
              </button>
            </div>

            {authNotice && (
              <div className="mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
                <span>{authNotice}</span>
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {(tab === 'student_register' || tab === 'poster_register') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  University / Personal Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@dgu.ac.in"
                  className={inputClass}
                />
              </div>

              {tab !== 'forgot' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className={inputClass}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 disabled:opacity-60 transition-colors"
              >
                {busy
                  ? 'Please wait...'
                  : tab === 'login'
                  ? 'Sign In'
                  : tab === 'forgot'
                  ? 'Send Password Reset Link'
                  : 'Create Account & Continue Onboarding'}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              {tab !== 'forgot' ? (
                <button
                  type="button"
                  onClick={() => setTab('forgot')}
                  className="hover:text-violet-700 dark:hover:text-violet-400 font-medium"
                >
                  Forgot password?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="hover:text-violet-700 dark:hover:text-violet-400 font-medium"
                >
                  Back to Sign In
                </button>
              )}
              <Link to="/explore" className="hover:text-slate-900 dark:hover:text-white font-medium">
                Browse gigs without signing in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
