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
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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

      const { token, refreshToken, user } = response.data;
      login(token, refreshToken, user);

      toast({
        title: 'Login successful!',
        description: `Welcome back, ${user.name}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });

      navigate('/');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast({
        title: 'Login failed',
        description: error.response?.data?.error || 'Invalid credentials.',
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
            <Text color="gray.500">Sign in to manage your reimbursement requests.</Text>
          </VStack>
    
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.email}>
                <FormLabel color="gray.700" fontWeight="medium">Email</FormLabel>
                <Input
                  type="email"
                  placeholder="example@pitang.com"
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
                <FormLabel color="gray.700" fontWeight="medium">Password</FormLabel>
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
                loadingText="Signing in..."
                leftIcon={<Icon as={LogIn} />}
                borderRadius="lg"
                boxShadow="md"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                transition="all 0.2s"
              >
                Sign In
              </Button>
            </VStack>
          </form>

          <Box textAlign="center" pt={4} borderTop="1px solid" borderColor="gray.100">
            <Text fontSize="sm" color="gray.500" fontWeight="medium">
              Default test accounts (password: 123456)
            </Text>
            <Text fontSize="xs" color="gray.400" mt={1}>
              admin@pitang.com · employee@pitang.com<br />
              manager@pitang.com · finance@pitang.com
            </Text>
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
}
