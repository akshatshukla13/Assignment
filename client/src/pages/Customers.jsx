import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Plus, Search, Edit2, Eye, X, Clock, ChevronLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../utils/permissions';

const statusColor = {
  Active: 'bg-green-100 text-green-700',
  Lead: 'bg-blue-100 text-blue-700',
  Inactive: 'bg-slate-100 text-slate-600'
};

function CustomerForm({ initial, onSave, onClose }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: initial || { type: 'Retail', status: 'Lead' }
  });
  const { addToast } = useToast();

  const onSubmit = async (data) => {
    try {
      if (initial?._id) await api.put(`/customers/${initial._id}`, data);
      else await api.post('/customers', data);
      addToast(initial?._id ? 'Customer updated!' : 'Customer added!');
      onSave();
    } catch (e) {
      addToast(e.response?.data?.message || 'Error saving customer', 'error');
    }
  };

  // format date for input
  const fmtDate = initial?.followUpDate ? initial.followUpDate.split('T')[0] : '';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="app-dialog-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{initial?._id ? 'Edit Customer' : 'Add Customer'}</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Name *</label>
              <input {...register('name', { required: true })} className="input" /></div>
            <div><label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Mobile *</label>
              <input {...register('mobile', { required: true })} className="input" /></div>
            <div><label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Email</label>
              <input type="email" {...register('email')} className="input" /></div>
            <div><label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Business Name</label>
              <input {...register('businessName')} className="input" /></div>
            <div><label className="block text-xs font-semibold uppercase text-slate-500 mb-1">GST Number</label>
              <input {...register('gstNumber')} className="input" /></div>
            <div><label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Customer Type</label>
              <select {...register('type')} className="select">
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Distributor">Distributor</option>
              </select></div>
            <div><label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Status</label>
              <select {...register('status')} className="select">
                <option value="Lead">Lead</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select></div>
            <div><label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Follow-up Date</label>
              <input type="date" defaultValue={fmtDate} {...register('followUpDate')} className="input" /></div>
            <div className="col-span-2"><label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Address</label>
              <textarea {...register('address')} className="textarea" rows="2" /></div>
            <div className="col-span-2"><label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Notes</label>
              <textarea {...register('notes')} className="textarea" rows="2" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="btn-muted">Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <span className="app-loader-spinner" /> : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [formData, setFormData] = useState(null); // null=closed, {}=add, {customer}=edit
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const { addToast } = useToast();
  const { user } = useAuth();
  
  const canManage = PERMISSIONS.canManageCustomers(user?.role);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/customers', { params });
      setCustomers(res.data.customers || res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openDetail = async (id) => {
    const res = await api.get(`/customers/${id}`);
    setDetailCustomer(res.data);
  };

  const refreshDetail = async () => {
    if (detailCustomer) {
      const res = await api.get(`/customers/${detailCustomer._id}`);
      setDetailCustomer(res.data);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setNoteLoading(true);
    try {
      const res = await api.post(`/customers/${detailCustomer._id}/notes`, { note: newNote });
      setDetailCustomer(prev => ({ ...prev, followUpNotes: res.data }));
      setNewNote('');
      addToast('Note added!');
    } catch (e) {
      addToast(e.response?.data?.message || 'Error adding note', 'error');
    } finally { setNoteLoading(false); }
  };

  // ─── Detail View ───────────────────────────────────────────────────────────
  if (detailCustomer) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setDetailCustomer(null)} className="btn-muted">
          <ChevronLeft size={16} className="mr-1" /> Back to Customers
        </button>
        {canManage && (
          <button onClick={() => setFormData(detailCustomer)} className="btn-primary">
            <Edit2 size={14} className="mr-1.5" /> Edit Customer
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="lg:col-span-2 card space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{detailCustomer.name}</h2>
              {detailCustomer.businessName && <p className="text-slate-500 mt-0.5">{detailCustomer.businessName}</p>}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[detailCustomer.status]}`}>{detailCustomer.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-slate-100">
            {[
              ['Mobile', detailCustomer.mobile],
              ['Email', detailCustomer.email],
              ['Type', detailCustomer.type],
              ['GST Number', detailCustomer.gstNumber],
              ['Address', detailCustomer.address],
              ['Follow-up Date', detailCustomer.followUpDate ? new Date(detailCustomer.followUpDate).toLocaleDateString() : null],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase text-slate-400 mb-1">{label}</p>
                <p className="font-medium text-slate-900">{val || '—'}</p>
              </div>
            ))}
          </div>
          {detailCustomer.notes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
              <span className="font-semibold text-amber-800">Notes: </span>
              <span className="text-amber-900">{detailCustomer.notes}</span>
            </div>
          )}
        </div>

        {/* Follow-up Notes */}
        <div className="card space-y-4 flex flex-col">
          <h3 className="font-bold">Follow-up Notes</h3>
          {canManage && (
            <div className="flex gap-2">
              <input
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                className="input flex-1 text-sm"
                placeholder="Type a note and press Enter…"
                onKeyDown={e => e.key === 'Enter' && addNote()}
              />
              <button onClick={addNote} disabled={noteLoading} className="btn-primary px-3 py-2">
                {noteLoading ? <span className="app-loader-spinner" /> : '+'}
              </button>
            </div>
          )}
          <div className="space-y-3 overflow-y-auto flex-1" style={{ maxHeight: 340 }}>
            {detailCustomer.followUpNotes?.length > 0
              ? detailCustomer.followUpNotes.map((n, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-md border border-slate-200 text-sm">
                  <p className="text-slate-800">{n.note}</p>
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(n.date).toLocaleString()} · <span className="font-medium">{n.addedBy}</span>
                  </p>
                </div>
              ))
              : <p className="text-sm text-slate-400 text-center py-6">No notes yet. Add the first one!</p>
            }
          </div>
        </div>
      </div>

      {formData && (
        <CustomerForm
          initial={formData}
          onClose={() => setFormData(null)}
          onSave={async () => {
            setFormData(null);
            await fetchCustomers();
            await refreshDetail();
          }}
        />
      )}
    </div>
  );

  // ─── List View ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search name, business, mobile…"
              className="input w-64"
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select w-36">
            <option value="">All Status</option>
            <option>Lead</option><option>Active</option><option>Inactive</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="select w-36">
            <option value="">All Types</option>
            <option>Retail</option><option>Wholesale</option><option>Distributor</option>
          </select>
        </div>
        {canManage && (
          <button onClick={() => setFormData({})} className="btn-primary">
            <Plus size={16} className="mr-2" /> Add Customer
          </button>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-48"><span className="app-loader-spinner app-loader-spinner--md" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              {['Name', 'Business', 'Mobile', 'Type', 'Status', 'Follow-up', 'Actions'].map(h => (
                <th key={h} className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {customers.map(c => (
                <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm font-semibold text-slate-900">{c.name}</td>
                  <td className="p-4 text-sm text-slate-600">{c.businessName || '—'}</td>
                  <td className="p-4 text-sm text-slate-600">{c.mobile}</td>
                  <td className="p-4 text-sm text-slate-600">{c.type}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => openDetail(c._id)} className="text-slate-400 hover:text-blue-600 p-1 transition-colors" title="View Detail">
                      <Eye size={16} />
                    </button>
                    {canManage && (
                      <button onClick={() => setFormData(c)} className="text-slate-400 hover:text-amber-600 p-1 transition-colors" title="Quick Edit">
                        <Edit2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan="7" className="p-10 text-center text-slate-400">No customers found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {formData !== null && (
        <CustomerForm
          initial={Object.keys(formData).length > 0 ? formData : null}
          onClose={() => setFormData(null)}
          onSave={() => { setFormData(null); fetchCustomers(); }}
        />
      )}
    </div>
  );
}
