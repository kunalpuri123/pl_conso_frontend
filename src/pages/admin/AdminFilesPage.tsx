import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { InputFile } from '@/lib/supabase-types';
import type { FileObject } from '@supabase/storage-js';

export function AdminFilesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  // =========================
  // DOWNLOAD HELPER
  // =========================
  const handleDownload = async (bucket: string, path: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || 'Download failed');
    }
  };

  // =========================
  // FETCH CRAWL FILES (DB)
  // =========================
  const { data: crawlFiles, refetch: refetchCrawl } = useQuery({
    queryKey: ['input-files', 'CRAWL'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('input_files')
        .select('id, filename, storage_path, created_at')
        .eq('file_type', 'CRAWL')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InputFile[];
    },
  });

  // =========================
  // FETCH MASTER FILES (BUCKET)
  // =========================
  const { data: masterFiles, refetch: refetchMaster } = useQuery<FileObject[]>({
    queryKey: ['storage', 'masters'],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('masters').list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error) throw error;
      return data || [];
    },
  });

  // =========================
  // UPLOAD HANDLER
  // =========================
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: 'CRAWL' | 'MASTER'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const bucket = fileType === 'CRAWL' ? 'input-files' : 'masters';
      const path = `${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);
      if (uploadError) throw uploadError;

      // Only CRAWL files go into DB
      if (fileType === 'CRAWL') {
        const { error: dbError } = await supabase.from('input_files').insert({
          filename: file.name,
          file_type: 'CRAWL',
          storage_path: path,
          uploaded_by: user?.id,
        });
        if (dbError) throw dbError;
      }

      toast.success('File uploaded successfully');

      if (fileType === 'CRAWL') refetchCrawl();
      else refetchMaster();

    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  // =========================
  // DELETE HANDLERS
  // =========================
  const deleteCrawlFile = async (file: InputFile) => {
    try {
      await supabase.storage.from('input-files').remove([file.storage_path]);
      await supabase.from('input_files').delete().eq('id', file.id);

      toast.success('File deleted');
      refetchCrawl();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const deleteMasterFile = async (file: FileObject) => {
    try {
      await supabase.storage.from('masters').remove([file.name]);
      toast.success('File deleted');
      refetchMaster();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">File Management</h1>

      <Tabs defaultValue="crawl">
        <TabsList>
          <TabsTrigger value="crawl">Crawl Input Files</TabsTrigger>
          <TabsTrigger value="master">Master Files</TabsTrigger>
        </TabsList>

        {/* ================= CRAWL TAB ================= */}
        <TabsContent value="crawl">
          <Card>
            <CardHeader>
              <CardTitle>Crawl Input Files</CardTitle>
            </CardHeader>
            <CardContent>
              <Input type="file" accept=".csv,.tsv,.xlsx" disabled={uploading} onChange={(e) => handleFileUpload(e, 'CRAWL')} />

              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crawlFiles?.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>{file.filename}</TableCell>
                      <TableCell>{format(new Date(file.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() =>
                            handleDownload('input-files', file.storage_path, file.filename)
                          }>
                            <Download className="h-4 w-4" />
                          </Button>

                          <Button variant="ghost" size="icon" onClick={() => deleteCrawlFile(file)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= MASTER TAB ================= */}
        <TabsContent value="master">
          <Card>
            <CardHeader>
              <CardTitle>Master Files</CardTitle>
            </CardHeader>
            <CardContent>
              <Input type="file" accept=".csv" disabled={uploading} onChange={(e) => handleFileUpload(e, 'MASTER')} />

              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {masterFiles?.map((file) => (
                    <TableRow key={file.name}>
                      <TableCell>{file.name}</TableCell>
                      <TableCell>{file.created_at ? format(new Date(file.created_at), 'MMM d, yyyy HH:mm') : '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() =>
                            handleDownload('masters', file.name, file.name)
                          }>
                            <Download className="h-4 w-4" />
                          </Button>

                          {/* <Button variant="ghost" size="icon" onClick={() => deleteMasterFile(file)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

export default AdminFilesPage;
