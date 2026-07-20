import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { Plus, Search, Edit2, AlertCircle, X, ArrowUp, ArrowDown, ChevronLeft, ImageUp, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../utils/permissions';
import ProductImage from '../components/ProductImage';

function ProductForm({ initial, onSave, onClose }) {
  const isEdit = !!initial?._id;
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
    defaultValues: initial || { minStockAlert: 10, currentStock: 0 }
  });
  const { addToast } = useToast();
  const [imagePreview, setImagePreview] = useState(initial?.imageBase64 || null);
  const [imageBase64, setImageBase64] = useState(initial?.imageBase64 || null);
  const fileInputRef = useRef();
  const watchedCategory = watch('category', initial?.category || '');
  const watchedName = watch('name', initial?.name || '');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      addToast('Image must be under 1 MB', 'info');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target.result);
      setImageBase64(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, imageBase64: imageBase64 || null };
      if (isEdit) await api.put(`/products/${initial._id}`, payload);
      else await api.post('/products', payload);
      addToast(isEdit ? 'Product updated!' : 'Product added!');
      onSave();
    } catch (e) {
      addToast(e.response?.data?.message || 'Error saving product', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="app-dialog-panel w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Product Image <span className="font-normal text-slate-400 normal-case">(optional, max 1 MB)</span></label>
            <div className="flex gap-4 items-start">
              <div className="w-36 flex-shrink-0">
                <ProductImage
                  imageBase64={imagePreview}
                  name={watchedName}
                  category={watchedCategory}
                  rounded="rounded-md"
                />
              </div>
              <div className="flex flex-col gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-muted text-xs"
                >
                  <ImageUp size={14} className="mr-1.5" />
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setImageBase64(null); }}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                )}
                <p className="text-xs text-slate-400 leading-tight">JPG, PNG, WebP<br/>Max 1 MB</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Product Name *</label>
            <input {...register('name', { required: true })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">SKU / Code *</label>
            <input {...register('sku', { required: true })} className="input" disabled={isEdit} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Category</label>
              <input {...register('category')} className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Location</label>
              <input {...register('location')} className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Unit Price (₹) *</label>
              <input type="number" step="0.01" {...register('unitPrice', { required: true, valueAsNumber: true })} className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Min Alert Qty *</label>
              <input type="number" {...register('minStockAlert', { required: true, valueAsNumber: true })} className="input" />
            </div>
            {!isEdit && (
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Opening Stock *</label>
                <input type="number" {...register('currentStock', { required: true, valueAsNumber: true })} className="input" />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="btn-muted">Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <span className="app-loader-spinner" /> : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StockAdjustForm({ product, onSave, onClose }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { type: 'IN', quantity: '' } });
  const { addToast } = useToast();

  const onSubmit = async (data) => {
    try {
      await api.post(`/products/${product._id}/stock`, { ...data, quantity: Number(data.quantity) });
      addToast(`Stock ${data.type === 'IN' ? 'added' : 'removed'} successfully!`);
      onSave();
    } catch (e) {
      addToast(e.response?.data?.message || 'Error adjusting stock', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="app-dialog-panel w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Adjust Stock</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          {product.name} · Current stock: <span className="font-bold text-slate-800">{product.currentStock}</span>
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Movement Type *</label>
            <select {...register('type', { required: true })} className="select">
              <option value="IN">IN — Stock Added</option>
              <option value="OUT">OUT — Stock Removed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Quantity *</label>
            <input type="number" min="1" {...register('quantity', { required: true })} className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Reason</label>
            <input {...register('reason')} className="input" placeholder="e.g. Purchase from supplier" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="btn-muted">Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <span className="app-loader-spinner" /> : 'Update Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formProduct, setFormProduct] = useState(null);   // null=closed, {}=add, {p}=edit
  const [stockProduct, setStockProduct] = useState(null); // product to adjust stock for
  const [detailProduct, setDetailProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [movLoading, setMovLoading] = useState(false);
  const { user } = useAuth();
  const canManage = PERMISSIONS.canManageProducts(user?.role);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get('/products', { params });
      setProducts(res.data.products || res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, categoryFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openDetail = async (product) => {
    setDetailProduct(product);
    setMovLoading(true);
    try {
      const res = await api.get(`/products/${product._id}/movements`);
      setMovements(res.data);
    } catch (e) { console.error(e); }
    finally { setMovLoading(false); }
  };

  const refreshDetail = async () => {
    if (!detailProduct) return;
    const [pRes, mRes] = await Promise.all([
      api.get(`/products/${detailProduct._id}`),
      api.get(`/products/${detailProduct._id}/movements`)
    ]);
    setDetailProduct(pRes.data);
    setMovements(mRes.data);
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // ─── Detail View ──────────────────────────────────────────────────────────
  if (detailProduct) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setDetailProduct(null)} className="btn-muted">
          <ChevronLeft size={16} className="mr-1" /> Back to Products
        </button>
        {canManage && (
          <div className="flex gap-2">
            <button onClick={() => setFormProduct(detailProduct)} className="btn-muted">
              <Edit2 size={14} className="mr-1.5" /> Edit
            </button>
            <button onClick={() => setStockProduct(detailProduct)} className="btn-primary">
              <ArrowUp size={14} className="mr-1.5" /> Adjust Stock
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card space-y-4">
          {/* Product Image */}
          <ProductImage
            imageBase64={detailProduct.imageBase64}
            name={detailProduct.name}
            category={detailProduct.category}
            rounded="rounded-md"
            className="w-full"
          />
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{detailProduct.name}</h2>
              <p className="text-sm font-mono text-slate-400 mt-1">{detailProduct.sku}</p>
            </div>
            {detailProduct.currentStock <= detailProduct.minStockAlert && (
              <span className="flex items-center gap-1 bg-red-50 text-red-600 text-xs font-semibold px-2 py-1 rounded-full">
                <AlertCircle size={12} /> Low Stock
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t border-slate-100">
            {[
              ['Category', detailProduct.category],
              ['Location', detailProduct.location],
              ['Unit Price', `₹${detailProduct.unitPrice}`],
              ['Min Alert', `${detailProduct.minStockAlert} units`],
              ['Current Stock', detailProduct.currentStock],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-xs font-semibold uppercase text-slate-400 mb-1">{l}</p>
                <p className={`font-bold ${l === 'Current Stock' && detailProduct.currentStock <= detailProduct.minStockAlert ? 'text-red-600' : 'text-slate-900'}`}>{v ?? '—'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 card overflow-hidden p-0">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold">Stock Movement Log</h3>
          </div>
          {movLoading ? (
            <div className="flex items-center justify-center h-40"><span className="app-loader-spinner app-loader-spinner--md" /></div>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
              <table className="w-full text-sm text-left">
                <thead><tr className="bg-slate-50 border-b sticky top-0">
                  {['Date & Time', 'Type', 'Qty', 'Reason', 'By'].map(h => (
                    <th key={h} className="p-3 text-xs font-semibold uppercase text-slate-500">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {movements.map((m, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-3 text-slate-600">{new Date(m.timestamp).toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-bold ${m.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {m.type === 'IN' ? <ArrowDown size={10} /> : <ArrowUp size={10} />} {m.type}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{m.quantity}</td>
                      <td className="p-3 text-slate-600">{m.reason || '—'}</td>
                      <td className="p-3 text-slate-500">{m.createdBy?.username || '—'}</td>
                    </tr>
                  ))}
                  {movements.length === 0 && (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-400">No movements recorded yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {formProduct && (
        <ProductForm
          initial={formProduct}
          onClose={() => setFormProduct(null)}
          onSave={async () => { setFormProduct(null); await fetchProducts(); await refreshDetail(); }}
        />
      )}
      {stockProduct && (
        <StockAdjustForm
          product={stockProduct}
          onClose={() => setStockProduct(null)}
          onSave={async () => { setStockProduct(null); await fetchProducts(); await refreshDetail(); }}
        />
      )}
    </div>
  );

  // ─── Grid View ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search name or SKU…"
              className="input w-56"
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="select w-40">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        {canManage && (
          <button onClick={() => setFormProduct({})} className="btn-primary">
            <Plus size={16} className="mr-2" /> Add Product
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><span className="app-loader-spinner app-loader-spinner--md" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map(p => {
            const isLow = p.currentStock <= p.minStockAlert;
            return (
              <div
                key={p._id}
                onClick={() => openDetail(p)}
                className={`card cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden p-0 border-l-4 ${isLow ? 'border-l-red-400' : 'border-l-green-400'}`}
              >
                {/* Image / Placeholder */}
                <ProductImage
                  imageBase64={p.imageBase64}
                  name={p.name}
                  category={p.category}
                  rounded="rounded-none"
                  className="w-full"
                />
                {/* Card Body */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{p.name}</h3>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{p.sku}</p>
                    </div>
                    {isLow && <AlertCircle size={16} className="text-red-500 flex-shrink-0 ml-2 mt-0.5" />}
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{p.category} · {p.location || 'N/A'}</p>
                  <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-xs uppercase text-slate-400 font-semibold mb-1">Stock</p>
                      <p className={`text-2xl font-bold ${isLow ? 'text-red-600' : 'text-slate-900'}`}>{p.currentStock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase text-slate-400 font-semibold mb-1">Price</p>
                      <p className="text-base font-semibold text-slate-700">₹{p.unitPrice}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {products.length === 0 && (
            <div className="col-span-full card p-12 text-center text-slate-400">No products found</div>
          )}
        </div>
      )}

      {formProduct !== null && (
        <ProductForm
          initial={Object.keys(formProduct).length > 0 ? formProduct : null}
          onClose={() => setFormProduct(null)}
          onSave={() => { setFormProduct(null); fetchProducts(); }}
        />
      )}
    </div>
  );
}
