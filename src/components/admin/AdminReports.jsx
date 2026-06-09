import React, { useEffect, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { StaticCard } from '../StaticPageLayout';
import { useToast } from '../../contexts/ToastContext';
import { fetchReports, updateReportStatus, deleteReport } from '../../services/adminService';
import AdminConfirmModal from './AdminConfirmModal';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Pending (open)' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'resolved', label: 'Resolved' },
];

const STATUS_BADGE = {
  open: 'bg-red-500/20 text-red-400',
  reviewing: 'bg-yellow-500/20 text-yellow-400',
  dismissed: 'bg-gray-500/20 text-gray-400',
  resolved: 'bg-green-500/20 text-green-400',
};

function statusLabel(status) {
  const match = STATUS_OPTIONS.find((o) => o.value === status);
  return match?.label ?? status;
}

export default function AdminReports() {
  const { toast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [notesDraft, setNotesDraft] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await fetchReports({ status: statusFilter });
    if (fetchError) {
      setError(fetchError);
      setReports([]);
    } else {
      setReports(data);
      const drafts = {};
      data.forEach((r) => {
        drafts[r.id] = r.admin_notes ?? '';
      });
      setNotesDraft(drafts);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const handleStatusUpdate = async (id, status) => {
    const notes = notesDraft[id] ?? '';
    const { error: updateError } = await updateReportStatus(id, status, notes || null);
    if (updateError) {
      toast(`Failed to update report: ${updateError}`, 'error');
      return;
    }
    toast('Report updated', 'success');
    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, admin_notes: notes || null } : r,
      ),
    );
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error: deleteError } = await deleteReport(deleteTarget.id);
    setDeleting(false);

    if (deleteError) {
      toast(`Failed to delete report: ${deleteError}`, 'error');
      return;
    }

    toast('Report deleted', 'success');
    setReports((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="rounded-lg bg-dark-bg border border-dark-border text-white px-4 py-2.5 min-h-[44px]"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value || 'all'} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading reports…
        </div>
      ) : error ? (
        <StaticCard>
          <p className="text-red-400 text-sm text-center">{error}</p>
        </StaticCard>
      ) : reports.length === 0 ? (
        <StaticCard>
          <p className="text-gray-400 text-center text-sm">No reports found.</p>
        </StaticCard>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <StaticCard key={report.id} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-white">{report.category ?? 'Report'}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[report.status] ?? 'bg-gray-500/20 text-gray-400'}`}
                >
                  {statusLabel(report.status)}
                </span>
              </div>
              <p className="text-sm text-gray-300 break-words">{report.message}</p>
              <div className="text-xs text-gray-500">
                Reporter: {report.username || report.email || 'Anonymous'} ·{' '}
                {new Date(report.created_at).toLocaleString()}
              </div>
              <textarea
                value={notesDraft[report.id] ?? ''}
                onChange={(e) =>
                  setNotesDraft((prev) => ({ ...prev, [report.id]: e.target.value }))
                }
                placeholder="Admin notes (optional)"
                rows={2}
                className="w-full rounded-lg bg-dark-bg border border-dark-border text-white text-sm px-3 py-2 resize-y focus:outline-none focus:border-brand-gold"
              />
              <div className="flex flex-wrap gap-2">
                <select
                  value={report.status}
                  onChange={(e) => handleStatusUpdate(report.id, e.target.value)}
                  className="rounded-lg bg-dark-bg border border-dark-border text-white px-3 py-2 text-sm min-h-[40px]"
                >
                  {STATUS_OPTIONS.filter((o) => o.value).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(report)}
                  className="text-red-400 hover:text-red-300 p-2 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                  title="Delete report"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </StaticCard>
          ))}
        </div>
      )}

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete report?"
        message="Permanently delete this report? This cannot be undone."
        confirmLabel="Delete report"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
