import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Edit3, Flag, Star } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { VerificationText } from '../components/StatusIndicator';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { raiseDispute } from '../services/campusgigService';
import { HostelStatus, PosterType, formatIst } from '../types/campusgig';

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { firebaseUser, userPublic, userPrivate, saveProfile } = useAuth();
  const { usersPublic, reviews, tasks } = useData();
  const { showToast } = useToast();

  const targetUid = userId || firebaseUser?.uid || '';
  const isOwnProfile = Boolean(firebaseUser && targetUid === firebaseUser.uid);

  const profile = isOwnProfile
    ? userPublic
    : usersPublic.find((u) => u.uid === targetUid) || null;

  const userReviews = reviews.filter((r) => r.revieweeId === targetUid);
  const completedCount = tasks.filter(
    (t) => t.assignedWorkerId === targetUid && t.status === 'completed'
  ).length;

  const liveAvgRating =
    userReviews.length > 0
      ? userReviews.reduce((s, r) => s + r.rating, 0) / userReviews.length
      : profile?.averageRating || 0;

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [course, setCourse] = useState('');
  const [department, setDepartment] = useState('');
  const [academicYear, setAcademicYear] = useState('2nd Year');
  const [hostelStatus, setHostelStatus] = useState<HostelStatus>('hostel_resident');
  const [skillsText, setSkillsText] = useState('');
  const [bio, setBio] = useState('');
  const [universityEmail, setUniversityEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    if (profile && isOwnProfile) {
      setDisplayName(profile.displayName || '');
      setCourse(profile.course || '');
      setDepartment(profile.department || '');
      setAcademicYear(profile.academicYear || '2nd Year');
      setHostelStatus(profile.hostelStatus || 'hostel_resident');
      setSkillsText((profile.skills || []).join(', '));
      setBio(profile.bio || '');
    }
    if (userPrivate && isOwnProfile) {
      setUniversityEmail(userPrivate.universityEmail || '');
      setStudentId(userPrivate.studentId || '');
      setMobileNumber(userPrivate.mobileNumber || '');
      setUpiId(userPrivate.upiId || '');
    }
  }, [profile, userPrivate, isOwnProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    try {
      await saveProfile(
        {
          displayName,
          role: profile.role === 'poster' ? 'poster' : 'student',
          posterType: (profile.posterType || 'student') as PosterType,
          universityEmail: universityEmail || firebaseUser?.email || '',
          studentId: studentId || 'PENDING-ID',
          mobileNumber: mobileNumber || '+919000000000',
          course,
          department,
          academicYear,
          hostelStatus,
          skills: skillsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          bio,
          photoUrl: profile.photoUrl,
          upiId,
        },
        true
      );
      setEditing(false);
      showToast('Profile updated');
    } catch (err) {
      showToast('Could not update profile', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  if (!firebaseUser && !userId) {
    return (
      <AppLayout title="User Profile">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center max-w-md mx-auto">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Sign in to view your profile
          </p>
          <Link
            to="/auth"
            className="mt-4 inline-flex px-4 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
          >
            Sign In / Register
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout title="User Profile">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center max-w-md mx-auto">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {isOwnProfile ? 'Complete your campus registration first' : 'Profile not found'}
          </p>
          <Link
            to={isOwnProfile ? '/auth' : '/explore'}
            className="mt-4 inline-flex px-4 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
          >
            {isOwnProfile ? 'Complete Onboarding' : 'Explore Gigs'}
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={isOwnProfile ? 'My Profile' : profile.displayName}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <ImageWithFallback
                src={profile.photoUrl}
                alt={profile.displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
                    {profile.displayName}
                  </h2>
                  <VerificationText status={profile.verificationStatus} />
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {profile.university || 'DBS Global University, Dehradun'}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {[profile.course, profile.department, profile.academicYear]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => setEditing((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {editing ? 'Cancel Edit' : 'Edit Profile'}
                </button>
              ) : (
                firebaseUser &&
                userPublic && (
                  <button
                    type="button"
                    onClick={async () => {
                      await raiseDispute({
                        reporterId: userPublic.uid,
                        reporterName: userPublic.displayName,
                        reportedUserId: profile.uid,
                        type: 'user_report',
                        reason: 'User safety / policy report',
                        details: `Reported user profile ${profile.displayName} for admin review.`,
                      });
                      showToast('User reported to CampusGig Admin');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Report User
                  </button>
                )
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Completed Gigs</p>
              <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-slate-100 font-display tabular-nums">
                {Math.max(profile.completedGigsCount || 0, completedCount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Average Rating</p>
              <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-slate-100 font-display tabular-nums flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                {liveAvgRating.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Reviews Received</p>
              <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-slate-100 font-display tabular-nums">
                {Math.max(profile.ratingsCount || 0, userReviews.length)}
              </p>
            </div>
          </div>

          {!editing ? (
            <div className="mt-6 space-y-4">
              {profile.bio && (
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">About</h3>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Skills</h3>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {profile.skills.join(' · ')}
                  </p>
                </div>
              )}

              {isOwnProfile && userPrivate && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    Private Verification Details (Visible only to you & Admin)
                  </p>
                  <p>
                    University Email:{' '}
                    <span className="font-mono text-slate-900 dark:text-slate-100">
                      {userPrivate.universityEmail}
                    </span>
                  </p>
                  <p>
                    Enrollment ID:{' '}
                    <span className="font-mono text-slate-900 dark:text-slate-100">
                      {userPrivate.studentId}
                    </span>
                  </p>
                  <p>
                    Mobile:{' '}
                    <span className="font-mono text-slate-900 dark:text-slate-100">
                      {userPrivate.mobileNumber}
                    </span>
                  </p>
                  {userPrivate.upiId && (
                    <p>
                      UPI ID:{' '}
                      <span className="font-mono text-slate-900 dark:text-slate-100">
                        {userPrivate.upiId}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSave}
              className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course
                  </label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    University Email
                  </label>
                  <input
                    type="email"
                    value={universityEmail}
                    onChange={(e) => setUniversityEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student ID / Enrollment No.
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number (+91)
                  </label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    UPI ID (Private, for payouts)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="name@okaxis"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
                  />
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Short Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-sm font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
              >
                {busy ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          )}
        </div>

        {/* Reviews Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
            Campus Reviews ({userReviews.length})
          </h3>
          {userReviews.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              No reviews recorded yet.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {userReviews.map((rev) => (
                <div key={rev.id} className="py-4 first:pt-1 last:pb-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {rev.reviewerName}{' '}
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        ({rev.reviewerRole})
                      </span>
                    </p>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                      {rev.rating}.0 ★
                    </span>
                  </div>
                  {rev.taskTitle && (
                    <p className="text-xs text-violet-700 dark:text-violet-400 mt-0.5">
                      {rev.taskTitle}
                    </p>
                  )}
                  <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">
                    {rev.comment}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                    {formatIst(rev.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
