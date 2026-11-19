/**
 * CampusGig Firestore Security Rules Verification Spec
 * Documents the 12 "Dirty Dozen" adversarial payloads and expected rule enforcement.
 */

export interface AdversarialTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  actor: { uid: string; emailVerified: boolean; isAdmin: boolean; verificationStatus: string };
  payload: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
  enforcedByRule: string;
}

export const dirtyDozenPayloads: AdversarialTestCase[] = [
  {
    id: 1,
    name: 'Role Escalation on Registration',
    collectionPath: 'users_public/attacker_uid',
    operation: 'create',
    actor: { uid: 'attacker_uid', emailVerified: true, isAdmin: false, verificationStatus: 'unverified' },
    payload: { uid: 'attacker_uid', displayName: 'Attacker', role: 'admin', isSuspended: false },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'users_public create enforces role in ["student", "poster"] unless isAdmin()'
  },
  {
    id: 2,
    name: 'Self-Verification Bypass',
    collectionPath: 'users_public/student_1',
    operation: 'update',
    actor: { uid: 'student_1', emailVerified: true, isAdmin: false, verificationStatus: 'pending' },
    payload: { verificationStatus: 'verified' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'users_public owner update affectedKeys() excludes verificationStatus and isSuspended'
  },
  {
    id: 3,
    name: 'Shadow Ghost Field Injection',
    collectionPath: 'tasks/task_ghost',
    operation: 'create',
    actor: { uid: 'poster_1', emailVerified: true, isAdmin: false, verificationStatus: 'verified' },
    payload: { posterId: 'poster_1', title: 'Legit title', ghostFlag: true },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isValidTask() enforces strict data.keys().hasOnly(...)'
  },
  {
    id: 4,
    name: 'PII Cross-Read',
    collectionPath: 'users_private/victim_uid',
    operation: 'get',
    actor: { uid: 'other_student', emailVerified: true, isAdmin: false, verificationStatus: 'verified' },
    payload: {},
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'users_private get/list restricted strictly to isOwner(userId) || isAdmin()'
  },
  {
    id: 5,
    name: 'Unverified Student Application',
    collectionPath: 'applications/task_1_unverified_uid',
    operation: 'create',
    actor: { uid: 'unverified_uid', emailVerified: true, isAdmin: false, verificationStatus: 'unverified' },
    payload: { taskId: 'task_1', applicantId: 'unverified_uid', posterId: 'poster_1', status: 'pending' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'applications create requires isVerifiedStudent()'
  },
  {
    id: 6,
    name: 'Self-Application Attack',
    collectionPath: 'applications/task_1_poster_1',
    operation: 'create',
    actor: { uid: 'poster_1', emailVerified: true, isAdmin: false, verificationStatus: 'verified' },
    payload: { taskId: 'task_1', applicantId: 'poster_1', posterId: 'poster_1', status: 'pending' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'applications create forbids incoming().applicantId == incoming().posterId'
  },
  {
    id: 7,
    name: 'State Shortcutting on Task',
    collectionPath: 'tasks/task_1',
    operation: 'update',
    actor: { uid: 'worker_1', emailVerified: true, isAdmin: false, verificationStatus: 'verified' },
    payload: { status: 'completed' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'tasks update only allows poster to transition submitted -> completed'
  },
  {
    id: 8,
    name: 'Terminal Task Tampering',
    collectionPath: 'tasks/task_completed',
    operation: 'update',
    actor: { uid: 'poster_1', emailVerified: true, isAdmin: false, verificationStatus: 'verified' },
    payload: { budgetInr: 10 },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'tasks update locks documents when existing().status in ["completed", "cancelled"]'
  },
  {
    id: 9,
    name: 'Unauthorized Chat Snooping',
    collectionPath: 'conversations/conv_1/messages/msg_1',
    operation: 'get',
    actor: { uid: 'outsider_uid', emailVerified: true, isAdmin: false, verificationStatus: 'verified' },
    payload: {},
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'messages get checks request.auth.uid in parent conversation participantIds'
  },
  {
    id: 10,
    name: 'Forged Commission Update',
    collectionPath: 'transactions/txn_task_1',
    operation: 'update',
    actor: { uid: 'poster_1', emailVerified: true, isAdmin: false, verificationStatus: 'verified' },
    payload: { platformCommissionInr: 0, workerPayoutInr: 500 },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'transactions owner update affectedKeys().hasOnly(["status", "upiReference", "paymentMethod", "updatedAt"])'
  },
  {
    id: 11,
    name: 'ID Poisoning with Oversized Key',
    collectionPath: `tasks/${'A'.repeat(200)}`,
    operation: 'create',
    actor: { uid: 'poster_1', emailVerified: true, isAdmin: false, verificationStatus: 'verified' },
    payload: { title: 'Test' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'isValidId(taskId) caps length at 128 and enforces ^[a-zA-Z0-9_\\-]+$'
  },
  {
    id: 12,
    name: 'Client-Forged Timestamp',
    collectionPath: 'reviews/rev_task_1_student_1',
    operation: 'create',
    actor: { uid: 'student_1', emailVerified: true, isAdmin: false, verificationStatus: 'verified' },
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcedByRule: 'reviews create mandates incoming().createdAt == request.time'
  }
];
