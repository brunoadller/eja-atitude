import { ReactNode } from 'react';
import { STATUS_LABEL } from '../types';

export default function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="text-xs uppercase tracking-wider font-medium text-slate-500 mb-2">{label}</div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

export function Empty({ icon, title, desc }: { icon: ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-slate-500">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="font-semibold text-slate-900 mb-1">{title}</div>
      {desc && <div className="text-sm">{desc}</div>}
    </div>
  );
}

/** Recebe o código do status (pending | active | completed | locked). */
export function StatusPill({ status }: { status?: string }) {
  const cls: Record<string, string> = {
    pending: 'pill-warning',
    active: 'pill-success',
    completed: 'pill-accent',
    locked: 'pill-danger',
  };
  return <span className={cls[status || ''] || 'pill-muted'}>{STATUS_LABEL[status as keyof typeof STATUS_LABEL] || status || '—'}</span>;
}
