"use client";

import { useState, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ClipboardList, Loader2 } from "lucide-react";

interface JobRow {
  id: string;
  jobName: string;
  printerName: string;
  status: string;
  submittedAt: string;
  patientName?: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => setJobs(data.jobs || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Print Jobs</h1>
      <p className="text-muted-foreground text-sm mb-8">{jobs.length} total jobs</p>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mb-4 opacity-50" />
          <p>No print jobs yet</p>
        </div>
      ) : (
        <Card padding={false}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-left p-4">Job Name</th>
                <th className="text-left p-4">Patient</th>
                <th className="text-left p-4">Printer</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="p-4 text-sm font-medium">{job.jobName || job.id.slice(0, 8)}</td>
                  <td className="p-4 text-sm text-muted-foreground">{job.patientName || "-"}</td>
                  <td className="p-4 text-sm text-muted-foreground">{job.printerName || "-"}</td>
                  <td className="p-4">
                    <Badge variant={
                      job.status === "completed" ? "success" :
                      job.status === "failed" ? "destructive" :
                      job.status === "printing" ? "default" : "outline"
                    }>
                      {job.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(job.submittedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
