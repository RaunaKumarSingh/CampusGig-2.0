import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  PlayCircle,
  FileCheck2,
  XCircle,
} from 'lucide-react';
import {
  ApplicationStatus,
  TaskStatus,
  TransactionStatus,
  VerificationStatus,
} from '../types/campusgig';

export function VerificationText({ status }: { status: VerificationStatus }) {
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        Verified DGU Student
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        Verification Pending
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 whitespace-nowrap">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
        Verification Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      Unverified Account
    </span>
  );
}

export function TaskStatusLabel({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, { label: string; color: string; Icon: typeof Clock }> = {
    open: {
      label: 'Open',
      color: 'text-emerald-700 dark:text-emerald-400',
      Icon: CheckCircle2,
    },
    accepted: {
      label: 'Accepted',
      color: 'text-violet-700 dark:text-violet-400',
      Icon: CheckCircle2,
    },
    in_progress: {
      label: 'In Progress',
      color: 'text-blue-700 dark:text-blue-400',
      Icon: PlayCircle,
    },
    submitted: {
      label: 'Submitted for Review',
      color: 'text-amber-700 dark:text-amber-400',
      Icon: FileCheck2,
    },
    completed: {
      label: 'Completed',
      color: 'text-emerald-800 dark:text-emerald-400',
      Icon: CheckCircle2,
    },
    cancelled: {
      label: 'Cancelled',
      color: 'text-slate-500 dark:text-slate-400',
      Icon: XCircle,
    },
    disputed: {
      label: 'Disputed',
      color: 'text-red-700 dark:text-red-400',
      Icon: AlertCircle,
    },
  };
  const item = map[status] || map.open;
  const Icon = item.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${item.color}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {item.label}
    </span>
  );
}

export function ApplicationStatusLabel({ status }: { status: ApplicationStatus }) {
  const map: Record<ApplicationStatus, { label: string; color: string; Icon: typeof Clock }> = {
    pending: {
      label: 'Pending Review',
      color: 'text-amber-700 dark:text-amber-400',
      Icon: Clock,
    },
    shortlisted: {
      label: 'Shortlisted',
      color: 'text-violet-700 dark:text-violet-400',
      Icon: CheckCircle2,
    },
    accepted: {
      label: 'Accepted',
      color: 'text-emerald-700 dark:text-emerald-400',
      Icon: CheckCircle2,
    },
    rejected: {
      label: 'Not Selected',
      color: 'text-slate-500 dark:text-slate-400',
      Icon: XCircle,
    },
    withdrawn: {
      label: 'Withdrawn',
      color: 'text-slate-500 dark:text-slate-400',
      Icon: XCircle,
    },
  };
  const item = map[status] || map.pending;
  const Icon = item.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${item.color}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {item.label}
    </span>
  );
}

export function TransactionStatusLabel({ status }: { status: TransactionStatus }) {
  const map: Record<TransactionStatus, { label: string; color: string; Icon: typeof Clock }> = {
    pending_confirmation: {
      label: 'Pending Confirmation',
      color: 'text-amber-700 dark:text-amber-400',
      Icon: Clock,
    },
    completed: {
      label: 'Paid & Confirmed',
      color: 'text-emerald-700 dark:text-emerald-400',
      Icon: CheckCircle2,
    },
    disputed: {
      label: 'Disputed',
      color: 'text-red-700 dark:text-red-400',
      Icon: AlertCircle,
    },
    refunded: {
      label: 'Refunded',
      color: 'text-slate-600 dark:text-slate-400',
      Icon: XCircle,
    },
  };
  const item = map[status] || map.pending_confirmation;
  const Icon = item.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${item.color}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {item.label}
    </span>
  );
}
