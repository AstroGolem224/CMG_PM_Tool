import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast, isWithinInterval, addDays } from 'date-fns';
import type { Priority } from '@/types';

/** Merge Tailwind classes with conflict resolution */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format an ISO date string for display */
export function formatDate(date: string): string {
  return format(new Date(date), 'MMM d, yyyy');
}

/** Format an ISO date string as relative time (e.g., "2 hours ago") */
export function formatRelativeTime(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/** Check if a deadline is overdue */
export function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return isPast(new Date(deadline));
}

/** Check if a deadline is within the next N days */
export function isUpcoming(deadline: string | null, days: number = 3): boolean {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  return isWithinInterval(deadlineDate, {
    start: new Date(),
    end: addDays(new Date(), days),
  });
}

/** Priority color map for badges and indicators */
export const priorityColors: Record<Priority, { bg: string; text: string; dot: string }> = {
  low: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400' },
  medium: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  high: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
  urgent: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
};

/** Priority labels for display */
export const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

/** Preset color palette for projects and labels */
export const colorPalette = [
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#f97316', // orange
  '#14b8a6', // teal
];
