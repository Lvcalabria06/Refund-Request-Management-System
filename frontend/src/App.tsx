import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { Login } from './pages/Login';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MyReimbursements } from './pages/employee/MyReimbursements';
import { NewReimbursement } from './pages/employee/NewReimbursement';
import { Approvals } from './pages/manager/Approvals';
import { Payments } from './pages/finance/Payments';
import { Users } from './pages/admin/Users';
import { NewUser } from './pages/admin/NewUser';
import { Categories } from './pages/admin/Categories';
import { ReimbursementDetail } from './pages/ReimbursementDetail';


function DashboardPlaceholder() {
  const { user } = useAuth();
  return (
    <VStack align="flex-start" spacing={6} w="full">
      <Heading size="lg" color="gray.800">Dashboard</Heading>
      <Box bg="white" p={6} borderRadius="xl" boxShadow="sm" w="full" border="1px solid" borderColor="gray.100">
        <Text fontSize="lg" color="gray.600">
          Welcome to the system, <strong>{user?.name}</strong>!
        </Text>
        <Text mt={2} color="gray.500">
          You are logged in as: <Box as="span" color="brand.600" fontWeight="bold">{user?.role}</Box>
        </Text>
      </Box>
    </VStack>
  );
}

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
            <DashboardPlaceholder />
          </ProtectedRoute>
        }
      />

      {/* Rotas do Employee */}
      <Route
        path="/reimbursements"
        element={
          <ProtectedRoute allowedRoles={['EMPLOYEE']}>
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

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
