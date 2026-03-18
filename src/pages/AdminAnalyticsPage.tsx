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
import { backendBlob } from "@/lib/backendApi";

export function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState("7");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
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
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-analytics", dateRange, projectFilter, userFilter, useCustomDate, customStartDate, customEndDate],
    refetchInterval: 15000,
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
          sites(*)
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

      const { data, error } = await query;
      if (error) throw error;

      const runIds = (data || []).map((run: any) => run.id).filter(Boolean);
      const userIds = Array.from(
        new Set((data || []).map((run: any) => run.user_id).filter(Boolean))
      );

      // Load AI reports independently to avoid nested relation issues.
      const aiByRunId = new Map<string, any[]>();
      if (runIds.length > 0) {
        const chunkSize = 100;
        const aiRowsAll: any[] = [];
        let aiChunkErrors = 0;

        for (let i = 0; i < runIds.length; i += chunkSize) {
          const chunk = runIds.slice(i, i + chunkSize);
          const { data: aiRows, error: aiError } = await supabase
            .from("run_ai_reports")
            .select("*")
            .in("run_id", chunk)
            .order("created_at", { ascending: false });

          if (aiError) {
            aiChunkErrors += 1;
            console.error("Failed to load run_ai_reports chunk:", aiError);
            continue;
          }

          aiRowsAll.push(...(aiRows || []));
        }

        for (const row of aiRowsAll) {
          const key = row.run_id;
          if (!key) continue;
          const bucket = aiByRunId.get(key) || [];
          bucket.push(row);
          aiByRunId.set(key, bucket);
        }
        for (const [key, rows] of aiByRunId.entries()) {
          rows.sort(
            (a, b) =>
              new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime()
          );
          aiByRunId.set(key, rows);
        }

        if (aiRowsAll.length === 0 && runIds.length > 0) {
          console.warn("No run_ai_reports rows returned for current analytics filters");
        }
        if (aiChunkErrors > 0) {
          console.warn(`run_ai_reports chunk errors: ${aiChunkErrors}`);
        }
      }

      const profilesByUserId = new Map<string, any>();
      if (userIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, full_name, username")
          .in("user_id", userIds);

        if (profileError) {
          console.error("Failed to load profiles:", profileError);
        } else {
          for (const profile of profileRows || []) {
            profilesByUserId.set(profile.user_id, profile);
          }
        }
      }

      // attach profile
      const enriched = (data || []).map((run: any) => {
        const aiRows = aiByRunId.get(run.id) || [];
        const profile = run.user_id ? profilesByUserId.get(run.user_id) || null : null;
        return {
          ...run,
          profile,
          run_ai_reports: aiRows,
        };
      });

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

  const parseReport = (value: unknown): Record<string, any> | null => {
    if (!value) return null;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return typeof value === "object" ? (value as Record<string, any>) : null;
  };

  const deepFindMetric = (source: unknown, keys: string[]): unknown => {
    if (!source || typeof source !== "object") return undefined;
    const keySet = new Set(keys.map((k) => k.toLowerCase()));
    const stack: unknown[] = [source];

    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== "object") continue;

      if (Array.isArray(node)) {
        for (const item of node) stack.push(item);
        continue;
      }

      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (keySet.has(k.toLowerCase()) && v !== undefined && v !== null && v !== "") {
          return v;
        }
        if (v && typeof v === "object") stack.push(v);
      }
    }

    return undefined;
  };

  const hasMeaningfulValue = (value: unknown) =>
    value !== undefined && value !== null && value !== "";

  const pickBestAI = (entries: any[]) => {
    if (!entries.length) return undefined;
    const scoreEntry = (entry: any) => {
      const report =
        parseReport(entry?.report_json) ||
        parseReport(entry?.report) ||
        parseReport(entry?.result) ||
        parseReport(entry?.response_json);
      const ctx = {
        ...(report || {}),
        ...(entry || {}),
      };
      const total = readMetric(ctx, [
        "total_tested",
        "total",
        "tested",
        "total_rows",
        "rows_total",
        "total_count",
        "record_count",
      ]);
      const passed = readMetric(ctx, [
        "passed",
        "pass",
        "passed_rows",
        "rows_passed",
        "pass_count",
        "passed_count",
      ]);
      const failed = readMetric(ctx, [
        "failed",
        "fail",
        "failed_rows",
        "rows_failed",
        "fail_count",
        "failed_count",
      ]);
      const accuracy = readMetric(ctx, [
        "accuracy",
        "accuracy_pct",
        "accuracy_percent",
        "accuracy_percentage",
        "pass_rate",
        "success_rate",
      ]);
      const verdict =
        entry?.verdict ??
        readMetric(ctx, ["verdict", "overall_verdict", "final_verdict", "recommendation"]);

      let score = 0;
      if (hasMeaningfulValue(total)) score += 3;
      if (hasMeaningfulValue(passed)) score += 3;
      if (hasMeaningfulValue(failed)) score += 3;
      if (hasMeaningfulValue(accuracy)) score += 2;
      if (hasMeaningfulValue(verdict)) score += 2;
      if (hasMeaningfulValue(entry?.summary)) score += 1;

      const ts = new Date(entry?.created_at ?? 0).getTime();
      return { entry, score, ts };
    };

    const ranked = entries.map(scoreEntry).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.ts - a.ts;
    });
    return ranked[0]?.entry ?? entries[0];
  };

  const readMetric = (report: Record<string, any> | null, keys: string[]) => {
    return deepFindMetric(report, keys);
  };

  const extractSummaryMetric = (summary: string | null | undefined, patterns: RegExp[]) => {
    if (!summary) return undefined;
    for (const pattern of patterns) {
      const match = summary.match(pattern);
      if (match?.[1] !== undefined) return match[1];
    }
    return undefined;
  };

  // ------------------- DOWNLOAD AI PDF -------------------
  async function downloadAIReport(runId: string) {
    try {
      const paths = [
        `/run/${runId}/ai-report-pdf`,
        `/runs/${runId}/ai-report-pdf`,
        `/admin/run/${runId}/ai-report-pdf`,
      ];
      let blob: Blob | null = null;
      const errors: string[] = [];
      for (const path of paths) {
        try {
          blob = await backendBlob(path);
          if (blob.size > 0) break;
        } catch (err: any) {
          errors.push(String(err?.message || err || ""));
        }
      }
      if (!blob || blob.size === 0) {
        const uniqueErrors = Array.from(new Set(errors.filter(Boolean)));
        const errorText = uniqueErrors.join(" | ");
        if (uniqueErrors.length > 0 && uniqueErrors.every((e) => e.includes("Not Found"))) {
          throw new Error("AI report not found for this run yet.");
        }
        if (uniqueErrors.some((e) => e.includes("Forbidden") || e.includes("403"))) {
          throw new Error("Backend denied access to this report for admin user.");
        }
        throw new Error(errorText || "AI report not available");
      }
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `AI_Report_${runId}.pdf`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert(String(err?.message || "Failed to download AI report"));
    }
  }

  // ------------------- STATUS BADGE -------------------
  const getStatusBadge = (status: string) => {
    const normalized = String(status || "").toLowerCase();
    switch (normalized) {
      case "cancelled":
      case "canceled":
        return <Badge variant="outline">Cancelled</Badge>;
      case "completed":
      case "complete":
        return <Badge className="bg-green-600 text-white">Complete</Badge>;
      case "running":
      case "processing":
      case "in_progress":
        return <Badge className="bg-blue-600 text-white">Running</Badge>;
      case "failed":
      case "error":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
      case "queued":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status || "-"}</Badge>;
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
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-red-600">
                    {(error as any)?.message || "Failed to load analytics"}
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
                  const aiReports = Array.isArray(run.run_ai_reports)
                    ? run.run_ai_reports
                    : run.run_ai_reports
                    ? [run.run_ai_reports]
                    : [];
                  const ai = pickBestAI(aiReports);
                  const report =
                    parseReport(ai?.report_json) ||
                    parseReport(ai?.report) ||
                    parseReport(ai?.result) ||
                    parseReport(ai?.response_json);
                  const summaryText = typeof ai?.summary === "string" ? ai.summary : "";
                  const combinedAIContext = {
                    ...parseReport(ai?.report_json),
                    ...parseReport(ai?.report),
                    ...parseReport(ai?.result),
                    ...parseReport(ai?.response_json),
                    ...(ai || {}),
                  };
                  const totalValue =
                    readMetric(report, ["total_tested", "total", "tested", "total_rows", "rows_total", "total_count", "record_count"]) ??
                    readMetric(combinedAIContext, ["total_tested", "total", "tested", "total_rows", "rows_total", "total_count", "record_count"]) ??
                    extractSummaryMetric(summaryText, [
                      /total\s*tested\s*[:=]\s*(\d+(?:\.\d+)?)/i,
                      /total\s*(?:rows|records|count)?\s*[:=]\s*(\d+(?:\.\d+)?)/i,
                    ]);
                  const passedValue =
                    readMetric(report, ["passed", "pass", "passed_rows", "rows_passed", "pass_count", "passed_count"]) ??
                    readMetric(combinedAIContext, ["passed", "pass", "passed_rows", "rows_passed", "pass_count", "passed_count"]) ??
                    extractSummaryMetric(summaryText, [/passed\s*[:=]\s*(\d+(?:\.\d+)?)/i, /pass\s*count\s*[:=]\s*(\d+(?:\.\d+)?)/i]);
                  const failedValue =
                    readMetric(report, ["failed", "fail", "failed_rows", "rows_failed", "fail_count", "failed_count"]) ??
                    readMetric(combinedAIContext, ["failed", "fail", "failed_rows", "rows_failed", "fail_count", "failed_count"]) ??
                    extractSummaryMetric(summaryText, [/failed\s*[:=]\s*(\d+(?:\.\d+)?)/i, /fail\s*count\s*[:=]\s*(\d+(?:\.\d+)?)/i]);
                  const accuracyValue =
                    readMetric(report, ["accuracy", "accuracy_pct", "accuracy_percent", "accuracy_percentage", "pass_rate"]) ??
                    readMetric(combinedAIContext, ["accuracy", "accuracy_pct", "accuracy_percent", "accuracy_percentage", "pass_rate", "success_rate"]) ??
                    ai?.accuracy ??
                    extractSummaryMetric(summaryText, [/accuracy\s*[:=]\s*(\d+(?:\.\d+)?)/i, /accuracy\s*[:=]\s*(\d+(?:\.\d+)?)%/i]);
                  const verdictText = String(
                    ai?.verdict ??
                      readMetric(report, ["verdict", "overall_verdict", "final_verdict", "recommendation"]) ??
                      readMetric(combinedAIContext, ["verdict", "overall_verdict", "final_verdict", "recommendation"]) ??
                      extractSummaryMetric(summaryText, [/verdict\s*[:=]\s*([a-zA-Z_ -]+)/i, /recommendation\s*[:=]\s*([a-zA-Z_ -]+)/i]) ??
                      ""
                  ).toUpperCase();
                  const accuracyDisplay =
                    accuracyValue === undefined
                      ? "-"
                      : typeof accuracyValue === "string" && accuracyValue.includes("%")
                      ? accuracyValue
                      : `${accuracyValue}%`;
                  const showReportButton = Boolean(ai) || run.status === "completed";

                  return (
                    <TableRow key={run.id}>
                      <TableCell>{run.profile?.full_name || "-"}</TableCell>
                      <TableCell>{run.projects?.name || "-"}</TableCell>
                      <TableCell>{run.sites?.name || "-"}</TableCell>
                      <TableCell>{getStatusBadge(run.status)}</TableCell>

                      <TableCell>{totalValue ?? "-"}</TableCell>
                      <TableCell className="text-green-600 font-bold">
                        {passedValue ?? "-"}
                      </TableCell>
                      <TableCell className="text-red-600 font-bold">
                        {failedValue ?? "-"}
                      </TableCell>

                      <TableCell>{accuracyDisplay}</TableCell>
                      <TableCell>
                        {verdictText ? (
                          <span
                            className={
                              verdictText === "PASS"
                                ? "text-green-600 font-bold"
                                : verdictText === "WARN"
                                ? "text-yellow-600 font-bold"
                                : "text-red-600 font-bold"
                            }
                          >
                            {verdictText}
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
                        {showReportButton ? (
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
