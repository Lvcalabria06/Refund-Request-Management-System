import { Box, Flex, VStack, Icon, Text, Link as ChakraLink, Button } from '@chakra-ui/react';
import { NavLink as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, FileText, CheckSquare, DollarSign, Users, LogOut, Tags } from 'lucide-react';

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getNavItems = () => {
    const items = [
      { name: 'Dashboard', icon: Home, path: '/', roles: ['EMPLOYEE', 'MANAGER', 'FINANCE', 'ADMIN'] },
      { name: 'My reimbursements', icon: FileText, path: '/reimbursements', roles: ['EMPLOYEE'] },
      { name: 'Approvals', icon: CheckSquare, path: '/approvals', roles: ['MANAGER'] },
      { name: 'Payments', icon: DollarSign, path: '/payments', roles: ['FINANCE'] },
      { name: 'Users', icon: Users, path: '/admin/users', roles: ['ADMIN'] },
      { name: 'Categories', icon: Tags, path: '/admin/categories', roles: ['ADMIN'] },
    ];
    return items.filter(item => item.roles.includes(user?.role || ''));
  };

  const navItems = getNavItems();

  return (
    <Box 
      w="260px" 
      bg="white" 
      h="100vh" 
      borderRight="1px solid" 
      borderColor="gray.200" 
      flexShrink={0} 
      display="flex" 
      flexDirection="column"
    >
      <Flex h="20" align="center" justify="center" borderBottom="1px solid" borderColor="gray.100">
        <Text fontSize="2xl" fontWeight="extrabold" color="brand.600">Pitang Refunds</Text>
      </Flex>

      <VStack spacing={2} align="stretch" mt={6} px={4} flex="1">
        {navItems.map((item) => {
          // Detectar rota ativa exata ou rota base
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <ChakraLink
              key={item.name}
              as={RouterLink}
              to={item.path}
              _hover={{ textDecoration: 'none' }}
            >
              <Flex
                align="center"
                p={3}
                borderRadius="lg"
                cursor="pointer"
                bg={isActive ? 'brand.50' : 'transparent'}
                color={isActive ? 'brand.600' : 'gray.600'}
                _hover={{ bg: 'brand.50', color: 'brand.600' }}
                transition="all 0.2s"
              >
                <Icon as={item.icon} boxSize={5} mr={3} />
                <Text fontWeight="medium">{item.name}</Text>
              </Flex>
            </ChakraLink>
          );
        })}
      </VStack>

      <Box p={4} borderTop="1px solid" borderColor="gray.100">
        <Flex align="center" mb={4}>
          <Box 
            bg="brand.100" 
            color="brand.700" 
            fontWeight="bold" 
            borderRadius="full" 
            boxSize={10} 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            mr={3}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight="bold" color="gray.800" isTruncated maxW="150px">{user?.name}</Text>
            <Text fontSize="xs" color="gray.500">{user?.role}</Text>
          </Box>
        </Flex>
        <Button 
          w="full" 
          variant="outline" 
          colorScheme="red" 
          leftIcon={<Icon as={LogOut} boxSize={4} />} 
          onClick={logout}
          size="sm"
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
}
