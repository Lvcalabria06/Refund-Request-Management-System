import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Heading, VStack, Text, Button } from '@chakra-ui/react';
import { Login } from './pages/Login';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login /> : <Navigate to="/" />} 
      />
      
      {/* Dashboard Temporário */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
              <VStack spacing={4} bg="white" p={8} borderRadius="xl" boxShadow="md">
                <Heading color="brand.600">Bem-vindo, {user?.name}!</Heading>
                <Text color="gray.600">Seu cargo é: <strong>{user?.role}</strong></Text>
                <Button colorScheme="red" onClick={logout} mt={4}>
                  Sair
                </Button>
              </VStack>
            </Box>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
    </Routes>
  );
}

export default App;
