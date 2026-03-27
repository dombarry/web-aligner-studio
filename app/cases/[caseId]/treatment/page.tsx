"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { STLViewer } from "@/components/viewer/STLViewer";
import { ToothSelector } from "@/components/viewer/ToothSelector";
import { PlanViewer } from "@/components/treatment/PlanViewer";
import { getSegmenter } from "@/lib/segmentation/segmenter";
import type { SegmentationResult, TreatmentPlan } from "@/lib/segmentation/types";
import type { Scan } from "@/lib/types";
import {
  ArrowLeft,
  Loader2,
  Scan as ScanIcon,
  Layers,
} from "lucide-react";

export default function TreatmentPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [segmentation, setSegmentation] = useState<SegmentationResult | null>(null);
  const [selectedTeeth, setSelectedTeeth] = useState<Set<number>>(new Set());
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [segmenting, setSegmenting] = useState(false);

  useEffect(() => {
    fetch(`/api/cases/${caseId}/scans`)
      .then((r) => r.json())
      .then((data) => setScans(data.scans || []))
      .finally(() => setLoading(false));
  }, [caseId]);

  const handleSegment = async (scanId: string) => {
    setSegmenting(true);
    setSelectedScanId(scanId);
    try {
      const scan = scans.find((s) => s.id === scanId);
      const arch = scan?.originalName.toLowerCase().includes("upper") ? "upper" as const : "lower" as const;
      const segmenter = getSegmenter();
      const result = await segmenter.segment(scanId, arch);
      setSegmentation(result);
      setSelectedTeeth(new Set());
    } finally {
      setSegmenting(false);
    }
  };

  const handleToothSelect = (num: number) => {
    setSelectedTeeth((prev) => new Set([...prev, num]));
  };

  const handleToothDeselect = (num: number) => {
    setSelectedTeeth((prev) => {
      const next = new Set(prev);
      next.delete(num);
      return next;
    });
  };

  // 3D viewer models for the selected scan
  const viewerModels = selectedScanId
    ? [{
        id: selectedScanId,
        url: `/api/uploads/${selectedScanId}/file`,
        name: scans.find((s) => s.id === selectedScanId)?.originalName || "Scan",
        position: [0, 0, 0] as [number, number, number],
        selected: false,
        color: "#94a3b8",
      }]
    : [];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-4 shrink-0">
        <Link href={`/cases/${caseId}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold">Treatment Planning</h1>
        <Badge variant="warning" className="text-[10px]">Preview</Badge>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Viewer */}
        <div className="flex-1 relative">
          {selectedScanId ? (
            <STLViewer
              models={viewerModels}
              onModelClick={() => {}}
              className="w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <ScanIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a scan to begin</p>
              </div>
            </div>
          )}
          {segmenting && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-20">
              <div className="flex items-center gap-3 bg-card px-6 py-4 rounded-xl border border-border shadow-xl">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm font-medium">Segmenting teeth...</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-border bg-card overflow-y-auto shrink-0">
          <div className="p-4 space-y-6">
            {/* Scan selector */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Scans</h3>
              {scans.length === 0 ? (
                <p className="text-xs text-muted-foreground">No scans uploaded for this case.</p>
              ) : (
                <div className="space-y-2">
                  {scans.map((scan) => (
                    <button
                      key={scan.id}
                      onClick={() => handleSegment(scan.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedScanId === scan.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <p className="text-xs font-medium truncate">{scan.originalName}</p>
                      {scan.pairGroup && (
                        <p className="text-[10px] text-muted-foreground">Group: {scan.pairGroup}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tooth selector */}
            {segmentation && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Tooth Chart</h3>
                  <Badge variant="outline" className="text-[10px]">
                    {segmentation.teeth.length} teeth
                  </Badge>
                </div>
                <ToothSelector
                  teeth={segmentation.teeth}
                  selectedTeeth={selectedTeeth}
                  onToothSelect={handleToothSelect}
                  onToothDeselect={handleToothDeselect}
                />
              </div>
            )}

            {/* Treatment plan */}
            {segmentation && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Treatment Plan</h3>
                <PlanViewer
                  plan={plan}
                  currentStep={currentStep}
                  onStepChange={setCurrentStep}
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Treatment planning with real tooth movements coming soon.
                  Requires ML-based segmentation integration.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
