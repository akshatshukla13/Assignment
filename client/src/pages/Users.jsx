import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';

const roleColors = {
  Admin: 'bg-purple-100 text-purple-700',
  Sales: 'bg-blue-100 text-blue-700',
  Warehouse: 'bg-amber-100 text-amber-700',
  Accounts: 'bg-green-100 text-green-700'
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const onSubmit = async (data) => {
    try {
      await api.post('/users', data);
      addToast(`User "${data.username}" created successfully!`);
      setShowModal(false);
      reset();
      fetchUsers();
    } catch (e) {
      addToast(e.response?.data?.message || 'Error creating user', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${deleteTarget._id}`);
      addToast(`User "${deleteTarget.username}" deleted.`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (e) {
      addToast(e.response?.data?.message || 'Error deleting user', 'error');
      setDeleteTarget(null);
    }
  };

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="card text-center p-16">
        <p className="text-2xl mb-2">🔒</p>
        <p className="font-semibold text-slate-700">Access Restricted</p>
        <p className="text-sm text-slate-500 mt-1">Only Admins can manage system users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-500">Manage system users and their roles.</p>
        </div>
        <button onClick={() => { reset(); setShowModal(true); }} className="btn-primary">
          <Plus size={16} className="mr-2" /> Add User
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-48"><span className="app-loader-spinner app-loader-spinner--md" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              {['Username', 'Role', 'Created', 'Actions'].map(h => (
                <th key={h} className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-semibold text-slate-900">{u.username}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleColors[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    {u.username !== 'admin' && (
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="text-red-400 hover:text-red-600 p-1 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="4" className="p-10 text-center text-slate-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="app-dialog-panel w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Create New User</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Username *</label>
                <input {...register('username', { required: true })} className="input" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Password *</label>
                <input type="password" {...register('password', { required: true })} className="input" placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Role *</label>
                <select {...register('role', { required: true })} className="select">
                  <option value="Sales">Sales</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Accounts">Accounts</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="pt-2 p-3 bg-slate-50 rounded-md text-xs text-slate-500 space-y-1 border border-slate-200">
                <p className="font-semibold text-slate-600 mb-1">Role Permissions:</p>
                <p>• <strong>Admin</strong> — Full access to all modules</p>
                <p>• <strong>Sales</strong> — Customers & Challans only</p>
                <p>• <strong>Warehouse</strong> — Products & Stock management</p>
                <p>• <strong>Accounts</strong> — Read-only access</p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowModal(false)} className="btn-muted">Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <span className="app-loader-spinner" /> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.username}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmClass="btn-primary bg-red-600 hover:bg-red-700"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
