import { useEffect, useState, useMemo } from 'react';
import {
  Box, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Spinner, Text, Icon, Button, Select, HStack, Tag,
  TagLabel, TagCloseButton, Wrap, WrapItem,
} from '@chakra-ui/react';
import { Eye, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import dayjs from 'dayjs';

interface Reimbursement {
  id: string;
  description: string;
  amount: number;
  status: string;
  expenseDate: string;
  categoryId: string;
  category: { id: string; name: string };
  employee?: { name: string; email: string };
}

interface Category {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  DRAFT: 'gray', SUBMITTED: 'blue', APPROVED: 'green',
  REJECTED: 'red', PAID: 'purple', CANCELED: 'orange',
};

const ALL_STATUSES = ['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'CANCELED'];

export function AdminReimbursements() {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [reimbRes, catRes] = await Promise.all([
          api.get('/reimbursements'),
          api.get('/categories'),
        ]);
        setReimbursements(reimbRes.data);
        setCategories(catRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return reimbursements.filter((r) => {
      const matchStatus   = statusFilter   === 'ALL' || r.status === statusFilter;
      const matchCategory = categoryFilter === 'ALL' || r.category?.id === categoryFilter;
      return matchStatus && matchCategory;
    });
  }, [reimbursements, statusFilter, categoryFilter]);

  const activeFilters = [
    statusFilter   !== 'ALL' && { key: 'status',   label: statusFilter,                                clear: () => setStatusFilter('ALL')   },
    categoryFilter !== 'ALL' && { key: 'category',  label: categories.find(c => c.id === categoryFilter)?.name ?? '', clear: () => setCategoryFilter('ALL') },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" color="gray.800">All Reimbursements</Heading>

        <HStack spacing={3} flexWrap="wrap" justify="flex-end">
          <HStack>
            <Icon as={Filter} boxSize={4} color="gray.400" />
            <Text fontSize="sm" color="gray.500">Status:</Text>
            <Select
              size="sm"
              w="175px"
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

          <HStack>
            <Text fontSize="sm" color="gray.500">Category:</Text>
            <Select
              size="sm"
              w="175px"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              focusBorderColor="brand.500"
              borderRadius="md"
            >
              <option value="ALL">ALL</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </HStack>
        </HStack>
      </Flex>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <Wrap mb={4} spacing={2}>
          {activeFilters.map((f) => (
            <WrapItem key={f.key}>
              <Tag size="sm" colorScheme="brand" borderRadius="full">
                <TagLabel>{f.label}</TagLabel>
                <TagCloseButton onClick={f.clear} />
              </Tag>
            </WrapItem>
          ))}
          <WrapItem>
            <Button
              size="xs"
              variant="link"
              colorScheme="gray"
              onClick={() => { setStatusFilter('ALL'); setCategoryFilter('ALL'); }}
            >
              Clear all
            </Button>
          </WrapItem>
        </Wrap>
      )}

      <Box bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
        {loading ? (
          <Flex justify="center" p={10}><Spinner color="brand.500" size="xl" /></Flex>
        ) : filtered.length === 0 ? (
          <Flex justify="center" p={10} direction="column" align="center" gap={2}>
            <Text color="gray.500">No reimbursements match the selected filters.</Text>
            {activeFilters.length > 0 && (
              <Button size="sm" variant="link" colorScheme="brand" onClick={() => { setStatusFilter('ALL'); setCategoryFilter('ALL'); }}>
                Clear filters
              </Button>
            )}
          </Flex>
        ) : (
          <>
            <Flex px={4} py={2} borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
              <Text fontSize="xs" color="gray.500">
                Showing <strong>{filtered.length}</strong> of <strong>{reimbursements.length}</strong> reimbursements
              </Text>
            </Flex>
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
                      <Td>
                        <Badge variant="subtle" colorScheme="brand" px={2} borderRadius="md">
                          {r.category?.name}
                        </Badge>
                      </Td>
                      <Td>{dayjs(r.expenseDate).format('DD/MM/YYYY')}</Td>
                      <Td isNumeric fontWeight="bold">R$ {r.amount.toFixed(2)}</Td>
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
          </>
        )}
      </Box>
    </Box>
  );
}
