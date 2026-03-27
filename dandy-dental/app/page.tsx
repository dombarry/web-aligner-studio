"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FolderOpen,
  Printer,
  ClipboardList,
  Plus,
  Activity,
  ArrowRight,
  Wifi,
  WifiOff,
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
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    totalJobs: 0,
    recentJobs: [],
    connectedPrinters: 0,
    totalPrinters: 0,
    preformConnected: false,
  });

  useEffect(() => {
    async function load() {
      try {
        const [casesRes, jobsRes, devicesRes] = await Promise.allSettled([
          fetch("/api/cases").then((r) => r.json()),
          fetch("/api/jobs").then((r) => r.json()),
          fetch("/api/preform/devices").then((r) => r.json()),
        ]);

        const cases = casesRes.status === "fulfilled" ? casesRes.value.cases || [] : [];
        const jobs = jobsRes.status === "fulfilled" ? jobsRes.value.jobs || [] : [];
        const devices = devicesRes.status === "fulfilled" ? devicesRes.value.devices || [] : [];

        setStats({
          totalCases: cases.length,
          activeCases: cases.filter((c: { status: string }) => c.status === "in_progress").length,
          totalJobs: jobs.length,
          recentJobs: jobs.slice(0, 5),
          connectedPrinters: devices.filter((d: { is_connected: boolean }) => d.is_connected).length,
          totalPrinters: devices.length,
          preformConnected: devicesRes.status === "fulfilled",
        });
      } catch {
        // silently fail
      }
    }
    load();
  }, []);

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
          {stats.preformConnected ? (
            <>
              <Wifi className="w-5 h-5 text-success" />
              <span className="text-sm font-medium text-success">PreForm Server Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium text-destructive">PreForm Server Disconnected</span>
              <span className="text-xs text-muted-foreground ml-2">Start PreFormServer on port 44388</span>
            </>
          )}
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
                <p className="text-2xl font-bold">{stats.totalCases}</p>
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
                  {stats.connectedPrinters}
                  <span className="text-sm text-muted-foreground font-normal">/{stats.totalPrinters}</span>
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
                <p className="text-2xl font-bold">{stats.totalJobs}</p>
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
        {stats.recentJobs.length === 0 ? (
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
