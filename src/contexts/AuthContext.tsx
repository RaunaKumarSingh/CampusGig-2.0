import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  HostelStatus,
  PosterType,
  UserPrivate,
  UserPublic,
  UserRole,
} from '../types/campusgig';
import { GENERATED_IMAGES } from '../data/demoData';

export interface OnboardingInput {
  displayName: string;
  role: 'student' | 'poster';
  posterType: PosterType;
  universityEmail: string;
  studentId: string;
  mobileNumber: string;
  course: string;
  department: string;
  academicYear: string;
  hostelStatus: HostelStatus;
  skills: string[];
  bio: string;
  photoUrl?: string;
  upiId?: string;
}

interface AuthContextValue {
  firebaseUser: User | null;
  authReady: boolean;
  profileLoading: boolean;
  userPublic: UserPublic | null;
  userPrivate: UserPrivate | null;
  isAdmin: boolean;
  needsOnboarding: boolean;
  workspaceMode: 'student' | 'poster';
  setWorkspaceMode: (mode: 'student' | 'poster') => void;
  signInWithGoogle: () => Promise<void>;
  registerWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshAuthUser: () => Promise<void>;
  saveProfile: (input: OnboardingInput, submitForVerification?: boolean) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DGU_DOMAIN_REGEX = /@(dgu\.ac\.in|dbsglobaluniversity\.ac\.in|doonbusinessschool\.com)$/i;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [userPublic, setUserPublic] = useState<UserPublic | null>(null);
  const [userPrivate, setUserPrivate] = useState<UserPrivate | null>(null);
  const [hasAdminDoc, setHasAdminDoc] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<'student' | 'poster'>('student');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (!user) {
        setUserPublic(null);
        setUserPrivate(null);
        setHasAdminDoc(false);
        setProfileLoading(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    setProfileLoading(true);

    const pubPath = `users_public/${firebaseUser.uid}`;
    const unsubPub = onSnapshot(
      doc(db, 'users_public', firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserPublic;
          setUserPublic(data);
          if (data.role === 'poster') {
            setWorkspaceMode('poster');
          }
        } else {
          setUserPublic(null);
        }
        setProfileLoading(false);
      },
      (err) => {
        setProfileLoading(false);
        handleFirestoreError(err, OperationType.GET, pubPath);
      }
    );

    let unsubPriv = () => {};
    let unsubAdmin = () => {};

    if (firebaseUser.emailVerified) {
      const privPath = `users_private/${firebaseUser.uid}`;
      unsubPriv = onSnapshot(
        doc(db, 'users_private', firebaseUser.uid),
        (snap) => {
          setUserPrivate(snap.exists() ? (snap.data() as UserPrivate) : null);
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, privPath);
        }
      );

      unsubAdmin = onSnapshot(
        doc(db, 'admins', firebaseUser.uid),
        (snap) => {
          setHasAdminDoc(snap.exists());
        },
        () => {
          setHasAdminDoc(false);
        }
      );
    } else {
      setUserPrivate(null);
      setHasAdminDoc(false);
    }

