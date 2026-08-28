import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { saleAPI, productAPI, stockAPI } from '../api';
import toast from 'react-hot-toast';

const CashierDashboard = () => {
    const { user, logout } = useAuth();
    const [products, setProducts] = useState([]);
    const [stockData, setStockData] = useState([]);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [saleType, setSaleType] = useState('retail');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [loading, setLoading] = useState(false);
    const [showReceipt, setShowReceipt] = useState(null);
    const [recentSales, setRecentSales] = useState([]);
    const searchRef = useRef(null);

    useEffect(() => {
        loadProducts();
        loadStock();
        loadRecentSales();
        setTimeout(() => searchRef.current?.focus(), 500);
    }, []);

    const loadProducts = async () => {
        try {
            const { data } = await productAPI.getAll();
            setProducts(data);
        } catch (error) {
            toast.error('Failed to load products');
        }
    };

    const loadStock = async () => {
        try {
            const { data } = await stockAPI.getSummary();
            setStockData(data);
        } catch (error) {
            // Silent fail
        }
    };

    const loadRecentSales = async () => {
        try {
            const { data } = await saleAPI.getAll();
            setRecentSales(data.slice(0, 5));
        } catch (error) {
            // Silent fail
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    // Get stock quantity for a product
    const getStockQuantity = (productId) => {
        const storeId = saleType === 'wholesale' ? 1 : 2;
        const stockItem = stockData.find(item => 
            item.product_id === productId && 
            item.store_id === storeId
        );
        return stockItem ? stockItem.quantity : 0;
    };

    const addToCart = (product) => {
        const price = saleType === 'retail' ? parseFloat(product.retail_price) : parseFloat(product.wholesale_price);
        const stockQty = getStockQuantity(product.id);
        
        if (stockQty <= 0) {
            toast.error('Product is out of stock!');
            return;
        }

        const existing = cart.find(item => item.product_id === product.id);
        
        if (existing) {
            if (existing.quantity >= stockQty) {
                toast.error('Not enough stock available!');
                return;
            }
            setCart(cart.map(item =>
                item.product_id === product.id
                    ? { ...item, quantity: item.quantity + 1, total: price * (item.quantity + 1) }
                    : item
            ));
        } else {
            setCart([...cart, {
                product_id: product.id,
                name: product.name,
                price: price,
                quantity: 1,
                total: price
            }]);
        }
        toast.success(`Added ${product.name}`, { duration: 1000 });
    };

    const removeFromCart = (productId) => {
        const item = cart.find(i => i.product_id === productId);
        if (!item) return;

        if (item.quantity > 1) {
            setCart(cart.map(i =>
                i.product_id === productId
                    ? { ...i, quantity: i.quantity - 1, total: i.price * (i.quantity - 1) }
                    : i
            ));
        } else {
            setCart(cart.filter(i => i.product_id !== productId));
        }
    };

    const clearCart = () => {
        setCart([]);
        setCustomerName('');
        setAmountPaid('');
    };

    const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleSale = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        if (paymentMethod === 'credit' && !customerName.trim()) {
            toast.error('Customer name required for credit sales');
            return;
        }

        setLoading(true);
        try {
            let storeId;
            if (saleType === 'wholesale') {
                storeId = 1;
            } else {
                storeId = 2;
            }

            const payload = {
                store_id: storeId,
                sale_type: saleType,
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                })),
                amount_paid: parseFloat(amountPaid) || totalAmount,
                payment_method: paymentMethod,
                customer_name: customerName.trim() || undefined
            };

            const { data } = await saleAPI.create(payload);
            
            setShowReceipt({
                invoice: data.sale.sale.invoice_number,
                items: data.sale.items,
                total: data.sale.total_amount,
                paid: data.sale.sale.amount_paid,
                balance: data.sale.balance_due,
                customer: customerName || 'Walk-in',
                paymentMethod: paymentMethod,
                saleType: saleType,
                cashier: user.full_name,
                date: new Date(data.sale.sale.created_at).toLocaleString()
            });

            toast.success('🎉 Sale completed successfully!');
            loadRecentSales();
            loadStock(); // Refresh stock after sale
            clearCart();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Sale failed');
        } finally {
            setLoading(false);
        }
    };

    // Receipt Modal
    if (showReceipt) {
        return (
            <div className="min-h-screen bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 fixed inset-0 z-50">
                <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
                    <div className="text-center border-b pb-4">
                        <div className="text-4xl mb-2">🧾</div>
                        <h2 className="text-xl font-bold text-gray-800">Receipt</h2>
                        <p className="text-sm text-gray-500 font-mono">{showReceipt.invoice}</p>
                    </div>
                    
                    <div className="py-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Cashier:</span>
                            <span className="font-medium">{showReceipt.cashier}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Customer:</span>
                            <span className="font-medium">{showReceipt.customer}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Type:</span>
                            <span className="font-medium capitalize">{showReceipt.saleType}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Payment:</span>
                            <span className="font-medium capitalize">{showReceipt.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Date:</span>
                            <span className="font-medium">{showReceipt.date}</span>
                        </div>
                    </div>

                    <div className="border-t border-b py-3 space-y-2">
                        {showReceipt.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span>{item.product_name || 'Product'}</span>
                                <span className="font-medium">{item.quantity} × GHS {item.unit_price} = GHS {item.total_price}</span>
                            </div>
                        ))}
                    </div>

                    <div className="py-3 space-y-1">
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span className="text-emerald-600">GHS {showReceipt.total}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Paid:</span>
                            <span>GHS {showReceipt.paid}</span>
                        </div>
                        {showReceipt.balance > 0 && (
                            <div className="flex justify-between text-sm text-rose-600 font-bold">
                                <span>Balance Due:</span>
                                <span>GHS {showReceipt.balance}</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowReceipt(null)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                    >
                        Continue Selling
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm p-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                        🧾
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Point of Sale</h1>
                        <p className="text-xs text-gray-400">{user?.full_name} · {user?.store_id === 1 ? 'Wholesale' : 'Retail'}</p>
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

            <div className="p-4 max-w-6xl mx-auto">
                {/* Sale Settings */}
                <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 font-medium mb-1.5">Sale Type</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSaleType('retail')}
                                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        saleType === 'retail' 
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    🏪 Retail
                                </button>
                                <button
                                    onClick={() => setSaleType('wholesale')}
                                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        saleType === 'wholesale' 
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    📦 Wholesale
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 font-medium mb-1.5">Payment Method</label>
                            <div className="flex gap-1.5 flex-wrap">
                                {['cash', 'mobile_money', 'bank_transfer', 'credit'].map(method => (
                                    <button
                                        key={method}
                                        onClick={() => setPaymentMethod(method)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                            paymentMethod === method 
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {method.replace('_', ' ').toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 font-medium mb-1.5">Amount Paid</label>
                            <input
                                type="number"
                                placeholder="Auto"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 font-medium mb-1.5">Customer</label>
                            <input
                                type="text"
                                placeholder={paymentMethod === 'credit' ? 'Name required*' : 'Optional'}
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 outline-none transition ${
                                    paymentMethod === 'credit' && !customerName 
                                        ? 'border-rose-300 focus:ring-rose-500' 
                                        : 'border-gray-200 focus:ring-blue-500'
                                }`}
                                required={paymentMethod === 'credit'}
                            />
                            {paymentMethod === 'credit' && !customerName && (
                                <p className="text-rose-500 text-xs mt-1">Customer name required for credit</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Product Grid */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                                <input
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                                />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 max-h-[400px] overflow-y-auto">
                                {filteredProducts.slice(0, 24).map(product => {
                                    const price = saleType === 'retail' ? product.retail_price : product.wholesale_price;
                                    const stockQty = getStockQuantity(product.id);
                                    const isLowStock = stockQty < 10 && stockQty > 0;
                                    const isOutOfStock = stockQty === 0;
                                    
                                    return (
                                        <button
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            disabled={isOutOfStock}
                                            className={`group bg-gray-50 hover:bg-blue-50 p-4 rounded-xl text-left transition-all duration-200 hover:shadow-md hover:scale-[1.02] border ${
                                                isOutOfStock 
                                                    ? 'border-red-200 opacity-50 cursor-not-allowed' 
                                                    : isLowStock 
                                                        ? 'border-orange-300' 
                                                        : 'border-transparent hover:border-blue-200'
                                            }`}
                                        >
                                            <div className="font-medium text-sm text-gray-800 truncate">{product.name}</div>
                                            <div className="text-sm font-bold text-emerald-600 mt-1">GHS {price}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{product.category || 'General'}</div>
                                            
                                            {/* Stock Quantity Display */}
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                    isOutOfStock 
                                                        ? 'bg-red-100 text-red-700' 
                                                        : isLowStock 
                                                            ? 'bg-orange-100 text-orange-700' 
                                                            : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {isOutOfStock ? 'Out of Stock' : `${stockQty} in stock`}
                                                </span>
                                                {isLowStock && (
                                                    <span className="text-xs text-orange-500">⚠️ Low Stock</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {filteredProducts.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    <div className="text-4xl mb-2">🔍</div>
                                    <p>No products found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 sticky top-24">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                    🛒 Cart
                                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">{itemCount}</span>
                                </h2>
                                {cart.length > 0 && (
                                    <button
                                        onClick={clearCart}
                                        className="text-rose-500 text-sm hover:text-rose-700 transition"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {cart.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4 opacity-30">🛒</div>
                                    <p className="text-gray-400 text-sm">Cart is empty</p>
                                    <p className="text-gray-300 text-xs">Add products above</p>
                                </div>
                            ) : (
                                <>
                                    <div className="max-h-64 overflow-y-auto space-y-1">
                                        {cart.map(item => (
                                            <div key={item.product_id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-xl transition">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm text-gray-800 truncate">{item.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        GHS {item.price} × {item.quantity}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-700">GHS {item.total}</span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => removeFromCart(item.product_id)}
                                                            className="bg-gray-100 hover:bg-rose-100 text-gray-600 hover:text-rose-600 w-7 h-7 rounded-lg text-sm font-bold transition"
                                                        >
                                                            −
                                                        </button>
                                                        <button
                                                            onClick={() => addToCart({ id: item.product_id, name: item.name, retail_price: item.price, wholesale_price: item.price })}
                                                            className="bg-gray-100 hover:bg-emerald-100 text-gray-600 hover:text-emerald-600 w-7 h-7 rounded-lg text-sm font-bold transition"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-gray-600 text-sm">Total Items</span>
                                            <span className="font-medium">{itemCount}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-lg font-bold">
                                            <span>Total</span>
                                            <span className="text-emerald-600">GHS {totalAmount}</span>
                                        </div>
                                        <button
                                            onClick={handleSale}
                                            disabled={loading || cart.length === 0}
                                            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processing...
                                                </span>
                                            ) : (
                                                '✅ Complete Sale'
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashierDashboard;