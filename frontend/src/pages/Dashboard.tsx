import { useEffect, useState } from 'react';
import {
  Box, Flex, Heading, Text, SimpleGrid, Stat, StatLabel, StatNumber,
  StatHelpText, Spinner, Badge, VStack, HStack, Icon, Button, Table,
  Thead, Tbody, Tr, Th, Td,
} from '@chakra-ui/react';
import {
  FileText, Clock, CheckCircle, XCircle, DollarSign,
  Users, Tags, TrendingUp, AlertCircle, Send,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import dayjs from 'dayjs';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Reimbursement {
  id: string;
  description: string;
  amount: number;
  status: string;
  expenseDate: string;
  category?: { name: string };
  employee?: { name: string };
}

const statusColors: Record<string, string> = {
  DRAFT: 'gray', SUBMITTED: 'blue', APPROVED: 'green',
  REJECTED: 'red', PAID: 'purple', CANCELED: 'orange',
};

// ─── Shared Components ────────────────────────────────────────────────────────
function StatCard({
  label, value, helpText, icon, colorScheme = 'brand',
}: {
  label: string; value: string | number; helpText?: string;
  icon: React.ElementType; colorScheme?: string;
}) {
  const colors: Record<string, { bg: string; icon: string }> = {
    brand:  { bg: 'brand.50',  icon: 'brand.500'  },
    green:  { bg: 'green.50',  icon: 'green.500'  },
    blue:   { bg: 'blue.50',   icon: 'blue.500'   },
    orange: { bg: 'orange.50', icon: 'orange.500' },
    red:    { bg: 'red.50',    icon: 'red.500'    },
    purple: { bg: 'purple.50', icon: 'purple.500' },
  };
  const c = colors[colorScheme] ?? colors.brand;

  return (
    <Box bg="white" p={5} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100">
      <Flex justify="space-between" align="flex-start">
        <Stat>
          <StatLabel color="gray.500" fontSize="sm">{label}</StatLabel>
          <StatNumber fontSize="2xl" color="gray.800" mt={1}>{value}</StatNumber>
          {helpText && <StatHelpText color="gray.400" fontSize="xs" mb={0}>{helpText}</StatHelpText>}
        </Stat>
        <Box bg={c.bg} p={3} borderRadius="lg">
          <Icon as={icon} boxSize={5} color={c.icon} />
        </Box>
      </Flex>
    </Box>
  );
}

function RecentTable({
  rows, onView,
}: {
  rows: Reimbursement[];
  onView: (id: string) => void;
}) {
  if (rows.length === 0)
    return <Text color="gray.400" fontSize="sm" py={4}>No recent records.</Text>;

  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Description</Th>
            {rows[0]?.employee && <Th>Employee</Th>}
            <Th>Date</Th>
            <Th isNumeric>Amount</Th>
            <Th>Status</Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.slice(0, 5).map((r) => (
            <Tr key={r.id} _hover={{ bg: 'gray.50' }}>
              <Td maxW="200px" isTruncated>{r.description}</Td>
              {r.employee && <Td>{r.employee.name}</Td>}
              <Td>{dayjs(r.expenseDate).format('DD/MM/YYYY')}</Td>
              <Td isNumeric fontWeight="bold">R$ {r.amount.toFixed(2)}</Td>
              <Td>
                <Badge colorScheme={statusColors[r.status] ?? 'gray'} px={2} borderRadius="md">
                  {r.status}
                </Badge>
              </Td>
              <Td>
                <Button size="xs" variant="ghost" colorScheme="brand" onClick={() => onView(r.id)}>
                  View
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

// ─── EMPLOYEE Dashboard ───────────────────────────────────────────────────────
function EmployeeDashboard() {
  const [data, setData] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api.get('/reimbursements').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const count = (s: string) => data.filter((r) => r.status === s).length;
  const totalPaid = data.filter((r) => r.status === 'PAID').reduce((acc, r) => acc + r.amount, 0);
  const totalPending = data.filter((r) => ['SUBMITTED', 'APPROVED'].includes(r.status)).reduce((acc, r) => acc + r.amount, 0);

  if (loading) return <Flex justify="center" p={10}><Spinner color="brand.500" size="xl" /></Flex>;

  return (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg" color="gray.800">Welcome, {user?.name}! 👋</Heading>
          <Text color="gray.500" mt={1}>Here's an overview of your reimbursement requests.</Text>
        </Box>
        <Button colorScheme="brand" leftIcon={<Icon as={FileText} />} onClick={() => navigate('/reimbursements/new')}>
          New Request
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <StatCard label="Drafts"    value={count('DRAFT')}     icon={FileText}     colorScheme="brand" />
        <StatCard label="Submitted" value={count('SUBMITTED')} icon={Send}         colorScheme="blue" />
        <StatCard label="Approved"  value={count('APPROVED')}  icon={CheckCircle}  colorScheme="green" />
        <StatCard label="Paid"      value={count('PAID')}      icon={DollarSign}   colorScheme="purple" helpText={`R$ ${totalPaid.toFixed(2)}`} />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <StatCard label="Total Reimbursed" value={`R$ ${totalPaid.toFixed(2)}`}    icon={TrendingUp}  colorScheme="green" helpText="Already paid" />
        <StatCard label="Awaiting Payment" value={`R$ ${totalPending.toFixed(2)}`} icon={Clock}       colorScheme="orange" helpText="In review or approved" />
      </SimpleGrid>

      {count('REJECTED') > 0 && (
        <Box bg="red.50" border="1px solid" borderColor="red.200" borderRadius="xl" p={4}>
          <HStack>
            <Icon as={XCircle} color="red.500" boxSize={5} />
            <Text color="red.700" fontWeight="medium">
              You have <strong>{count('REJECTED')}</strong> rejected request{count('REJECTED') > 1 ? 's' : ''}. Check the details to see the reason.
            </Text>
            <Button size="sm" colorScheme="red" variant="outline" ml="auto" onClick={() => navigate('/reimbursements')}>
              View
            </Button>
          </HStack>
        </Box>
      )}

      <Box bg="white" p={5} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100">
        <Heading size="sm" color="gray.700" mb={4}>Recent Requests</Heading>
        <RecentTable rows={data} onView={(id) => navigate(`/reimbursements/${id}`)} />
        {data.length > 5 && (
          <Button size="sm" variant="link" colorScheme="brand" mt={3} onClick={() => navigate('/reimbursements')}>
            View all ({data.length})
          </Button>
        )}
      </Box>
    </VStack>
  );
}

// ─── MANAGER Dashboard ────────────────────────────────────────────────────────
function ManagerDashboard() {
  const [data, setData] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api.get('/reimbursements').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const total = data.length;
  const totalAmount = data.reduce((acc, r) => acc + r.amount, 0);
  const highValue = data.filter((r) => r.amount > 500);

  if (loading) return <Flex justify="center" p={10}><Spinner color="brand.500" size="xl" /></Flex>;

  return (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg" color="gray.800">Approval Panel — {user?.name}</Heading>
          <Text color="gray.500" mt={1}>Requests waiting for your review.</Text>
        </Box>
        <Button colorScheme="green" leftIcon={<Icon as={CheckCircle} />} onClick={() => navigate('/approvals')}>
          Go to Approvals
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <StatCard label="Pending Approval"   value={total}                          icon={Clock}       colorScheme="blue"   helpText="Submitted requests" />
        <StatCard label="Total Amount"        value={`R$ ${totalAmount.toFixed(2)}`} icon={DollarSign}  colorScheme="brand"  helpText="Sum of pending requests" />
        <StatCard label="High-Value (>R$500)" value={highValue.length}               icon={AlertCircle} colorScheme="orange" helpText="Require extra attention" />
      </SimpleGrid>

      {highValue.length > 0 && (
        <Box bg="orange.50" border="1px solid" borderColor="orange.200" borderRadius="xl" p={4}>
          <HStack>
            <Icon as={AlertCircle} color="orange.500" boxSize={5} />
            <Text color="orange.700" fontWeight="medium">
              <strong>{highValue.length}</strong> request{highValue.length > 1 ? 's' : ''} above R$ 500 — review carefully before approving.
            </Text>
          </HStack>
        </Box>
      )}

      <Box bg="white" p={5} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100">
        <Heading size="sm" color="gray.700" mb={4}>Pending Requests</Heading>
        <RecentTable rows={data} onView={(id) => navigate(`/reimbursements/${id}`)} />
        {total > 5 && (
          <Button size="sm" variant="link" colorScheme="brand" mt={3} onClick={() => navigate('/approvals')}>
            View all ({total})
          </Button>
        )}
      </Box>
    </VStack>
  );
}

// ─── FINANCE Dashboard ────────────────────────────────────────────────────────
function FinanceDashboard() {
  const [data, setData] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api.get('/reimbursements').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const totalAmount = data.reduce((acc, r) => acc + r.amount, 0);
  const maxReimb = data.length > 0 ? Math.max(...data.map((r) => r.amount)) : 0;
  const avgReimb = data.length > 0 ? totalAmount / data.length : 0;

  if (loading) return <Flex justify="center" p={10}><Spinner color="brand.500" size="xl" /></Flex>;

  return (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg" color="gray.800">Payment Panel — {user?.name}</Heading>
          <Text color="gray.500" mt={1}>Approved requests ready for payment.</Text>
        </Box>
        <Button colorScheme="purple" leftIcon={<Icon as={DollarSign} />} onClick={() => navigate('/payments')}>
          Go to Payments
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <StatCard label="To Pay"         value={data.length}                       icon={FileText}   colorScheme="blue"   helpText="Approved requests" />
        <StatCard label="Total Amount"   value={`R$ ${totalAmount.toFixed(2)}`}    icon={DollarSign} colorScheme="purple" helpText="Total to disburse" />
        <StatCard label="Average / Request" value={`R$ ${avgReimb.toFixed(2)}`}   icon={TrendingUp} colorScheme="green"  helpText={`Highest: R$ ${maxReimb.toFixed(2)}`} />
      </SimpleGrid>

      <Box bg="white" p={5} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100">
        <Heading size="sm" color="gray.700" mb={4}>Approved — Awaiting Payment</Heading>
        <RecentTable rows={data} onView={(id) => navigate(`/reimbursements/${id}`)} />
        {data.length > 5 && (
          <Button size="sm" variant="link" colorScheme="brand" mt={3} onClick={() => navigate('/payments')}>
            View all ({data.length})
          </Button>
        )}
      </Box>
    </VStack>
  );
}

// ─── ADMIN Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard() {
  const [reimbs, setReimbs] = useState<Reimbursement[]>([]);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      api.get('/reimbursements'),
      api.get('/users'),
      api.get('/categories'),
    ]).then(([r, u, c]) => {
      setReimbs(r.data);
      setUserCount(u.data.length);
      setCategoryCount(c.data.length);
    }).finally(() => setLoading(false));
  }, []);

  const count = (s: string) => reimbs.filter((r) => r.status === s).length;
  const totalPaid = reimbs.filter((r) => r.status === 'PAID').reduce((acc, r) => acc + r.amount, 0);
  const totalPending = reimbs.filter((r) => ['SUBMITTED', 'APPROVED'].includes(r.status)).reduce((acc, r) => acc + r.amount, 0);

  if (loading) return <Flex justify="center" p={10}><Spinner color="brand.500" size="xl" /></Flex>;

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="lg" color="gray.800">Admin Overview — {user?.name}</Heading>
        <Text color="gray.500" mt={1}>Full system summary.</Text>
      </Box>

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <StatCard label="Total Users"       value={userCount ?? '—'}               icon={Users}      colorScheme="brand"  />
        <StatCard label="Categories"        value={categoryCount ?? '—'}           icon={Tags}       colorScheme="blue"   />
        <StatCard label="Total Paid"        value={`R$ ${totalPaid.toFixed(2)}`}   icon={DollarSign} colorScheme="green"  helpText={`${count('PAID')} requests`} />
        <StatCard label="Pending Payment"   value={`R$ ${totalPending.toFixed(2)}`} icon={Clock}     colorScheme="orange" helpText={`${count('SUBMITTED') + count('APPROVED')} in progress`} />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
        <StatCard label="Drafts"    value={count('DRAFT')}     icon={FileText}    colorScheme="brand"  />
        <StatCard label="Submitted" value={count('SUBMITTED')} icon={Send}        colorScheme="blue"   />
        <StatCard label="Approved"  value={count('APPROVED')}  icon={CheckCircle} colorScheme="green"  />
        <StatCard label="Rejected"  value={count('REJECTED')}  icon={XCircle}     colorScheme="red"    />
        <StatCard label="Paid"      value={count('PAID')}      icon={DollarSign}  colorScheme="purple" />
        <StatCard label="Canceled"  value={count('CANCELED')}  icon={AlertCircle} colorScheme="orange" />
      </SimpleGrid>

      <Box bg="white" p={5} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100">
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="sm" color="gray.700">Latest Reimbursements</Heading>
          <Button size="sm" variant="outline" colorScheme="brand" onClick={() => navigate('/admin/reimbursements')}>
            View all
          </Button>
        </Flex>
        <RecentTable rows={reimbs} onView={(id) => navigate(`/reimbursements/${id}`)} />
      </Box>
    </VStack>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'EMPLOYEE': return <EmployeeDashboard />;
    case 'MANAGER':  return <ManagerDashboard />;
    case 'FINANCE':  return <FinanceDashboard />;
    case 'ADMIN':    return <AdminDashboard />;
    default:         return null;
  }
}
