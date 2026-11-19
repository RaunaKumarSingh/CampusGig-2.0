import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowUpRight, Users } from 'lucide-react';
import { CampusTask, formatInr } from '../types/campusgig';
import { TaskStatusLabel } from './StatusIndicator';
import { ImageWithFallback } from './ImageWithFallback';

interface TaskCardProps {
  task: CampusTask;
  alreadyApplied?: boolean;
  isOwnTask?: boolean;
}

export function TaskCard({ task, alreadyApplied, isOwnTask }: TaskCardProps) {
  return (
    <article className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="text-violet-700 dark:text-violet-400 font-semibold">{task.category}</span>
            {task.isDemo && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  DEMO
                </span>
              </>
            )}
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display tabular-nums shrink-0">
            {formatInr(task.budgetInr)}
          </span>
        </div>

        <Link
          to={`/tasks/${task.id}`}
          className="mt-2 block text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors leading-snug"
        >
          {task.title}
        </Link>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {task.description}
        </p>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate max-w-[180px]">{task.location}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{task.estimatedDuration}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">Due {task.deadline}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <ImageWithFallback
            src={task.posterAvatar}
            alt={task.posterName}
            className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              <span className="truncate">{task.posterName}</span>
              {task.posterVerified && (
                <ShieldCheck
                  className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                  aria-label="Verified Poster"
                />
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3" />
                {task.applicantCount} {task.applicantCount === 1 ? 'applicant' : 'applicants'}
              </span>
              {task.status !== 'open' && (
                <>
                  <span aria-hidden="true">·</span>
                  <TaskStatusLabel status={task.status} />
                </>
              )}
            </div>
          </div>
        </div>

        <Link
          to={`/tasks/${task.id}`}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 min-h-[36px] transition-colors ${
            alreadyApplied
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
              : isOwnTask
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              : 'bg-violet-700 dark:bg-violet-600 text-white hover:bg-violet-800 dark:hover:bg-violet-500'
          }`}
        >
          {alreadyApplied ? 'Applied' : isOwnTask ? 'Manage' : 'Apply Now'}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
}
