import { useEffect, useState } from 'react';
import { Box, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td, Spinner, Text, Badge } from '@chakra-ui/react';
import { api } from '../../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const roleColors: Record<string, string> = {
  ADMIN: 'red',
  MANAGER: 'orange',
  FINANCE: 'purple',
  EMPLOYEE: 'blue',
};

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="gray.800">Usuários do Sistema</Heading>
      </Flex>

      <Box bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
        {loading ? (
          <Flex justify="center" p={10}><Spinner color="brand.500" size="xl" /></Flex>
        ) : users.length === 0 ? (
          <Flex justify="center" p={10}><Text color="gray.500">Nenhum usuário encontrado.</Text></Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Nome</Th>
                  <Th>E-mail</Th>
                  <Th>Cargo</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user) => (
                  <Tr key={user.id} _hover={{ bg: 'gray.50' }}>
                    <Td fontWeight="bold" color="gray.700">{user.name}</Td>
                    <Td>{user.email}</Td>
                    <Td>
                      <Badge colorScheme={roleColors[user.role] || 'gray'} px={2} py={1} borderRadius="md">
                        {user.role}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>
    </Box>
  );
}