    return () => {
      unsubPub();
      unsubPriv();
      unsubAdmin();
    };
  }, [firebaseUser]);

  const isAdmin = Boolean(
    firebaseUser?.emailVerified &&
      (firebaseUser.email === 'raunakagiaon0@gmail.com' ||
        hasAdminDoc ||
        userPublic?.role === 'admin')
  );

  const needsOnboarding = Boolean(firebaseUser && authReady && !profileLoading && !userPublic);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const registerWithEmail = useCallback(
    async (email: string, password: string, fullName: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (fullName.trim()) {
        await updateProfile(cred.user, { displayName: fullName.trim() });
      }
      await sendEmailVerification(cred.user);
    },
    []
  );

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  }, []);

  const refreshAuthUser = useCallback(async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      setFirebaseUser({ ...auth.currentUser });
    }
  }, []);

  const saveProfile = useCallback(
    async (input: OnboardingInput, submitForVerification = true) => {
      const current = auth.currentUser;
      if (!current) throw new Error('You must be signed in first.');
      if (!current.emailVerified) {
        throw new Error('Please verify your email address before saving your campus profile.');
      }

      const uid = current.uid;
      const isBootstrapAdmin = current.email === 'raunakagiaon0@gmail.com';
      const emailDomainVerified =
        Boolean(current.email && DGU_DOMAIN_REGEX.test(current.email)) &&
        current.emailVerified;

      let nextVerificationStatus = userPublic?.verificationStatus || 'unverified';
      if (isBootstrapAdmin || isAdmin || emailDomainVerified) {
        nextVerificationStatus = 'verified';
      } else if (submitForVerification && nextVerificationStatus !== 'verified') {
        nextVerificationStatus = 'pending';
      }

      const cleanSkills = input.skills
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12);

      const resolvedPhoto =
        input.photoUrl?.trim() ||
        current.photoURL ||
        userPublic?.photoUrl ||
        GENERATED_IMAGES.avatarMale;

      try {
        const pubRef = doc(db, 'users_public', uid);
        const privRef = doc(db, 'users_private', uid);

        if (!userPublic) {
          const roleToSave: UserRole = input.role;
          await setDoc(pubRef, {
            uid,
            displayName: input.displayName.trim().slice(0, 80),
            photoUrl: resolvedPhoto.slice(0, 500),
            role: roleToSave,
            posterType: input.posterType,
            university: 'DBS Global University, Dehradun',
            course: input.course.trim().slice(0, 80),
            department: input.department.trim().slice(0, 80),
            academicYear: input.academicYear.trim().slice(0, 30),
            hostelStatus: input.hostelStatus,
            skills: cleanSkills,
            bio: input.bio.trim().slice(0, 400),
            verificationStatus: nextVerificationStatus,
            isSuspended: false,
            completedGigsCount: 0,
            postedGigsCount: 0,
            averageRating: 0,
            ratingsCount: 0,
            isDemo: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(
            pubRef,
            {
              displayName: input.displayName.trim().slice(0, 80),
              photoUrl: resolvedPhoto.slice(0, 500),
              role: input.role,
              posterType: input.posterType,
              university: 'DBS Global University, Dehradun',
              course: input.course.trim().slice(0, 80),
              department: input.department.trim().slice(0, 80),
              academicYear: input.academicYear.trim().slice(0, 30),
              hostelStatus: input.hostelStatus,
              skills: cleanSkills,
              bio: input.bio.trim().slice(0, 400),
              verificationStatus: nextVerificationStatus,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        if (!userPrivate) {
          await setDoc(privRef, {
            uid,
            universityEmail: input.universityEmail.trim().slice(0, 120),
            personalEmail: (current.email || '').slice(0, 120),
            studentId: input.studentId.trim().slice(0, 40),
            mobileNumber: input.mobileNumber.trim().slice(0, 20),
            emailVerified: Boolean(current.emailVerified),
            idVerificationMethod: emailDomainVerified
              ? 'university_email'
              : 'manual_id_review',
            verificationNote: emailDomainVerified
              ? 'Verified via university email domain'
              : 'Submitted DGU Enrollment ID for admin verification',
            upiId: (input.upiId || '').trim().slice(0, 80),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(
            privRef,
            {
              universityEmail: input.universityEmail.trim().slice(0, 120),
              personalEmail: (current.email || '').slice(0, 120),
              studentId: input.studentId.trim().slice(0, 40),
              mobileNumber: input.mobileNumber.trim().slice(0, 20),
              emailVerified: Boolean(current.emailVerified),
              idVerificationMethod: emailDomainVerified
                ? 'university_email'
                : 'manual_id_review',
              upiId: (input.upiId || '').trim().slice(0, 80),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users_public/${uid}`);
      }
    },
    [isAdmin, userPrivate, userPublic]
  );

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        authReady,
        profileLoading,
        userPublic,
        userPrivate,
        isAdmin,
        needsOnboarding,
        workspaceMode,
        setWorkspaceMode,
        signInWithGoogle,
        registerWithEmail,
        loginWithEmail,
        sendPasswordReset,
        resendVerificationEmail,
        refreshAuthUser,
        saveProfile,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
