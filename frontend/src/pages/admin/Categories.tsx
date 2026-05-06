import { useEffect, useState } from 'react';
import { Box, Flex, Heading, Table, Thead, Tbody, Tr, Th, Td, Spinner, Text, Badge, Button, useToast, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Input, FormErrorMessage, Icon } from '@chakra-ui/react';
import { Plus, Edit2, Power, PowerOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  maxAmount: number | null;
}

// Schema simples baseado em string — react-hook-form recebe strings dos inputs
// Empty string = no limit (null on backend); valid positive number otherwise.
const categorySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  maxAmount: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) > 0),
      { message: 'Limit must be a positive number' }
    ),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({ name: '', maxAmount: '' });
    onOpen();
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    reset({
      name: category.name,
      // Number → string para popular o input; null vira string vazia
      maxAmount: category.maxAmount != null ? String(category.maxAmount) : '',
    });
    onOpen();
  };

  const onSubmitForm = async (data: CategoryFormData) => {
    try {
      setIsSubmitting(true);
      // Empty/undefined → null (sem limite); senão converte para número
      const maxAmountValue =
        !data.maxAmount || data.maxAmount.trim() === '' ? null : Number(data.maxAmount);

      if (editingCategory) {
        // Edit mode
        await api.patch(`/categories/${editingCategory.id}`, {
          name: data.name,
          isActive: editingCategory.isActive,
          maxAmount: maxAmountValue,
        });
        toast({ title: 'Category updated!', status: 'success' });
      } else {
        // Create mode
        await api.post('/categories', {
          name: data.name,
          maxAmount: maxAmountValue,
        });
        toast({ title: 'Category created successfully!', status: 'success' });
      }
      onClose();
      loadCategories();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast({ title: 'Error', description: error.response?.data?.error || 'Failed to save category', status: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = async (id: string, currentStatus: boolean, name: string) => {
    try {
      await api.patch(`/categories/${id}`, { name, isActive: !currentStatus });
      toast({ title: 'Status updated', status: 'success' });
      loadCategories();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast({ title: 'Error', description: error.response?.data?.error || 'Failed to update', status: 'error' });
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="gray.800">Refund Categories</Heading>
        <Button colorScheme="brand" leftIcon={<Icon as={Plus} boxSize={4} />} onClick={openCreateModal}>
          New Category
        </Button>
      </Flex>

      <Box bg="white" borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
        {loading ? (
          <Flex justify="center" p={10}><Spinner color="brand.500" size="xl" /></Flex>
        ) : categories.length === 0 ? (
          <Flex justify="center" p={10}><Text color="gray.500">No categories found.</Text></Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Category Name</Th>
                  <Th isNumeric>Max Amount (R$)</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {categories.map((cat) => (
                  <Tr key={cat.id} _hover={{ bg: 'gray.50' }}>
                    <Td fontWeight="bold" color="gray.700">{cat.name}</Td>
                    <Td isNumeric>
                      {cat.maxAmount !== null ? (
                        <Text fontWeight="medium" color="gray.700">
                          {cat.maxAmount.toFixed(2)}
                        </Text>
                      ) : (
                        <Text color="gray.400" fontSize="sm">No limit</Text>
                      )}
                    </Td>
                    <Td>
                      <Badge colorScheme={cat.isActive ? 'green' : 'red'} px={2} py={1} borderRadius="md">
                        {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </Td>
                    <Td>
                      <Flex gap={2}>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="ghost"
                          leftIcon={<Icon as={Edit2} boxSize={4} />}
                          onClick={() => openEditModal(cat)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          colorScheme={cat.isActive ? 'red' : 'green'}
                          variant="ghost"
                          leftIcon={<Icon as={cat.isActive ? PowerOff : Power} boxSize={4} />}
                          onClick={() => toggleCategory(cat.id, cat.isActive, cat.name)}
                        >
                          {cat.isActive ? 'Disable' : 'Activate'}
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

      {/* Modal de Criação / Edição */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmitForm)}>
            <ModalHeader>{editingCategory ? 'Edit Category' : 'New Category'}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl isInvalid={!!errors.name} mb={3}>
                <FormLabel>Category Name</FormLabel>
                <Input
                  placeholder="Ex: Travel, Accommodation..."
                  focusBorderColor="brand.500"
                  {...register('name')}
                />
                <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
              </FormControl>

              {/* EXTRA: per-category spending limit */}
              <FormControl isInvalid={!!errors.maxAmount}>
                <FormLabel>
                  Max Amount (R$)
                  <Text as="span" fontSize="xs" color="gray.500" ml={2} fontWeight="normal">
                    Leave empty for no limit
                  </Text>
                </FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1000.00"
                  focusBorderColor="brand.500"
                  {...register('maxAmount')}
                />
                <FormErrorMessage>{errors.maxAmount?.message}</FormErrorMessage>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
              <Button colorScheme="brand" type="submit" isLoading={isSubmitting}>
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
}