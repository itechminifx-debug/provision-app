import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productAPI } from '../api';
import toast from 'react-hot-toast';

const AdminProducts = () => {
    const { user, logout } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        wholesale_price: '',
        retail_price: '',
        cost_price: ''
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const { data } = await productAPI.getAll();
            setProducts(data);
        } catch (error) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                wholesale_price: parseFloat(formData.wholesale_price),
                retail_price: parseFloat(formData.retail_price),
                cost_price: parseFloat(formData.cost_price)
            };

            if (editingProduct) {
                await productAPI.update(editingProduct.id, payload);
                toast.success('Product updated successfully!');
            } else {
                await productAPI.create(payload);
                toast.success('Product created successfully!');
            }
            loadProducts();
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Something went wrong');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await productAPI.delete(id);
            toast.success('Product deleted successfully!');
            loadProducts();
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                category: product.category || '',
                wholesale_price: product.wholesale_price,
                retail_price: product.retail_price,
                cost_price: product.cost_price
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                category: '',
                wholesale_price: '',
                retail_price: '',
                cost_price: ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setFormData({
            name: '',
            category: '',
            wholesale_price: '',
            retail_price: '',
            cost_price: ''
        });
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                                <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 w-1/2 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 w-2/3 bg-gray-200 rounded"></div>
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
                        <h1 className="text-xl font-bold text-gray-800">📦 Products</h1>
                        <p className="text-xs text-gray-400">Manage your product inventory</p>
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
                {/* Stats & Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Total Products</p>
                        <p className="text-2xl font-bold text-gray-800">{products.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Categories</p>
                        <p className="text-2xl font-bold text-gray-800">
                            {new Set(products.map(p => p.category).filter(Boolean)).size}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 col-span-2">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                                />
                            </div>
                            <button
                                onClick={() => openModal()}
                                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition whitespace-nowrap"
                            >
                                + Add Product
                            </button>
                        </div>
                    </div>
                </div>

                {/* Product Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-gray-500 text-lg">No products found</p>
                        <p className="text-gray-400 text-sm">Click "Add Product" to create your first product</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center text-2xl">
                                        🏷️
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openModal(product)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                                {product.category && (
                                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full mt-1">
                                        {product.category}
                                    </span>
                                )}

                                <div className="mt-3 grid grid-cols-3 gap-1 text-xs">
                                    <div className="bg-green-50 rounded-lg p-2 text-center">
                                        <p className="text-green-600 font-semibold">GHS {product.retail_price}</p>
                                        <p className="text-gray-400">Retail</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                                        <p className="text-blue-600 font-semibold">GHS {product.wholesale_price}</p>
                                        <p className="text-gray-400">Wholesale</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                        <p className="text-gray-600 font-semibold">GHS {product.cost_price}</p>
                                        <p className="text-gray-400">Cost</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingProduct ? '✏️ Edit Product' : '📦 Add Product'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    placeholder="e.g., Grains, Beverages, Snacks"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price (GHS) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.retail_price}
                                        onChange={(e) => setFormData({ ...formData, retail_price: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Price (GHS) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.wholesale_price}
                                        onChange={(e) => setFormData({ ...formData, wholesale_price: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (GHS) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.cost_price}
                                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                                >
                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
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

export default AdminProducts;