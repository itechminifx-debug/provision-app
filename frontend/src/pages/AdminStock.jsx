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
        // Load stock summary - FIXED
        const stockRes = await stockAPI.getSummary();  // CHANGE THIS
        setStockData(stockRes.data || []);
        
        // Load products for dropdown
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
        if (storeId === 1) return '🏪 Wholesale';
        if (storeId === 2) return '🛒 Retail';
        return 'Unknown';
    };

    const getStockTypeLabel = (type) => {
        return type === 'new_stock' ? '🆕 New' : '📦 Old';
    };

    const getStockTypeColor = (type) => {
        return type === 'new_stock' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700';
    };

    const getStockStatus = (quantity) => {
        if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
        if (quantity < 10) return { label: 'Low Stock', color: 'bg-orange-100 text-orange-700' };
        if (quantity < 30) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' };
        return { label: 'In Stock', color: 'bg-green-100 text-green-700' };
    };

    // Group stock by product for display
    const groupedStock = stockData.reduce((acc, item) => {
        const key = `${item.product_id}-${item.product_name}`;
        if (!acc[key]) {
            acc[key] = {
                product_id: item.product_id,
                product_name: item.product_name,
                category: item.category,
                stores: {}
            };
        }
        const storeKey = `store_${item.store_id}`;
        if (!acc[key].stores[storeKey]) {
            acc[key].stores[storeKey] = {
                store_id: item.store_id,
                store_name: item.store_name,
                stock: {}
            };
        }
        acc[key].stores[storeKey].stock[item.stock_type] = item.quantity;
        return acc;
    }, {});

    const stockArray = Object.values(groupedStock);

    // Filter by store
    const filteredStock = selectedStore === 'all' 
        ? stockArray 
        : stockArray.filter(item => 
            Object.values(item.stores).some(store => store.store_id === parseInt(selectedStore))
        );

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
                        <p className="text-xs text-gray-500">Total Products</p>
                        <p className="text-2xl font-bold text-gray-800">{stockArray.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Total Stock Value</p>
                        <p className="text-2xl font-bold text-emerald-600">
                            GHS {stockArray.reduce((sum, item) => {
                                let total = 0;
                                Object.values(item.stores).forEach(store => {
                                    Object.values(store.stock).forEach(qty => {
                                        total += qty * 1; // You can add cost price logic here
                                    });
                                });
                                return sum + total;
                            }, 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Low Stock Items</p>
                        <p className="text-2xl font-bold text-orange-600">
                            {stockArray.filter(item => 
                                Object.values(item.stores).some(store => 
                                    Object.values(store.stock).some(qty => qty > 0 && qty < 10)
                                )
                            ).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Out of Stock</p>
                        <p className="text-2xl font-bold text-red-600">
                            {stockArray.filter(item => 
                                Object.values(item.stores).every(store => 
                                    Object.values(store.stock).every(qty => qty === 0)
                                )
                            ).length}
                        </p>
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
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Wholesale</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Retail</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStock.map((item) => {
                                        const wholesaleStore = item.stores.store_1;
                                        const retailStore = item.stores.store_2;
                                        
                                        const wholesaleNew = wholesaleStore?.stock?.new_stock || 0;
                                        const wholesaleOld = wholesaleStore?.stock?.old_stock || 0;
                                        const wholesaleTotal = wholesaleNew + wholesaleOld;
                                        
                                        const retailNew = retailStore?.stock?.new_stock || 0;
                                        const retailOld = retailStore?.stock?.old_stock || 0;
                                        const retailTotal = retailNew + retailOld;

                                        const totalStock = wholesaleTotal + retailTotal;
                                        const status = getStockStatus(totalStock);

                                        // Determine which store is being filtered
                                        const showWholesale = selectedStore === 'all' || selectedStore === '1';
                                        const showRetail = selectedStore === 'all' || selectedStore === '2';

                                        return (
                                            <tr key={item.product_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-800">{item.product_name}</div>
                                                    <div className="text-xs text-gray-400">ID: {item.product_id}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                                        {item.category || 'Uncategorized'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {showWholesale ? (
                                                        <div>
                                                            <div className="flex justify-center gap-2 text-sm">
                                                                <span className="text-green-600 font-medium">{wholesaleNew}</span>
                                                                <span className="text-amber-600 font-medium">{wholesaleOld}</span>
                                                            </div>
                                                            <div className="text-xs text-gray-400 flex justify-center gap-2">
                                                                <span className="text-green-600">New</span>
                                                                <span className="text-amber-600">Old</span>
                                                            </div>
                                                            <div className="text-sm font-bold text-gray-700">{wholesaleTotal} total</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {showRetail ? (
                                                        <div>
                                                            <div className="flex justify-center gap-2 text-sm">
                                                                <span className="text-green-600 font-medium">{retailNew}</span>
                                                                <span className="text-amber-600 font-medium">{retailOld}</span>
                                                            </div>
                                                            <div className="text-xs text-gray-400 flex justify-center gap-2">
                                                                <span className="text-green-600">New</span>
                                                                <span className="text-amber-600">Old</span>
                                                            </div>
                                                            <div className="text-sm font-bold text-gray-700">{retailTotal} total</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                    <div className="text-sm font-bold text-gray-700 mt-1">{totalStock} units</div>
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