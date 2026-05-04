import { useEffect, useState } from 'react';
import { Box, Button, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td, Spinner, Text, Icon, useToast, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Textarea } from '@chakra-ui/react';
import { Check, X, Eye } from 'lucide-react';
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
  category: {
    name: string;
  };
}

export function Approvals() {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  const loadReimbursements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reimbursements');
      // Filtra apenas os que estão como SUBMITTED
      const submitted = response.data.filter((r: Reimbursement) => r.status === 'SUBMITTED');
      setReimbursements(submitted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReimbursements();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/reimbursements/${id}/approve`);
      toast({ title: 'Reimbursement approved', status: 'success' });
      loadReimbursements();
    } catch (err) {
      const error = err as any;
      toast({ title: 'Error', description: error.response?.data?.error || 'Failed to approve', status: 'error' });
    }
  };

  const handleRejectClick = (id: string) => {
    setRejectId(id);
    setRejectReason('');
    onOpen();
  };

  const confirmReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    try {
      await api.post(`/reimbursements/${rejectId}/reject`, { reason: rejectReason });
      toast({ title: 'Reimbursement rejected', status: 'success' });
      onClose();
      loadReimbursements();
    } catch (err) {
      const error = err as any;
      toast({ title: 'Error', description: error.response?.data?.error || 'Failed to reject', status: 'error' });
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="gray.800">Pending Approvals</Heading>
      </Flex>

      <Box bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
        {loading ? (
          <Flex justify="center" p={10}><Spinner color="brand.500" size="xl" /></Flex>
        ) : reimbursements.length === 0 ? (
          <Flex justify="center" p={10}><Text color="gray.500">No requests awaiting approval.</Text></Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Employee</Th>
                  <Th>Description</Th>
                  <Th>Expense Date</Th>
                  <Th isNumeric>Amount (R$)</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {reimbursements.map((r) => (
                  <Tr key={r.id} _hover={{ bg: 'gray.50' }}>
                    <Td fontWeight="bold" color="gray.700">{r.employee?.name}</Td>
                    <Td>{r.description}</Td>
                    <Td>{dayjs(r.expenseDate).format('DD/MM/YYYY')}</Td>
                    <Td isNumeric fontWeight="bold">{r.amount.toFixed(2)}</Td>
                    <Td>
                      <Flex gap={2}>
                        <Button size="sm" variant="ghost" colorScheme="brand" onClick={() => navigate(`/reimbursements/${r.id}`)}>
                          <Icon as={Eye} boxSize={4} />
                        </Button>
                        <Button size="sm" colorScheme="green" onClick={() => handleApprove(r.id)} leftIcon={<Icon as={Check} boxSize={4}/>}>Approve</Button>
                        <Button size="sm" colorScheme="red" variant="outline" onClick={() => handleRejectClick(r.id)} leftIcon={<Icon as={X} boxSize={4}/>}>Reject</Button>
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      {/* Rejection Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Rejection reason</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              placeholder="Please explain the reason for rejection (minimum 5 characters)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              focusBorderColor="red.500"
              rows={4}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="red" onClick={confirmReject} isDisabled={rejectReason.length < 5}>Confirm rejection</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
