import React, { useCallback, useEffect, useState } from 'react';
import { Search, Loader2, Trash2 } from 'lucide-react';
import { StaticCard } from '../StaticPageLayout';
import { useToast } from '../../contexts/ToastContext';
import { fetchUsers, updateUserRole, deleteUser } from '../../services/adminService';
import AdminConfirmModal from './AdminConfirmModal';

const ROLES = ['', 'user', 'admin'];

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await fetchUsers({
      search: search.trim(),
      role: roleFilter,
    });
    if (fetchError) {
      setError(fetchError);
      setUsers([]);
    } else {
      setUsers(data);
    }
    setLoading(false);
  }, [search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const handleRoleChangeRequest = (user, newRole) => {
    if (user.role === newRole) return;
    setPendingRoleChange({ user, newRole });
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    setSaving(true);
    const { user, newRole } = pendingRoleChange;
    const { error: updateError } = await updateUserRole(user.id, newRole);
    setSaving(false);

    if (updateError) {
      toast(`Failed to update role: ${updateError}`, 'error');
      return;
    }

    toast(`@${user.username} is now ${newRole}`, 'success');
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
    );
    setPendingRoleChange(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error: deleteError } = await deleteUser(deleteTarget.id);
    setDeleting(false);

    if (deleteError) {
      toast(`Failed to delete user: ${deleteError}`, 'error');
      return;
    }

    toast(`@${deleteTarget.username} deleted`, 'success');
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username…"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-bg border border-dark-border text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg bg-dark-bg border border-dark-border text-white px-4 py-2.5 min-h-[44px]"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading users…
        </div>
      ) : error ? (
        <StaticCard>
          <p className="text-red-400 text-sm text-center">{error}</p>
        </StaticCard>
      ) : users.length === 0 ? (
        <StaticCard>
          <p className="text-gray-400 text-center text-sm">No users match your filters.</p>
        </StaticCard>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <StaticCard
              key={u.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">@{u.username}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Joined {new Date(u.created_at).toLocaleDateString()}
                  {u.is_public ? ' · Public profile' : ' · Private profile'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={u.role ?? 'user'}
                  onChange={(e) => handleRoleChangeRequest(u, e.target.value)}
                  className="rounded-lg bg-dark-bg border border-dark-border text-white px-3 py-2 text-sm min-h-[40px]"
                >
                  {ROLES.filter(Boolean).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(u)}
                  className="text-red-400 hover:text-red-300 p-2 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                  title="Delete user"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </StaticCard>
          ))}
        </div>
      )}

      <AdminConfirmModal
        open={Boolean(pendingRoleChange)}
        title="Change user role?"
        message={
          pendingRoleChange
            ? `Change @${pendingRoleChange.user.username} from "${pendingRoleChange.user.role ?? 'user'}" to "${pendingRoleChange.newRole}"?`
            : ''
        }
        confirmLabel="Update role"
        onConfirm={confirmRoleChange}
        onCancel={() => setPendingRoleChange(null)}
        loading={saving}
        danger={pendingRoleChange?.newRole !== 'admin'}
      />

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete user?"
        message={
          deleteTarget
            ? `Permanently delete @${deleteTarget.username}'s profile and all their content? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete user"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
