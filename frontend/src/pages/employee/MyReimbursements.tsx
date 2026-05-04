import { useEffect, useState } from 'react';
import { Box, Button, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, Spinner, Text, Icon, useToast, useDisclosure, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay } from '@chakra-ui/react';
import { Plus, Eye, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
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
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const askCancel = (id: string) => {
    setCancelTarget(id);
    onOpen();
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await api.post(`/reimbursements/${cancelTarget}/cancel`);
      toast({ title: 'Reimbursement canceled', status: 'success', duration: 3000 });
      onClose();
      setCancelTarget(null);
      loadReimbursements();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast({
        title: 'Failed to cancel',
        description: error.response?.data?.error || 'Please try again.',
        status: 'error',
      });
    }
  };

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
        <Heading size="lg" color="gray.800">My Reimbursements</Heading>
        <Button 
          colorScheme="brand" 
          leftIcon={<Icon as={Plus} />}
          onClick={() => navigate('/reimbursements/new')}
        >
          New Request
        </Button>
      </Flex>

      <Box bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
        {loading ? (
          <Flex justify="center" p={10}>
            <Spinner color="brand.500" size="xl" />
          </Flex>
        ) : reimbursements.length === 0 ? (
          <Flex justify="center" p={10}>
            <Text color="gray.500">No requests found.</Text>
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Description</Th>
                  <Th>Category</Th>
                  <Th>Expense Date</Th>
                  <Th isNumeric>Amount (R$)</Th>
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
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              onClick={async () => {
                                try {
                                  await api.post(`/reimbursements/${r.id}/submit`);
                                  loadReimbursements();
                                } catch (e) {
                                    const error = e as { response?: { data?: { error?: string } } };
                                    toast({
                                      title: 'Failed to submit',
                                      description: error.response?.data?.error || 'Please try again.',
                                      status: 'error',
                                      duration: 3000,});
                                  }
                              }}
                            >
                              Submit
                            </Button>
                          </>
                        )}
                        {(r.status === 'DRAFT' || r.status === 'SUBMITTED') && (
                          <Button
                            size="sm"
                            colorScheme="orange"
                            variant="outline"
                            leftIcon={<Icon as={XCircle} boxSize={4} />}
                            onClick={() => askCancel(r.id)}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" colorScheme="brand" onClick={() => navigate(`/reimbursements/${r.id}`)}>
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

      {/* Cancel confirmation dialog */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Cancel reimbursement?
            </AlertDialogHeader>
            <AlertDialogBody>
              This action will change the status to CANCELED and cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Go back
              </Button>
              <Button colorScheme="orange" onClick={confirmCancel} ml={3}>
                Yes, cancel
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
