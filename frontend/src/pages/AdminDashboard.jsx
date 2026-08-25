import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { reportAPI } from '../api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({
        total_sales: 0,
        total_revenue: 0,
        total_outstanding: 0,
        total_debtors: 0,
        low_stock_items: 0,
        retail_count: 0,
        wholesale_count: 0
    });
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('🌅 Good Morning');
        else if (hour < 17) setGreeting('☀️ Good Afternoon');
        else setGreeting('🌙 Good Evening');
        
        loadDashboardStats();
    }, []);

    const loadDashboardStats = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            
            const salesRes = await reportAPI.getDaily(today);
            const debtorRes = await reportAPI.getDebtors();
            const lowStockRes = await reportAPI.getLowStock();

            setStats({
                total_sales: salesRes.data.summary?.total_sales || 0,
                total_revenue: salesRes.data.summary?.total_revenue || 0,
                total_outstanding: debtorRes.data?.total_outstanding || 0,
                total_debtors: debtorRes.data?.total_debtors || 0,
                low_stock_items: lowStockRes.data?.length || 0,
                retail_count: salesRes.data.summary?.retail_count || 0,
                wholesale_count: salesRes.data.summary?.wholesale_count || 0
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const modules = [
        { icon: '📦', name: 'Products', path: '/admin/products', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-500/20', desc: 'Manage products' },
        { icon: '📊', name: 'Stock', path: '/admin/stock', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-500/20', desc: 'View & add stock' },
        { icon: '🔄', name: 'Transfers', path: '/admin/transfers', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-500/20', desc: 'Transfer stock' },
        { icon: '🧾', name: 'Sales', path: '/admin/sales', color: 'from-orange-500 to-orange-600', bg: 'bg-orange-500/20', desc: 'View all sales' },
        { icon: '👥', name: 'Debtors', path: '/admin/debtors', color: 'from-rose-500 to-rose-600', bg: 'bg-rose-500/20', desc: 'Manage debtors' },
        { icon: '📈', name: 'Reports', path: '/admin/reports', color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-500/20', desc: 'View reports' },
        { icon: '👤', name: 'Users', path: '/admin/users', color: 'from-teal-500 to-teal-600', bg: 'bg-teal-500/20', desc: 'Manage cashiers' },
    ];

    const StatCard = ({ label, value, icon, color, subtitle }) => (
        <div className={`bg-gradient-to-br ${color} text-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm opacity-80 font-light">{label}</p>
                        {loading ? (
                            <div className="h-8 w-20 bg-white/20 rounded animate-pulse mt-1"></div>
                        ) : (
                            <p className="text-2xl font-bold mt-1">{value}</p>
                        )}
                        {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
                    </div>
                    <span className="text-4xl opacity-80">{icon}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm p-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                        PC
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
                        <p className="text-xs text-gray-400">{greeting}, {user?.full_name?.split(' ')[0]}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="text-gray-400 hover:text-gray-600 transition text-lg">
                        🔔
                    </button>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium transition"
                    >
                        <span>🚪</span>
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </header>

            <div className="p-4 md:p-6 max-w-7xl mx-auto">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                    <StatCard 
                        label="Today's Sales" 
                        value={stats.total_sales} 
                        icon="🛒" 
                        color="from-blue-500 to-blue-600"
                        subtitle={`${stats.retail_count} Retail · ${stats.wholesale_count} Wholesale`}
                    />
                    <StatCard 
                        label="Revenue" 
                        value={`GHS ${stats.total_revenue.toLocaleString()}`} 
                        icon="💰" 
                        color="from-emerald-500 to-emerald-600"
                    />
                    <StatCard 
                        label="Outstanding" 
                        value={`GHS ${stats.total_outstanding.toLocaleString()}`} 
                        icon="💳" 
                        color="from-rose-500 to-rose-600"
                    />
                    <StatCard 
                        label="Debtors" 
                        value={stats.total_debtors} 
                        icon="👥" 
                        color="from-amber-500 to-amber-600"
                    />
                    <StatCard 
                        label="Low Stock" 
                        value={stats.low_stock_items} 
                        icon="⚠️" 
                        color="from-orange-500 to-orange-600"
                    />
                </div>

                {/* Quick Actions */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <span>⚡</span> Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {modules.map((module) => (
                            <Link
                                key={module.name}
                                to={module.path}
                                className={`group bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.03] border border-gray-100 hover:border-${module.color.split('-')[1]}-200`}
                            >
                                <div className={`w-12 h-12 ${module.bg} rounded-xl flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                    {module.icon}
                                </div>
                                <div className="font-semibold text-sm text-gray-700">{module.name}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{module.desc}</div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Activity / Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <h3 className="font-semibold text-gray-700 mb-4">📊 Today's Overview</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">Retail Sales</span>
                                        <span className="font-medium">{stats.retail_count} transactions</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((stats.retail_count / (stats.retail_count + stats.wholesale_count || 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">Wholesale Sales</span>
                                        <span className="font-medium">{stats.wholesale_count} transactions</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((stats.wholesale_count / (stats.retail_count + stats.wholesale_count || 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">Outstanding Debt</span>
                                        <span className="font-medium text-rose-600">GHS {stats.total_outstanding.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((stats.total_outstanding / (stats.total_revenue || 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                        <h3 className="font-semibold text-white/80 mb-2">💡 Quick Tip</h3>
                        <p className="text-sm text-white/70 leading-relaxed">
                            Monitor your low stock items regularly to avoid running out of popular products.
                        </p>
                        {stats.low_stock_items > 0 && (
                            <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-3">
                                <p className="text-sm font-medium">⚠️ {stats.low_stock_items} items need restocking</p>
                            </div>
                        )}
                        <Link 
                            to="/admin/stock" 
                            className="mt-4 inline-block bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium transition"
                        >
                            View Stock →
                        </Link>
                    </div>
                </div>

                <div className="text-center text-xs text-gray-400 mt-8 border-t border-gray-200 pt-6">
                    Provision Management System v2.0 · Made with ❤️
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;