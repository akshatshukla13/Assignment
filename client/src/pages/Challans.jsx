import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, CheckCircle, Clock, XCircle, X, Eye, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../utils/permissions';
import ConfirmDialog from '../components/ConfirmDialog';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const statusBadge = (status) => {
  if (status === 'Confirmed') return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold w-fit"><CheckCircle size={12} />Confirmed</span>;
  if (status === 'Cancelled') return <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold w-fit"><XCircle size={12} />Cancelled</span>;
  return <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-semibold w-fit"><Clock size={12} />Draft</span>;
};

function exportChallanPDF(challan) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(0, 30, 64);
  doc.rect(0, 0, pageW, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES CHALLAN', 14, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Challan No: ${challan.challanNumber}`, 14, 24);
  doc.text(`Date: ${new Date(challan.createdAt).toLocaleDateString('en-IN')}`, pageW - 14, 24, { align: 'right' });

  // Status Badge
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${challan.status}`, pageW - 14, 42, { align: 'right' });

  // Customer Details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const customer = challan.customer;
  let y = 50;
  doc.text(customer?.name || '—', 14, y); y += 6;
  if (customer?.businessName) { doc.text(customer.businessName, 14, y); y += 6; }
  if (customer?.mobile) { doc.text(`Mobile: ${customer.mobile}`, 14, y); y += 6; }
  if (customer?.address) { doc.text(`Address: ${customer.address}`, 14, y); y += 6; }
  if (customer?.gstNumber) { doc.text(`GST: ${customer.gstNumber}`, 14, y); y += 6; }

  // Products Table
  autoTable(doc, {
    startY: y + 8,
    head: [['#', 'Product', 'SKU', 'Qty', 'Unit Price (₹)', 'Total (₹)']],
    body: challan.products.map((p, i) => [
      i + 1,
      p.name,
      p.sku,
      p.quantity,
      `₹${p.unitPrice.toFixed(2)}`,
      `₹${(p.unitPrice * p.quantity).toFixed(2)}`
    ]),
    headStyles: { fillColor: [0, 30, 64], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [247, 249, 252] },
    styles: { fontSize: 9, cellPadding: 4 },
    foot: [[
      '', '', '', { content: 'Total Qty:', styles: { fontStyle: 'bold' } },
      { content: challan.totalQuantity, styles: { fontStyle: 'bold' } },
      {
        content: `₹${challan.products.reduce((s, p) => s + p.unitPrice * p.quantity, 0).toFixed(2)}`,
        styles: { fontStyle: 'bold', textColor: [0, 30, 64] }
      }
    ]],
    footStyles: { fillColor: [241, 245, 249] },
  });

  // Footer
  const finalY = doc.lastAutoTable.finalY + 14;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a computer-generated document. No signature required.', pageW / 2, finalY, { align: 'center' });

  doc.save(`${challan.challanNumber}.pdf`);
}

export default function Challans() {
  const [challans, setChallans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewChallan, setViewChallan] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [error, setError] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const { addToast } = useToast();

  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const selectedProductId = watch('currentProductId');
  const currentQuantity = watch('currentQuantity');

  useEffect(() => { fetchAll(); }, [statusFilter]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const [chalRes, custRes, prodRes] = await Promise.all([
        api.get('/challans', { params }),
        api.get('/customers'),
        api.get('/products')
      ]);
      setChallans(chalRes.data.challans || chalRes.data);
      const allCustomers = custRes.data.customers || custRes.data;
      setCustomers(allCustomers.filter(c => c.status === 'Active'));
      setProducts(prodRes.data.products || prodRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAddProduct = () => {
    if (!selectedProductId || !currentQuantity || Number(currentQuantity) < 1) return;
    const product = products.find(p => p._id === selectedProductId);
    if (!product) return;
    if (selectedProducts.find(p => p.productId === product._id)) {
      addToast('Product already added. Remove it first to change quantity.', 'info');
      return;
    }
    setSelectedProducts(prev => [...prev, {
      productId: product._id,
      name: product.name,
      sku: product.sku,
      unitPrice: product.unitPrice,
      quantity: Number(currentQuantity),
      availableStock: product.currentStock
    }]);
    // Reset selectors after adding
    setValue('currentProductId', '');
    setValue('currentQuantity', '');
  };

  const handleCancel = async () => {
    try {
      await api.patch(`/challans/${cancelTarget}/cancel`);
      addToast('Challan cancelled. Stock has been restored.');
      setCancelTarget(null);
      fetchAll();
    } catch (e) {
      addToast(e.response?.data?.message || 'Error cancelling challan', 'error');
      setCancelTarget(null);
    }
  };

  const onSubmit = async (data, status) => {
    if (!data.customer) { setError('Please select a customer'); return; }
    if (selectedProducts.length === 0) { setError('Please add at least one product'); return; }
    setError('');
    try {
      await api.post('/challans', { customer: data.customer, products: selectedProducts, status });
      addToast(status === 'Confirmed' ? 'Challan confirmed! Stock deducted.' : 'Challan saved as draft.');
      setShowModal(false);
      reset();
      setSelectedProducts([]);
      fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || 'Error creating challan');
    }
  };

  const totalValue = selectedProducts.reduce((s, p) => s + p.unitPrice * p.quantity, 0);
  const { user } = useAuth();
  const canCreate = PERMISSIONS.canCreateChallan(user?.role);
  const canCancel = PERMISSIONS.canCancelChallan(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select w-40">
          <option value="">All Status</option>
          <option>Draft</option><option>Confirmed</option><option>Cancelled</option>
        </select>
        {canCreate && (
          <button onClick={() => { reset(); setSelectedProducts([]); setError(''); setShowModal(true); }} className="btn-primary">
            <Plus size={16} className="mr-2" /> Create Challan
          </button>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-48"><span className="app-loader-spinner app-loader-spinner--md" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              {['Challan No.', 'Customer', 'Date', 'Total Qty', 'Status', 'Actions'].map(h => (
                <th key={h} className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {challans.map(c => (
                <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{c.challanNumber}</td>
                  <td className="p-4 text-sm">
                    <p className="font-medium">{c.customer?.name}</p>
                    {c.customer?.businessName && <p className="text-xs text-slate-400">{c.customer.businessName}</p>}
                  </td>
                  <td className="p-4 text-sm text-slate-600">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-sm font-semibold">{c.totalQuantity}</td>
                  <td className="p-4">{statusBadge(c.status)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewChallan(c)}
                        className="text-slate-400 hover:text-blue-600 p-1 transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => exportChallanPDF(c)}
                        className="text-slate-400 hover:text-green-600 p-1 transition-colors"
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </button>
                      {canCancel && c.status !== 'Cancelled' && (
                        <button
                          onClick={() => setCancelTarget(c._id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {challans.length === 0 && (
                <tr><td colSpan="6" className="p-10 text-center text-slate-400">No challans found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* View Challan Detail Modal */}
      {viewChallan && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="app-dialog-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold">{viewChallan.challanNumber}</h2>
                <p className="text-sm text-slate-500 mt-1">{new Date(viewChallan.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(viewChallan.status)}
                <button onClick={() => exportChallanPDF(viewChallan)} className="btn-primary py-1.5 px-3 text-xs">
                  <Download size={14} className="mr-1.5" /> PDF
                </button>
                <button onClick={() => setViewChallan(null)}><X size={20} className="text-slate-400" /></button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-6 text-sm">
              <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Customer</p>
              <p className="font-bold text-slate-900">{viewChallan.customer?.name}</p>
              {viewChallan.customer?.businessName && <p className="text-slate-600">{viewChallan.customer.businessName}</p>}
              {viewChallan.customer?.mobile && <p className="text-slate-600">📞 {viewChallan.customer.mobile}</p>}
            </div>

            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-slate-100"><tr>
                <th className="p-3 text-left text-xs uppercase text-slate-500">#</th>
                <th className="p-3 text-left text-xs uppercase text-slate-500">Product</th>
                <th className="p-3 text-left text-xs uppercase text-slate-500">SKU</th>
                <th className="p-3 text-right text-xs uppercase text-slate-500">Qty</th>
                <th className="p-3 text-right text-xs uppercase text-slate-500">Unit Price</th>
                <th className="p-3 text-right text-xs uppercase text-slate-500">Total</th>
              </tr></thead>
              <tbody>
                {viewChallan.products.map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3 text-slate-400">{i + 1}</td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-slate-500 font-mono text-xs">{p.sku}</td>
                    <td className="p-3 text-right font-semibold">{p.quantity}</td>
                    <td className="p-3 text-right">₹{p.unitPrice.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold">₹{(p.unitPrice * p.quantity).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 border-t-2 border-slate-300">
                  <td colSpan="3" className="p-3 font-bold text-slate-700">Total</td>
                  <td className="p-3 text-right font-bold">{viewChallan.totalQuantity}</td>
                  <td></td>
                  <td className="p-3 text-right font-bold text-[#001e40]">
                    ₹{viewChallan.products.reduce((s, p) => s + p.unitPrice * p.quantity, 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Challan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="app-dialog-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Create New Challan</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">{error}</div>
            )}

            <form className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Select Customer *</label>
                <select {...register('customer')} className="select">
                  <option value="">— Choose Active Customer —</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name}{c.businessName ? ` (${c.businessName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Add Products</h3>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <select {...register('currentProductId')} className="select text-sm">
                      <option value="">— Select Product —</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name} — Stock: {p.currentStock} — ₹{p.unitPrice}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28">
                    <input
                      type="number"
                      min="1"
                      {...register('currentQuantity')}
                      placeholder="Qty"
                      className="input text-sm"
                    />
                  </div>
                  <button type="button" onClick={handleAddProduct} className="btn-muted whitespace-nowrap">
                    + Add
                  </button>
                </div>
              </div>

              {selectedProducts.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100"><tr>
                      <th className="p-3 text-left text-xs uppercase text-slate-500">Product</th>
                      <th className="p-3 text-left text-xs uppercase text-slate-500">SKU</th>
                      <th className="p-3 text-right text-xs uppercase text-slate-500">Qty</th>
                      <th className="p-3 text-right text-xs uppercase text-slate-500">Unit Price</th>
                      <th className="p-3 text-right text-xs uppercase text-slate-500">Total</th>
                      <th className="p-3"></th>
                    </tr></thead>
                    <tbody>
                      {selectedProducts.map((item, idx) => (
                        <tr key={idx} className="border-t hover:bg-slate-50">
                          <td className="p-3 font-medium">{item.name}</td>
                          <td className="p-3 text-slate-500 font-mono text-xs">{item.sku}</td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3 text-right">₹{item.unitPrice}</td>
                          <td className="p-3 text-right font-semibold">₹{(item.unitPrice * item.quantity).toFixed(2)}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedProducts(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-600"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                        <td colSpan="4" className="p-3 text-right text-slate-700">Grand Total</td>
                        <td className="p-3 text-right text-[#001e40] text-base">₹{totalValue.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowModal(false)} className="btn-muted">Cancel</button>
                <button
                  type="button"
                  onClick={handleSubmit(d => onSubmit(d, 'Draft'))}
                  className="btn-muted border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={handleSubmit(d => onSubmit(d, 'Confirmed'))}
                  className="btn-primary"
                >
                  ✓ Confirm & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancel Challan"
        message="Are you sure you want to cancel this challan? If it was confirmed, all deducted stock will be restored."
        confirmLabel="Yes, Cancel It"
        confirmClass="btn-primary bg-red-600 hover:bg-red-700"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
