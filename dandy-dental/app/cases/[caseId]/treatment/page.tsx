"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PaintableSTLViewer } from "@/components/viewer/PaintableSTLViewer";
import { ToothSelector } from "@/components/viewer/ToothSelector";
import { PlanViewer } from "@/components/treatment/PlanViewer";
import { TOOTH_NAMES, getToothColor } from "@/lib/segmentation/types";
import type { SegmentationResult, TreatmentPlan, ToothSegment } from "@/lib/segmentation/types";
import type { Scan } from "@/lib/types";
import { usePrinterMode } from "@/store/printer-mode";
import {
  ArrowLeft,
  Loader2,
  Scan as ScanIcon,
  Paintbrush,
  Eraser,
  MousePointer,
  Minus,
  Plus,
} from "lucide-react";

// Tools for the painting toolbar
type PaintTool = "paint" | "erase" | "navigate";

export default function TreatmentPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [segmentation, setSegmentation] = useState<SegmentationResult | null>(null);
  const [selectedTeeth, setSelectedTeeth] = useState<Set<number>>(new Set());
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Painting state
  const [activeTool, setActiveTool] = useState<PaintTool>("navigate");
  const [activeToothNumber, setActiveToothNumber] = useState<number | null>(null);
  const [brushRadius, setBrushRadius] = useState(2.5);

  const { getBuildPlate } = usePrinterMode();

  useEffect(() => {
    fetch(`/api/cases/${caseId}/scans`)
      .then((r) => r.json())
      .then((data) => setScans(data.scans || []))
      .finally(() => setLoading(false));
  }, [caseId]);

  const handleSelectScan = (scanId: string) => {
    setSelectedScanId(scanId);
    setSegmentation(null);
    setSelectedTeeth(new Set());
    setActiveTool("navigate");
    setActiveToothNumber(null);
  };

  const handleSegmentationUpdate = useCallback((result: SegmentationResult) => {
    setSegmentation(result);
  }, []);

  const handleToothSelect = (num: number) => {
    setSelectedTeeth((prev) => new Set([...prev, num]));
    // When selecting a tooth from the chart, set it as the active paint tooth
    setActiveToothNumber(num);
    setActiveTool("paint");
  };

  const handleToothDeselect = (num: number) => {
    setSelectedTeeth((prev) => {
      const next = new Set(prev);
      next.delete(num);
      return next;
    });
    if (activeToothNumber === num) {
      setActiveToothNumber(null);
      setActiveTool("navigate");
    }
  };

  // Quick tooth number selector for painting (1-32)
  const selectToothForPainting = (num: number) => {
    setActiveToothNumber(num);
    setActiveTool("paint");
    setSelectedTeeth((prev) => new Set([...prev, num]));
  };

  const isPainting = activeTool === "paint" || activeTool === "erase";
  const effectiveToothNumber =
    activeTool === "erase" ? 0 : // 0 = unassign
    activeTool === "paint" ? activeToothNumber :
    null;

  const selectedScan = scans.find((s) => s.id === selectedScanId);
  const detectedArch: "upper" | "lower" =
    selectedScan?.originalName.toLowerCase().includes("upper") ? "upper" : "lower";

  // Teeth available for current arch
  const archTeeth = detectedArch === "upper"
    ? Array.from({ length: 16 }, (_, i) => i + 1)
    : Array.from({ length: 16 }, (_, i) => i + 17);

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
        <Badge variant="outline" className="text-[10px]">Manual Segmentation</Badge>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Viewer + Paint Toolbar */}
        <div className="flex-1 relative">
          {selectedScanId ? (
            <>
              <PaintableSTLViewer
                url={`/api/uploads/${selectedScanId}/file`}
                activeToothNumber={effectiveToothNumber}
                brushRadius={brushRadius}
                isPainting={isPainting}
                onSegmentationUpdate={handleSegmentationUpdate}
                scanId={selectedScanId}
                arch={detectedArch}
                className="w-full h-full"
              />

              {/* Paint Toolbar - floating bottom */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/95 backdrop-blur border border-border rounded-xl px-4 py-2 shadow-xl">
                {/* Tool Selection */}
                <button
                  onClick={() => { setActiveTool("navigate"); }}
                  className={`p-2 rounded-lg transition-colors ${
                    activeTool === "navigate" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Navigate (orbit/zoom)"
                >
                  <MousePointer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setActiveTool("paint"); }}
                  className={`p-2 rounded-lg transition-colors ${
                    activeTool === "paint" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Paint teeth"
                >
                  <Paintbrush className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setActiveTool("erase"); }}
                  className={`p-2 rounded-lg transition-colors ${
                    activeTool === "erase" ? "bg-destructive/20 text-destructive" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Erase painting"
                >
                  <Eraser className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Brush Size */}
                <button onClick={() => setBrushRadius(Math.max(0.5, brushRadius - 0.5))} className="p-1 text-muted-foreground hover:text-foreground">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs text-muted-foreground w-10 text-center">{brushRadius.toFixed(1)}mm</span>
                <button onClick={() => setBrushRadius(Math.min(10, brushRadius + 0.5))} className="p-1 text-muted-foreground hover:text-foreground">
                  <Plus className="w-3 h-3" />
                </button>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Active Tooth Indicator */}
                {activeTool === "paint" && activeToothNumber ? (
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-full border border-white/30"
                      style={{ backgroundColor: getToothColor(activeToothNumber) }}
                    />
                    <span className="text-xs font-medium">#{activeToothNumber}</span>
                  </div>
                ) : activeTool === "paint" ? (
                  <span className="text-xs text-muted-foreground">Select tooth below</span>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <ScanIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a scan to begin segmentation</p>
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
                      onClick={() => handleSelectScan(scan.id)}
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

            {/* Tooth Picker for Painting */}
            {selectedScanId && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Paint Tooth</h3>
                  <Badge variant="outline" className="text-[10px]">
                    {detectedArch === "upper" ? "Upper" : "Lower"} Arch
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Select a tooth number, then paint on the 3D model to mark that tooth.
                </p>
                <div className="grid grid-cols-8 gap-1">
                  {archTeeth.map((num) => {
                    const isActive = activeToothNumber === num;
                    const hasPaint = segmentation?.teeth.some((t) => t.toothNumber === num);
                    return (
                      <button
                        key={num}
                        onClick={() => selectToothForPainting(num)}
                        className={`w-8 h-8 rounded text-[10px] font-bold transition-all ${
                          isActive
                            ? "ring-2 ring-white scale-110"
                            : hasPaint
                            ? "opacity-90"
                            : "opacity-40 hover:opacity-70"
                        }`}
                        style={{ backgroundColor: getToothColor(num) }}
                        title={TOOTH_NAMES[num]}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => { setActiveToothNumber(-1); setActiveTool("paint"); }}
                  className={`w-full p-2 rounded-lg border text-xs font-medium transition-colors ${
                    activeToothNumber === -1
                      ? "border-pink-400 bg-pink-400/20 text-pink-300"
                      : "border-border text-muted-foreground hover:border-pink-400/50"
                  }`}
                >
                  Paint Gingiva
                </button>
              </div>
            )}

            {/* Segmentation Results */}
            {segmentation && segmentation.teeth.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Segmented Teeth</h3>
                  <Badge variant="success" className="text-[10px]">
                    {segmentation.teeth.length} teeth
                  </Badge>
                </div>
                <div className="space-y-1">
                  {segmentation.teeth
                    .sort((a, b) => a.toothNumber - b.toothNumber)
                    .map((tooth) => (
                    <div
                      key={tooth.toothNumber}
                      className="flex items-center gap-2 px-2 py-1.5 rounded text-xs"
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: tooth.color }}
                      />
                      <span className="font-medium">#{tooth.toothNumber}</span>
                      <span className="text-muted-foreground truncate">{tooth.label}</span>
                      <span className="text-muted-foreground ml-auto">{tooth.vertexIndices.length}v</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Treatment plan (future) */}
            {segmentation && segmentation.teeth.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Treatment Plan</h3>
                <PlanViewer
                  plan={plan}
                  currentStep={currentStep}
                  onStepChange={setCurrentStep}
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Treatment planning with real tooth movements coming soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
