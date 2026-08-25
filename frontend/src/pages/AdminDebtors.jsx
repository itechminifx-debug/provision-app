import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { debtorAPI } from '../api';
import toast from 'react-hot-toast';

const AdminDebtors = () => {
    const { user, logout } = useAuth();
    const [debtors, setDebtors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDebtor, setSelectedDebtor] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [paymentData, setPaymentData] = useState({
        debtor_id: '',
        amount_paid: '',
        payment_method: 'cash'
    });
    const [formData, setFormData] = useState({
        customer_name: '',
        phone: ''
    });

    useEffect(() => {
        loadDebtors();
    }, []);

    const loadDebtors = async () => {
        try {
            setLoading(true);
            const { data } = await debtorAPI.getAll();
            setDebtors(data || []);
        } catch (error) {
            console.error('Error loading debtors:', error);
            toast.error('Failed to load debtors');
        } finally {
            setLoading(false);
        }
    };

    const handleAddDebtor = async (e) => {
        e.preventDefault();
        try {
            await debtorAPI.create(formData);
            toast.success('Debtor added successfully!');
            setShowAddModal(false);
            setFormData({ customer_name: '', phone: '' });
            loadDebtors();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add debtor');
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                debtor_id: parseInt(paymentData.debtor_id),
                amount_paid: parseFloat(paymentData.amount_paid),
                payment_method: paymentData.payment_method
            };

            await debtorAPI.recordPayment(payload);
            toast.success('Payment recorded successfully!');
            setShowPaymentModal(false);
            setPaymentData({ debtor_id: '', amount_paid: '', payment_method: 'cash' });
            loadDebtors();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to record payment');
        }
    };

    const viewPayments = async (debtorId) => {
        try {
            const { data } = await debtorAPI.getPayments(debtorId);
            const debtor = debtors.find(d => d.id === debtorId);
            setSelectedDebtor({ ...debtor, payments: data });
        } catch (error) {
            toast.error('Failed to load payment history');
        }
    };

    const closeDetail = () => {
        setSelectedDebtor(null);
    };

    const getPaymentMethodLabel = (method) => {
        const methods = {
            'cash': '💵 Cash',
            'mobile_money': '📱 Mobile Money',
            'bank_transfer': '🏦 Bank Transfer'
        };
        return methods[method] || method;
    };

    const getStatusColor = (outstanding) => {
        if (outstanding === 0) return 'bg-green-100 text-green-700';
        if (outstanding < 100) return 'bg-yellow-100 text-yellow-700';
        return 'bg-red-100 text-red-700';
    };

    const formatCurrency = (amount) => {
        return `GHS ${parseFloat(amount || 0).toLocaleString()}`;
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
                        <h1 className="text-xl font-bold text-gray-800">👥 Debtors Management</h1>
                        <p className="text-xs text-gray-400">Track customers with outstanding balances</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-rose-700 transition"
                    >
                        + Add Debtor
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
                        <p className="text-xs text-gray-500">Total Debtors</p>
                        <p className="text-2xl font-bold text-gray-800">{debtors.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Total Debt</p>
                        <p className="text-2xl font-bold text-rose-600">
                            {formatCurrency(debtors.reduce((sum, d) => sum + parseFloat(d.total_debt || 0), 0))}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Total Paid</p>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(debtors.reduce((sum, d) => sum + parseFloat(d.total_paid || 0), 0))}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Outstanding Balance</p>
                        <p className="text-2xl font-bold text-amber-600">
                            {formatCurrency(debtors.reduce((sum, d) => sum + parseFloat(d.outstanding_balance || 0), 0))}
                        </p>
                    </div>
                </div>

                {/* Debtors List */}
                {debtors.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="text-6xl mb-4">👥</div>
                        <p className="text-gray-500 text-lg">No debtors found</p>
                        <p className="text-gray-400 text-sm">Debtors will appear here when customers buy on credit</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Debt</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Paid</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Payments</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Payment</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {debtors.map((debtor) => (
                                        <tr key={debtor.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                {debtor.customer_name}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {debtor.phone || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center font-semibold text-rose-600">
                                                {formatCurrency(debtor.total_debt)}
                                            </td>
                                            <td className="px-4 py-3 text-center font-semibold text-green-600">
                                                {formatCurrency(debtor.total_paid)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(debtor.outstanding_balance)}`}>
                                                    {formatCurrency(debtor.outstanding_balance)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm text-gray-600">
                                                {debtor.payment_count || 0}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {debtor.last_payment_date 
                                                    ? new Date(debtor.last_payment_date).toLocaleDateString()
                                                    : 'No payments'
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setPaymentData({ ...paymentData, debtor_id: debtor.id });
                                                            setShowPaymentModal(true);
                                                        }}
                                                        disabled={debtor.outstanding_balance === 0}
                                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                                                            debtor.outstanding_balance > 0
                                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        💳 Record Payment
                                                    </button>
                                                    <button
                                                        onClick={() => viewPayments(debtor.id)}
                                                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition"
                                                    >
                                                        📋 History
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Debtor Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">👤 Add Debtor</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleAddDebtor}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                                <input
                                    type="text"
                                    value={formData.customer_name}
                                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition"
                                    required
                                    placeholder="Enter customer name"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition"
                                    placeholder="0244123456"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-semibold hover:bg-rose-700 transition"
                                >
                                    Add Debtor
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

            {/* Record Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">💳 Record Payment</h2>
                            <button
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setPaymentData({ debtor_id: '', amount_paid: '', payment_method: 'cash' });
                                }}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {paymentData.debtor_id && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-600">
                                    Customer: <span className="font-medium">
                                        {debtors.find(d => d.id === parseInt(paymentData.debtor_id))?.customer_name}
                                    </span>
                                </p>
                                <p className="text-sm text-gray-600">
                                    Outstanding: <span className="font-bold text-amber-600">
                                        {formatCurrency(debtors.find(d => d.id === parseInt(paymentData.debtor_id))?.outstanding_balance)}
                                    </span>
                                </p>
                            </div>
                        )}

                        <form onSubmit={handlePayment}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (GHS) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={paymentData.amount_paid}
                                    onChange={(e) => setPaymentData({ ...paymentData, amount_paid: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    required
                                    min="0.01"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['cash', 'mobile_money', 'bank_transfer'].map(method => (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => setPaymentData({ ...paymentData, payment_method: method })}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                                                paymentData.payment_method === method
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {method === 'cash' && '💵 Cash'}
                                            {method === 'mobile_money' && '📱 Mobile'}
                                            {method === 'bank_transfer' && '🏦 Bank'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                                >
                                    Record Payment
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPaymentModal(false);
                                        setPaymentData({ debtor_id: '', amount_paid: '', payment_method: 'cash' });
                                    }}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment History Modal */}
            {selectedDebtor && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">📋 Payment History</h2>
                                <p className="text-sm text-gray-500">{selectedDebtor.customer_name}</p>
                            </div>
                            <button
                                onClick={closeDetail}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
                            <div>
                                <p className="text-xs text-gray-500">Total Debt</p>
                                <p className="font-bold text-rose-600">{formatCurrency(selectedDebtor.total_debt)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total Paid</p>
                                <p className="font-bold text-green-600">{formatCurrency(selectedDebtor.total_paid)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Outstanding</p>
                                <p className={`font-bold ${selectedDebtor.outstanding_balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                    {formatCurrency(selectedDebtor.outstanding_balance)}
                                </p>
                            </div>
                        </div>

                        {selectedDebtor.payments && selectedDebtor.payments.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {selectedDebtor.payments.map((payment, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-medium text-green-600">+ {formatCurrency(payment.amount_paid)}</p>
                                            <p className="text-xs text-gray-500">
                                                {getPaymentMethodLabel(payment.payment_method)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">
                                                {payment.invoice_number || 'Direct Payment'}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(payment.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <p>No payment records found</p>
                            </div>
                        )}

                        <button
                            onClick={closeDetail}
                            className="w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDebtors;