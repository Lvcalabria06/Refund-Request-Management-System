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
  Text,
  VStack,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { LogIn } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate(); // usado para levar o usuario sem precisar clicar num link
  const toast = useToast(); // Exibe uma notificação temporaria
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/login', data);
      
      const { token, user } = response.data;
      login(token, user);
      
      toast({
        title: 'Login realizado com sucesso!',
        description: `Bem-vindo de volta, ${user.name}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: error.response?.data?.error || 'Credenciais inválidas.',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50" p={4}>
      <Box
        w="full"
        maxW="md"
        bg="white"
        p={8}
        boxShadow="xl"
        borderRadius="2xl"
        borderTop="4px solid"
        borderTopColor="brand.500"
      >
        <VStack spacing={6} align="stretch">
          <VStack spacing={2} textAlign="center">
            <Heading fontSize="3xl" color="gray.800" fontWeight="extrabold">
              Pitang Refunds
            </Heading>
            <Text color="gray.500">Faça login para gerenciar suas solicitações.</Text>
          </VStack>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.email}>
                <FormLabel color="gray.700" fontWeight="medium">E-mail</FormLabel>
                <Input
                  type="email"
                  placeholder="exemplo@pitang.com"
                  size="lg"
                  focusBorderColor="brand.500"
                  borderRadius="lg"
                  bg="gray.50"
                  _hover={{ bg: 'white' }}
                  {...register('email')}
                />
                <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel color="gray.700" fontWeight="medium">Senha</FormLabel>
                <Input
                  type="password"
                  placeholder="••••••••"
                  size="lg"
                  focusBorderColor="brand.500"
                  borderRadius="lg"
                  bg="gray.50"
                  _hover={{ bg: 'white' }}
                  {...register('password')}
                />
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                w="full"
                mt={4}
                isLoading={isLoading}
                loadingText="Entrando..."
                leftIcon={<Icon as={LogIn} />}
                borderRadius="lg"
                boxShadow="md"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                transition="all 0.2s"
              >
                Entrar
              </Button>
            </VStack>
          </form>

          <Box textAlign="center" pt={4} borderTop="1px solid" borderColor="gray.100">
            <Text fontSize="sm" color="gray.500" fontWeight="medium">
              Contas de teste padrão:
            </Text>
            <Text fontSize="xs" color="gray.400" mt={1}>
              emp@test.com | mgr@test.com | fin@test.com<br/>
              Senha: 123456
            </Text>
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
}
