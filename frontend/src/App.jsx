import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CashierDashboard from './pages/CashierDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminStock from './pages/AdminStock';
import AdminTransfers from './pages/AdminTransfers';
import AdminSales from './pages/AdminSales';
import AdminDebtors from './pages/AdminDebtors';
import AdminReports from './pages/AdminReports';
import AdminUsers from './pages/AdminUsers';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Toaster position="top-right" />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<Navigate to="/login" />} />
                    
                    <Route path="/admin/*" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/stock" element={
    <ProtectedRoute allowedRoles={['admin']}>
        <AdminStock />
    </ProtectedRoute>
} />
<Route path="/admin/sales" element={
    <ProtectedRoute allowedRoles={['admin']}>
        <AdminSales />
    </ProtectedRoute>
} />
<Route path="/admin/debtors" element={
    <ProtectedRoute allowedRoles={['admin']}>
        <AdminDebtors />
    </ProtectedRoute>
} />

<Route path="/admin/transfers" element={
    <ProtectedRoute allowedRoles={['admin']}>
        <AdminTransfers />
    </ProtectedRoute>
} />
<Route path="/admin/users" element={
    <ProtectedRoute allowedRoles={['admin']}>
        <AdminUsers />
    </ProtectedRoute>
} />
<Route path="/admin/reports" element={
    <ProtectedRoute allowedRoles={['admin']}>
        <AdminReports />
    </ProtectedRoute>
} />
                    
                    <Route path="/admin/products" element={
    <ProtectedRoute allowedRoles={['admin']}>
        <AdminProducts />
    </ProtectedRoute>
} />


                
                    <Route path="/cashier" element={
                        <ProtectedRoute allowedRoles={['cashier']}>
                            <CashierDashboard />
                        </ProtectedRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;