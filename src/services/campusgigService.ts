import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  AdminSettings,
  CampusTask,
  Conversation,
  Dispute,
  DisputeStatus,
  DisputeType,
  GigApplication,
  GigTransaction,
  NotificationType,
  PaymentMethod,
  UserPublic,
  VerificationStatus,
  calculateCommissionBreakdown,
} from '../types/campusgig';

async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkPath?: string;
  relatedTaskId?: string;
  isDemo?: boolean;
}) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId: params.userId,
      type: params.type,
      title: params.title.slice(0, 120),
      body: params.body.slice(0, 300),
      linkPath: params.linkPath || '/dashboard',
      relatedTaskId: params.relatedTaskId || '',
      isRead: false,
      isDemo: Boolean(params.isDemo),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Notification dispatch skipped:', err);
  }
}

export async function createTask(
  poster: UserPublic,
  input: {
    title: string;
    category: string;
    description: string;
    responsibilities?: string;
    location: string;
    budgetInr: number;
    estimatedDuration: string;
    durationMinutes?: number;
    deadline: string;
    workersRequired: number;
    skillsRequired?: string[];
    additionalInstructions?: string;
    attachmentLabel?: string;
  }
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      posterId: poster.uid,
      posterName: poster.displayName.slice(0, 80),
      posterAvatar: poster.photoUrl || '',
      posterVerified: poster.verificationStatus === 'verified',
      posterType:
        poster.posterType && poster.posterType !== 'none' ? poster.posterType : 'student',
      posterRating: poster.averageRating || 0,
      title: input.title.trim().slice(0, 120),
      category: input.category.trim().slice(0, 60),
      description: input.description.trim().slice(0, 2000),
      responsibilities: (input.responsibilities || '').trim().slice(0, 1000),
      location: input.location.trim().slice(0, 120),
      budgetInr: Math.max(20, Math.min(50000, Math.round(input.budgetInr))),
      estimatedDuration: input.estimatedDuration.trim().slice(0, 50),
      durationMinutes: input.durationMinutes || 60,
      deadline: input.deadline.trim().slice(0, 60),
      workersRequired: Math.max(1, Math.min(50, Math.round(input.workersRequired))),
      skillsRequired: (input.skillsRequired || []).slice(0, 10),
      additionalInstructions: (input.additionalInstructions || '').trim().slice(0, 600),
      attachmentLabel: (input.attachmentLabel || '').trim().slice(0, 200),
      status: 'open',
      applicantCount: 0,
      isRemoved: false,
      isDemo: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'tasks');
  }
}

