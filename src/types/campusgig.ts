import { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'poster' | 'admin';
export type PosterType = 'student' | 'department' | 'club' | 'business' | 'none';
export type HostelStatus = 'hostel_resident' | 'day_scholar' | 'campus_entity';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type TaskStatus =
  | 'open'
  | 'accepted'
  | 'in_progress'
  | 'submitted'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type ApplicationStatus =
  | 'pending'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export type PaymentMethod = 'upi_manual' | 'demo_simulated' | 'razorpay_ready';
export type TransactionStatus = 'pending_confirmation' | 'completed' | 'disputed' | 'refunded';

export type NotificationType =
  | 'application'
  | 'acceptance'
  | 'completion'
  | 'payment'
  | 'verification'
  | 'dispute'
  | 'message';

export type DisputeType =
  | 'task_report'
  | 'user_report'
  | 'payment_dispute'
  | 'completion_dispute';

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export interface UserPublic {
  uid: string;
  displayName: string;
  photoUrl?: string;
  role: UserRole;
  posterType?: PosterType;
  university?: string;
  course?: string;
  department?: string;
  academicYear?: string;
  hostelStatus?: HostelStatus;
  skills?: string[];
  bio?: string;
  verificationStatus: VerificationStatus;
  isSuspended: boolean;
  completedGigsCount: number;
  postedGigsCount?: number;
  averageRating: number;
  ratingsCount: number;
  isDemo: boolean;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface UserPrivate {
  uid: string;
  universityEmail: string;
  personalEmail?: string;
  studentId: string;
  mobileNumber: string;
  emailVerified: boolean;
  idVerificationMethod?: 'university_email' | 'manual_id_review' | 'none';
  verificationNote?: string;
  suspensionReason?: string;
  upiId?: string;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface CampusTask {
  id: string;
  posterId: string;
  posterName: string;
  posterAvatar?: string;
  posterVerified: boolean;
  posterType: 'student' | 'department' | 'club' | 'business';
  posterRating?: number;
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
  status: TaskStatus;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  applicantCount: number;
  completionProofNote?: string;
  completionProofRef?: string;
  cancellationReason?: string;
  isRemoved: boolean;
  isDemo: boolean;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface GigApplication {
  id: string;
  taskId: string;
  taskTitle: string;
  taskBudgetInr: number;
  taskLocation?: string;
  posterId: string;
  applicantId: string;
  applicantName: string;
  applicantAvatar?: string;
  applicantCourse?: string;
  applicantRating?: number;
  applicantVerified: boolean;
  message: string;
  status: ApplicationStatus;
  isDemo: boolean;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface GigTransaction {
  id: string;
  taskId: string;
  taskTitle: string;
  taskCategory?: string;
  posterId: string;
  posterName?: string;
  workerId: string;
  workerName?: string;
  grossAmountInr: number;
  commissionRatePct: number;
  platformCommissionInr: number;
  workerPayoutInr: number;
  variableCostInr: number;
  netContributionInr: number;
  paymentMethod: PaymentMethod;
  upiReference?: string;
  status: TransactionStatus;
  isDemo: boolean;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkPath?: string;
  relatedTaskId?: string;
  isRead: boolean;
  isDemo: boolean;
  createdAt?: Timestamp | Date | null;
}

export interface Conversation {
  id: string;
  taskId: string;
  taskTitle: string;
  posterId: string;
  posterName?: string;
  workerId: string;
  workerName?: string;
  participantIds: string[];
  lastMessage?: string;
  isDemo: boolean;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  participantIds: string[];
  senderId: string;
  senderName: string;
  text: string;
  isDemo: boolean;
  createdAt?: Timestamp | Date | null;
}

export interface Review {
  id: string;
  taskId: string;
  taskTitle?: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: 'student' | 'poster';
  revieweeId: string;
  revieweeName?: string;
  rating: number;
  comment: string;
  isDemo: boolean;
  createdAt?: Timestamp | Date | null;
}

export interface Dispute {
  id: string;
  taskId?: string;
  taskTitle?: string;
  reporterId: string;
  reporterName: string;
  reportedUserId?: string;
  type: DisputeType;
  reason: string;
  details: string;
  status: DisputeStatus;
  adminResolution?: string;
  isDemo: boolean;
  createdAt?: Timestamp | Date | null;
  updatedAt?: Timestamp | Date | null;
}

export interface AdminSettings {
  commissionRatePct: number;
  variableCostInr: number;
  monthlyFixedCostInr: number;
  categories: string[];
  demoModeBanner: boolean;
  updatedBy?: string;
  updatedAt?: Timestamp | Date | null;
}

export const GIG_CATEGORIES = [
  'Event Management',
  'Delivery and Pickup',
  'Printing and Documentation',
  'Academic Assistance',
  'Tutoring',
  'Research Assistance',
  'Photography and Videography',
  'Graphic Design',
  'Technical Support',
  'Library Assistance',
  'Campus Administration',
  'Other Micro-Tasks',
] as const;

export const DGU_CAMPUS_LOCATIONS = [
  'DGU Main Academic Block A',
  'DGU Engineering & Tech Block B',
  'DGU Central Library',
  'DGU Main Auditorium',
  'DGU Student Cafeteria & Food Court',
  'DGU Boys Hostel Block H1',
  'DGU Girls Hostel Block H2',
  'DGU Admin & Admissions Office',
  'DGU Sports Complex & Amphitheatre',
  'DGU Main Gate & Parcel Desk',
  'Selaqui Student Housing Cluster',
] as const;

export const VENTURE_ASSUMPTIONS = {
  avgTaskValueInr: 200,
  commissionRangePct: '10–15%',
  referenceCommissionInr: 30,
  variableCostPerTxnInr: 5,
  contributionMarginPerTxnInr: 25,
  monthlyFixedOperatingCostInr: 8000,
  baseMonthlyCustomers: 300,
  purchasesPerCustomerPerMonth: 3,
  baseMonthlyTransactions: 900,
  baseMonthlyGrossRevenueInr: 27000,
  baseMonthlyContributionInr: 22500,
  baseMonthlyOperatingSurplusInr: 14500,
  breakEvenTransactions: 320,
  breakEvenCustomers: 107,
} as const;

export const PILOT_TARGETS = {
  targetCompletedGigs14Days: 30,
  targetSatisfactionPct: 85,
  targetMaxDisputes: 0,
} as const;

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  commissionRatePct: 15,
  variableCostInr: 5,
  monthlyFixedCostInr: 8000,
  categories: [...GIG_CATEGORIES],
  demoModeBanner: true,
};

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function toJsDate(value: Timestamp | Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  return null;
}

export function formatIst(value: Timestamp | Date | string | null | undefined): string {
  const date = toJsDate(value);
  if (!date) return 'Just now';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date) + ' IST';
}

export function calculateCommissionBreakdown(
  grossAmountInr: number,
  commissionRatePct: number,
  variableCostInr: number
) {
  const platformCommissionInr = Math.round((grossAmountInr * commissionRatePct) / 100);
  const workerPayoutInr = Math.max(0, grossAmountInr - platformCommissionInr);
  const netContributionInr = platformCommissionInr - variableCostInr;
  return {
    grossAmountInr,
    commissionRatePct,
    platformCommissionInr,
    workerPayoutInr,
    variableCostInr,
    netContributionInr,
  };
}
