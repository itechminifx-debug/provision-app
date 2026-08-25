import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../api';
import toast from 'react-hot-toast';

const AdminUsers = () => {
    const { user, logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'cashier',
        store_id: '1'
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const { data } = await userAPI.getAll();
            setUsers(data || []);
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                store_id: parseInt(formData.store_id)
            };

            await userAPI.createCashier(payload);
            toast.success('Cashier created successfully!');
            setShowAddModal(false);
            setFormData({
                full_name: '',
                email: '',
                password: '',
                role: 'cashier',
                store_id: '1'
            });
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create user');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await userAPI.deleteUser(id);
            toast.success('User deleted successfully!');
            loadUsers();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const getRoleBadge = (role) => {
        if (role === 'admin') {
            return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">👑 Admin</span>;
        }
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">🧾 Cashier</span>;
    };

    const getStoreLabel = (storeId) => {
        if (storeId === 1) return '🏪 Wholesale';
        if (storeId === 2) return '🛒 Retail';
        return '—';
    };

    const getStatusBadge = (user) => {
        if (user.id === parseInt(localStorage.getItem('userId'))) {
            return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">You</span>;
        }
        return null;
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
                        <h1 className="text-xl font-bold text-gray-800">👤 Users Management</h1>
                        <p className="text-xs text-gray-400">Manage cashiers and administrators</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700 transition"
                    >
                        + Add Cashier
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
                        <p className="text-xs text-gray-500">Total Users</p>
                        <p className="text-2xl font-bold text-gray-800">{users.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Admins</p>
                        <p className="text-2xl font-bold text-purple-600">
                            {users.filter(u => u.role === 'admin').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Cashiers</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {users.filter(u => u.role === 'cashier').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Active Stores</p>
                        <p className="text-2xl font-bold text-teal-600">
                            {new Set(users.map(u => u.store_id).filter(Boolean)).size}
                        </p>
                    </div>
                </div>

                {/* Users Table */}
                {users.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="text-6xl mb-4">👤</div>
                        <p className="text-gray-500 text-lg">No users found</p>
                        <p className="text-gray-400 text-sm">Click "Add Cashier" to create a new user</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((userItem) => (
                                        <tr key={userItem.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                        {userItem.full_name.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-gray-800">{userItem.full_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{userItem.email}</td>
                                            <td className="px-4 py-3">{getRoleBadge(userItem.role)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{getStoreLabel(userItem.store_id)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {new Date(userItem.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getStatusBadge(userItem)}
                                                {!getStatusBadge(userItem) && (
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {userItem.role === 'cashier' && (
                                                    <button
                                                        onClick={() => handleDeleteUser(userItem.id)}
                                                        className="text-red-500 hover:text-red-700 text-sm font-medium transition"
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                )}
                                                {userItem.role === 'admin' && (
                                                    <span className="text-xs text-gray-400">Cannot delete</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Cashier Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">👤 Add Cashier</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleAddUser}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition"
                                    required
                                    placeholder="John Doe"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition"
                                    required
                                    placeholder="john@provision.com"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition"
                                    required
                                    placeholder="Min 6 characters"
                                    minLength="6"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Store Assignment *</label>
                                <select
                                    value={formData.store_id}
                                    onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition"
                                    required
                                >
                                    <option value="1">🏪 Wholesale Store</option>
                                    <option value="2">🛒 Retail Store</option>
                                </select>
                            </div>

                            <div className="mb-6 p-3 bg-blue-50 rounded-xl">
                                <p className="text-xs text-blue-600">
                                    💡 Cashiers will only have access to sales and receipts for their assigned store.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition"
                                >
                                    Create Cashier
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

export default AdminUsers;