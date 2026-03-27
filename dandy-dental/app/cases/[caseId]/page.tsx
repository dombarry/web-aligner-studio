"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScanUploader } from "@/components/cases/ScanUploader";
import {
  ArrowLeft,
  Printer,
  File,
  Loader2,
  Trash2,
  Link2,
  ClipboardList,
} from "lucide-react";
import type { Scan } from "@/lib/types";

interface CaseData {
  id: string;
  patientName: string;
  notes: string;
  status: string;
  createdAt: string;
}

export default function CaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"scans" | "history">("scans");

  useEffect(() => {
    Promise.all([
      fetch(`/api/cases/${caseId}`).then((r) => r.json()),
      fetch(`/api/cases/${caseId}/scans`).then((r) => r.json()),
    ])
      .then(([c, s]) => {
        setCaseData(c);
        setScans(s.scans || []);
      })
      .finally(() => setLoading(false));
  }, [caseId]);

  const onUploadComplete = (newScans: Scan[]) => {
    setScans((prev) => [...prev, ...newScans]);
  };

  // Group scans by pair
  const pairGroups = scans.reduce<Record<string, Scan[]>>((acc, scan) => {
    const group = scan.pairGroup || "ungrouped";
    (acc[group] = acc[group] || []).push(scan);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!caseData) {
    return <div className="p-8 text-center text-muted-foreground">Case not found</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/cases" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Cases
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{caseData.patientName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Case {caseData.id.slice(0, 8)} &middot; Created {new Date(caseData.createdAt).toLocaleDateString()}
          </p>
          {caseData.notes && (
            <p className="text-sm text-muted-foreground mt-2">{caseData.notes}</p>
          )}
        </div>
        <div className="flex gap-3">
          {scans.length > 0 && (
            <Link href={`/cases/${caseId}/prepare`}>
              <Button>
                <Printer className="w-4 h-4" />
                Prepare Print
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {(["scans", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "scans" ? `Scans (${scans.length})` : "Print History"}
          </button>
        ))}
      </div>

      {activeTab === "scans" && (
        <div className="space-y-6">
          <ScanUploader caseId={caseId} onUploadComplete={onUploadComplete} />

          {Object.entries(pairGroups).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Uploaded Scans
              </h3>
              {Object.entries(pairGroups).map(([group, groupScans]) => (
                <Card key={group}>
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {group === "ungrouped" ? "Unpaired Files" : `Patient: ${group}`}
                    </span>
                    {group !== "ungrouped" && groupScans.length === 2 && (
                      <Badge variant="success">Paired</Badge>
                    )}
                    {group !== "ungrouped" && groupScans.length !== 2 && (
                      <Badge variant="warning">Incomplete</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {groupScans.map((scan) => (
                      <div key={scan.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary">
                        <File className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm flex-1 truncate">{scan.originalName}</span>
                        <span className="text-xs text-muted-foreground">
                          {(scan.fileSize / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No print jobs for this case yet.</p>
        </div>
      )}
    </div>
  );
}
