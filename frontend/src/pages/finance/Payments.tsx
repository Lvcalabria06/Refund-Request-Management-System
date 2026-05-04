import { useEffect, useState } from 'react';
import { Box, Button, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td, Spinner, Text, Icon, useToast } from '@chakra-ui/react';
import { DollarSign, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import dayjs from 'dayjs';

interface Reimbursement {
  id: string;
  description: string;
  amount: number;
  status: string;
  expenseDate: string;
  employee: {
    name: string;
  };
}

export function Payments() {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  const loadReimbursements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reimbursements');
      // Filtra apenas os que estão como APPROVED
      const approved = response.data.filter((r: Reimbursement) => r.status === 'APPROVED');
      setReimbursements(approved);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReimbursements();
  }, []);

  const handlePay = async (id: string) => {
    try {
      await api.post(`/reimbursements/${id}/pay`);
      toast({ title: 'Payment confirmed', status: 'success' });
      loadReimbursements();
    } catch (err) {
      const error = err as any;
      toast({ title: 'Error', description: error.response?.data?.error || 'Failed to pay', status: 'error' });
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="gray.800">Pagamentos Pendentes</Heading>
      </Flex>

      <Box bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
        {loading ? (
          <Flex justify="center" p={10}><Spinner color="brand.500" size="xl" /></Flex>
        ) : reimbursements.length === 0 ? (
          <Flex justify="center" p={10}><Text color="gray.500">Nenhum pagamento pendente no momento.</Text></Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Funcionário</Th>
                  <Th>Descrição</Th>
                  <Th>Data da Despesa</Th>
                  <Th isNumeric>Valor (R$)</Th>
                  <Th>Ação</Th>
                </Tr>
              </Thead>
              <Tbody>
                {reimbursements.map((r) => (
                  <Tr key={r.id} _hover={{ bg: 'gray.50' }}>
                    <Td fontWeight="bold" color="gray.700">{r.employee?.name}</Td>
                    <Td>{r.description}</Td>
                    <Td>{dayjs(r.expenseDate).format('DD/MM/YYYY')}</Td>
                    <Td isNumeric fontWeight="bold" color="green.600">{r.amount.toFixed(2)}</Td>
                    <Td>
                      <Flex gap={2}>
                        <Button size="sm" variant="ghost" colorScheme="brand" onClick={() => navigate(`/reimbursements/${r.id}`)}>
                          <Icon as={Eye} boxSize={4} />
                        </Button>
                        <Button size="sm" colorScheme="purple" onClick={() => handlePay(r.id)} leftIcon={<Icon as={DollarSign} boxSize={4}/>}>
                          Marcar como Pago
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
