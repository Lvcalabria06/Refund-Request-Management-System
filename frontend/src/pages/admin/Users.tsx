import { useEffect, useRef, useState } from 'react';
import {
  Box, Button, Flex, Heading, Icon, Table, Thead, Tbody, Tr, Th, Td,
  Spinner, Text, Badge, useToast, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, FormControl, FormLabel, Input, Select,
  FormErrorMessage, AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  InputGroup, InputLeftElement, Tabs, TabList, Tab, TabPanels, TabPanel,
  Tooltip,
} from '@chakra-ui/react';
import { UserPlus, Edit2, UserX, RotateCcw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  deletedAt?: string | null;
}

const roleColors: Record<string, string> = {
  ADMIN: 'red', MANAGER: 'orange', FINANCE: 'purple', EMPLOYEE: 'blue',
};

const editUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN']),
  password: z.string().optional().refine(
    (val) => !val || val.length >= 6,
    { message: 'If provided, password must be at least 6 characters' }
  ),
});

type EditFormData = z.infer<typeof editUserSchema>;

export function Users() {
  const [users, setUsers]               = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [loading, setLoading]           = useState(true);
  const [editingUser, setEditingUser]   = useState<User | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  const navigate = useNavigate();
  const toast    = useToast();
  const { user: loggedUser } = useAuth();

  const editModal        = useDisclosure();
  const deactivateDialog = useDisclosure();
  const cancelRef        = useRef<HTMLButtonElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormData>({
    resolver: zodResolver(editUserSchema),
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [activeRes, deletedRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/deleted'),
      ]);
      setUsers(activeRes.data);
      setDeletedUsers(deletedRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const openEdit = (u: User) => {
    setEditingUser(u);
    reset({ name: u.name, email: u.email, role: u.role as EditFormData['role'], password: '' });
    editModal.onOpen();
  };

  const onSubmitEdit = async (data: EditFormData) => {
    if (!editingUser) return;
    try {
      setSubmitting(true);
      const payload: Partial<EditFormData> = { ...data };
      if (!payload.password) delete payload.password;
      await api.put(`/users/${editingUser.id}`, payload);
      toast({ title: 'User updated!', status: 'success', duration: 3000 });
      editModal.onClose();
      loadUsers();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast({ title: 'Failed to update', description: error.response?.data?.error, status: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const askDeactivate = (u: User) => { setDeactivatingUser(u); deactivateDialog.onOpen(); };

  const confirmDeactivate = async () => {
    if (!deactivatingUser) return;
    try {
      await api.delete(`/users/${deactivatingUser.id}`);
      toast({
        title: `${deactivatingUser.name} deactivated`,
        description: 'The user can no longer log in. Their data is preserved.',
        status: 'warning',
        duration: 4000,
      });
      deactivateDialog.onClose();
      setDeactivatingUser(null);
      loadUsers();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast({ title: 'Failed to deactivate', description: error.response?.data?.error, status: 'error' });
    }
  };

  const restoreUser = async (u: User) => {
    try {
      await api.patch(`/users/${u.id}/restore`);
      toast({ title: `${u.name} restored`, description: 'The user can log in again.', status: 'success', duration: 3000 });
      loadUsers();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast({ title: 'Failed to restore', description: error.response?.data?.error, status: 'error' });
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="gray.800">System Users</Heading>
        <Button colorScheme="brand" leftIcon={<Icon as={UserPlus} />} onClick={() => navigate('/admin/users/new')}>
          New user
        </Button>
      </Flex>

      <Tabs colorScheme="brand" variant="enclosed">
        <TabList mb={4}>
          <Tab>
            Active
            <Badge ml={2} colorScheme="green" borderRadius="full">{users.length}</Badge>
          </Tab>
          <Tab>
            Deactivated
            {deletedUsers.length > 0 && (
              <Badge ml={2} colorScheme="red" borderRadius="full">{deletedUsers.length}</Badge>
            )}
          </Tab>
        </TabList>

        <TabPanels>
          {/* ── Active Users ── */}
          <TabPanel p={0}>
            <InputGroup mb={4} maxW="400px">
              <InputLeftElement pointerEvents="none">
                <Icon as={Search} color="gray.400" boxSize={4} />
              </InputLeftElement>
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg="white"
                focusBorderColor="brand.500"
              />
            </InputGroup>

            <Box bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
              {loading ? (
                <Flex justify="center" p={10}><Spinner color="brand.500" size="xl" /></Flex>
              ) : filteredUsers.length === 0 ? (
                <Flex justify="center" p={10}>
                  <Text color="gray.500">
                    {searchTerm ? `No users matching "${searchTerm}".` : 'No active users found.'}
                  </Text>
                </Flex>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead bg="gray.50">
                      <Tr><Th>Name</Th><Th>E-mail</Th><Th>Role</Th><Th>Actions</Th></Tr>
                    </Thead>
                    <Tbody>
                      {filteredUsers.map((u) => {
                        const isSelf = u.id === loggedUser?.id;
                        return (
                          <Tr key={u.id} _hover={{ bg: 'gray.50' }}>
                            <Td fontWeight="bold" color="gray.700">{u.name}</Td>
                            <Td>{u.email}</Td>
                            <Td>
                              <Badge colorScheme={roleColors[u.role] || 'gray'} px={2} py={1} borderRadius="md">
                                {u.role}
                              </Badge>
                            </Td>
                            <Td>
                              <Flex gap={2}>
                                <Button size="sm" colorScheme="blue" variant="ghost"
                                  leftIcon={<Icon as={Edit2} boxSize={4} />} onClick={() => openEdit(u)}>
                                  Edit
                                </Button>
                                <Tooltip label={isSelf ? 'You cannot deactivate your own account' : 'Deactivate — user will not be able to log in'}>
                                  <Button
                                    size="sm" colorScheme="orange" variant="ghost"
                                    leftIcon={<Icon as={UserX} boxSize={4} />}
                                    isDisabled={isSelf}
                                    onClick={() => askDeactivate(u)}
                                  >
                                    Deactivate
                                  </Button>
                                </Tooltip>
                              </Flex>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* ── Deactivated Users ── */}
          <TabPanel p={0}>
            <Box bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
              {loading ? (
                <Flex justify="center" p={10}><Spinner color="brand.500" size="xl" /></Flex>
              ) : deletedUsers.length === 0 ? (
                <Flex justify="center" p={10}><Text color="gray.500">No deactivated users.</Text></Flex>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead bg="gray.50">
                      <Tr><Th>Name</Th><Th>E-mail</Th><Th>Role</Th><Th>Deactivated at</Th><Th>Actions</Th></Tr>
                    </Thead>
                    <Tbody>
                      {deletedUsers.map((u) => (
                        <Tr key={u.id} _hover={{ bg: 'red.50' }} opacity={0.85}>
                          <Td fontWeight="bold" color="gray.500">{u.name}</Td>
                          <Td color="gray.500">{u.email}</Td>
                          <Td>
                            <Badge colorScheme={roleColors[u.role] || 'gray'} px={2} py={1} borderRadius="md" opacity={0.6}>
                              {u.role}
                            </Badge>
                          </Td>
                          <Td color="red.400" fontSize="sm">
                            {u.deletedAt ? dayjs(u.deletedAt).format('DD/MM/YYYY HH:mm') : '—'}
                          </Td>
                          <Td>
                            <Button size="sm" colorScheme="green" variant="ghost"
                              leftIcon={<Icon as={RotateCcw} boxSize={4} />}
                              onClick={() => restoreUser(u)}>
                              Restore
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* ── Edit Modal ── */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmitEdit)}>
            <ModalHeader>Edit User</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl isInvalid={!!errors.name} mb={3}>
                <FormLabel>Name</FormLabel>
                <Input {...register('name')} focusBorderColor="brand.500" />
                <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.email} mb={3}>
                <FormLabel>E-mail</FormLabel>
                <Input type="email" {...register('email')} focusBorderColor="brand.500" />
                <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={!!errors.role} mb={3}>
                <FormLabel>Role</FormLabel>
                <Select {...register('role')} focusBorderColor="brand.500"
                  isDisabled={editingUser?.id === loggedUser?.id}>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="ADMIN">ADMIN</option>
                </Select>
                <FormErrorMessage>{errors.role?.message}</FormErrorMessage>
                {editingUser?.id === loggedUser?.id && (
                  <Text fontSize="xs" color="gray.500" mt={1}>You cannot change your own role.</Text>
                )}
              </FormControl>
              <FormControl isInvalid={!!errors.password}>
                <FormLabel>New password (optional)</FormLabel>
                <Input type="password" placeholder="Leave empty to keep current"
                  {...register('password')} focusBorderColor="brand.500" />
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={editModal.onClose}>Cancel</Button>
              <Button colorScheme="brand" type="submit" isLoading={submitting}>Save changes</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ── Deactivate Confirmation ── */}
      <AlertDialog isOpen={deactivateDialog.isOpen} leastDestructiveRef={cancelRef} onClose={deactivateDialog.onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">Deactivate user?</AlertDialogHeader>
            <AlertDialogBody>
              <strong>{deactivatingUser?.name}</strong> will be <strong>immediately logged out</strong> and
              will no longer be able to log in. All their data and history are preserved.
              The account can be restored at any time.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={deactivateDialog.onClose}>Cancel</Button>
              <Button colorScheme="orange" onClick={confirmDeactivate} ml={3}>Yes, deactivate</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
