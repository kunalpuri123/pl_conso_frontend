import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  ArrowLeft,
  Search,
  Filter,
  Download,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

interface DownloadItem {
  run_file_id: string;
  filename: string;
  storage_path: string;
  file_type: string;
  project_name: string | null;
  site_name: string | null;
  user_full_name: string | null;
  scope: string | null;
  run_uuid: string;
  file_created_at: string;
}

export function DownloadsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const { data: downloads, refetch, isLoading } = useQuery({
    queryKey: ['downloads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('download_view')
        .select('*')
        .order('file_created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as DownloadItem[];
    },
  });

  // Build site dropdown options
  const siteOptions = useMemo(() => {
    return Array.from(
      new Set((downloads || []).map(d => d.site_name).filter(Boolean))
    ) as string[];
  }, [downloads]);

  // Apply filters
  const filteredDownloads = useMemo(() => {
    return (downloads || []).filter((item) => {
      // Text search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const textMatch =
          item.filename.toLowerCase().includes(q) ||
          item.project_name?.toLowerCase().includes(q) ||
          item.site_name?.toLowerCase().includes(q) ||
          item.user_full_name?.toLowerCase().includes(q);

        if (!textMatch) return false;
      }

      // Site filter
      if (selectedSite !== 'all' && item.site_name !== selectedSite) {
        return false;
      }

      // Date filter
      const itemDate = new Date(item.file_created_at);

      if (fromDate) {
        const from = new Date(fromDate);
        if (itemDate < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (itemDate > to) return false;
      }

      return true;
    });
  }, [downloads, searchQuery, selectedSite, fromDate, toDate]);

  const handleDownload = async (storagePath: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('run-outputs')
        .download(storagePath);

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

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSite('all');
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Downloads</h1>
        <Button variant="ghost" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search file, project, site, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Site filter */}
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="border rounded px-3 py-2 bg-background"
          >
            <option value="all">All Sites</option>
            {siteOptions.map(site => (
              <option key={site} value={site}>{site}</option>
            ))}
          </select>

          {/* Date filters */}
          {/* <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />

          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          /> */}

          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        </div>

        <Filter className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Generated At</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredDownloads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No downloads found
                </TableCell>
              </TableRow>
            ) : (
              filteredDownloads.map((item, index) => (
                <TableRow key={item.run_file_id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.project_name || '-'}</TableCell>
                  <TableCell>{item.site_name || '-'}</TableCell>
                  <TableCell>
                    <button
                      className="text-accent hover:underline"
                      onClick={() => handleDownload(item.storage_path, item.filename)}
                    >
                      {item.filename}
                    </button>
                  </TableCell>
                  <TableCell>{item.user_full_name || '-'}</TableCell>
                  <TableCell>{item.file_type}</TableCell>
                  <TableCell>{item.scope || '-'}</TableCell>
                  <TableCell>
                    {format(new Date(item.file_created_at), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(item.storage_path, item.filename)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Merkle Inc.
      </div>
    </div>
  );
}

export default DownloadsPage;
