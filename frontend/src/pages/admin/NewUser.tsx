import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Select,
  VStack,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';

// Mesmo formato do createUserSchema do backend
const newUserSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN'], {
    error: 'Selecione um cargo válido',
  }),
});

type FormData = z.infer<typeof newUserSchema>;

export function NewUser() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(newUserSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      await api.post('/users', data);

      toast({
        title: 'Usuário criado!',
        description: `${data.name} foi cadastrado com sucesso como ${data.role}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      navigate('/admin/users');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast({
        title: 'Erro ao criar usuário',
        description: error.response?.data?.error || 'Verifique os dados e tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="container.md" mx="auto">
      <Flex align="center" mb={6}>
        <Button variant="ghost" mr={4} onClick={() => navigate('/admin/users')} px={2}>
          <Icon as={ArrowLeft} boxSize={5} />
        </Button>
        <Heading size="lg" color="gray.800">
          Novo Usuário
        </Heading>
      </Flex>

      <Box
        bg="white"
        p={8}
        borderRadius="xl"
        boxShadow="sm"
        border="1px solid"
        borderColor="gray.100"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={5} align="stretch">
            <FormControl isInvalid={!!errors.name}>
              <FormLabel color="gray.700" fontWeight="medium">
                Nome completo
              </FormLabel>
              <Input
                placeholder="Ex: João da Silva"
                {...register('name')}
                focusBorderColor="brand.500"
              />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.email}>
              <FormLabel color="gray.700" fontWeight="medium">
                E-mail
              </FormLabel>
              <Input
                type="email"
                placeholder="usuario@pitang.com"
                {...register('email')}
                focusBorderColor="brand.500"
              />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>

            <Flex gap={5} direction={{ base: 'column', md: 'row' }}>
              <FormControl isInvalid={!!errors.password} flex={1}>
                <FormLabel color="gray.700" fontWeight="medium">
                  Senha provisória
                </FormLabel>
                <Input
                  type="password"
                  placeholder="Mínimo de 6 caracteres"
                  {...register('password')}
                  focusBorderColor="brand.500"
                />
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.role} flex={1}>
                <FormLabel color="gray.700" fontWeight="medium">
                  Cargo
                </FormLabel>
                <Select
                  placeholder="Selecione um cargo"
                  {...register('role')}
                  focusBorderColor="brand.500"
                >
                  <option value="EMPLOYEE">Colaborador (EMPLOYEE)</option>
                  <option value="MANAGER">Gestor (MANAGER)</option>
                  <option value="FINANCE">Financeiro (FINANCE)</option>
                  <option value="ADMIN">Administrador (ADMIN)</option>
                </Select>
                <FormErrorMessage>{errors.role?.message}</FormErrorMessage>
              </FormControl>
            </Flex>

            <Flex justify="flex-end" pt={4}>
              <Button
                colorScheme="gray"
                mr={3}
                onClick={() => navigate('/admin/users')}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                colorScheme="brand"
                isLoading={loading}
                leftIcon={<Icon as={UserPlus} />}
              >
                Cadastrar Usuário
              </Button>
            </Flex>
          </VStack>
        </form>
      </Box>
    </Box>
  );
}
