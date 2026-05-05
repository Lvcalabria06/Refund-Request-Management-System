import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MyReimbursements } from './pages/employee/MyReimbursements';
import { NewReimbursement } from './pages/employee/NewReimbursement';
import { Approvals } from './pages/manager/Approvals';
import { Payments } from './pages/finance/Payments';
import { Users } from './pages/admin/Users';
import { NewUser } from './pages/admin/NewUser';
import { Categories } from './pages/admin/Categories';
import { ReimbursementDetail } from './pages/ReimbursementDetail';
import { AdminReimbursements } from './pages/admin/AdminReimbursements';
import { Dashboard } from './pages/Dashboard';



function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Rotas do Employee */}
      <Route
        path="/reimbursements"
        element={
          <ProtectedRoute allowedRoles={['EMPLOYEE','ADMIN']}>
            <MyReimbursements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reimbursements/new"
        element={
          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
            <NewReimbursement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reimbursements/edit/:id"
        element={
          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
            <NewReimbursement />
          </ProtectedRoute>
        }
      />
      {/* Detalhe da solicitação — qualquer usuário autenticado, backend filtra por ownership */}
      <Route
        path="/reimbursements/:id"
        element={
          <ProtectedRoute>
            <ReimbursementDetail />
          </ProtectedRoute>
        }
      />

      {/* Rotas do Manager */}
      <Route
        path="/approvals"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <Approvals />
          </ProtectedRoute>
        }
      />

      {/* Rotas do Financeiro */}
      <Route
        path="/payments"
        element={
          <ProtectedRoute allowedRoles={['FINANCE']}>
            <Payments />
          </ProtectedRoute>
        }
      />

      {/* Rotas do Admin */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/new"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <NewUser />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Categories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reimbursements"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminReimbursements />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
