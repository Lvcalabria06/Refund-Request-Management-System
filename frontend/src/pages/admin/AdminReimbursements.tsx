import { useEffect, useState, useMemo } from 'react';
import {
  Box, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Spinner, Text, Icon, Button, Select, HStack, IconButton,
} from '@chakra-ui/react';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
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
  category: { name: string };
  employee?: { name: string; email: string };
}

interface Category {
  id: string;
  name: string;
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
const PAGE_SIZE = 5;

export function AdminReimbursements() {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [reimbursementsRes, categoriesRes] = await Promise.all([
          api.get('/reimbursements'),
          api.get('/categories'),
        ]);
        setReimbursements(reimbursementsRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Reset page to 1 whenever a filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter]);

  // Filtered list (all matching items, not yet paginated)
  const filtered = useMemo(() => {
    let result = reimbursements;
    if (statusFilter !== 'ALL')   {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (categoryFilter !== 'ALL') {
      result = result.filter((r) => r.categoryId === categoryFilter);
    }
    return result;
  }, [reimbursements, statusFilter, categoryFilter]);

  // Pagination derived values
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startItem = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safePage * PAGE_SIZE, filtered.length);

  const goTo = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  // Build visible page numbers (up to 5 around current)
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, safePage - delta);
      i <= Math.min(totalPages, safePage + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  }, [safePage, totalPages]);

  return (
    <Box>
      {/* ── Header ── */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
        <Heading size="lg" color="gray.800">All Reimbursements</Heading>
        <HStack spacing={3} flexWrap="wrap">
          <HStack>
            <Text fontSize="sm" color="gray.500">Status:</Text>
            <Select
              size="sm"
              w="170px"
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
              w="200px"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              focusBorderColor="brand.500"
              borderRadius="md"
            >
              <option value="ALL">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </HStack>
        </HStack>
      </Flex>

      {/* ── Table ── */}
      <Box bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
        {loading ? (
          <Flex justify="center" p={10}><Spinner color="brand.500" size="xl" /></Flex>
        ) : filtered.length === 0 ? (
          <Flex justify="center" p={10}><Text color="gray.500">No reimbursements found.</Text></Flex>
        ) : (
          <>
            {/* Row count info */}
            <Flex px={4} py={2} borderBottom="1px solid" borderColor="gray.100" bg="gray.50" justify="space-between" align="center">
              <Text fontSize="xs" color="gray.500">
                Showing <strong>{startItem}–{endItem}</strong> of <strong>{filtered.length}</strong> reimbursements
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
                  {pageItems.map((r) => (
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

            {/* ── Pagination Controls ── */}
            {totalPages > 1 && (
              <Flex
                justify="center"
                align="center"
                gap={1}
                py={4}
                borderTop="1px solid"
                borderColor="gray.100"
                flexWrap="wrap"
              >
                {/* Previous */}
                <IconButton
                  aria-label="Previous page"
                  icon={<Icon as={ChevronLeft} boxSize={4} />}
                  size="sm"
                  variant="ghost"
                  isDisabled={safePage === 1}
                  onClick={() => goTo(safePage - 1)}
                />

                {/* First page if not in range */}
                {pageNumbers[0] > 1 && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => goTo(1)}>1</Button>
                    {pageNumbers[0] > 2 && <Text color="gray.400" px={1}>…</Text>}
                  </>
                )}

                {/* Page number buttons */}
                {pageNumbers.map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === safePage ? 'solid' : 'ghost'}
                    colorScheme={p === safePage ? 'brand' : 'gray'}
                    onClick={() => goTo(p)}
                    minW="36px"
                  >
                    {p}
                  </Button>
                ))}

                {/* Last page if not in range */}
                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                      <Text color="gray.400" px={1}>…</Text>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => goTo(totalPages)}>{totalPages}</Button>
                  </>
                )}

                {/* Next */}
                <IconButton
                  aria-label="Next page"
                  icon={<Icon as={ChevronRight} boxSize={4} />}
                  size="sm"
                  variant="ghost"
                  isDisabled={safePage === totalPages}
                  onClick={() => goTo(safePage + 1)}
                />
              </Flex>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
