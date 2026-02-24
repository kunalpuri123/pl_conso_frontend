import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, RefreshCw, Download, RotateCcw, Loader2, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import type { Project, Site, Run, RunLog } from '@/lib/supabase-types';
import { backendFetch } from '@/lib/backendApi';

const scopes = ['PP'];
type PPRunMode = 'fresh' | 'revalidation';

const TEMPLATE_REQUIRED_SOURCE_FILES = [
  "COTY_Benelux_Consumer Beauty_Animation_Exposure_All_Data_2025-12-29_All_All_All",
  "COTY_Benelux_Prestige_Animation_Exposure_All_Data_2025-12-29_All_All_All",
  "COTY_ES_Consumer Beauty_Animation_Exposure_All_Data_2025-12-29_All_All_All",
  "COTY_ES_Prestige_Animation_Exposure_All_Data_2025-12-29_All_All_All",
  "COTY_Argentina_Consumer_Beauty_Animation_Exposure_All_Data_2025-12-30_All_All_All.tsv",
  "COTY_Argentina_Prestige_Animation_Exposure_All_Data_2025-12-30_All_All_All.tsv",
  "COTY_South_Africa_Consumer_Beauty_Animation_Exposure_All_Data_2025-12-31_All_All_All.tsv",
  "COTY_South_Africa_Prestige_Animation_Exposure_All_Data_2025-12-31_All_All_All.tsv",
  "COTY_UK_Consumer Beauty_Animation_Exposure_All_Data_2026-01-07_All_All_All.tsv",
  "COTY_UK_Prestige_Animation_Exposure_All_Data_2026-01-07_All_All_All.tsv",
  "Hermes_America_AE_Template_All_Data_2026-01-07_All_All_All.tsv",
  "Hermes_Europe_AE_Template_All_Data_2026-01-07_All_All_All.tsv",
  "COTY_Brazil_Prestige_Animation_Exposure_All_Data_2026-01-08_All_All_All.tsv",
  "COTY_Animation_Exposure_All_Data_2026-01-21_All_All_All.tsv",
  "COTY_FR_Consumer Beauty_Animation_Exposure_All_Data_2026-01-19_All_All_All.tsv",
  "COTY_FR_Prestige_Animation_Exposure_All_Data_2026-01-19_All_All_All.tsv",
  "Grocery_POC_US_Aerated_Beverages_Animation_Exposure_All_Data_2026-01-26_All_All_All.tsv",
  "Grocery_POC_US_Energy_Bars_Animation_Exposure_All_Data_2026-01-26_All_All_All.tsv",
  "Grocery_POC_US_Beer_Animation_Exposure_All_Data_2026-02-05_All_All_All.tsv",
  "Grocery_POC_US_Cheese_Animation_Exposure_All_Data_2026-02-05_All_All_All.tsv",
  "Grocery_POC_US_Coffee_Creamers_Animation_Exposure_All_Data_2026-02-05_All_All_All.tsv",
  "Grocery_POC_US_Frozen_Foods_Animation_Exposure_All_Data_2026-02-05_All_All_All.tsv",
  "Grocery_POC_US_Sparkling_Water_Animation_Exposure_All_Data_2026-02-05_All_All_All.tsv",
  "Grocery_POC_US_Toilet_Paper_Animation_Exposure_All_Data_2026-02-05_All_All_All.tsv",
  "Grocery_POC_US_Vodka_Animation_Exposure_All_Data_2026-02-05_All_All_All.tsv",
  "COTY_Canada_Consumer Beauty_Animation_Exposure_All_Data_2026-02-18_All_All_All.tsv",
];

const normalizeSourceFilename = (name: string) => {
  let n = (name || "")
    .trim()
    .replace(/\.tsv$/i, "")
    .replace(/\d{4}-\d{2}-\d{2}/g, "")
    .replace(/[\s_]+/g, " ")
    .trim()
    .toLowerCase();
  n = n.replace(/\ball all all\b/g, "").replace(/\s+/g, " ").trim();
  return n;
};

