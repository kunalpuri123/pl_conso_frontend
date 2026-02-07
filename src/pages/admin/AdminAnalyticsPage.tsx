import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import type { Project } from "@/lib/supabase-types";

export function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState("7");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [automationFilter, setAutomationFilter] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(
    subDays(new Date(), 7)
  );
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(new Date());
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ------------------- LOAD PROJECTS -------------------
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("name");
      if (error) throw error;
      return data as Project[];
    },
  });

  // ------------------- LOAD USERS -------------------
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, username")
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
  });

  // ------------------- LOAD RUNS -------------------
const {
  data: runs,
  refetch,
  isLoading,
} = useQuery<any[]>({
    queryKey: ["admin-analytics", dateRange, projectFilter, userFilter,   automationFilter, useCustomDate, customStartDate, customEndDate],
    queryFn: async () => {
      let startDate: Date;
      let endDate: Date;

      if (useCustomDate && customStartDate && customEndDate) {
        startDate = startOfDay(customStartDate);
        endDate = endOfDay(customEndDate);
      } else {
        startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
        endDate = endOfDay(new Date());
      }

      let query = supabase
        .from("runs")
        .select(`
          *,
          projects(*),
          sites(*),
          run_ai_reports(*)
        `)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (projectFilter !== "all") {
        query = query.eq("project_id", projectFilter);
      }

      if (userFilter !== "all") {
        query = query.eq("user_id", userFilter);
      }

      if (automationFilter !== "all") {
  query = query.eq("automation_slug", automationFilter);
}


      const { data, error } = await query;
      if (error) throw error;

      // attach profile
      const enriched = await Promise.all(
        (data || []).map(async (run: any) => {
          if (!run.user_id) return { ...run, profile: null };

          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, username")
            .eq("user_id", run.user_id)
            .single();

          return { ...run, profile };
        })
      );

      return enriched;
    },
  });

  // ------------------- PAGINATION -------------------
  const totalPages = Math.ceil((runs?.length || 0) / itemsPerPage);
  const paginatedRuns = runs?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];

  // ------------------- METRICS -------------------
  const totalRuns = runs?.length || 0;
  const completedRuns = runs?.filter((r) => r.status === "completed").length || 0;
  const failedRuns = runs?.filter((r) => r.status === "failed").length || 0;
  const successRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

  const finishedRuns = runs?.filter((r) => r.start_time && r.end_time) || [];

  const avgDurationMs =
    finishedRuns.reduce((acc, r) => {
      return acc + (new Date(r.end_time).getTime() - new Date(r.start_time).getTime());
    }, 0) / (finishedRuns.length || 1);

  const avgDurationSeconds = Math.round(avgDurationMs / 1000);

  // ------------------- DOWNLOAD AI PDF -------------------
  async function downloadAIReport(runId: string) {
    try {
      const res = await fetch(`https://pl-conso-backend.onrender.com/run/${runId}/ai-report-pdf`);

      if (!res.ok) {
        alert("AI report not available yet");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `AI_Report_${runId}.pdf`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to download AI report");
    }
  }

  // ------------------- STATUS BADGE -------------------
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      case "completed":
        return <Badge className="bg-green-600 text-white">Complete</Badge>;
      case "running":
        return <Badge className="bg-blue-600 text-white">Running</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  // ------------------- EXPORT CSV -------------------
  const handleExport = () => {
    if (!runs) return;

    const csv = [
      ["User", "Project", "Site", "Scope", "Status", "Start Time", "End Time"].join(","),
      ...runs.map((run) =>
        [
          run.profile?.full_name || "",
          run.projects?.name || "",
          run.sites?.name || "",
          run.scope || "",
          run.status,
          run.start_time || "",
          run.end_time || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  // ------------------- UI -------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Runs" value={totalRuns} />
        <StatCard title="Success Rate" value={`${successRate}%`} />
        <StatCard title="Failed Runs" value={failedRuns} />
        <StatCard title="Avg Duration" value={`${avgDurationSeconds}s`} />
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Runs</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, runs?.length || 0)} of{" "}
                {runs?.length || 0} runs
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              {/* AUTOMATION FILTER */}
<Select
  value={automationFilter}
  onValueChange={(value) => {
    setAutomationFilter(value);
    setCurrentPage(1);
  }}
>
  <SelectTrigger className="w-[150px]">
    <SelectValue placeholder="All Automation" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Automation</SelectItem>
    <SelectItem value="pl-input">PL Input</SelectItem>
    <SelectItem value="pl-conso">PL Conso</SelectItem>
  </SelectContent>
</Select>

              {/* DATE RANGE PRESET */}
              <Select
                value={useCustomDate ? "custom" : dateRange}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setUseCustomDate(true);
                  } else {
                    setUseCustomDate(false);
                    setDateRange(value);
                  }
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 Hours</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="custom">Custom Date</SelectItem>
                </SelectContent>
              </Select>

              {/* CUSTOM DATE PICKER */}
              {useCustomDate && (
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        {customStartDate ? format(customStartDate, "MMM d") : "Start"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customStartDate}
                        onSelect={(date) => {
                          setCustomStartDate(date);
                          setCurrentPage(1);
                        }}
                        disabled={(date) =>
                          customEndDate ? date > customEndDate : false
                        }
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        {customEndDate ? format(customEndDate, "MMM d") : "End"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customEndDate}
                        onSelect={(date) => {
                          setCustomEndDate(date);
                          setCurrentPage(1);
                        }}
                        disabled={(date) =>
                          customStartDate ? date < customStartDate : false
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* USER FILTER */}
              <Select value={userFilter} onValueChange={(value) => {
                setUserFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users?.map((user: any) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.full_name || user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* PROJECT FILTER */}
              <Select value={projectFilter} onValueChange={(value) => {
                setProjectFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Automation</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Passed</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Verdict</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Report</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : paginatedRuns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    No runs found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRuns.map((run: any) => {
                  const ai = run.run_ai_reports?.[0];
                  const report = ai?.report_json;
                  const isCancelled = run.status === "cancelled";

                  return (
                    <TableRow key={run.id}>
                      <TableCell>{run.profile?.full_name || "-"}</TableCell>
                      <TableCell>
  {(() => {
    const map: Record<string, { label: string; className: string }> = {
      "pl-input": { label: "PL Input", className: "bg-blue-500 text-white" },
      "pl-conso": { label: "PL Conso", className: "bg-purple-500 text-white" }
    };

    const config = map[run.automation_slug ?? ""];

    return config ? (
      <Badge className={config.className}>{config.label}</Badge>
    ) : (
      <Badge variant="secondary">
        {run.automation_slug ?? "Unknown"}
      </Badge>
    );
  })()}
</TableCell>

                      <TableCell>{run.projects?.name || "-"}</TableCell>
                      <TableCell>{run.sites?.name || "-"}</TableCell>
                      <TableCell>{getStatusBadge(run.status)}</TableCell>

                      <TableCell>{report?.total_tested ?? "-"}</TableCell>
                      <TableCell className="text-green-600 font-bold">
                        {report?.passed ?? "-"}
                      </TableCell>
                      <TableCell className="text-red-600 font-bold">
                        {report?.failed ?? "-"}
                      </TableCell>

                      <TableCell> {report?.accuracy !== undefined ? `${report.accuracy}%` : "-"} </TableCell>
                      <TableCell>
                        {isCancelled ? (
                          <span>-</span>
                        ) : ai?.verdict ? (
                          <span
                            className={
                              ai.verdict === "PASS"
                                ? "text-green-600 font-bold"
                                : ai.verdict === "WARN"
                                ? "text-yellow-600 font-bold"
                                : "text-red-600 font-bold"
                            }
                          >
                            {ai.verdict}
                          </span>
                        ) : (
                          <span className="text-gray-400">AI Pending</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {run.start_time
                          ? format(new Date(run.start_time), "MMM d, HH:mm")
                          : "-"}
                      </TableCell>

                      <TableCell>
                        {run.start_time && run.end_time
                          ? `${Math.round(
                              (new Date(run.end_time).getTime() -
                                new Date(run.start_time).getTime()) /
                                1000
                            )}s`
                          : "-"}
                      </TableCell>

                      <TableCell>
  {run.automation_slug === "pl-input" || isCancelled ? (
    <span>-</span>
  ) : ai ? (
    <Button size="sm" onClick={() => downloadAIReport(run.id)}>
      📄 Report
    </Button>
  ) : (
    <span className="text-gray-400 text-sm">Processing...</span>
  )}
</TableCell>

                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* PAGINATION */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages || 1}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------- SMALL STAT CARD ----------------
function StatCard({ title, value }: { title: string; value: any }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default AdminAnalyticsPage;
