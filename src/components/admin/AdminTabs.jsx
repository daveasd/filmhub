import React from 'react';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'reports', label: 'Reports' },
  { id: 'moderation', label: 'Moderation' },
  { id: 'analytics', label: 'Analytics' },
];

export default function AdminTabs({ activeTab, onTabChange }) {
  return (
    <div className="flex flex-wrap gap-2 pb-4 mb-2 border-b border-dark-border">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors min-h-[40px] ${
            activeTab === tab.id
              ? 'bg-brand-gold text-black'
              : 'bg-dark-card text-gray-400 hover:text-white border border-dark-border'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