const REQUIRED_SOURCE_PATTERNS = Array.from(
  new Set(TEMPLATE_REQUIRED_SOURCE_FILES.map((f) => normalizeSourceFilename(f)))
);

export function PPConsoPage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedIPFile, setSelectedIPFile] = useState<string>('');
  const [selectedMasterBucketFile, setSelectedMasterBucketFile] = useState<string>('');
  const [selectedAETemplateFile, setSelectedAETemplateFile] = useState<string>('');
  const [runMode, setRunMode] = useState<PPRunMode>('fresh');
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [siteFilter, setSiteFilter] = useState<string>('');
  const [crawlFileFilter, setCrawlFileFilter] = useState<string>('');
  const [crawlInputFilter, setCrawlInputFilter] = useState<string>('');
  const [masterFileFilter, setMasterFileFilter] = useState<string>('');
  const [aeTemplateFilter, setAETemplateFilter] = useState<string>('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<any[]>([]);

  const BUSINESS_GROUPS = {
  COTY: "COTY",
  HERMES: "HERMES",
  LVMH: "LVMH",
  OTHERS: "OTHERS",
} as const;

const PROJECT_GROUP_MAP: Record<string, string[]> = {
  COTY: [
    "COTY",
  ],

  HERMES: [
    "Hermes"
  ],

  LVMH: [
    "PCD",
    "LFB",
    "MFK",
    "MUFE",
    "Fresh",
    "BNC"
  ],

  OTHERS: [
    "Grocery",
    "INTEL",
    "DSA",
    "Sargento",
    "Shiseido",
    "Immuno",
    "ADP"
  ]
};


  useEffect(() => {
  if (!selectedRunId) return;

  supabase
    .from("run_logs")
    .select("*")
    .eq("run_id", selectedRunId)
    .order("created_at", { ascending: true })
    .then(({ data }) => {
      setConsoleLogs(data || []);
    });
}, [selectedRunId]);

  // Form state
  const [selectedProject, setSelectedProject] = useState<string>(
    location.state?.projectId || ''
  );
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedScope, setSelectedScope] = useState<string>('');
  const [selectedCrawlFile, setSelectedCrawlFile] = useState<string>('');
  
  // Current run being monitored
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').order('name');
      if (error) throw error;
      return data as Project[];
    },
  });
  const isAETemplateRequired =
    !!selectedCrawlFile &&
    REQUIRED_SOURCE_PATTERNS.some((pattern) =>
      normalizeSourceFilename(selectedCrawlFile).startsWith(pattern)
    );

  // Fetch sites for selected project
  const { data: sites } = useQuery({
    queryKey: ['sites', selectedProject],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('project_id', selectedProject)
        .order('name');
      if (error) throw error;
      return data as Site[];
    },
    enabled: !!selectedProject,
  });

  // Fetch AE PP input files (output from crawl)
  const { data: pdpInputFiles } = useQuery({
    queryKey: ['storage', 'pp-input'],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('pp-input').list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });
      if (error) throw error;
      return data;
    },
  });

  // Fetch AE PP crawl-input (IP) files from bucket
  const { data: crawlInputFiles } = useQuery({
    queryKey: ['storage', 'pp-review-input'],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('pp-review-input').list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });
      if (error) throw error;
      return data;
    },
  });

  // Fetch AE PP references files from bucket
  const { data: masterBucketFiles } = useQuery({
    queryKey: ['storage', 'pp-reference'],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('pp-reference').list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });
      if (error) throw error;
      return data;
    },
  });

  // Fetch AE template files from bucket
  const { data: aeTemplateFiles } = useQuery({
    queryKey: ['storage', 'pp-ae-checks'],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('pp-ae-checks').list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });
      if (error) throw error;
      return data;
    },
  });


  // Fetch runs history
  const { data: myRuns, refetch: refetchRuns } = useQuery({
    queryKey: ['runs', 'my', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('runs')
        .select('*, projects(*), sites(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as (Run & { projects: Project; sites: Site })[];
    },
    enabled: !!user?.id,
  });

  const { data: teamRuns } = useQuery({
    queryKey: ['runs', 'team'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('runs')
        .select('*, projects(*), sites(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      
      // Fetch profiles separately for each run
      const runsWithProfiles = await Promise.all(
        (data || []).map(async (run) => {
          if (run.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', run.user_id)
              .single();
            return { ...run, profile };
          }
          return { ...run, profile: null };
        })
      );
      
      return runsWithProfiles;
    },
  });

  // Fetch logs for current run with realtime subscription
  const { data: currentLogs } = useQuery({
    queryKey: ['run-logs', currentRunId],
    queryFn: async () => {
      if (!currentRunId) return [];
      const { data, error } = await supabase
        .from('run_logs')
        .select('*')
        .eq('run_id', currentRunId)
        .order('timestamp');
      if (error) throw error;
      const sorted = (data as RunLog[]).slice().sort((a: any, b: any) => {
        const ta = a.timestamp ?? a.created_at ?? 0;
        const tb = b.timestamp ?? b.created_at ?? 0;
        const dt = new Date(ta).getTime() - new Date(tb).getTime();
        if (dt !== 0) return dt;
        if (a.id != null && b.id != null) return a.id - b.id;
        return 0;
      });
      return sorted;
    },
    enabled: !!currentRunId,
    refetchInterval: currentRunId ? 2000 : false,
  });

  // Current run status
  const { data: currentRun } = useQuery({
    queryKey: ['run', currentRunId],
    queryFn: async () => {
      if (!currentRunId) return null;
      const { data, error } = await supabase
        .from('runs')
        .select('*')
        .eq('id', currentRunId)
        .single();
      if (error) throw error;
      return data as Run;
    },
    enabled: !!currentRunId,
    refetchInterval: currentRunId ? 2000 : false,
  });

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentLogs, autoScroll]);

  // Create run mutation
  const createRunMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMasterBucketFile) throw new Error("Please select AE PP reference file");
      if (isAETemplateRequired && !selectedAETemplateFile) {
        throw new Error("Please select AE PP template file");
      }
      if (runMode === 'fresh' && !selectedCrawlFile) {
        throw new Error("Please select AE PP source file");
      }
      if (runMode === 'revalidation' && !selectedIPFile) {
        throw new Error("Please select AE PP review file for revalidation");
      }

      const { data, error } = await supabase
        .from('runs')
        .insert({
          user_id: user?.id,
          project_id: selectedProject,
          site_id: selectedSite,
          scope: selectedScope,
          op_filename: selectedCrawlFile || null,     // from pp-input bucket
          ip_filename: selectedIPFile || null,        // from pp-review-input bucket
          master_filename: selectedMasterBucketFile, // from pp-reference bucket
          ae_filename: isAETemplateRequired ? (selectedAETemplateFile || null) : null, // from pp-ae-checks bucket

          status: 'pending',
          automation_slug: 'pp-conso',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Run;
    },
    onSuccess: async (data) => {
    setCurrentRunId(data.id);
    toast.success(`Run ${data.run_uuid} started`);

    await backendFetch(`/pp-run/${data.id}`, { method: 'POST' });

  refetchRuns();
},
    onError: (error) => {
      toast.error(`Failed to create run: ${error.message}`);
    },
  });

  const handleRunAutomation = () => {
    if (!selectedProject || !selectedSite || !selectedScope) {
      toast.error('Please select all required fields');
      return;
    }

    if (!selectedMasterBucketFile) {
      toast.error('Please select AE PP reference file');
      return;
    }
    if (isAETemplateRequired && !selectedAETemplateFile) {
      toast.error('Please select AE PP template file');
      return;
    }

    if (runMode === 'fresh' && !selectedCrawlFile) {
      toast.error('Please select AE PP source file');
      return;
    }

    if (runMode === 'revalidation' && !selectedIPFile) {
      toast.error('Please select AE PP review file for revalidation');
      return;
    }
    
    createRunMutation.mutate();
  };

  const canRunAutomation =
    !!selectedProject &&
    !!selectedSite &&
    !!selectedScope &&
    !!selectedMasterBucketFile &&
    (!isAETemplateRequired || !!selectedAETemplateFile) &&
    (runMode === 'fresh' ? !!selectedCrawlFile : !!selectedIPFile);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'cancelled':
        return <Badge variant="outline">⛔ Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-success text-success-foreground">✓ Complete</Badge>;
      case 'running':
        return <Badge className="bg-accent text-accent-foreground">⏳ Running</Badge>;
      case 'failed':
        return <Badge variant="destructive">✗ Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-destructive';
      case 'WARN':
        return 'text-warning';
      default:
        return 'text-primary-foreground';
    }
  };

  const formatDuration = (start?: string | null, end?: string | null) => {
    if (!start) return '-';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  try {
    const file = e.target.files?.[0];
    if (!file) return;


    const newFileName = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("pp-input")
      .upload(newFileName, file);

    if (uploadError) throw uploadError;

    toast.success(`AE PP source uploaded as ${newFileName}`);
    queryClient.invalidateQueries({ queryKey: ['storage', 'pp-input'] });

  } catch (err: any) {
    toast.error(err.message || "Upload failed");
  } finally {
    e.target.value = "";
  }
};

