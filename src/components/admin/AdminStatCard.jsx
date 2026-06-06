import React from 'react';

export default function AdminStatCard({ title, value, icon: Icon, accent = 'gold' }) {
  const accentClass =
    accent === 'red'
      ? 'text-red-400'
      : accent === 'blue'
        ? 'text-blue-400'
        : 'text-brand-gold';

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col items-center justify-center text-center min-w-0">
      {Icon && <Icon className={`w-6 h-6 ${accentClass} mb-2 shrink-0`} />}
      <div className="text-2xl font-bold text-white mb-1 tabular-nums">{value ?? '—'}</div>
      <div className="text-xs text-gray-400 font-medium uppercase tracking-wider leading-tight">
        {title}
      </div>
    </div>
  );
}
