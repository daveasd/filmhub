import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import StaticPageLayout from '../components/StaticPageLayout';
import AdminGuard from '../components/admin/AdminGuard';
import AdminTabs from '../components/admin/AdminTabs';
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminReports from '../components/admin/AdminReports';
import AdminModeration from '../components/admin/AdminModeration';
import AdminAnalytics from '../components/admin/AdminAnalytics';

export default function AdminDashboardPage({ onSignInClick }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <AdminGuard onSignInClick={onSignInClick}>
      <StaticPageLayout
        title="Admin Dashboard"
        subtitle="Monitor users, reports, feedback, and platform activity."
        icon={Shield}
      >
        <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'overview' && <AdminOverview />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'reports' && <AdminReports />}
        {activeTab === 'moderation' && <AdminModeration />}
        {activeTab === 'analytics' && <AdminAnalytics />}
      </StaticPageLayout>
    </AdminGuard>
  );
}
