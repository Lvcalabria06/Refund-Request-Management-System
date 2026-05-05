import { useEffect, useState } from 'react';
import {
  Box, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Spinner, Text, Icon, Button, Select, HStack,
} from '@chakra-ui/react';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import dayjs from 'dayjs';

interface Reimbursement {
  id: string;
  description: string;
  amount: number;
  status: string;
  expenseDate: string;
  category: { name: string };
  employee?: { name: string; email: string };
}

const statusColors: Record<string, string> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
  PAID: 'purple',
  CANCELED: 'orange',
};

const ALL_STATUSES = ['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'CANCELED'];

export function AdminReimbursements() {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [filtered, setFiltered] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/reimbursements');
        setReimbursements(data);
        setFiltered(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFiltered(reimbursements);
    } else {
      setFiltered(reimbursements.filter((r) => r.status === statusFilter));
    }
  }, [statusFilter, reimbursements]);

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="gray.800">All Reimbursements</Heading>
        <HStack>
          <Text fontSize="sm" color="gray.500">Filter by status:</Text>
          <Select
            size="sm"
            w="180px"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            focusBorderColor="brand.500"
            borderRadius="md"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </HStack>
      </Flex>

      <Box bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
        {loading ? (
          <Flex justify="center" p={10}><Spinner color="brand.500" size="xl" /></Flex>
        ) : filtered.length === 0 ? (
          <Flex justify="center" p={10}><Text color="gray.500">No reimbursements found.</Text></Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Employee</Th>
                  <Th>Description</Th>
                  <Th>Category</Th>
                  <Th>Expense Date</Th>
                  <Th isNumeric>Amount (R$)</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((r) => (
                  <Tr key={r.id} _hover={{ bg: 'gray.50' }}>
                    <Td fontWeight="medium" color="gray.700">{r.employee?.name ?? '—'}</Td>
                    <Td>{r.description}</Td>
                    <Td>{r.category?.name}</Td>
                    <Td>{dayjs(r.expenseDate).format('DD/MM/YYYY')}</Td>
                    <Td isNumeric fontWeight="bold">{r.amount.toFixed(2)}</Td>
                    <Td>
                      <Badge colorScheme={statusColors[r.status] || 'gray'} px={2} py={1} borderRadius="md">
                        {r.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="brand"
                        onClick={() => navigate(`/reimbursements/${r.id}`)}
                        aria-label="View details"
                      >
                        <Icon as={Eye} boxSize={4} />
                      </Button>
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
