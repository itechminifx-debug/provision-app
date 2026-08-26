const pool = require('../config/database');
const Sale = require('../models/Sale');

// ============================================
// 1. DAILY SALES REPORT
// ============================================
const getDailyReport = async (req, res) => {
    try {
        const { date } = req.query;
        const reportDate = date || new Date().toISOString().split('T')[0];
        
        // Daily summary
        const summary = await Sale.getDailySummary(reportDate);
        
        // Top products for the day
        const topProductsQuery = `
            SELECT 
                p.name AS product_name,
                SUM(si.quantity) AS total_quantity,
                SUM(si.total_price) AS total_revenue
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE s.created_at::date = $1
            GROUP BY p.name
            ORDER BY total_revenue DESC
            LIMIT 5
        `;
        const topProducts = await pool.query(topProductsQuery, [reportDate]);

        // Sales by hour
        const hourlyQuery = `
            SELECT 
                EXTRACT(HOUR FROM created_at) AS hour,
                COUNT(*) AS sales_count,
                SUM(total_amount) AS revenue
            FROM sales
            WHERE created_at::date = $1
            GROUP BY EXTRACT(HOUR FROM created_at)
            ORDER BY hour ASC
        `;
        const hourly = await pool.query(hourlyQuery, [reportDate]);

        res.json({
            date: reportDate,
            summary: summary || {
                total_sales: 0,
                total_revenue: 0,
                total_received: 0,
                total_outstanding: 0,
                retail_count: 0,
                wholesale_count: 0,
                retail_revenue: 0,
                wholesale_revenue: 0
            },
            top_products: topProducts.rows,
            hourly_breakdown: hourly.rows
        });
    } catch (error) {
        console.error('Get daily report error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// ============================================
// 2. MONTHLY SALES REPORT
// ============================================
const getMonthlyReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        const currentDate = new Date();
        const reportMonth = parseInt(month) || currentDate.getMonth() + 1;
        const reportYear = parseInt(year) || currentDate.getFullYear();

        // Daily breakdown for the month
        const dailyQuery = `
            SELECT 
                DATE(s.created_at) AS sale_date,
                COUNT(*) AS total_sales,
                SUM(total_amount) AS total_revenue,
                SUM(amount_paid) AS total_received,
                SUM(balance_due) AS total_outstanding,
                COUNT(CASE WHEN sale_type = 'retail' THEN 1 END) AS retail_count,
                COUNT(CASE WHEN sale_type = 'wholesale' THEN 1 END) AS wholesale_count,
                SUM(CASE WHEN sale_type = 'retail' THEN total_amount ELSE 0 END) AS retail_revenue,
                SUM(CASE WHEN sale_type = 'wholesale' THEN total_amount ELSE 0 END) AS wholesale_revenue
            FROM sales
            WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2
            GROUP BY DATE(s.created_at)
            ORDER BY sale_date DESC
        `;
        const daily = await pool.query(dailyQuery, [reportMonth, reportYear]);

        // Monthly totals
        const totalsQuery = `
            SELECT 
                COUNT(*) AS total_sales,
                SUM(total_amount) AS total_revenue,
                SUM(amount_paid) AS total_received,
                SUM(balance_due) AS total_outstanding,
                COUNT(CASE WHEN sale_type = 'retail' THEN 1 END) AS retail_count,
                COUNT(CASE WHEN sale_type = 'wholesale' THEN 1 END) AS wholesale_count,
                SUM(CASE WHEN sale_type = 'retail' THEN total_amount ELSE 0 END) AS retail_revenue,
                SUM(CASE WHEN sale_type = 'wholesale' THEN total_amount ELSE 0 END) AS wholesale_revenue
            FROM sales
            WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2
        `;
        const totals = await pool.query(totalsQuery, [reportMonth, reportYear]);

        // Top products for the month
        const topProductsQuery = `
            SELECT 
                p.name AS product_name,
                SUM(si.quantity) AS total_quantity,
                SUM(si.total_price) AS total_revenue
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE EXTRACT(MONTH FROM s.created_at) = $1 AND EXTRACT(YEAR FROM s.created_at) = $2
            GROUP BY p.name
            ORDER BY total_revenue DESC
            LIMIT 10
        `;
        const topProducts = await pool.query(topProductsQuery, [reportMonth, reportYear]);

        // Best performing day
        const bestDayQuery = `
            SELECT 
                DATE(created_at) AS sale_date,
                SUM(total_amount) AS revenue
            FROM sales
            WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2
            GROUP BY DATE(created_at)
            ORDER BY revenue DESC
            LIMIT 1
        `;
        const bestDay = await pool.query(bestDayQuery, [reportMonth, reportYear]);

        res.json({
            month: reportMonth,
            year: reportYear,
            month_name: new Date(reportYear, reportMonth - 1).toLocaleString('default', { month: 'long' }),
            totals: totals.rows[0] || {
                total_sales: 0,
                total_revenue: 0,
                total_received: 0,
                total_outstanding: 0,
                retail_count: 0,
                wholesale_count: 0,
                retail_revenue: 0,
                wholesale_revenue: 0
            },
            daily_breakdown: daily.rows,
            top_products: topProducts.rows,
            best_day: bestDay.rows[0] || null,
            total_days: daily.rows.length
        });
    } catch (error) {
        console.error('Get monthly report error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// ============================================
// 3. STOCK REPORT
// ============================================
const getStockReport = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id AS product_id,
                p.name AS product_name,
                p.category,
                p.wholesale_price,
                p.retail_price,
                p.cost_price,
                COALESCE(SUM(CASE WHEN s.name = 'wholesale' AND st.stock_type = 'new_stock' THEN st.quantity ELSE 0 END), 0) AS wholesale_new,
                COALESCE(SUM(CASE WHEN s.name = 'wholesale' AND st.stock_type = 'old_stock' THEN st.quantity ELSE 0 END), 0) AS wholesale_old,
                COALESCE(SUM(CASE WHEN s.name = 'retail' AND st.stock_type = 'new_stock' THEN st.quantity ELSE 0 END), 0) AS retail_new,
                COALESCE(SUM(CASE WHEN s.name = 'retail' AND st.stock_type = 'old_stock' THEN st.quantity ELSE 0 END), 0) AS retail_old,
                COALESCE(SUM(st.quantity), 0) AS total_stock
            FROM products p
            LEFT JOIN stock st ON p.id = st.product_id
            LEFT JOIN stores s ON st.store_id = s.id
            GROUP BY p.id, p.name, p.category, p.wholesale_price, p.retail_price, p.cost_price
            ORDER BY p.name ASC
        `;
        const result = await pool.query(query);
        
        // Calculate total stock value
        let total_stock_value = 0;
        let total_wholesale_value = 0;
        let total_retail_value = 0;
        
        for (const row of result.rows) {
            const total_qty = row.wholesale_new + row.wholesale_old + row.retail_new + row.retail_old;
            total_stock_value += total_qty * parseFloat(row.cost_price);
            total_wholesale_value += (row.wholesale_new + row.wholesale_old) * parseFloat(row.wholesale_price);
            total_retail_value += (row.retail_new + row.retail_old) * parseFloat(row.retail_price);
        }

        res.json({
            products: result.rows,
            summary: {
                total_products: result.rows.length,
                total_stock_value: total_stock_value,
                total_wholesale_value: total_wholesale_value,
                total_retail_value: total_retail_value
            }
        });
    } catch (error) {
        console.error('Get stock report error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// ============================================
// 4. LOW STOCK REPORT
// ============================================
const getLowStockReport = async (req, res) => {
    try {
        const { threshold } = req.query;
        const alertThreshold = parseInt(threshold) || 10;

        const query = `
            SELECT 
                p.id AS product_id,
                p.name AS product_name,
                s.name AS store_name,
                st.stock_type,
                st.quantity,
                p.wholesale_price,
                p.retail_price
            FROM stock st
            JOIN products p ON st.product_id = p.id
            JOIN stores s ON st.store_id = s.id
            WHERE st.quantity < $1 AND st.quantity > 0
            ORDER BY st.quantity ASC
        `;
        const result = await pool.query(query, [alertThreshold]);
        res.json(result.rows);
        
        const total_low_stock_items = result.rows.length;

        // Count low stock items by store
        const byStore = {};
        for (const row of result.rows) {
            if (!byStore[row.store_name]) {
                byStore[row.store_name] = 0;
            }
            byStore[row.store_name]++;
        }

        res.json({
            threshold: alertThreshold,
            total_low_stock_items: total_low_stock_items,
            by_store: byStore,
            items: result.rows
        });
    } catch (error) {
        console.error('Get low stock report error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// ============================================
// 5. DEBTOR REPORT
// ============================================
const getDebtorReport = async (req, res) => {
    try {
        const query = `
            SELECT 
                d.id,
                d.customer_name,
                d.phone,
                d.total_debt,
                COALESCE(SUM(p.amount_paid), 0) AS total_paid,
                d.total_debt - COALESCE(SUM(p.amount_paid), 0) AS outstanding_balance,
                COUNT(p.id) AS payment_count,
                MAX(p.created_at) AS last_payment_date,
                MIN(p.created_at) AS first_payment_date
            FROM debtors d
            LEFT JOIN payments p ON d.id = p.debtor_id
            GROUP BY d.id
            HAVING d.total_debt - COALESCE(SUM(p.amount_paid), 0) > 0
            ORDER BY outstanding_balance DESC
        `;
        const result = await pool.query(query);
        
        const total_outstanding = result.rows.reduce((sum, row) => sum + parseFloat(row.outstanding_balance), 0);
        const total_debt = result.rows.reduce((sum, row) => sum + parseFloat(row.total_debt), 0);

        res.json({
            summary: {
                total_debtors: result.rows.length,
                total_debt: total_debt,
                total_outstanding: total_outstanding,
                total_paid: total_debt - total_outstanding
            },
            debtors: result.rows
        });
    } catch (error) {
        console.error('Get debtor report error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// ============================================
// 6. SALES BY PAYMENT METHOD
// ============================================
const getPaymentMethodReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let query = `
            SELECT 
                payment_method,
                COUNT(*) AS transaction_count,
                SUM(total_amount) AS total_revenue,
                SUM(amount_paid) AS total_received,
                SUM(balance_due) AS total_outstanding
            FROM sales
            WHERE payment_method IS NOT NULL
        `;
        const params = [];

        if (startDate && endDate) {
            query += ` AND created_at::date BETWEEN $1 AND $2`;
            params.push(startDate, endDate);
        }

        query += ` GROUP BY payment_method ORDER BY total_revenue DESC`;

        const result = await pool.query(query, params);

        // Get total grand total
        const totalQuery = `
            SELECT 
                SUM(total_amount) AS grand_total,
                SUM(amount_paid) AS grand_received,
                SUM(balance_due) AS grand_outstanding
            FROM sales
            ${startDate && endDate ? `WHERE created_at::date BETWEEN $1 AND $2` : ''}
        `;
        const totalResult = await pool.query(
            totalQuery, 
            startDate && endDate ? [startDate, endDate] : []
        );

        res.json({
            breakdown: result.rows,
            totals: totalResult.rows[0] || { grand_total: 0, grand_received: 0, grand_outstanding: 0 }
        });
    } catch (error) {
        console.error('Get payment method report error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// ============================================
// 7. PROFIT REPORT
// ============================================
const getProfitReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let query = `
            SELECT 
                s.id AS sale_id,
                s.invoice_number,
                s.sale_type,
                s.created_at,
                si.product_id,
                p.name AS product_name,
                si.quantity,
                si.unit_price,
                si.total_price AS revenue,
                (si.quantity * p.cost_price) AS cost,
                (si.total_price - (si.quantity * p.cost_price)) AS profit
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (startDate && endDate) {
            query += ` AND s.created_at::date BETWEEN $1 AND $2`;
            params.push(startDate, endDate);
        }

        query += ` ORDER BY s.created_at DESC`;

        const result = await pool.query(query, params);

        // Calculate totals
        let total_revenue = 0;
        let total_cost = 0;
        let total_profit = 0;
        const productProfits = {};

        for (const row of result.rows) {
            total_revenue += parseFloat(row.revenue);
            total_cost += parseFloat(row.cost);
            total_profit += parseFloat(row.profit);

            if (!productProfits[row.product_name]) {
                productProfits[row.product_name] = {
                    revenue: 0,
                    cost: 0,
                    profit: 0,
                    quantity: 0
                };
            }
            productProfits[row.product_name].revenue += parseFloat(row.revenue);
            productProfits[row.product_name].cost += parseFloat(row.cost);
            productProfits[row.product_name].profit += parseFloat(row.profit);
            productProfits[row.product_name].quantity += parseInt(row.quantity);
        }

        // Convert to array and sort by profit
        const productArray = Object.keys(productProfits).map(name => ({
            product_name: name,
            ...productProfits[name]
        }));
        productArray.sort((a, b) => b.profit - a.profit);

        res.json({
            summary: {
                total_revenue: total_revenue,
                total_cost: total_cost,
                total_profit: total_profit,
                profit_margin: total_revenue > 0 ? ((total_profit / total_revenue) * 100).toFixed(2) : 0,
                total_transactions: result.rows.length
            },
            by_product: productArray,
            details: result.rows
        });
    } catch (error) {
        console.error('Get profit report error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// ============================================
// 8. EXPORT (EXPORT ALL REPORTS)
// ============================================
const getFullReport = async (req, res) => {
    try {
        const { date } = req.query;
        const reportDate = date || new Date().toISOString().split('T')[0];

        // Get all reports
        const daily = await Sale.getDailySummary(reportDate);
        
        const topProductsQuery = `
            SELECT 
                p.name AS product_name,
                SUM(si.quantity) AS total_quantity,
                SUM(si.total_price) AS total_revenue
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE s.created_at::date = $1
            GROUP BY p.name
            ORDER BY total_revenue DESC
        `;
        const topProducts = await pool.query(topProductsQuery, [reportDate]);

        const debtorsQuery = `
            SELECT 
                customer_name,
                total_debt,
                COALESCE(SUM(p.amount_paid), 0) AS total_paid,
                total_debt - COALESCE(SUM(p.amount_paid), 0) AS outstanding
            FROM debtors d
            LEFT JOIN payments p ON d.id = p.debtor_id
            GROUP BY d.id, d.customer_name, d.total_debt
            HAVING total_debt - COALESCE(SUM(p.amount_paid), 0) > 0
        `;
        const debtors = await pool.query(debtorsQuery);

        const lowStockQuery = `
            SELECT 
                p.name AS product_name,
                s.name AS store_name,
                st.stock_type,
                st.quantity
            FROM stock st
            JOIN products p ON st.product_id = p.id
            JOIN stores s ON st.store_id = s.id
            WHERE st.quantity < 10 AND st.quantity > 0
        `;
        const lowStock = await pool.query(lowStockQuery);

        res.json({
            report_date: reportDate,
            sales_summary: daily || {
                total_sales: 0,
                total_revenue: 0,
                total_received: 0,
                total_outstanding: 0,
                retail_count: 0,
                wholesale_count: 0,
                retail_revenue: 0,
                wholesale_revenue: 0
            },
            top_products: topProducts.rows,
            debtors: debtors.rows,
            low_stock: lowStock.rows,
            generated_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get full report error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================
module.exports = {
    getDailyReport,
    getMonthlyReport,
    getStockReport,
    getLowStockReport,
    getDebtorReport,
    getPaymentMethodReport,
    getProfitReport,
    getFullReport
};