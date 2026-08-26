import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { stockAPI, productAPI } from '../api';
import toast from 'react-hot-toast';

const AdminStock = () => {
    const { user, logout } = useAuth();
    const [stockData, setStockData] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStore, setSelectedStore] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        product_id: '',
        store_id: '1',
        stock_type: 'new_stock',
        quantity: '',
        expiry_date: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const stockRes = await stockAPI.getSummary();
            console.log('📊 API Response:', stockRes);
            console.log('📊 Data:', stockRes.data);
            
            // Process data to ensure quantity is a number
            const processedData = (stockRes.data || []).map(item => ({
                ...item,
                quantity: Number(item.quantity) || 0,
                stock_type: item.stock_type || 'new_stock',
                store_id: Number(item.store_id) || 1,
                product_id: Number(item.product_id) || 0,
                product_name: item.product_name || 'Unknown',
                category: item.category || 'Uncategorized',
                store_name: item.store_name || (item.store_id === 1 ? 'wholesale' : 'retail'),
                date_added: item.date_added || null
            }));
            
            console.log('📊 Processed Data:', processedData);
            setStockData(processedData);
            
            const productRes = await productAPI.getAll();
            setProducts(productRes.data || []);
        } catch (error) {
            console.error('Error loading stock:', error);
            toast.error('Failed to load stock data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                product_id: parseInt(formData.product_id),
                store_id: parseInt(formData.store_id),
                stock_type: formData.stock_type,
                quantity: parseInt(formData.quantity),
                expiry_date: formData.expiry_date || null
            };

            await stockAPI.add(payload);
            toast.success('Stock added successfully!');
            setShowAddModal(false);
            setFormData({
                product_id: '',
                store_id: '1',
                stock_type: 'new_stock',
                quantity: '',
                expiry_date: ''
            });
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add stock');
        }
    };

    const getStoreName = (storeId) => {
        const id = Number(storeId);
        if (id === 1) return '🏪 Wholesale';
        if (id === 2) return '🛒 Retail';
        return 'Unknown';
    };

    const getStockTypeLabel = (type) => {
        return type === 'new_stock' ? '🆕 New' : '📦 Old';
    };

    const getStockTypeColor = (type) => {
        return type === 'new_stock' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-amber-100 text-amber-700';
    };

    const getStockStatus = (quantity) => {
        const qty = Number(quantity) || 0;
        if (qty === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
        if (qty < 10) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-700' };
        if (qty < 30) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' };
        return { label: 'In Stock', color: 'bg-green-100 text-green-700' };
    };

    // Filter by store
    const filteredStock = selectedStore === 'all' 
        ? stockData 
        : stockData.filter(item => Number(item.store_id) === Number(selectedStore));

    // Calculate totals
    const totalUnits = stockData.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalProducts = new Set(stockData.map(item => item.product_id)).size;
    const lowStockCount = stockData.filter(item => Number(item.quantity) > 0 && Number(item.quantity) < 10).length;
    const outOfStockCount = stockData.filter(item => Number(item.quantity) === 0).length;

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
                                <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
                                <div className="h-4 w-32 bg-gray-200 rounded"></div>
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
                        <h1 className="text-xl font-bold text-gray-800">📊 Stock Management</h1>
                        <p className="text-xs text-gray-400">View and manage inventory across stores</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                    >
                        + Add Stock
                    </button>
                    <button
                        onClick={logout}
                        className="text-red-500 hover:text-red-700 text-sm font-medium transition"
                    >
                        🚪 Logout
                    </button>
                </div>
            </header>

            <div className="p-6 max-w-7xl mx-auto">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Total Stock Entries</p>
                        <p className="text-2xl font-bold text-gray-800">{stockData.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Total Units</p>
                        <p className="text-2xl font-bold text-emerald-600">
                            {totalUnits.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Products</p>
                        <p className="text-2xl font-bold text-blue-600">{totalProducts}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Low Stock (&lt;10)</p>
                        <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
                    </div>
                </div>

                {/* Filter */}
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
                    <div className="flex flex-wrap gap-3 items-center">
                        <span className="text-sm font-medium text-gray-700">Filter by Store:</span>
                        <button
                            onClick={() => setSelectedStore('all')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                                selectedStore === 'all' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            All Stores
                        </button>
                        <button
                            onClick={() => setSelectedStore('1')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                                selectedStore === '1' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            🏪 Wholesale
                        </button>
                        <button
                            onClick={() => setSelectedStore('2')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                                selectedStore === '2' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            🛒 Retail
                        </button>
                    </div>
                </div>

                {/* Stock Table */}
                {filteredStock.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-gray-500 text-lg">No stock found</p>
                        <p className="text-gray-400 text-sm">Add stock to get started</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Type</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Added</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStock.map((item, index) => {
                                        const quantity = Number(item.quantity) || 0;
                                        const status = getStockStatus(quantity);
                                        
                                        return (
                                            <tr key={`${item.product_id}-${item.store_id}-${item.stock_type}-${index}`} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-800">{item.product_name || 'Unknown'}</div>
                                                    <div className="text-xs text-gray-400">ID: {item.product_id}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                                        {item.category || 'Uncategorized'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getStoreName(item.store_id)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockTypeColor(item.stock_type)}`}>
                                                        {getStockTypeLabel(item.stock_type)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="text-2xl font-bold text-blue-600">
                                                        {quantity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {item.date_added ? new Date(item.date_added).toLocaleDateString() : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Stock Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">📦 Add Stock</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleAddStock}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                                <select
                                    value={formData.product_id}
                                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    required
                                >
                                    <option value="">Select product...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Store *</label>
                                <select
                                    value={formData.store_id}
                                    onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    required
                                >
                                    <option value="1">🏪 Wholesale</option>
                                    <option value="2">🛒 Retail</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Type *</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, stock_type: 'new_stock' })}
                                        className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition ${
                                            formData.stock_type === 'new_stock' 
                                                ? 'bg-green-600 text-white' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        🆕 New Stock
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, stock_type: 'old_stock' })}
                                        className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition ${
                                            formData.stock_type === 'old_stock' 
                                                ? 'bg-amber-600 text-white' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        📦 Old Stock
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    required
                                    min="1"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (optional)</label>
                                <input
                                    type="date"
                                    value={formData.expiry_date}
                                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                                >
                                    Add Stock
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStock;