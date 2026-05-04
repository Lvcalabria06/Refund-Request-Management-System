import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Badge,
  Spinner,
  VStack,
  HStack,
  Divider,
  Icon,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { ArrowLeft, Paperclip, Clock, Plus, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import dayjs from 'dayjs';

interface Attachment {
  id: string;
  fileName: string;
  url: string;
  fileType: string;
  createdAt?: string;
}

interface HistoryEntry {
  id: string;
  action: string;
  notes?: string;
  createdAt: string;
  author: { id: string; name: string };
}

interface Reimbursement {
  id: string;
  description: string;
  amount: number;
  status: string;
  expenseDate: string;
  rejectionReason?: string | null;
  employeeId: string;
  category: { name: string };
  employee?: { id: string; name: string; email: string };
}

const statusColors: Record<string, string> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
  PAID: 'purple',
  CANCELED: 'orange',
};

export function ReimbursementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [reimbursement, setReimbursement] = useState<Reimbursement | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado do formulário de novo anexo (upload simulado via base64)
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedFileType, setDetectedFileType] = useState<'PDF' | 'JPG' | 'PNG' | null>(null);
  const [submittingAttachment, setSubmittingAttachment] = useState(false);

  // Detecta o tipo a partir da extensão do arquivo
  const detectFileType = (file: File): 'PDF' | 'JPG' | 'PNG' | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'PDF';
    if (ext === 'jpg' || ext === 'jpeg') return 'JPG';
    if (ext === 'png') return 'PNG';
    return null;
  };

  // Converte o arquivo em data URL base64 (upload simulado)
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = detectFileType(file);
    if (!type) {
      toast({
        title: 'Tipo de arquivo não permitido',
        description: 'Aceitos apenas: PDF, JPG ou PNG.',
        status: 'warning',
      });
      e.target.value = '';
      return;
    }

    // Limite de 5MB para evitar payloads gigantes em base64
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O limite é 5MB.',
        status: 'warning',
      });
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setDetectedFileType(type);
  };

  const loadAll = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [reimbursementRes, attachmentsRes, historyRes] = await Promise.all([
        api.get(`/reimbursements/${id}`),
        api.get(`/reimbursements/${id}/attachments`),
        api.get(`/reimbursements/${id}/history`),
      ]);
      setReimbursement(reimbursementRes.data);
      setAttachments(attachmentsRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast({
        title: 'Erro ao carregar solicitação',
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  const handleAddAttachment = async () => {
    if (!selectedFile || !detectedFileType) {
      toast({ title: 'Selecione um arquivo.', status: 'warning' });
      return;
    }
    try {
      setSubmittingAttachment(true);
      const dataUrl = await fileToDataUrl(selectedFile);

      await api.post(`/reimbursements/${id}/attachments`, {
        fileName: selectedFile.name,
        url: dataUrl,
        fileType: detectedFileType,
      });

      toast({ title: 'Anexo adicionado com sucesso!', status: 'success' });
      setSelectedFile(null);
      setDetectedFileType(null);
      setShowAttachmentForm(false);

      const attRes = await api.get(`/reimbursements/${id}/attachments`);
      setAttachments(attRes.data);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string; errors?: unknown } } };
      toast({
        title: 'Erro ao adicionar anexo',
        description: error.response?.data?.error || 'Verifique os dados e tente novamente.',
        status: 'error',
      });
    } finally {
      setSubmittingAttachment(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="60vh">
        <Spinner color="brand.500" size="xl" />
      </Flex>
    );
  }

  if (!reimbursement) {
    return (
      <Box>
        <Text color="gray.500">Solicitação não encontrada.</Text>
      </Box>
    );
  }

  const canAddAttachment =
    reimbursement.status === 'DRAFT' || reimbursement.status === 'SUBMITTED';

  return (
    <Box>
      <Flex align="center" mb={6}>
        <Button variant="ghost" mr={4} onClick={() => navigate(-1)} px={2}>
          <Icon as={ArrowLeft} boxSize={5} />
        </Button>
        <Heading size="lg" color="gray.800">
          Detalhes da Solicitação
        </Heading>
      </Flex>

      {/* Bloco principal de dados */}
      <Box
        bg="white"
        p={6}
        borderRadius="xl"
        boxShadow="sm"
        border="1px solid"
        borderColor="gray.100"
        mb={6}
      >
        <Flex justify="space-between" align="flex-start" mb={4}>
          <Box>
            <Text fontSize="sm" color="gray.500">Descrição</Text>
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              {reimbursement.description}
            </Text>
          </Box>
          <Badge
            colorScheme={statusColors[reimbursement.status] || 'gray'}
            px={3}
            py={1}
            borderRadius="md"
            fontSize="sm"
          >
            {reimbursement.status}
          </Badge>
        </Flex>

        <Divider my={4} />

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Box>
            <Text fontSize="sm" color="gray.500">Valor</Text>
            <Text fontWeight="bold" color="gray.800">
              R$ {reimbursement.amount.toFixed(2)}
            </Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.500">Data da Despesa</Text>
            <Text fontWeight="bold" color="gray.800">
              {dayjs(reimbursement.expenseDate).format('DD/MM/YYYY')}
            </Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.500">Categoria</Text>
            <Text fontWeight="bold" color="gray.800">
              {reimbursement.category?.name}
            </Text>
          </Box>
          {reimbursement.employee && (
            <Box>
              <Text fontSize="sm" color="gray.500">Funcionário</Text>
              <Text fontWeight="bold" color="gray.800">
                {reimbursement.employee.name}
              </Text>
            </Box>
          )}
        </SimpleGrid>

        {reimbursement.status === 'REJECTED' && reimbursement.rejectionReason && (
          <Box
            mt={4}
            p={3}
            bg="red.50"
            borderLeft="4px solid"
            borderColor="red.500"
            borderRadius="md"
          >
            <Text fontSize="sm" color="red.700" fontWeight="bold">
              Motivo da rejeição:
            </Text>
            <Text fontSize="sm" color="red.600">
              {reimbursement.rejectionReason}
            </Text>
          </Box>
        )}
      </Box>

      {/* Bloco de Anexos */}
      <Box
        bg="white"
        p={6}
        borderRadius="xl"
        boxShadow="sm"
        border="1px solid"
        borderColor="gray.100"
        mb={6}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <HStack>
            <Icon as={Paperclip} color="brand.500" />
            <Heading size="md" color="gray.800">
              Anexos ({attachments.length})
            </Heading>
          </HStack>
          {canAddAttachment && (
            <Button
              size="sm"
              colorScheme="brand"
              variant="outline"
              leftIcon={<Icon as={Plus} boxSize={4} />}
              onClick={() => setShowAttachmentForm(!showAttachmentForm)}
            >
              {showAttachmentForm ? 'Cancelar' : 'Adicionar'}
            </Button>
          )}
        </Flex>

        {showAttachmentForm && (
          <Box bg="gray.50" p={4} borderRadius="md" mb={4}>
            <VStack spacing={3} align="stretch">
              <FormControl>
                <FormLabel fontSize="sm">
                  Selecionar arquivo (PDF, JPG ou PNG — máx. 5MB)
                </FormLabel>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={handleFileChange}
                  p={1}
                  border="1px solid"
                  borderColor="gray.300"
                  bg="white"
                />
              </FormControl>

              {selectedFile && detectedFileType && (
                <Flex
                  p={3}
                  bg="white"
                  borderRadius="md"
                  align="center"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <Icon as={Paperclip} color="gray.500" boxSize={4} mr={2} />
                  <Text fontSize="sm" color="gray.700" fontWeight="medium" mr={2}>
                    {selectedFile.name}
                  </Text>
                  <Badge colorScheme="blue" mr={2}>
                    {detectedFileType}
                  </Badge>
                  <Text fontSize="xs" color="gray.500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </Text>
                </Flex>
              )}

              <Button
                size="sm"
                colorScheme="brand"
                onClick={handleAddAttachment}
                isLoading={submittingAttachment}
                isDisabled={!selectedFile}
              >
                Salvar Anexo
              </Button>
            </VStack>
          </Box>
        )}

        {attachments.length === 0 ? (
          <Text color="gray.500" fontSize="sm">
            Nenhum anexo cadastrado.
          </Text>
        ) : (
          <VStack spacing={2} align="stretch">
            {attachments.map((att) => (
              <Flex
                key={att.id}
                p={3}
                bg="gray.50"
                borderRadius="md"
                align="center"
                justify="space-between"
                _hover={{ bg: 'gray.100' }}
              >
                <HStack>
                  <Icon as={Paperclip} color="gray.500" boxSize={4} />
                  <Box>
                    <Text fontWeight="medium" color="gray.800">
                      {att.fileName}
                    </Text>
                    <Badge colorScheme="blue" fontSize="xs">
                      {att.fileType}
                    </Badge>
                  </Box>
                </HStack>
                <ChakraLink href={att.url} isExternal color="brand.500">
                  <HStack spacing={1}>
                    <Text fontSize="sm">Abrir</Text>
                    <Icon as={ExternalLink} boxSize={3} />
                  </HStack>
                </ChakraLink>
              </Flex>
            ))}
          </VStack>
        )}
      </Box>

      {/* Bloco de Histórico */}
      <Box
        bg="white"
        p={6}
        borderRadius="xl"
        boxShadow="sm"
        border="1px solid"
        borderColor="gray.100"
      >
        <HStack mb={4}>
          <Icon as={Clock} color="brand.500" />
          <Heading size="md" color="gray.800">
            Histórico
          </Heading>
        </HStack>

        {history.length === 0 ? (
          <Text color="gray.500" fontSize="sm">
            Nenhum registro de histórico.
          </Text>
        ) : (
          <VStack spacing={3} align="stretch">
            {history.map((h) => (
              <Box
                key={h.id}
                p={3}
                borderLeft="3px solid"
                borderColor="brand.400"
                bg="gray.50"
                borderRadius="md"
              >
                <Flex justify="space-between" align="center" mb={1}>
                  <Badge colorScheme={statusColors[h.action] || 'gray'}>
                    {h.action}
                  </Badge>
                  <Text fontSize="xs" color="gray.500">
                    {dayjs(h.createdAt).format('DD/MM/YYYY HH:mm')}
                  </Text>
                </Flex>
                <Text fontSize="sm" color="gray.700">
                  {h.notes}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  por <strong>{h.author?.name}</strong>
                </Text>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  );
}
