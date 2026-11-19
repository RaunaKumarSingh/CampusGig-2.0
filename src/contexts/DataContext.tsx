import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  AdminSettings,
  AppNotification,
  CampusTask,
  Conversation,
  DEFAULT_ADMIN_SETTINGS,
  Dispute,
  GigApplication,
  GigTransaction,
  Review,
  UserPrivate,
  UserPublic,
} from '../types/campusgig';
import {
  DEMO_REVIEWS,
  DEMO_TASKS,
  DEMO_TRANSACTIONS,
  DEMO_USERS_PUBLIC,
  seedDemoDataInFirestore,
} from '../data/demoData';
import { useAuth } from './AuthContext';

interface DataContextValue {
  tasks: CampusTask[];
  isUsingLocalDemoPreview: boolean;
  usersPublic: UserPublic[];
  usersPrivate: UserPrivate[];
  applications: GigApplication[];
  transactions: GigTransaction[];
  notifications: AppNotification[];
  conversations: Conversation[];
  reviews: Review[];
  disputes: Dispute[];
  adminSettings: AdminSettings;
  dataLoading: boolean;
  unreadNotificationsCount: number;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser, isAdmin } = useAuth();
  const autoSeededRef = useRef(false);

  const [firestoreTasks, setFirestoreTasks] = useState<CampusTask[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [firestoreUsersPublic, setFirestoreUsersPublic] = useState<UserPublic[]>([]);
  const [usersPrivate, setUsersPrivate] = useState<UserPrivate[]>([]);
  const [applications, setApplications] = useState<GigApplication[]>([]);
  const [firestoreTransactions, setFirestoreTransactions] = useState<GigTransaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [firestoreReviews, setFirestoreReviews] = useState<Review[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);

  // Publicly readable listeners: tasks, users_public, reviews, admin_settings
  useEffect(() => {
    const tasksQuery = isAdmin
      ? collection(db, 'tasks')
      : query(collection(db, 'tasks'), where('isRemoved', '==', false));

    const unsubTasks = onSnapshot(
      tasksQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampusTask));
        setFirestoreTasks(list);
        setTasksLoaded(true);
      },
      (err) => {
        setTasksLoaded(true);
        handleFirestoreError(err, OperationType.LIST, 'tasks');
      }
    );

    const usersQuery = isAdmin
      ? collection(db, 'users_public')
      : query(collection(db, 'users_public'), where('isSuspended', '==', false));

    const unsubUsers = onSnapshot(
      usersQuery,
      (snap) => {
        setFirestoreUsersPublic(snap.docs.map((d) => d.data() as UserPublic));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users_public')
    );

    const unsubReviews = onSnapshot(
      query(collection(db, 'reviews'), where('rating', '>=', 1)),
      (snap) => {
        setFirestoreReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'reviews')
    );

    const unsubSettings = onSnapshot(
      doc(db, 'admin_settings', 'platform'),
      (snap) => {
        if (snap.exists()) {
          setAdminSettings(snap.data() as AdminSettings);
        } else {
          setAdminSettings(DEFAULT_ADMIN_SETTINGS);
        }
      },
      () => setAdminSettings(DEFAULT_ADMIN_SETTINGS)
    );

    return () => {
      unsubTasks();
      unsubUsers();
      unsubReviews();
      unsubSettings();
    };
  }, [isAdmin]);

  // Auto-seed Firestore once when Admin signs in and database has zero tasks
  useEffect(() => {
    if (
      tasksLoaded &&
      firestoreTasks.length === 0 &&
      isAdmin &&
      firebaseUser &&
      !autoSeededRef.current &&
      window.localStorage.getItem('campusgig_demo_cleared') !== 'true'
    ) {
      autoSeededRef.current = true;
      seedDemoDataInFirestore(firebaseUser.uid).catch((err) => {
        console.warn('Initial Firestore demo seed skipped:', err);
      });
    }
  }, [tasksLoaded, firestoreTasks.length, isAdmin, firebaseUser]);

  // Authenticated-only listeners
  useEffect(() => {
    if (!firebaseUser || !firebaseUser.emailVerified) {
      setApplications([]);
      setFirestoreTransactions([]);
      setNotifications([]);
      setConversations([]);
      setDisputes([]);
      setUsersPrivate([]);
      return;
    }

    const uid = firebaseUser.uid;
    const unsubs: Array<() => void> = [];

    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'applications'),
          (snap) => setApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as GigApplication))),
          (err) => handleFirestoreError(err, OperationType.LIST, 'applications')
        )
      );
      unsubs.push(
        onSnapshot(
          collection(db, 'transactions'),
          (snap) =>
            setFirestoreTransactions(
              snap.docs.map((d) => ({ id: d.id, ...d.data() } as GigTransaction))
            ),
          (err) => handleFirestoreError(err, OperationType.LIST, 'transactions')
        )
      );
      unsubs.push(
        onSnapshot(
          collection(db, 'disputes'),
          (snap) => setDisputes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Dispute))),
          (err) => handleFirestoreError(err, OperationType.LIST, 'disputes')
        )
      );
      unsubs.push(
        onSnapshot(
          collection(db, 'users_private'),
          (snap) => setUsersPrivate(snap.docs.map((d) => d.data() as UserPrivate)),
          (err) => handleFirestoreError(err, OperationType.LIST, 'users_private')
        )
      );
    } else {
      let applicantApps: GigApplication[] = [];
      let posterApps: GigApplication[] = [];
      const mergeApps = () => {
        const map = new Map<string, GigApplication>();
        [...applicantApps, ...posterApps].forEach((a) => map.set(a.id, a));
        setApplications(Array.from(map.values()));
      };

      unsubs.push(
        onSnapshot(
          query(collection(db, 'applications'), where('applicantId', '==', uid)),
          (snap) => {
            applicantApps = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GigApplication));
            mergeApps();
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'applications')
        )
      );
      unsubs.push(
        onSnapshot(
          query(collection(db, 'applications'), where('posterId', '==', uid)),
          (snap) => {
            posterApps = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GigApplication));
            mergeApps();
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'applications')
        )
      );

      let workerTxns: GigTransaction[] = [];
      let posterTxns: GigTransaction[] = [];
      const mergeTxns = () => {
        const map = new Map<string, GigTransaction>();
        [...workerTxns, ...posterTxns].forEach((t) => map.set(t.id, t));
        setFirestoreTransactions(Array.from(map.values()));
      };

      unsubs.push(
        onSnapshot(
          query(collection(db, 'transactions'), where('workerId', '==', uid)),
          (snap) => {
            workerTxns = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GigTransaction));
            mergeTxns();
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'transactions')
        )
      );
      unsubs.push(
        onSnapshot(
          query(collection(db, 'transactions'), where('posterId', '==', uid)),
          (snap) => {
            posterTxns = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GigTransaction));
            mergeTxns();
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'transactions')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'disputes'), where('reporterId', '==', uid)),
          (snap) => setDisputes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Dispute))),
          (err) => handleFirestoreError(err, OperationType.LIST, 'disputes')
        )
      );
    }

    unsubs.push(
      onSnapshot(
        query(collection(db, 'notifications'), where('userId', '==', uid)),
        (snap) =>
          setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'conversations'), where('participantIds', 'array-contains', uid)),
        (snap) =>
          setConversations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Conversation))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'conversations')
      )
    );

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [firebaseUser, isAdmin]);

  const isUsingLocalDemoPreview = tasksLoaded && firestoreTasks.length === 0;

  const tasks = useMemo(() => {
    if (firestoreTasks.length > 0) return firestoreTasks;
    return DEMO_TASKS.map((t) => ({ ...t, createdAt: new Date(), updatedAt: new Date() }));
  }, [firestoreTasks]);

  const usersPublic = useMemo(() => {
    if (firestoreUsersPublic.length > 0) return firestoreUsersPublic;
    return DEMO_USERS_PUBLIC.map((u) => ({ ...u, createdAt: new Date(), updatedAt: new Date() }));
  }, [firestoreUsersPublic]);

  const reviews = useMemo(() => {
    if (firestoreReviews.length > 0) return firestoreReviews;
    return DEMO_REVIEWS.map((r) => ({ ...r, createdAt: new Date() }));
  }, [firestoreReviews]);

  const transactions = useMemo(() => {
    if (firestoreTransactions.length > 0 || !isUsingLocalDemoPreview) return firestoreTransactions;
    if (isAdmin) {
      return DEMO_TRANSACTIONS.map((t) => ({ ...t, createdAt: new Date(), updatedAt: new Date() }));
    }
    return [];
  }, [firestoreTransactions, isAdmin, isUsingLocalDemoPreview]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  return (
    <DataContext.Provider
      value={{
        tasks,
        isUsingLocalDemoPreview,
        usersPublic,
        usersPrivate,
        applications,
        transactions,
        notifications,
        conversations,
        reviews,
        disputes,
        adminSettings,
        dataLoading: !tasksLoaded,
        unreadNotificationsCount,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
