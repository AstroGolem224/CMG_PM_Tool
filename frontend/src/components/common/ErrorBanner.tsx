import { AlertTriangle } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
}

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="surface-subtle flex items-start gap-3 px-4 py-3 text-sm text-[var(--text-primary)]"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--neon-red)]" />
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--neon-red)]">
          request failed
        </p>
        <p className="mt-1 text-[var(--text-secondary)]">{message}</p>
      </div>
    </div>
  );
}
