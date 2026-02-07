'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Key, CheckCircle, XCircle, Trash2, Loader2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { apiKeysApi } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';
import { AddApiKeyForm } from './add-api-key-form';

const PROVIDER_LABELS: Record<string, string> = {
  CLAUDE: 'Claude (Anthropic)',
  OPENAI: 'OpenAI',
  GEMINI: 'Gemini (Google)',
  OPENROUTER: 'OpenRouter',
  DALLE: 'DALL-E',
  REPLICATE: 'Replicate',
};

const PROVIDER_COLORS: Record<string, string> = {
  CLAUDE: 'bg-orange-100 text-orange-800',
  OPENAI: 'bg-green-100 text-green-800',
  GEMINI: 'bg-blue-100 text-blue-800',
  OPENROUTER: 'bg-indigo-100 text-indigo-800',
  DALLE: 'bg-purple-100 text-purple-800',
  REPLICATE: 'bg-pink-100 text-pink-800',
};

// Providers that support text generation
const TEXT_GENERATION_PROVIDERS = ['CLAUDE', 'OPENAI', 'GEMINI', 'OPENROUTER'];

export default function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiKeysApi.list().then((res) => res.data),
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => apiKeysApi.test(id),
    onSuccess: (res) => {
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Test failed');
    },
    onSettled: () => {
      setTestingKey(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiKeysApi.delete(id),
    onSuccess: () => {
      toast.success('API key deleted');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => apiKeysApi.setDefault(id),
    onSuccess: () => {
      toast.success('Default API key updated');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to set default');
    },
  });

  const handleTest = (id: string) => {
    setTestingKey(id);
    testMutation.mutate(id);
  };

  return (
    <div>
      <Header
        title="API Keys"
        description="Manage AI provider API keys"
        action={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add API Key
          </Button>
        }
      />

      <div className="p-6">
        {/* Info Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">
              API keys are encrypted and stored securely. Add keys for AI providers to enable
              article generation and image creation features.
            </p>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : apiKeys?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No API keys configured
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys?.map((apiKey: any) => (
                  <TableRow key={apiKey.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                          <Key className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <span className="font-medium">{apiKey.name}</span>
                          {apiKey.isDefault && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                              <Star className="h-3 w-3" />
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            PROVIDER_COLORS[apiKey.provider] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {PROVIDER_LABELS[apiKey.provider] || apiKey.provider}
                        </span>
                        {apiKey.model && (
                          <div className="text-xs text-gray-500 mt-1">
                            {apiKey.model}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={apiKey.isActive ? 'success' : 'default'}>
                        {apiKey.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatNumber(apiKey.usageCount)} calls</TableCell>
                    <TableCell className="text-gray-500">
                      {apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTest(apiKey.id)}
                          disabled={testingKey === apiKey.id}
                        >
                          {testingKey === apiKey.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Test'
                          )}
                        </Button>
                        {TEXT_GENERATION_PROVIDERS.includes(apiKey.provider) && (
                          apiKey.isDefault ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="bg-yellow-50 border-yellow-300 text-yellow-700"
                            >
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDefaultMutation.mutate(apiKey.id)}
                              disabled={setDefaultMutation.isPending}
                            >
                              Set Default
                            </Button>
                          )
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteKeyId(apiKey.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add API Key Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add API Key"
      >
        <AddApiKeyForm
          onSuccess={() => {
            setIsAddModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
          }}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteKeyId}
        onClose={() => setDeleteKeyId(null)}
        onConfirm={() => {
          if (deleteKeyId) {
            deleteMutation.mutate(deleteKeyId);
            setDeleteKeyId(null);
          }
        }}
        title="ลบ API Key"
        message="คุณต้องการลบ API Key นี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบ"
        cancelText="ยกเลิก"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
