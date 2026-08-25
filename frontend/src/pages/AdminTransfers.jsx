import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { transferAPI, stockAPI, productAPI } from '../api';
import toast from 'react-hot-toast';

const AdminTransfers = () => {
    const { user, logout } = useAuth();
    const [transfers, setTransfers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [stockData, setStockData] = useState({ wholesale: {}, retail: {} });
    const [formData, setFormData] = useState({
        product_id: '',
        from_store_id: '1',
        to_store_id: '2',
        stock_type: 'new_stock',
        quantity: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // Load transfers
            const transfersRes = await transferAPI.getAll();
            setTransfers(transfersRes.data || []);
            
            // Load products
            const productRes = await productAPI.getAll();
            setProducts(productRes.data || []);
            
            // Load stock for both stores
            const wholesaleRes = await stockAPI.getByStore(1);
            const retailRes = await stockAPI.getByStore(2);
            
            // Organize stock by product for easy lookup
            const wholesaleMap = {};
            wholesaleRes.data.forEach(item => {
                wholesaleMap[item.product_id] = {
                    product_name: item.product_name,
                    new_stock: item.stock_type === 'new_stock' ? item.quantity : 0,
                    old_stock: item.stock_type === 'old_stock' ? item.quantity : 0
                };
            });
            
            const retailMap = {};
            retailRes.data.forEach(item => {
                retailMap[item.product_id] = {
                    product_name: item.product_name,
                    new_stock: item.stock_type === 'new_stock' ? item.quantity : 0,
                    old_stock: item.stock_type === 'old_stock' ? item.quantity : 0
                };
            });
            
            setStockData({ wholesale: wholesaleMap, retail: retailMap });
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        
        const product = products.find(p => p.id === parseInt(formData.product_id));
        const fromStore = formData.from_store_id === '1' ? 'Wholesale' : 'Retail';
        const toStore = formData.to_store_id === '1' ? 'Wholesale' : 'Retail';
        
        // Check if enough stock
        const fromData = formData.from_store_id === '1' ? stockData.wholesale : stockData.retail;
        const productStock = fromData[formData.product_id];
        let availableQty = 0;
        
        if (productStock) {
            if (formData.stock_type === 'new_stock') {
                availableQty = productStock.new_stock || 0;
            } else {
                availableQty = productStock.old_stock || 0;
            }
        }
        
        if (parseInt(formData.quantity) > availableQty) {
            toast.error(`Insufficient ${formData.stock_type === 'new_stock' ? 'new' : 'old'} stock in ${fromStore}. Available: ${availableQty}`);
            return;
        }

        try {
            const payload = {
                product_id: parseInt(formData.product_id),
                from_store_id: parseInt(formData.from_store_id),
                to_store_id: parseInt(formData.to_store_id),
                stock_type: formData.stock_type,
                quantity: parseInt(formData.quantity)
            };

            await transferAPI.create(payload);
            toast.success(`✅ ${formData.quantity} units transferred from ${fromStore} to ${toStore}!`);
            setShowTransferModal(false);
            setFormData({
                product_id: '',
                from_store_id: '1',
                to_store_id: '2',
                stock_type: 'new_stock',
                quantity: ''
            });
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Transfer failed');
        }
    };

    const getAvailableStock = (productId, storeId, stockType) => {
        const storeData = storeId === 1 ? stockData.wholesale : stockData.retail;
        const product = storeData[productId];
        if (!product) return 0;
        return stockType === 'new_stock' ? (product.new_stock || 0) : (product.old_stock || 0);
    };

    const getProductName = (productId) => {
        const product = products.find(p => p.id === productId);
        return product ? product.name : 'Unknown Product';
    };

    const getStoreName = (storeId) => {
        return storeId === 1 ? '🏪 Wholesale' : '🛒 Retail';
    };

    const getStockTypeLabel = (type) => {
        return type === 'new_stock' ? '🆕 New' : '📦 Old';
    };

    const getStockTypeColor = (type) => {
        return type === 'new_stock' ? 'text-green-600' : 'text-amber-600';
    };

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
                        {[1, 2, 3].map(i => (
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
                        <h1 className="text-xl font-bold text-gray-800">🔄 Stock Transfers</h1>
                        <p className="text-xs text-gray-400">Move stock between wholesale and retail stores</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowTransferModal(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition"
                    >
                        + New Transfer
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
                        <p className="text-xs text-gray-500">Total Transfers</p>
                        <p className="text-2xl font-bold text-gray-800">{transfers.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Total Units Moved</p>
                        <p className="text-2xl font-bold text-purple-600">
                            {transfers.reduce((sum, t) => sum + t.quantity, 0)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Wholesale → Retail</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {transfers.filter(t => t.from_store_name === 'wholesale' && t.to_store_name === 'retail').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Retail → Wholesale</p>
                        <p className="text-2xl font-bold text-orange-600">
                            {transfers.filter(t => t.from_store_name === 'retail' && t.to_store_name === 'wholesale').length}
                        </p>
                    </div>
                </div>

                {/* Transfer History */}
                {transfers.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="text-6xl mb-4">🔄</div>
                        <p className="text-gray-500 text-lg">No transfers yet</p>
                        <p className="text-gray-400 text-sm">Click "New Transfer" to move stock between stores</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transferred By</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transfers.map((transfer) => (
                                        <tr key={transfer.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                {transfer.product_name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                    {transfer.from_store_name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                    {transfer.to_store_name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-medium ${getStockTypeColor(transfer.stock_type)}`}>
                                                    {getStockTypeLabel(transfer.stock_type)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-gray-700">
                                                {transfer.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {transfer.transferred_by_name || 'System Admin'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {new Date(transfer.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">🔄 New Transfer</h2>
                            <button
                                onClick={() => setShowTransferModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleTransfer}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                                <select
                                    value={formData.product_id}
                                    onChange={(e) => {
                                        setFormData({ ...formData, product_id: e.target.value });
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                                    required
                                >
                                    <option value="">Select product...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">From Store *</label>
                                    <select
                                        value={formData.from_store_id}
                                        onChange={(e) => setFormData({ ...formData, from_store_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                                        required
                                    >
                                        <option value="1">🏪 Wholesale</option>
                                        <option value="2">🛒 Retail</option>
                                    </select>
                                    {formData.product_id && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Available: {getAvailableStock(
                                                parseInt(formData.product_id),
                                                parseInt(formData.from_store_id),
                                                formData.stock_type
                                            )} units
                                        </p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">To Store *</label>
                                    <select
                                        value={formData.to_store_id}
                                        onChange={(e) => setFormData({ ...formData, to_store_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                                        required
                                    >
                                        <option value="1">🏪 Wholesale</option>
                                        <option value="2">🛒 Retail</option>
                                    </select>
                                </div>
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

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                                    required
                                    min="1"
                                />
                                {formData.product_id && formData.from_store_id && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Max available: {getAvailableStock(
                                            parseInt(formData.product_id),
                                            parseInt(formData.from_store_id),
                                            formData.stock_type
                                        )} units
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition"
                                >
                                    Transfer Stock
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowTransferModal(false)}
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

export default AdminTransfers;