import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, Package, FileText, AlertTriangle, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusColor = { Active: 'bg-green-100 text-green-700', Lead: 'bg-blue-100 text-blue-700', Inactive: 'bg-slate-100 text-slate-600' };
const challanBadge = { Confirmed: 'bg-green-100 text-green-700', Draft: 'bg-amber-100 text-amber-700', Cancelled: 'bg-red-100 text-red-700' };

export default function Dashboard() {
  const [stats, setStats] = useState({ customers: 0, products: 0, lowStock: 0, challans: 0 });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentChallans, setRecentChallans] = useState([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [custRes, prodRes, chalRes] = await Promise.all([
          api.get('/customers'),
          api.get('/products'),
          api.get('/challans')
        ]);

        const customers = custRes.data.customers || custRes.data;
        const products = prodRes.data.products || prodRes.data;
        const challans = chalRes.data.challans || chalRes.data;

        const lowStock = products.filter(p => p.currentStock <= p.minStockAlert);

        setStats({
          customers: custRes.data.total ?? customers.length,
          products: prodRes.data.total ?? products.length,
          lowStock: lowStock.length,
          challans: chalRes.data.total ?? challans.length,
        });
        setLowStockItems(lowStock.slice(0, 5));
        setRecentChallans(challans.slice(0, 5));

        const today = new Date();
        const next7 = new Date(today);
        next7.setDate(today.getDate() + 7);
        const upcoming = customers.filter(c => {
          if (!c.followUpDate) return false;
          const d = new Date(c.followUpDate);
          return d >= today && d <= next7;
        }).sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate)).slice(0, 5);
        setUpcomingFollowUps(upcoming);
      } catch (e) {
        console.error('Dashboard fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const cards = [
    { title: 'Total Customers', value: stats.customers, icon: <Users size={22} className="text-blue-600" />, path: '/customers', bg: 'bg-blue-50', border: 'border-blue-400' },
    { title: 'Total Products',  value: stats.products,  icon: <Package size={22} className="text-emerald-600" />, path: '/products', bg: 'bg-emerald-50', border: 'border-emerald-400' },
    { title: 'Total Challans',  value: stats.challans,  icon: <FileText size={22} className="text-purple-600" />, path: '/challans', bg: 'bg-purple-50', border: 'border-purple-400' },
    { title: 'Low Stock Alerts',value: stats.lowStock,  icon: <AlertTriangle size={22} className="text-amber-600" />, path: '/products', bg: 'bg-amber-50', border: 'border-amber-400' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="app-loader-spinner app-loader-spinner--md" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => (
          <Link key={i} to={c.path} className={`card flex items-center gap-4 p-5 border-l-4 ${c.border} hover:-translate-y-1 hover:shadow-md transition-all`}>
            <div className={`p-3 rounded-xl ${c.bg} flex-shrink-0`}>{c.icon}</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{c.title}</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-0.5">{c.value}</h3>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Challans */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-slate-100">
            <div className="flex items-center gap-2"><TrendingUp size={18} className="text-purple-500" /><h3 className="font-bold">Recent Challans</h3></div>
            <Link to="/challans" className="text-xs text-blue-600 hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b">
              <th className="p-3 text-left text-xs uppercase text-slate-500">Challan</th>
              <th className="p-3 text-left text-xs uppercase text-slate-500">Customer</th>
              <th className="p-3 text-left text-xs uppercase text-slate-500">Date</th>
              <th className="p-3 text-left text-xs uppercase text-slate-500">Status</th>
            </tr></thead>
            <tbody>
              {recentChallans.length > 0 ? recentChallans.map(c => (
                <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{c.challanNumber}</td>
                  <td className="p-3 text-slate-700">{c.customer?.name}</td>
                  <td className="p-3 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${challanBadge[c.status]}`}>{c.status}</span></td>
                </tr>
              )) : <tr><td colSpan="4" className="p-8 text-center text-slate-400">No challans yet</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-slate-100">
              <AlertTriangle size={16} className="text-amber-500" />
              <h3 className="font-bold text-sm">Low Stock</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {lowStockItems.length > 0 ? lowStockItems.map(p => (
                <div key={p._id} className="flex justify-between items-center px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 truncate max-w-[160px]">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.sku}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600">{p.currentStock} left</span>
                </div>
              )) : <p className="p-4 text-sm text-slate-400 text-center">All stock levels healthy ✓</p>}
            </div>
          </div>

          {/* Upcoming Follow-ups */}
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-slate-100">
              <Clock size={16} className="text-blue-500" />
              <h3 className="font-bold text-sm">Upcoming Follow-ups</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {upcomingFollowUps.length > 0 ? upcomingFollowUps.map(c => (
                <div key={c._id} className="flex justify-between items-center px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.businessName || c.type}</p>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {new Date(c.followUpDate).toLocaleDateString()}
                  </span>
                </div>
              )) : <p className="p-4 text-sm text-slate-400 text-center">No follow-ups this week</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