export async function applyToTask(
  task: CampusTask,
  applicant: UserPublic,
  message: string
): Promise<void> {
  if (applicant.verificationStatus !== 'verified') {
    throw new Error('Only verified university students can apply for gigs.');
  }
  if (applicant.isSuspended) {
    throw new Error('Your account is currently suspended.');
  }
  if (task.posterId === applicant.uid) {
    throw new Error('You cannot apply to your own posted task.');
  }
  if (task.status !== 'open') {
    throw new Error('This task is no longer accepting applications.');
  }

  const appId = `${task.id}_${applicant.uid}`;
  const appRef = doc(db, 'applications', appId);

  try {
    const existingSnap = await getDoc(appRef);
    if (existingSnap.exists()) {
      throw new Error('You have already applied to this gig.');
    }

    const batch = writeBatch(db);
    batch.set(appRef, {
      taskId: task.id,
      taskTitle: task.title.slice(0, 120),
      taskBudgetInr: task.budgetInr,
      taskLocation: task.location.slice(0, 120),
      posterId: task.posterId,
      applicantId: applicant.uid,
      applicantName: applicant.displayName.slice(0, 80),
      applicantAvatar: applicant.photoUrl || '',
      applicantCourse: [applicant.course, applicant.academicYear].filter(Boolean).join(' · ').slice(0, 80),
      applicantRating: applicant.averageRating || 0,
      applicantVerified: applicant.verificationStatus === 'verified',
      message: message.trim().slice(0, 600),
      status: 'pending',
      isDemo: Boolean(task.isDemo),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.update(doc(db, 'tasks', task.id), {
      applicantCount: (task.applicantCount || 0) + 1,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    await createNotification({
      userId: task.posterId,
      type: 'application',
      title: 'New gig application received',
      body: `${applicant.displayName} applied for "${task.title}"`,
      linkPath: `/tasks/${task.id}`,
      relatedTaskId: task.id,
      isDemo: task.isDemo,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already applied')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `applications/${appId}`);
  }
}

export async function withdrawApplication(
  application: GigApplication,
  task?: CampusTask
): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'applications', application.id), {
      status: 'withdrawn',
      updatedAt: serverTimestamp(),
    });

    if (task && task.status === 'open') {
      batch.update(doc(db, 'tasks', task.id), {
        applicantCount: Math.max(0, (task.applicantCount || 1) - 1),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `applications/${application.id}`);
  }
}

export async function updateApplicationStatus(
  application: GigApplication,
  newStatus: 'shortlisted' | 'accepted' | 'rejected',
  posterName: string
): Promise<void> {
  try {
    if (newStatus !== 'accepted') {
      await updateDoc(doc(db, 'applications', application.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      await createNotification({
        userId: application.applicantId,
        type: 'application',
        title: `Application ${newStatus}`,
        body: `Your application for "${application.taskTitle}" was marked as ${newStatus}.`,
        linkPath: `/tasks/${application.taskId}`,
        relatedTaskId: application.taskId,
        isDemo: application.isDemo,
      });
      return;
    }

    // Accepting an application: transition task open -> accepted and reject competing pending apps
    const batch = writeBatch(db);
    batch.update(doc(db, 'applications', application.id), {
      status: 'accepted',
      updatedAt: serverTimestamp(),
    });

    const otherAppsSnap = await getDocs(
      query(collection(db, 'applications'), where('taskId', '==', application.taskId))
    );
    otherAppsSnap.docs.forEach((d) => {
      if (d.id !== application.id) {
        const st = d.data().status;
        if (st === 'pending' || st === 'shortlisted') {
          batch.update(d.ref, {
            status: 'rejected',
            updatedAt: serverTimestamp(),
          });
        }
      }
    });

    batch.update(doc(db, 'tasks', application.taskId), {
      status: 'accepted',
      assignedWorkerId: application.applicantId,
      assignedWorkerName: application.applicantName,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    // Create task-scoped conversation after task assignedWorkerId is committed
    const convId = `conv_${application.taskId}`;
    await setDoc(doc(db, 'conversations', convId), {
      taskId: application.taskId,
      taskTitle: application.taskTitle.slice(0, 120),
      posterId: application.posterId,
      posterName: posterName.slice(0, 80),
      workerId: application.applicantId,
      workerName: application.applicantName.slice(0, 80),
      participantIds: [application.posterId, application.applicantId],
      lastMessage: 'Gig assigned! Use this chat to coordinate campus handoff.',
      isDemo: Boolean(application.isDemo),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await createNotification({
      userId: application.applicantId,
      type: 'acceptance',
      title: 'You got the gig!',
      body: `${posterName} accepted your application for "${application.taskTitle}".`,
      linkPath: `/tasks/${application.taskId}`,
      relatedTaskId: application.taskId,
      isDemo: application.isDemo,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `applications/${application.id}`);
  }
}

export async function startTask(task: CampusTask): Promise<void> {
  try {
    await updateDoc(doc(db, 'tasks', task.id), {
      status: 'in_progress',
      updatedAt: serverTimestamp(),
    });

    await createNotification({
      userId: task.posterId,
      type: 'completion',
      title: 'Gig started',
      body: `${task.assignedWorkerName || 'Assigned student'} started working on "${task.title}".`,
      linkPath: `/tasks/${task.id}`,
      relatedTaskId: task.id,
      isDemo: task.isDemo,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
  }
}

export async function submitTaskCompletion(
  task: CampusTask,
  proofNote: string,
  proofRef?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'tasks', task.id), {
      status: 'submitted',
      completionProofNote: proofNote.trim().slice(0, 600),
      completionProofRef: (proofRef || '').trim().slice(0, 300),
      updatedAt: serverTimestamp(),
    });

    await createNotification({
      userId: task.posterId,
      type: 'completion',
      title: 'Completion submitted for review',
      body: `${task.assignedWorkerName || 'The gig worker'} submitted completion proof for "${task.title}".`,
      linkPath: `/tasks/${task.id}`,
      relatedTaskId: task.id,
      isDemo: task.isDemo,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
  }
}

export async function confirmTaskCompletion(
  task: CampusTask,
  settings: AdminSettings
): Promise<void> {
  if (!task.assignedWorkerId) {
    throw new Error('Cannot complete a task without an assigned worker.');
  }

  const txnId = `txn_${task.id}`;
  const txnRef = doc(db, 'transactions', txnId);

  try {
    const existingTxn = await getDoc(txnRef);
    const batch = writeBatch(db);

    batch.update(doc(db, 'tasks', task.id), {
      status: 'completed',
      updatedAt: serverTimestamp(),
    });

    if (!existingTxn.exists()) {
      const breakdown = calculateCommissionBreakdown(
        task.budgetInr,
        settings.commissionRatePct,
        settings.variableCostInr
      );
      batch.set(txnRef, {
        taskId: task.id,
        taskTitle: task.title.slice(0, 120),
        taskCategory: task.category.slice(0, 60),
        posterId: task.posterId,
        posterName: task.posterName.slice(0, 80),
        workerId: task.assignedWorkerId,
        workerName: (task.assignedWorkerName || 'Student Worker').slice(0, 80),
        ...breakdown,
        paymentMethod: task.isDemo ? 'demo_simulated' : 'upi_manual',
        upiReference: '',
        status: 'pending_confirmation',
        isDemo: Boolean(task.isDemo),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();

    await createNotification({
      userId: task.assignedWorkerId,
      type: 'completion',
      title: 'Task completion confirmed!',
      body: `${task.posterName} confirmed completion of "${task.title}". Payment record is now pending release.`,
      linkPath: `/earnings`,
      relatedTaskId: task.id,
      isDemo: task.isDemo,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `tasks/${task.id}`);
  }
}

export async function confirmPaymentRelease(
  txn: GigTransaction,
  paymentMethod: PaymentMethod,
  upiReference: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'transactions', txn.id), {
      status: 'completed',
      paymentMethod,
      upiReference: upiReference.trim().slice(0, 80),
      updatedAt: serverTimestamp(),
    });

    await createNotification({
      userId: txn.workerId,
      type: 'payment',
      title: `Payment confirmed (₹${txn.workerPayoutInr})`,
      body: `Payout for "${txn.taskTitle}" was confirmed via ${paymentMethod === 'demo_simulated' ? 'DEMO simulation' : 'UPI reference ' + upiReference}.`,
      linkPath: `/earnings`,
      relatedTaskId: txn.taskId,
      isDemo: txn.isDemo,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `transactions/${txn.id}`);
  }
}

export async function cancelTask(task: CampusTask, reason: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'tasks', task.id), {
      status: 'cancelled',
      cancellationReason: reason.trim().slice(0, 300),
      updatedAt: serverTimestamp(),
    });

    if (task.assignedWorkerId) {
      await createNotification({
        userId: task.assignedWorkerId,
        type: 'dispute',
        title: 'Task cancelled by poster',
        body: `"${task.title}" was cancelled. Reason: ${reason}`,
        linkPath: `/gigs`,
        relatedTaskId: task.id,
        isDemo: task.isDemo,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
  }
}

export async function raiseDispute(params: {
  task?: CampusTask;
  reporterId: string;
  reporterName: string;
  reportedUserId?: string;
  type: DisputeType;
  reason: string;
  details: string;
}): Promise<void> {
  try {
    const batch = writeBatch(db);
    const disputeRef = doc(collection(db, 'disputes'));

    batch.set(disputeRef, {
      taskId: params.task?.id || '',
      taskTitle: params.task?.title?.slice(0, 120) || '',
      reporterId: params.reporterId,
      reporterName: params.reporterName.slice(0, 80),
      reportedUserId: params.reportedUserId || '',
      type: params.type,
      reason: params.reason.trim().slice(0, 120),
      details: params.details.trim().slice(0, 1000),
      status: 'open',
      isDemo: Boolean(params.task?.isDemo),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (
      params.task &&
      ['accepted', 'in_progress', 'submitted'].includes(params.task.status) &&
      (params.type === 'payment_dispute' || params.type === 'completion_dispute')
    ) {
      batch.update(doc(db, 'tasks', params.task.id), {
        status: 'disputed',
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'disputes');
  }
}

export async function submitReview(params: {
  task: CampusTask;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: 'student' | 'poster';
  revieweeId: string;
  revieweeName: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const revId = `rev_${params.task.id}_${params.reviewerId}`;
  const revRef = doc(db, 'reviews', revId);

  try {
    const existing = await getDoc(revRef);
    if (existing.exists()) {
      throw new Error('You have already submitted a review for this gig.');
    }

    await setDoc(revRef, {
      taskId: params.task.id,
      taskTitle: params.task.title.slice(0, 120),
      reviewerId: params.reviewerId,
      reviewerName: params.reviewerName.slice(0, 80),
      reviewerRole: params.reviewerRole,
      revieweeId: params.revieweeId,
      revieweeName: params.revieweeName.slice(0, 80),
      rating: Math.max(1, Math.min(5, Math.round(params.rating))),
      comment: params.comment.trim().slice(0, 500),
      isDemo: Boolean(params.task.isDemo),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already submitted')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, `reviews/${revId}`);
  }
}

export async function sendChatMessage(
  conversation: Conversation,
  senderId: string,
  senderName: string,
  text: string
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  try {
    const batch = writeBatch(db);
    const msgRef = doc(collection(db, 'conversations', conversation.id, 'messages'));
    batch.set(msgRef, {
      conversationId: conversation.id,
      participantIds: conversation.participantIds,
      senderId,
      senderName: senderName.slice(0, 80),
      text: trimmed.slice(0, 1000),
      isDemo: Boolean(conversation.isDemo),
      createdAt: serverTimestamp(),
    });

    batch.update(doc(db, 'conversations', conversation.id), {
      lastMessage: trimmed.slice(0, 300),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    const recipientId = conversation.participantIds.find((id) => id !== senderId);
    if (recipientId) {
      await createNotification({
        userId: recipientId,
        type: 'message',
        title: `Message from ${senderName}`,
        body: trimmed.slice(0, 140),
        linkPath: `/messages`,
        relatedTaskId: conversation.taskId,
        isDemo: conversation.isDemo,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `conversations/${conversation.id}/messages`);
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
  }
}

// --- Admin Moderation & Settings ---

export async function setUserVerification(
  userId: string,
  status: VerificationStatus,
  note?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users_public', userId), {
      verificationStatus: status,
      updatedAt: serverTimestamp(),
    });

    if (note) {
      const privRef = doc(db, 'users_private', userId);
      const privSnap = await getDoc(privRef);
      if (privSnap.exists()) {
        await updateDoc(privRef, {
          verificationNote: note.slice(0, 300),
          updatedAt: serverTimestamp(),
        });
      }
    }

    await createNotification({
      userId,
      type: 'verification',
      title:
        status === 'verified'
          ? 'University Verification Approved'
          : 'Verification Status Updated',
      body:
        status === 'verified'
          ? 'Your DGU student profile is now verified. You can apply for campus gigs.'
          : `Your verification status was updated to ${status}. ${note || ''}`,
      linkPath: '/profile',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users_public/${userId}`);
  }
}

export async function setUserSuspension(
  userId: string,
  isSuspended: boolean,
  reason?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users_public', userId), {
      isSuspended,
      updatedAt: serverTimestamp(),
    });

    if (reason !== undefined) {
      const privRef = doc(db, 'users_private', userId);
      const privSnap = await getDoc(privRef);
      if (privSnap.exists()) {
        await updateDoc(privRef, {
          suspensionReason: reason.slice(0, 300),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users_public/${userId}`);
  }
}

export async function moderateTaskRemoval(taskId: string, isRemoved: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      isRemoved,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
  }
}

export async function resolveDispute(
  dispute: Dispute,
  status: DisputeStatus,
  resolution: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'disputes', dispute.id), {
      status,
      adminResolution: resolution.trim().slice(0, 500),
      updatedAt: serverTimestamp(),
    });

    await createNotification({
      userId: dispute.reporterId,
      type: 'dispute',
      title: `Report / Dispute ${status}`,
      body: resolution.slice(0, 200),
      linkPath: dispute.taskId ? `/tasks/${dispute.taskId}` : '/messages',
      relatedTaskId: dispute.taskId,
      isDemo: dispute.isDemo,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `disputes/${dispute.id}`);
  }
}

export async function updateAdminSettings(
  adminUid: string,
  settings: Omit<AdminSettings, 'updatedAt' | 'updatedBy'>
): Promise<void> {
  try {
    await setDoc(doc(db, 'admin_settings', 'platform'), {
      ...settings,
      updatedBy: adminUid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'admin_settings/platform');
  }
}

export async function grantAdminRole(targetUid: string, email: string, grantedBy: string) {
  try {
    await setDoc(doc(db, 'admins', targetUid), {
      uid: targetUid,
      email,
      grantedBy,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `admins/${targetUid}`);
  }
}
