import type { ReactNode } from 'react';
import { Flex, Box } from '@chakra-ui/react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Flex h="100vh" bg="gray.50" overflow="hidden">
      <Sidebar />
      <Box flex="1" overflowY="auto" p={8}>
        {children}
      </Box>
    </Flex>
  );
}
