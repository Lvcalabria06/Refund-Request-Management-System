import { useEffect, useState } from 'react';
import { Box, Button, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, Spinner, Text, Icon } from '@chakra-ui/react';
import { Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import dayjs from 'dayjs';

interface Reimbursement {
  id: string;
  description: string;
  amount: number;
  status: string;
  expenseDate: string;
  category: {
    name: string;
  };
}

const statusColors: Record<string, string> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
  PAID: 'purple',
  CANCELED: 'orange',
};

export function MyReimbursements() {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadReimbursements = async () => {
    try {
      const response = await api.get('/reimbursements');
      setReimbursements(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReimbursements();
  }, []);

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="gray.800">Meus Reembolsos</Heading>
        <Button 
          colorScheme="brand" 
          leftIcon={<Icon as={Plus} />}
          onClick={() => navigate('/reimbursements/new')}
        >
          Nova Solicitação
        </Button>
      </Flex>

      <Box bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
        {loading ? (
          <Flex justify="center" p={10}>
            <Spinner color="brand.500" size="xl" />
          </Flex>
        ) : reimbursements.length === 0 ? (
          <Flex justify="center" p={10}>
            <Text color="gray.500">Nenhuma solicitação encontrada.</Text>
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Descrição</Th>
                  <Th>Categoria</Th>
                  <Th>Data da Despesa</Th>
                  <Th isNumeric>Valor (R$)</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {reimbursements.map((r) => (
                  <Tr key={r.id} _hover={{ bg: 'gray.50' }}>
                    <Td fontWeight="medium" color="gray.800">{r.description}</Td>
                    <Td>{r.category?.name}</Td>
                    <Td>{dayjs(r.expenseDate).format('DD/MM/YYYY')}</Td>
                    <Td isNumeric>{r.amount.toFixed(2)}</Td>
                    <Td>
                      <Badge colorScheme={statusColors[r.status] || 'gray'} px={2} py={1} borderRadius="md">
                        {r.status}
                      </Badge>
                    </Td>
                    <Td isNumeric>
                      <Flex gap={2} justify="flex-end">
                        {r.status === 'DRAFT' && (
                          <>
                            <Button 
                              size="sm" 
                              colorScheme="gray"
                              variant="outline"
                              onClick={() => navigate(`/reimbursements/edit/${r.id}`)}
                            >
                              Editar
                            </Button>
                            <Button 
                              size="sm" 
                              colorScheme="blue" 
                              onClick={async () => {
                                try {
                                  await api.post(`/reimbursements/${r.id}/submit`);
                                  loadReimbursements();
                                } catch (e) {
                                  alert('Erro ao enviar');
                                }
                              }}
                            >
                              Enviar
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" colorScheme="brand" onClick={() => alert('Em breve: Detalhes')}>
                          <Icon as={Eye} />
                        </Button>
                      </Flex>
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
