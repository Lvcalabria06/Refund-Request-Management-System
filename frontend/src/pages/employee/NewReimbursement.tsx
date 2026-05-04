import { useEffect, useState } from 'react';
import { Box, Button, Flex, FormControl, FormErrorMessage, FormLabel, Heading, Input, Select, VStack, useToast, Icon, Spinner } from '@chakra-ui/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import dayjs from 'dayjs';

const newReimbursementSchema = z.object({
  description: z.string().min(5, 'Description must be at least 5 characters'),
  amount: z.number({ message: 'Invalid amount' }).min(0.01, 'Amount must be greater than zero'),
  expenseDate: z.string().min(1, 'Date is required'),
  categoryId: z.string().min(1, 'Category is required'),
});

type FormData = z.infer<typeof newReimbursementSchema>;

interface Category {
  id: string;
  name: string;
}

export function NewReimbursement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const isEditMode = !!id;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(newReimbursementSchema),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        // Busca as categorias ativas para popular o select
        let cats = [];
        try {
          const res = await api.get('/categories/active');
          cats = res.data;
        } catch {
          const res = await api.get('/categories');
          cats = res.data;
        }
        setCategories(cats);

        if (isEditMode) {
          const { data } = await api.get(`/reimbursements/${id}`);
          if (data.status !== 'DRAFT') {
            toast({ title: 'Warning', description: 'Only drafts can be edited.', status: 'warning' });
            navigate('/reimbursements');
            return;
          }
          setValue('description', data.description);
          setValue('amount', data.amount);
          setValue('expenseDate', dayjs(data.expenseDate).format('YYYY-MM-DD'));
          setValue('categoryId', data.categoryId);
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to load data.', status: 'error' });
        navigate('/reimbursements');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode, navigate, setValue, toast]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      const payload = {
        ...data,
        expenseDate: new Date(data.expenseDate).toISOString()
      };
      
      if (isEditMode) {
        await api.put(`/reimbursements/${id}`, payload);
        toast({ title: 'Success!', description: 'Draft updated.', status: 'success' });
      } else {
        await api.post('/reimbursements', payload);
        toast({ title: 'Success!', description: 'Reimbursement created as DRAFT.', status: 'success' });
      }

      navigate('/reimbursements');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save reimbursement.',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <Flex justify="center" p={10}><Spinner size="xl" color="brand.500" /></Flex>;
  }

  return (
    <Box maxW="container.md" mx="auto">
      <Flex align="center" mb={6}>
        <Button variant="ghost" mr={4} onClick={() => navigate('/reimbursements')} px={2}>
          <Icon as={ArrowLeft} boxSize={5} />
        </Button>
        <Heading size="lg" color="gray.800">{isEditMode ? 'Edit Draft' : 'New Reimbursement Request'}</Heading>
      </Flex>

      <Box bg="white" p={8} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100">
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={5} align="stretch">
            
            <FormControl isInvalid={!!errors.description}>
              <FormLabel color="gray.700" fontWeight="medium">Expense Description</FormLabel>
              <Input placeholder="Ex: Business lunch with client" {...register('description')} focusBorderColor="brand.500" />
              <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
            </FormControl>

            <Flex gap={5} direction={{ base: 'column', md: 'row' }}>
              <FormControl isInvalid={!!errors.amount} flex={1}>
                <FormLabel color="gray.700" fontWeight="medium">Amount (R$)</FormLabel>
                <Input type="number" step="0.01" placeholder="150.00" {...register('amount', { valueAsNumber: true })} focusBorderColor="brand.500" />
                <FormErrorMessage>{errors.amount?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.expenseDate} flex={1}>
                <FormLabel color="gray.700" fontWeight="medium">Expense Date</FormLabel>
                <Input type="date" {...register('expenseDate')} focusBorderColor="brand.500" />
                <FormErrorMessage>{errors.expenseDate?.message}</FormErrorMessage>
              </FormControl>
            </Flex>

            <FormControl isInvalid={!!errors.categoryId}>
              <FormLabel color="gray.700" fontWeight="medium">Category</FormLabel>
              <Select placeholder="Select a category" {...register('categoryId')} focusBorderColor="brand.500">
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              <FormErrorMessage>{errors.categoryId?.message}</FormErrorMessage>
            </FormControl>

            <Flex justify="flex-end" pt={4}>
              <Button colorScheme="gray" mr={3} onClick={() => navigate('/reimbursements')} variant="outline">
                Cancel
              </Button>
              <Button type="submit" colorScheme="brand" isLoading={loading} leftIcon={<Icon as={Save} boxSize={4}/>}>
                {isEditMode ? 'Update Draft' : 'Save Draft'}
              </Button>
            </Flex>

          </VStack>
        </form>
      </Box>
    </Box>
  );
}