const handleReviewReupload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  try {
    const file = e.target.files?.[0];
    if (!file) return;

    const newFileName = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("pp-review-input")
      .upload(newFileName, file);

    if (uploadError) throw uploadError;

    setSelectedIPFile(newFileName);
    toast.success(`AE PP review re-uploaded as ${newFileName}`);
    queryClient.invalidateQueries({ queryKey: ['storage', 'pp-review-input'] });
  } catch (err: any) {
    toast.error(err.message || "Review re-upload failed");
  } finally {
    e.target.value = "";
  }
};


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Left Panel - Run Configuration */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Run Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Project <span className="text-destructive">*</span></Label>
            <Select value={selectedProject} onValueChange={(value) => {
              setSelectedProject(value);
              setSelectedSite('');
              setSelectedScope('');
              setSelectedCrawlFile('');
              setSelectedAETemplateFile('');
              setProjectFilter('');
              setSiteFilter('');
              setCrawlFileFilter('');
              setCrawlInputFilter('');
              setMasterFileFilter('');
              setAETemplateFilter('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-2">
                  <input
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                {projects
                  ?.filter((p) => p.name.toLowerCase().includes(projectFilter.toLowerCase()))
                  .map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Market <span className="text-destructive">*</span></Label>
            <Select
              value={selectedSite}
              onValueChange={(value) => {
                setSelectedSite(value);
                setSelectedScope('');
                setSelectedCrawlFile('');
                setSelectedAETemplateFile('');
                setSiteFilter('');
                setCrawlFileFilter('');
                setCrawlInputFilter('');
                setMasterFileFilter('');
                setAETemplateFilter('');
              }}
              disabled={!selectedProject}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-2">
                  <input
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                    placeholder="Search sites..."
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                {sites
                  ?.filter((s) => s.name.toLowerCase().includes(siteFilter.toLowerCase()))
                  .map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Scope <span className="text-destructive">*</span></Label>
            <Select value={selectedScope} onValueChange={(value) => {
              setSelectedScope(value);
              setSelectedCrawlFile('');
              setCrawlFileFilter('');
              setCrawlInputFilter('');
              setMasterFileFilter('');
              setAETemplateFilter('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                {scopes.map((scope) => (
                  <SelectItem key={scope} value={scope}>
                    {scope}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Execution Mode <span className="text-destructive">*</span></Label>
            <div className="w-full rounded-lg border bg-muted/40 p-1 grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setRunMode('fresh')}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  runMode === 'fresh'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Fresh Run
              </button>
              <button
                type="button"
                onClick={() => setRunMode('revalidation')}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  runMode === 'revalidation'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Revalidation
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {runMode === 'fresh'
                ? 'Use source + reference files to run a new AE PP check.'
                : 'Upload corrected review file and validate again.'}
            </p>
          </div>
          <div className="space-y-2">
  <Label>
    AE PP Source File {runMode === 'fresh' ? <span className="text-destructive"> *</span> : null}
  </Label>

  <Button variant="outline" asChild>
    <label className="cursor-pointer flex gap-2 items-center">
      <Upload className="h-4 w-4" />
      Upload AE PP Source
      <input
        type="file"
        hidden
        accept=".csv,.tsv,.xlsx"
        onChange={handleUpload}
      />
    </label>
  </Button>

  <Select value={selectedCrawlFile} onValueChange={setSelectedCrawlFile}>
    <SelectTrigger>
      <SelectValue placeholder="Select AE PP source file" />
    </SelectTrigger>
    <SelectContent>
      <div className="px-2 py-2">
        <input
          value={crawlFileFilter}
          onChange={(e) => setCrawlFileFilter(e.target.value)}
          placeholder="Search files..."
          className="w-full border rounded px-2 py-1"
        />
      </div>
      {pdpInputFiles
        ?.filter((f) => f.name.toLowerCase().includes(crawlFileFilter.toLowerCase()))
        .map((file) => (
          <SelectItem key={file.name} value={file.name}>
            {file.name}
          </SelectItem>
        ))}
    </SelectContent>
  </Select>
</div>

<div className="space-y-2">
  <Label>AE PP Review File {runMode === 'revalidation' ? <span className="text-destructive"> *</span> : null}</Label>
  <Button variant="outline" asChild>
    <label className="cursor-pointer flex gap-2 items-center">
      <Upload className="h-4 w-4" />
      Upload/Re-upload Review
      <input
        type="file"
        hidden
        accept=".xlsx,.xls,.csv,.tsv"
        onChange={handleReviewReupload}
      />
    </label>
  </Button>
  <Select value={selectedIPFile} onValueChange={setSelectedIPFile}>
      <SelectTrigger>
        <SelectValue placeholder="Select AE PP review file" />
      </SelectTrigger>
      <SelectContent>
        <div className="px-2 py-2">
          <input
            value={crawlInputFilter}
            onChange={(e) => setCrawlInputFilter(e.target.value)}
            placeholder="Search storage files..."
            className="w-full border rounded px-2 py-1"
          />
        </div>
        {crawlInputFiles
          ?.filter((f) => f.name.toLowerCase().includes(crawlInputFilter.toLowerCase()))
          .map((file) => (
            <SelectItem key={file.name} value={file.name}>
              {file.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
</div>

<div className="space-y-2">
  <Label>
    AE PP Template File {isAETemplateRequired ? <span className="text-destructive"> *</span> : null}
  </Label>
  <Select value={selectedAETemplateFile} onValueChange={setSelectedAETemplateFile}>
    <SelectTrigger>
      <SelectValue placeholder="Select AE PP template file" />
    </SelectTrigger>
    <SelectContent>
      <div className="px-2 py-2">
        <input
          value={aeTemplateFilter}
          onChange={(e) => setAETemplateFilter(e.target.value)}
          placeholder="Search template files..."
          className="w-full border rounded px-2 py-1"
        />
      </div>
      {aeTemplateFiles
        ?.filter((f) => f.name.toLowerCase().includes(aeTemplateFilter.toLowerCase()))
        .map((file) => (
          <SelectItem key={file.name} value={file.name}>
            {file.name}
          </SelectItem>
        ))}
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground">
    {isAETemplateRequired
      ? "Template is mandatory for this source file."
      : "Template is optional for this source file."}
  </p>
</div>

<div className="space-y-2">
  <Label>AE PP Reference File <span className="text-destructive"> *</span></Label>
  <Select value={selectedMasterBucketFile} onValueChange={setSelectedMasterBucketFile}>
    <SelectTrigger>
      <SelectValue placeholder="Select AE PP reference file" />
    </SelectTrigger>
    <SelectContent>
      <div className="px-2 py-2">
        <input
          value={masterFileFilter}
          onChange={(e) => setMasterFileFilter(e.target.value)}
          placeholder="Search master files..."
          className="w-full border rounded px-2 py-1"
        />
      </div>
      {masterBucketFiles
        ?.filter((f) => f.name.toLowerCase().includes(masterFileFilter.toLowerCase()))
        .map((file) => (
          <SelectItem key={file.name} value={file.name}>
            {file.name}
          </SelectItem>
        ))}
    </SelectContent>
  </Select>
</div>

          <Button
            onClick={handleRunAutomation}
            disabled={createRunMutation.isPending || !canRunAutomation}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {createRunMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Automation
          </Button>
        </CardContent>
      </Card>

      {/* Center Panel - Live Console */}
      <Card className="lg:col-span-2 flex flex-col">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Execution Console</CardTitle>
          <div className="flex items-center gap-2">
            {currentRun && getStatusBadge(currentRun.status)}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
            >
              {autoScroll ? 'Disable' : 'Enable'} Auto-scroll
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <ScrollArea className="h-[300px] bg-primary rounded-md p-4 font-mono text-sm">
            {currentLogs && currentLogs.length > 0 ? (
              currentLogs.map((log) => {
                const ts = log.timestamp ?? log.created_at;
                return (
                  <div key={log.id} className={`${getLogColor(log.level)}`}>
                    <span className="text-muted-foreground">
                      [{format(new Date(ts), 'HH:mm:ss')}]
                    </span>{' '}
                    <span className="font-semibold">[{log.level}]</span> {log.message}
                  </div>
                );
              })
            ) : (
              <div className="text-muted-foreground text-center py-8">
                {currentRunId
                  ? 'Waiting for logs...'
                  : 'Select configuration and run automation to see logs'}
              </div>
            )}
            <div ref={logsEndRef} />
          </ScrollArea>
        </CardContent>

        {/* History Tabs */}
        <div className="p-4 pt-0">
          <Tabs defaultValue="my-runs">
            <div className="flex items-center justify-between mb-2">
              <TabsList>
                <TabsTrigger value="my-runs">My Runs</TabsTrigger>
                <TabsTrigger value="team-runs">Team Runs</TabsTrigger>
              </TabsList>
              <Button variant="ghost" size="sm" onClick={() => refetchRuns()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <TabsContent value="my-runs" className="mt-0">
              <ScrollArea className="h-[200px]">
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run ID</TableHead>
                      <TableHead>Automation</TableHead>
                      <TableHead className="hidden md:table-cell">Project</TableHead>
                      <TableHead className="hidden md:table-cell">Site</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Started</TableHead>
                      <TableHead className="hidden lg:table-cell">Duration</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myRuns?.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-mono break-all sm:whitespace-nowrap">{run.run_uuid}</TableCell>
                        <TableCell>
  {(() => {
    const map: Record<string, { label: string; className: string }> = {
      "pl-input": {
        label: "PL Input",
        className: "bg-blue-500 text-white"
      },
      "pl-conso": {
        label: "PL Conso",
        className: "bg-purple-500 text-white"
      },
      "pdp-conso": {
        label: "PDP Conso",
        className: "bg-emerald-500 text-white"
      },
      "pp-conso": {
        label: "AE PP Conso",
        className: "bg-orange-500 text-white"
      }
    };

    const config = map[run.automation_slug ?? ""];

    return config ? (
      <Badge className={config.className}>{config.label}</Badge>
    ) : (
      <Badge variant="secondary">{run.automation_slug ?? "Unknown"}</Badge>
    );
  })()}
</TableCell>

                        <TableCell className="hidden md:table-cell">{run.projects?.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{run.sites?.name}</TableCell>
                        <TableCell>{getStatusBadge(run.status)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {run.start_time
                            ? formatDistanceToNow(new Date(run.start_time), { addSuffix: true })
                            : '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{formatDuration(run.start_time, run.end_time)}</TableCell>
                        <TableCell>
  <div className="flex flex-wrap gap-1">
    {/* ▶ View logs */}
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setCurrentRunId(run.id)}
    >
      <Play className="h-4 w-4" />
    </Button>

    {/* ⬇ Download */}
    <Button
      variant="ghost"
      size="icon"
      onClick={async () => {
        const { data, error } = await supabase
          .from("run_files")
          .select("*")
          .eq("run_id", run.id)
          .eq("file_type", "FINAL_OUTPUT")
          .single();

        if (error || !data) {
          alert("Output not found");
          return;
        }

        const { data: file } = await supabase.storage
          .from("pp-run-output")
          .download(data.storage_path);

        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      <Download className="h-4 w-4" />
    </Button>

    {/* 🔁 Re-run */}
    <Button
      variant="ghost"
      size="icon"
      disabled={run.status === "cancelled"}
      onClick={async () => {
        if (run.status === "cancelled") return;
        await backendFetch(`/pp-run/${run.id}/rerun`, { method: 'POST' });

        refetchRuns();
      }}
    >
      <RotateCcw className="h-4 w-4" />
    </Button>

    {/* 🗑 Delete */}
    {run.status !== "completed" && (
      <Button
        variant="ghost"
        size="icon"
        onClick={async () => {
          if (!confirm("Cancel this run?")) return;

          const { error: cancelError } = await supabase
            .from("runs")
            .update({
              status: "cancelled",
              start_time: null,
              end_time: null,
              progress_percent: 0,
            })
            .eq("id", run.id);

          if (cancelError) {
            toast.error(cancelError.message || "Failed to cancel run");
            return;
          }

          await backendFetch(`/runs/${run.id}/cancel`, { method: 'POST' });

          toast.success("Run cancelled");

          queryClient.setQueryData(['run', run.id], (prev: Run | null | undefined) =>
            prev
              ? {
                  ...prev,
                  status: 'cancelled',
                  start_time: null,
                  end_time: null,
                  progress_percent: 0,
                }
              : prev
          );

          queryClient.setQueryData(['runs', 'my', user?.id], (prev: (Run & { projects: Project; sites: Site })[] | undefined) =>
            prev?.map((r) =>
              r.id === run.id
                ? { ...r, status: 'cancelled', start_time: null, end_time: null, progress_percent: 0 }
                : r
            )
          );

          queryClient.setQueryData(['runs', 'team'], (prev: any[] | undefined) =>
            prev?.map((r) =>
              r.id === run.id
                ? { ...r, status: 'cancelled', start_time: null, end_time: null, progress_percent: 0 }
                : r
            )
          );

          queryClient.invalidateQueries({ queryKey: ['runs'] });
          queryClient.invalidateQueries({ queryKey: ['run', run.id] });

          if (currentRunId === run.id) {
            setCurrentRunId(null);
          }
        }}
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    )}
  </div>
</TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="team-runs" className="mt-0">
              <ScrollArea className="h-[200px]">
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run ID</TableHead>
                      <TableHead>Automation</TableHead>
                      <TableHead className="hidden md:table-cell">User</TableHead>
                      <TableHead className="hidden lg:table-cell">Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Started</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamRuns?.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-mono break-all sm:whitespace-nowrap">{run.run_uuid}</TableCell>
                        <TableCell>
  {(() => {
    const map: Record<string, { label: string; className: string }> = {
      "pl-input": {
        label: "PL Input",
        className: "bg-blue-500 text-white"
      },
      "pl-conso": {
        label: "PL Conso",
        className: "bg-purple-500 text-white"
      },
      "pdp-conso": {
        label: "PDP Conso",
        className: "bg-emerald-500 text-white"
      },
      "pp-conso": {
        label: "AE PP Conso",
        className: "bg-orange-500 text-white"
      }
    };

    const config = map[run.automation_slug ?? ""];

    return config ? (
      <Badge className={config.className}>{config.label}</Badge>
    ) : (
      <Badge variant="secondary">{run.automation_slug ?? "Unknown"}</Badge>
    );
  })()}
</TableCell>

                        <TableCell className="hidden md:table-cell">{run.profile?.full_name || 'Unknown'}</TableCell>
                        <TableCell className="hidden lg:table-cell">{run.projects?.name}</TableCell>
                        <TableCell>{getStatusBadge(run.status)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {run.start_time
                            ? formatDistanceToNow(new Date(run.start_time), { addSuffix: true })
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}

export default PPConsoPage;
