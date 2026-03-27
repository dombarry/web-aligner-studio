"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FolderOpen,
  Printer,
  ClipboardList,
  Plus,
  ArrowRight,
  Wifi,
  WifiOff,
  Loader2,
  Download,
  Monitor,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface DashboardStats {
  totalCases: number;
  activeCases: number;
  totalJobs: number;
  recentJobs: Array<{ id: string; jobName: string; status: string; submittedAt: string; patientName?: string }>;
  connectedPrinters: number;
  totalPrinters: number;
  preformConnected: boolean;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [checking, setChecking] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const [casesRes, jobsRes, devicesRes] = await Promise.allSettled([
        fetch("/api/cases").then((r) => r.json()),
        fetch("/api/jobs").then((r) => r.json()),
        fetch("/api/preform/devices").then((r) => r.json()),
      ]);

      const cases = casesRes.status === "fulfilled" ? casesRes.value.cases || [] : [];
      const jobs = jobsRes.status === "fulfilled" ? jobsRes.value.jobs || [] : [];
      const devices = devicesRes.status === "fulfilled" ? devicesRes.value.devices || [] : [];
      const preformConnected = devicesRes.status === "fulfilled" && !devicesRes.value.error;

      setStats({
        totalCases: cases.length,
        activeCases: cases.filter((c: { status: string }) => c.status === "in_progress").length,
        totalJobs: jobs.length,
        recentJobs: jobs.slice(0, 5),
        connectedPrinters: devices.filter((d: { is_connected: boolean }) => d.is_connected).length,
        totalPrinters: devices.length,
        preformConnected,
      });
    } catch {
      setStats({
        totalCases: 0, activeCases: 0, totalJobs: 0, recentJobs: [],
        connectedPrinters: 0, totalPrinters: 0, preformConnected: false,
      });
    } finally {
      setChecking(false);
      setRetrying(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Auto-retry connection every 10s if disconnected
  useEffect(() => {
    if (stats && !stats.preformConnected) {
      const interval = setInterval(loadStats, 10000);
      return () => clearInterval(interval);
    }
  }, [stats, loadStats]);

  const handleRetry = () => {
    setRetrying(true);
    loadStats();
  };

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Connecting to PreForm Server...</p>
      </div>
    );
  }

  // Show setup page when PreForm is not connected
  if (stats && !stats.preformConnected) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to Web Aligner Studio</h1>
          <p className="text-muted-foreground">
            Connect to PreForm Server to start manufacturing aligners.
          </p>
        </div>

        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <WifiOff className="w-5 h-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">PreForm Server Not Detected</span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={handleRetry} disabled={retrying}>
              {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Retry
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-1">
            Auto-checking every 10 seconds...
          </p>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Setup Instructions</h2>

          <Card>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Download className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">1. Download PreForm</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Download and install the latest version of Formlabs PreForm software from the Formlabs website.
                  PreForm includes the local API server needed for this application.
                </p>
                <p className="text-xs text-muted-foreground">
                  Visit <span className="font-mono text-foreground">formlabs.com/software/preform</span> to download.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Monitor className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">2. Enable the Local API Server</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Open PreForm, then enable the local API server:
                </p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Open PreForm &rarr; <span className="text-foreground">File</span> &rarr; <span className="text-foreground">Preferences</span></li>
                  <li>Navigate to the <span className="text-foreground">Network</span> tab</li>
                  <li>Enable <span className="text-foreground">&quot;PreForm Local API Server&quot;</span></li>
                  <li>Ensure the port is set to <span className="font-mono text-foreground">44388</span></li>
                </ol>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">3. Verify Connection</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Once the server is running, this page will automatically detect the connection.
                  The expected endpoint is:
                </p>
                <code className="text-xs bg-secondary px-2 py-1 rounded font-mono">
                  http://localhost:44388
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Make sure this application is running on the same machine as PreForm, or configure
                  the <span className="font-mono text-foreground">PREFORM_URL</span> environment variable.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Connected dashboard
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Aligner manufacturing overview
          </p>
        </div>
        <Link href="/cases/new">
          <Button>
            <Plus className="w-4 h-4" />
            New Case
          </Button>
        </Link>
      </div>

      {/* Connection Status */}
      <Card className="mb-6">
        <div className="flex items-center gap-3">
          <Wifi className="w-5 h-5 text-success" />
          <span className="text-sm font-medium text-success">PreForm Server Connected</span>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/cases">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalCases ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total Cases</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/printers">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Printer className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats?.connectedPrinters ?? 0}
                  <span className="text-sm text-muted-foreground font-normal">/{stats?.totalPrinters ?? 0}</span>
                </p>
                <p className="text-xs text-muted-foreground">Printers Online</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/jobs">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalJobs ?? 0}</p>
                <p className="text-xs text-muted-foreground">Print Jobs</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Jobs */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Recent Jobs</CardTitle>
          <Link href="/jobs">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        {!stats?.recentJobs.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No print jobs yet. Create a case to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {stats.recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{job.jobName}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.patientName || "Unknown"} &middot; {new Date(job.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={job.status === "completed" ? "success" : job.status === "failed" ? "destructive" : "default"}>
                  {job.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
