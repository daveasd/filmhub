import React from 'react';

export default function StaticPageLayout({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 min-h-screen bg-dark-bg text-left pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
          {Icon && <Icon className="h-7 w-7 text-brand-gold shrink-0" />}
          {title}
        </h1>
        {subtitle && <p className="text-gray-400 text-sm mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

export function StaticCard({ children, className = '' }) {
  return (
    <div
      className={`bg-dark-card border border-dark-border rounded-xl p-5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function StaticSectionTitle({ children }) {
  return (
    <h2 className="text-lg font-bold text-white mb-3 border-l-4 border-brand-gold pl-3">
      {children}
    </h2>
  );
}
