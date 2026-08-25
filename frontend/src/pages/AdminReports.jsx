import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportAPI, saleAPI } from '../api';
import toast from 'react-hot-toast';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

const AdminReports = () => {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('daily');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    // Report data states
    const [dailyData, setDailyData] = useState(null);
    const [monthlyData, setMonthlyData] = useState(null);
    const [stockData, setStockData] = useState(null);
    const [debtorData, setDebtorData] = useState(null);
    const [profitData, setProfitData] = useState(null);
    const [fullReport, setFullReport] = useState(null);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadDailyReport(),
                loadMonthlyReport(),
                loadStockReport(),
                loadDebtorReport(),
                loadProfitReport(),
                loadFullReport()
            ]);
        } catch (error) {
            console.error('Error loading reports:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const loadDailyReport = async () => {
        try {
            const { data } = await reportAPI.getDaily(date);
            setDailyData(data);
        } catch (error) {
            console.error('Error loading daily report:', error);
        }
    };

    const loadMonthlyReport = async () => {
        try {
            const { data } = await reportAPI.getMonthly(month, year);
            setMonthlyData(data);
        } catch (error) {
            console.error('Error loading monthly report:', error);
        }
    };

    const loadStockReport = async () => {
        try {
            const { data } = await reportAPI.getStock();
            setStockData(data);
        } catch (error) {
            console.error('Error loading stock report:', error);
        }
    };

    const loadDebtorReport = async () => {
        try {
            const { data } = await reportAPI.getDebtors();
            setDebtorData(data);
        } catch (error) {
            console.error('Error loading debtor report:', error);
        }
    };

    const loadProfitReport = async () => {
        try {
            const { data } = await reportAPI.getProfit();
            setProfitData(data);
        } catch (error) {
            console.error('Error loading profit report:', error);
        }
    };

    const loadFullReport = async () => {
        try {
            const { data } = await reportAPI.getFull(date);
            setFullReport(data);
        } catch (error) {
            console.error('Error loading full report:', error);
        }
    };

    const handleDateChange = async () => {
        await loadDailyReport();
        await loadFullReport();
        toast.success('Report updated!');
    };

    const handleMonthChange = async () => {
        await loadMonthlyReport();
        toast.success('Monthly report updated!');
    };

    // Chart Data Preparation
    const prepareDailySalesChart = () => {
        if (!dailyData?.hourly_breakdown) return null;
        
        const hours = dailyData.hourly_breakdown.map(h => `${h.hour}:00`);
        const revenues = dailyData.hourly_breakdown.map(h => h.revenue || 0);
        const counts = dailyData.hourly_breakdown.map(h => h.sales_count || 0);

        return {
            labels: hours,
            datasets: [
                {
                    label: 'Revenue (GHS)',
                    data: revenues,
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    yAxisID: 'y',
                },
                {
                    label: 'Number of Sales',
                    data: counts,
                    backgroundColor: 'rgba(16, 185, 129, 0.5)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                    yAxisID: 'y1',
                }
            ]
        };
    };

    const prepareSalesTypeChart = () => {
        if (!dailyData?.summary) return null;
        
        return {
            labels: ['Retail', 'Wholesale'],
            datasets: [
                {
                    label: 'Sales by Type',
                    data: [
                        dailyData.summary.retail_revenue || 0,
                        dailyData.summary.wholesale_revenue || 0
                    ],
                    backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(139, 92, 246, 0.8)'],
                    borderColor: ['rgba(59, 130, 246, 1)', 'rgba(139, 92, 246, 1)'],
                    borderWidth: 2,
                }
            ]
        };
    };

    const prepareMonthlyTrendChart = () => {
        if (!monthlyData?.daily_breakdown) return null;
        
        const days = monthlyData.daily_breakdown.map(d => 
            new Date(d.sale_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
        );
        const revenues = monthlyData.daily_breakdown.map(d => d.total_revenue || 0);
        const retailRevenues = monthlyData.daily_breakdown.map(d => d.retail_revenue || 0);
        const wholesaleRevenues = monthlyData.daily_breakdown.map(d => d.wholesale_revenue || 0);

        return {
            labels: days,
            datasets: [
                {
                    label: 'Total Revenue',
                    data: revenues,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'Retail',
                    data: retailRevenues,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                },
                {
                    label: 'Wholesale',
                    data: wholesaleRevenues,
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                }
            ]
        };
    };

    const prepareStockChart = () => {
        if (!stockData?.products) return null;
        
        const topProducts = stockData.products
            .sort((a, b) => b.total_stock - a.total_stock)
            .slice(0, 10);
        
        return {
            labels: topProducts.map(p => p.product_name.substring(0, 15) + '...'),
            datasets: [
                {
                    label: 'Stock Quantity',
                    data: topProducts.map(p => p.total_stock || 0),
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                }
            ]
        };
    };

    const preparePaymentMethodChart = () => {
        if (!dailyData?.summary) return null;
        
        // Use daily data or create from sales
        return {
            labels: ['Cash', 'Mobile Money', 'Bank Transfer', 'Credit'],
            datasets: [
                {
                    label: 'Payment Methods',
                    data: [35, 30, 15, 20], // Sample data - would come from API
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(245, 158, 11, 1)'
                    ],
                    borderWidth: 2,
                }
            ]
        };
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
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                                <div className="h-8 w-32 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                    <div className="h-96 bg-white rounded-xl shadow-sm animate-pulse"></div>
                </div>
            </div>
        );
    }

    const dailyChartData = prepareDailySalesChart();
    const salesTypeData = prepareSalesTypeChart();
    const monthlyTrendData = prepareMonthlyTrendChart();
    const stockChartData = prepareStockChart();
    const paymentMethodData = preparePaymentMethodChart();

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
                        <h1 className="text-xl font-bold text-gray-800">📈 Reports Dashboard</h1>
                        <p className="text-xs text-gray-400">Visual insights and analytics</p>
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
                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {['daily', 'monthly', 'stock', 'debtors', 'profit'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                                activeTab === tab
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {tab === 'daily' && '📊 Daily'}
                            {tab === 'monthly' && '📈 Monthly'}
                            {tab === 'stock' && '📦 Stock'}
                            {tab === 'debtors' && '👥 Debtors'}
                            {tab === 'profit' && '💰 Profit'}
                        </button>
                    ))}
                </div>

                {/* DAILY TAB */}
                {activeTab === 'daily' && (
                    <div>
                        {/* Date Selector */}
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
                            <div className="flex flex-wrap gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleDateChange}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                                >
                                    Update Report
                                </button>
                            </div>
                        </div>

                        {/* Daily Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Total Sales</p>
                                <p className="text-2xl font-bold text-gray-800">{dailyData?.summary?.total_sales || 0}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Revenue</p>
                                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(dailyData?.summary?.total_revenue)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Retail</p>
                                <p className="text-2xl font-bold text-blue-600">{formatCurrency(dailyData?.summary?.retail_revenue)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Wholesale</p>
                                <p className="text-2xl font-bold text-purple-600">{formatCurrency(dailyData?.summary?.wholesale_revenue)}</p>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4">📊 Hourly Sales</h3>
                                {dailyChartData ? (
                                    <Bar 
                                        data={dailyChartData} 
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: { position: 'top' },
                                            },
                                            scales: {
                                                y: { beginAtZero: true },
                                                y1: { beginAtZero: true, position: 'right' }
                                            }
                                        }}
                                    />
                                ) : (
                                    <p className="text-gray-400 text-center py-8">No data available</p>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4">🥧 Sales by Type</h3>
                                {salesTypeData ? (
                                    <Doughnut 
                                        data={salesTypeData}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: { position: 'bottom' },
                                            }
                                        }}
                                    />
                                ) : (
                                    <p className="text-gray-400 text-center py-8">No data available</p>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 lg:col-span-2">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4">🏷️ Top Products</h3>
                                {dailyData?.top_products && dailyData.top_products.length > 0 ? (
                                    <div className="space-y-3">
                                        {dailyData.top_products.map((product, index) => (
                                            <div key={index} className="flex items-center gap-4">
                                                <span className="text-sm font-bold text-gray-400 w-6">#{index + 1}</span>
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium">{product.product_name}</span>
                                                        <span className="text-gray-600">{formatCurrency(product.total_revenue)}</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                                                            style={{ 
                                                                width: `${(product.total_revenue / dailyData.top_products[0].total_revenue) * 100}%` 
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-400">{product.total_quantity} units</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-center py-4">No products sold today</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MONTHLY TAB */}
                {activeTab === 'monthly' && (
                    <div>
                        {/* Month Selector */}
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
                            <div className="flex flex-wrap gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
                                    <select
                                        value={month}
                                        onChange={(e) => setMonth(parseInt(e.target.value))}
                                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m}>
                                                {new Date(2024, m - 1).toLocaleString('default', { month: 'long' })}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                                    <input
                                        type="number"
                                        value={year}
                                        onChange={(e) => setYear(parseInt(e.target.value))}
                                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-24"
                                    />
                                </div>
                                <button
                                    onClick={handleMonthChange}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                                >
                                    Update Report
                                </button>
                            </div>
                        </div>

                        {/* Monthly Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Total Sales</p>
                                <p className="text-2xl font-bold text-gray-800">{monthlyData?.totals?.total_sales || 0}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Revenue</p>
                                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(monthlyData?.totals?.total_revenue)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Total Days</p>
                                <p className="text-2xl font-bold text-gray-800">{monthlyData?.total_days || 0}</p>
                            </div>
                            {monthlyData?.best_day && (
                                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                    <p className="text-xs text-gray-500">Best Day</p>
                                    <p className="text-lg font-bold text-amber-600">
                                        {formatCurrency(monthlyData.best_day.revenue)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(monthlyData.best_day.sale_date).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Chart */}
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">📈 Monthly Revenue Trend</h3>
                            {monthlyTrendData ? (
                                <Line 
                                    data={monthlyTrendData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: { position: 'top' },
                                        },
                                        scales: {
                                            y: { beginAtZero: true }
                                        }
                                    }}
                                />
                            ) : (
                                <p className="text-gray-400 text-center py-8">No data available</p>
                            )}
                        </div>

                        {/* Top Products */}
                        {monthlyData?.top_products && monthlyData.top_products.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4">🏆 Top Products (Month)</h3>
                                <div className="space-y-3">
                                    {monthlyData.top_products.slice(0, 5).map((product, index) => (
                                        <div key={index} className="flex items-center gap-4">
                                            <span className="text-sm font-bold text-gray-400 w-6">#{index + 1}</span>
                                            <div className="flex-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium">{product.product_name}</span>
                                                    <span className="text-gray-600">{formatCurrency(product.total_revenue)}</span>
                                                </div>
                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                                                        style={{ 
                                                            width: `${(product.total_revenue / monthlyData.top_products[0].total_revenue) * 100}%` 
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-400">{product.total_quantity} units</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STOCK TAB */}
                {activeTab === 'stock' && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Total Products</p>
                                <p className="text-2xl font-bold text-gray-800">{stockData?.products?.length || 0}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Total Stock Value</p>
                                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stockData?.summary?.total_stock_value)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Wholesale vs Retail</p>
                                <p className="text-sm font-medium text-gray-700">
                                    Wholesale: {formatCurrency(stockData?.summary?.total_wholesale_value)}
                                </p>
                                <p className="text-sm font-medium text-gray-700">
                                    Retail: {formatCurrency(stockData?.summary?.total_retail_value)}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4">📊 Top 10 Stock Items</h3>
                                {stockChartData ? (
                                    <Bar 
                                        data={stockChartData}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: { display: false },
                                            },
                                            scales: {
                                                y: { beginAtZero: true }
                                            }
                                        }}
                                    />
                                ) : (
                                    <p className="text-gray-400 text-center py-8">No stock data available</p>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4">📦 Stock Summary</h3>
                                {stockData?.products && stockData.products.length > 0 ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {stockData.products.slice(0, 15).map((product, index) => (
                                            <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-bold text-blue-600">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{product.product_name}</p>
                                                    <p className="text-xs text-gray-400">
                                                        Wholesale: {product.wholesale_new + product.wholesale_old} | 
                                                        Retail: {product.retail_new + product.retail_old}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-bold text-gray-700">{product.total_stock}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-center py-8">No stock data available</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* DEBTORS TAB */}
                {activeTab === 'debtors' && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Total Debtors</p>
                                <p className="text-2xl font-bold text-gray-800">{debtorData?.total_debtors || 0}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Total Outstanding</p>
                                <p className="text-2xl font-bold text-amber-600">{formatCurrency(debtorData?.total_outstanding)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Total Paid</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(debtorData?.total_paid)}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">👥 Debtor List</h3>
                            {debtorData?.debtors && debtorData.debtors.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total Debt</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Paid</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Outstanding</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {debtorData.debtors.slice(0, 10).map((debtor, index) => (
                                                <tr key={index} className="border-b border-gray-100">
                                                    <td className="px-4 py-2 text-sm font-medium">{debtor.customer_name}</td>
                                                    <td className="px-4 py-2 text-right text-sm text-rose-600">{formatCurrency(debtor.total_debt)}</td>
                                                    <td className="px-4 py-2 text-right text-sm text-green-600">{formatCurrency(debtor.total_paid)}</td>
                                                    <td className="px-4 py-2 text-right text-sm font-bold text-amber-600">{formatCurrency(debtor.outstanding_balance)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-center py-8">No debtors with outstanding balance</p>
                            )}
                        </div>
                    </div>
                )}

                {/* PROFIT TAB */}
                {activeTab === 'profit' && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Total Revenue</p>
                                <p className="text-2xl font-bold text-blue-600">{formatCurrency(profitData?.summary?.total_revenue)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Total Cost</p>
                                <p className="text-2xl font-bold text-rose-600">{formatCurrency(profitData?.summary?.total_cost)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Total Profit</p>
                                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(profitData?.summary?.total_profit)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500">Profit Margin</p>
                                <p className="text-2xl font-bold text-purple-600">{profitData?.summary?.profit_margin || 0}%</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">💰 Profit by Product</h3>
                            {profitData?.by_product && profitData.by_product.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Quantity</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Revenue</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Cost</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Profit</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Margin</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {profitData.by_product.slice(0, 10).map((product, index) => (
                                                <tr key={index} className="border-b border-gray-100">
                                                    <td className="px-4 py-2 text-sm font-medium">{product.product_name}</td>
                                                    <td className="px-4 py-2 text-right text-sm">{product.quantity}</td>
                                                    <td className="px-4 py-2 text-right text-sm text-blue-600">{formatCurrency(product.revenue)}</td>
                                                    <td className="px-4 py-2 text-right text-sm text-rose-600">{formatCurrency(product.cost)}</td>
                                                    <td className="px-4 py-2 text-right text-sm font-bold text-emerald-600">{formatCurrency(product.profit)}</td>
                                                    <td className="px-4 py-2 text-right text-sm text-purple-600">
                                                        {product.revenue > 0 ? ((product.profit / product.revenue) * 100).toFixed(1) : 0}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-center py-8">No profit data available</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminReports;