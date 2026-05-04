import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Text,
  Badge,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  FormErrorMessage,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { UserPlus, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { user: loggedUser } = useAuth();

  const editModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editUserSchema),
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openEdit = (u: User) => {
    setEditingUser(u);
    reset({
      name: u.name,
      email: u.email,
      role: u.role as EditFormData['role'],
      password: '',
    });
    editModal.onOpen();
  };

  const onSubmitEdit = async (data: EditFormData) => {
    if (!editingUser) return;
    try {
      setSubmitting(true);
      // Não envia password se estiver vazio (mantém a atual no backend)
      const payload: Partial<EditFormData> = { ...data };
      if (!payload.password) delete payload.password;

      await api.put(`/users/${editingUser.id}`, payload);
      toast({ title: 'User updated!', status: 'success', duration: 3000 });
      editModal.onClose();
      loadUsers();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast({
        title: 'Failed to update user',
        description: error.response?.data?.error || 'Please try again.',
        status: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const askDelete = (u: User) => {
    setDeletingUser(u);
    deleteDialog.onOpen();
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    try {
      await api.delete(`/users/${deletingUser.id}`);
      toast({ title: 'User deleted', status: 'success', duration: 3000 });
      deleteDialog.onClose();
      setDeletingUser(null);
      loadUsers();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast({
        title: 'Failed to delete',
        description: error.response?.data?.error || 'Please try again.',
        status: 'error',
      });
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="gray.800">System Users</Heading>
        <Button
          colorScheme="brand"
          leftIcon={<Icon as={UserPlus} />}
          onClick={() => navigate('/admin/users/new')}
        >
           New user
        </Button>
      </Flex>

      <Box bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
        {loading ? (
          <Flex justify="center" p={10}><Spinner color="brand.500" size="xl" /></Flex>
        ) : users.length === 0 ? (
          <Flex justify="center" p={10}><Text color="gray.500">No users found.</Text></Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Name</Th>
                  <Th>E-mail</Th>
                  <Th>role</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((u) => {
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
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            leftIcon={<Icon as={Edit2} boxSize={4} />}
                            onClick={() => openEdit(u)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            leftIcon={<Icon as={Trash2} boxSize={4} />}
                            onClick={() => askDelete(u)}
                            isDisabled={isSelf}
                            title={isSelf ? 'You cannot delete your own account' : ''}
                          >
                            Delete
                          </Button>
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

      {/* Modal de Edição */}
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
                <FormLabel>role</FormLabel>
                <Select
                  {...register('role')}
                  focusBorderColor="brand.500"
                  isDisabled={editingUser?.id === loggedUser?.id}
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="ADMIN">ADMIN</option>
                </Select>
                <FormErrorMessage>{errors.role?.message}</FormErrorMessage>
                {editingUser?.id === loggedUser?.id && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    You cannot change your own role.
                  </Text>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel>New password (optional)</FormLabel>
                <Input
                  type="password"
                  placeholder="Leave empty to keep the current one"
                  {...register('password')}
                  focusBorderColor="brand.500"
                />
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={editModal.onClose}>Cancel</Button>
              <Button colorScheme="brand" type="submit" isLoading={submitting}>
                Save changes
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete confirmation dialog */}
      <AlertDialog
        isOpen={deleteDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteDialog.onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete user?
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete <strong>{deletingUser?.name}</strong>?
              This action cannot be undone. Users with reimbursements or history
              cannot be deleted.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={deleteDialog.onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Yes, delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
