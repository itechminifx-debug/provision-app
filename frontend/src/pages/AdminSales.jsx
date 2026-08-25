import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saleAPI } from '../api';
import toast from 'react-hot-toast';

const AdminSales = () => {
    const { user, logout } = useAuth();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSale, setSelectedSale] = useState(null);
    const [filter, setFilter] = useState({
        startDate: '',
        endDate: '',
        store: 'all',
        type: 'all'
    });

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {
        try {
            setLoading(true);
            const { data } = await saleAPI.getAll();
            setSales(data || []);
        } catch (error) {
            console.error('Error loading sales:', error);
            toast.error('Failed to load sales');
        } finally {
            setLoading(false);
        }
    };

    const loadSalesByDate = async () => {
        if (!filter.startDate || !filter.endDate) {
            toast.error('Please select both start and end dates');
            return;
        }
        try {
            setLoading(true);
            const { data } = await saleAPI.getByDate(filter.startDate, filter.endDate);
            setSales(data || []);
        } catch (error) {
            toast.error('Failed to load sales');
        } finally {
            setLoading(false);
        }
    };

    const resetFilter = () => {
        setFilter({
            startDate: '',
            endDate: '',
            store: 'all',
            type: 'all'
        });
        loadSales();
    };

    const getStoreName = (storeId) => {
        if (storeId === 1) return '🏪 Wholesale';
        if (storeId === 2) return '🛒 Retail';
        return 'Unknown';
    };

    const getPaymentMethod = (method) => {
        const methods = {
            'cash': '💵 Cash',
            'mobile_money': '📱 Mobile Money',
            'bank_transfer': '🏦 Bank Transfer',
            'credit': '💳 Credit'
        };
        return methods[method] || method;
    };

    const getPaymentMethodColor = (method) => {
        const colors = {
            'cash': 'bg-green-100 text-green-700',
            'mobile_money': 'bg-blue-100 text-blue-700',
            'bank_transfer': 'bg-purple-100 text-purple-700',
            'credit': 'bg-amber-100 text-amber-700'
        };
        return colors[method] || 'bg-gray-100 text-gray-700';
    };

    const getSaleTypeColor = (type) => {
        return type === 'retail' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
    };

    const getStatusBadge = (sale) => {
        if (sale.payment_method === 'credit' && sale.balance_due > 0) {
            return <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">⚠️ Partial Payment</span>;
        }
        if (sale.payment_method === 'credit' && sale.balance_due === 0) {
            return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">✅ Paid</span>;
        }
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">✅ Completed</span>;
    };

    const filteredSales = sales.filter(sale => {
        let match = true;
        if (filter.store !== 'all' && sale.store_id !== parseInt(filter.store)) {
            match = false;
        }
        if (filter.type !== 'all' && sale.sale_type !== filter.type) {
            match = false;
        }
        return match;
    });

    // Loading skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                                <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => window.history.back()}
                        className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                        ←
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">🧾 Sales History</h1>
                        <p className="text-xs text-gray-400">View and manage all sales transactions</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="text-red-500 hover:text-red-700 text-sm font-medium transition flex items-center gap-2"
                >
                    <span>🚪</span>
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </header>

            <div className="p-6 max-w-7xl mx-auto">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Total Sales</p>
                        <p className="text-2xl font-bold text-gray-800">{filteredSales.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Total Revenue</p>
                        <p className="text-2xl font-bold text-emerald-600">
                            GHS {filteredSales.reduce((sum, s) => sum + (s.total_amount || 0), 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Total Received</p>
                        <p className="text-2xl font-bold text-blue-600">
                            GHS {filteredSales.reduce((sum, s) => sum + (s.amount_paid || 0), 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Outstanding</p>
                        <p className="text-2xl font-bold text-amber-600">
                            GHS {filteredSales.reduce((sum, s) => sum + (s.balance_due || 0), 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={filter.startDate}
                                onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                            <input
                                type="date"
                                value={filter.endDate}
                                onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Store</label>
                            <select
                                value={filter.store}
                                onChange={(e) => setFilter({ ...filter, store: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="all">All Stores</option>
                                <option value="1">🏪 Wholesale</option>
                                <option value="2">🛒 Retail</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Sale Type</label>
                            <select
                                value={filter.type}
                                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="all">All Types</option>
                                <option value="retail">Retail</option>
                                <option value="wholesale">Wholesale</option>
                            </select>
                        </div>
                        <div className="flex items-end gap-2">
                            <button
                                onClick={loadSalesByDate}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                            >
                                🔍 Filter
                            </button>
                            <button
                                onClick={resetFilter}
                                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                            >
                                ↩️ Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sales Table */}
                {filteredSales.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="text-6xl mb-4">🧾</div>
                        <p className="text-gray-500 text-lg">No sales found</p>
                        <p className="text-gray-400 text-sm">Sales will appear here once customers make purchases</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cashier</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Payment</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSales.map((sale) => (
                                        <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 font-mono text-sm font-medium text-gray-700">
                                                {sale.invoice_number}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {sale.cashier_name || 'Unknown'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {getStoreName(sale.store_id)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSaleTypeColor(sale.sale_type)}`}>
                                                    {sale.sale_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-gray-700">
                                                GHS {sale.total_amount?.toLocaleString() || 0}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentMethodColor(sale.payment_method)}`}>
                                                    {getPaymentMethod(sale.payment_method)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {getStatusBadge(sale)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {new Date(sale.created_at).toLocaleDateString()}
                                                <br />
                                                <span className="text-xs text-gray-400">
                                                    {new Date(sale.created_at).toLocaleTimeString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => setSelectedSale(sale)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    👁️ View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Sale Detail Modal */}
            {selectedSale && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">🧾 Sale Details</h2>
                                <p className="text-sm text-gray-500 font-mono">{selectedSale.invoice_number}</p>
                            </div>
                            <button
                                onClick={() => setSelectedSale(null)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl mb-4">
                            <div>
                                <p className="text-xs text-gray-500">Cashier</p>
                                <p className="font-medium">{selectedSale.cashier_name || 'Unknown'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Store</p>
                                <p className="font-medium">{getStoreName(selectedSale.store_id)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Sale Type</p>
                                <p className="font-medium capitalize">{selectedSale.sale_type}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Payment Method</p>
                                <p className="font-medium">{getPaymentMethod(selectedSale.payment_method)}</p>
                            </div>
                            {selectedSale.customer_name && (
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500">Customer</p>
                                    <p className="font-medium">{selectedSale.customer_name}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-gray-500">Date</p>
                                <p className="font-medium">{new Date(selectedSale.created_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Items</p>
                                <p className="font-medium">{selectedSale.items_count || 0}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4 space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Amount</span>
                                <span className="font-bold text-gray-800">GHS {selectedSale.total_amount?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Amount Paid</span>
                                <span className="font-medium text-green-600">GHS {selectedSale.amount_paid?.toLocaleString() || 0}</span>
                            </div>
                            {selectedSale.balance_due > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Balance Due</span>
                                    <span className="font-bold text-amber-600">GHS {selectedSale.balance_due?.toLocaleString() || 0}</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedSale(null)}
                            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSales;