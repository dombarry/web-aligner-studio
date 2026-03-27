"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Progress } from "@/components/ui/Progress";
import { STLViewer } from "@/components/viewer/STLViewer";
import type { ModelClickEvent } from "@/components/viewer/STLModel";
import { ViewerToolbar } from "@/components/viewer/ViewerControls";
import { usePrintSession } from "@/store/print-session";
import { usePrinterMode } from "@/store/printer-mode";
import { useAppSettings } from "@/store/app-settings";
import { useMaterialLibrary } from "@/store/material-library";
import { MaterialSelector } from "@/components/prepare/MaterialSelector";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Box,
  Settings,
  LayoutGrid,
  Shield,
  Tag,
  Printer,
  CheckCircle2,
  Layers,
} from "lucide-react";
import type { Scan, DeviceStatus, SceneModel, ModelProperties } from "@/lib/types";

const STEPS = [
  { label: "Select Models", icon: Box },
  { label: "Scene Setup", icon: Settings },
  { label: "Orient & Layout", icon: LayoutGrid },
  { label: "Supports", icon: Shield },
  { label: "Labels", icon: Tag },
  { label: "Print", icon: Printer },
];

export default function PreparePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScans, setSelectedScans] = useState<Set<string>>(new Set());
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [patientName, setPatientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Label placement: per-model click position + normal
  const [labelPlacements, setLabelPlacements] = useState<Record<string, { point: { x: number; y: number; z: number }; normal: { x: number; y: number; z: number } }>>({});
  const [placingLabel, setPlacingLabel] = useState(false);

  const store = usePrintSession();
  const { getBuildPlate, getMachineTypes } = usePrinterMode();
  const buildPlate = getBuildPlate();
  const allowedMachineTypes = getMachineTypes();
  const { showVirtualPrinters } = useAppSettings();
  const { getMaterialName, fetch: fetchMaterials } = useMaterialLibrary();

  // Ensure material library is loaded for name lookups
  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  useEffect(() => {
    store.reset();
    Promise.all([
      fetch(`/api/cases/${caseId}`).then((r) => r.json()),
      fetch(`/api/cases/${caseId}/scans`).then((r) => r.json()),
      fetch("/api/preform/devices").then((r) => r.json()).catch(() => ({ devices: [] })),
    ])
      .then(([c, s, d]) => {
        setPatientName(c.patientName || "");
        setScans(s.scans || []);
        setDevices(d.devices || []);
      })
      .finally(() => setLoading(false));
  }, [caseId]);

  const toggleScan = (id: string) => {
    setSelectedScans((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Fetch fresh scene data from PreForm and update model state
  const refreshSceneData = async () => {
    if (!store.preformSceneId) return;
    try {
      const res = await fetch(`/api/preform/scenes/${store.preformSceneId}`);
      if (!res.ok) return;
      const scene: SceneModel = await res.json();
      if (scene.models) {
        const updated = store.models.map((m) => {
          const fresh = scene.models.find(
            (sm: ModelProperties) => sm.id === m.preformModelId
          );
          if (fresh) {
            return {
              ...m,
              position: fresh.position,
              boundingBox: fresh.bounding_box,
            };
          }
          return m;
        });
        store.setModels(updated);
      }
    } catch (e) {
      console.error("Failed to refresh scene data:", e);
    }
  };

  // ----- Workflow Actions -----
  const createScene = async (): Promise<string | null> => {
    store.setProcessing(true, "Creating scene...");
    setError("");
    try {
      const res = await fetch("/api/preform/scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machine_type: store.machineType,
          material_code: store.materialCode,
          print_setting: store.printSetting,
          layer_thickness_mm: store.layerThicknessMm,
        }),
      });
      if (!res.ok) throw new Error("Failed to create scene");
      const scene = await res.json();
      store.setSceneId(scene.id);
      store.setProcessing(false);
      return scene.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create scene");
      return null;
    } finally {
      store.setProcessing(false);
    }
  };

  const importModels = async (sceneId?: string) => {
    const activeSceneId = sceneId || usePrintSession.getState().preformSceneId;
    if (!activeSceneId) return;
    store.setProcessing(true, "Importing models...");
    setError("");
    try {
      const selected = scans.filter((s) => selectedScans.has(s.id));
      for (const scan of selected) {
        const res = await fetch(`/api/preform/scenes/${activeSceneId}/import-model`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId: scan.id, repairBehavior: "REPAIR" }),
        });
        if (!res.ok) throw new Error(`Failed to import ${scan.originalName}`);
        const model = await res.json();
        store.addModel({
          uploadId: scan.id,
          preformModelId: model.id,
          fileName: scan.originalName,
          position: model.position || { x: 0, y: 0, z: 0 },
          boundingBox: model.bounding_box || null,
          hasSupports: false,
          hasLabel: false,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      store.setProcessing(false);
    }
  };

  const autoOrient = async () => {
    if (!store.preformSceneId) return;
    store.setProcessing(true, "Auto-orienting...");
    setError("");
    try {
      const body =
        store.printMode === "direct"
          ? { models: "ALL", mode: "DENTAL", tilt: store.directPrintTiltDegrees }
          : { models: "ALL" };
      const res = await fetch(`/api/preform/scenes/${store.preformSceneId}/auto-orient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Auto-orient failed");
      await refreshSceneData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Auto-orient failed");
    } finally {
      store.setProcessing(false);
    }
  };

  const autoLayout = async () => {
    if (!store.preformSceneId) return;
    store.setProcessing(true, "Auto-layout...");
    setError("");
    try {
      const res = await fetch(`/api/preform/scenes/${store.preformSceneId}/auto-layout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lock_rotation: true }),
      });
      if (!res.ok) throw new Error("Auto-layout failed");
      await refreshSceneData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Auto-layout failed");
    } finally {
      store.setProcessing(false);
    }
  };

  const generateSupports = async () => {
    if (!store.preformSceneId) return;
    store.setProcessing(true, "Generating supports...");
    setError("");
    try {
      const res = await fetch(`/api/preform/scenes/${store.preformSceneId}/auto-support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          density: store.supportDensity,
          touchpoint_size_mm: store.supportTouchpoint,
          slope_multiplier: store.supportSlope,
          raft_type: "MINI_RAFTS_ON_BP",
        }),
      });
      if (!res.ok) throw new Error("Failed to generate supports");
      store.models.forEach((m) => store.updateModel(m.uploadId, { hasSupports: true }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate supports");
    } finally {
      store.setProcessing(false);
    }
  };

  const getLabelText = (model: { fileName: string }): string => {
    const state = usePrintSession.getState();
    switch (state.labelTextMode) {
      case "patient":
        return patientName || "Patient";
      case "custom":
        return state.labelCustomText || "Label";
      case "filename":
      default:
        return model.fileName.replace(/\.stl$/i, "");
    }
  };

  // Convert face normal into PreForm orientation (z_direction = surface normal, x_direction = perpendicular)
  const normalToOrientation = (normal: { x: number; y: number; z: number }) => {
    const n = { x: normal.x, y: normal.y, z: normal.z };
    // Find a vector not parallel to the normal to use as "up" reference
    const up = Math.abs(n.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    // x_direction = cross(normal, up), normalized
    const cx = n.y * up.z - n.z * up.y;
    const cy = n.z * up.x - n.x * up.z;
    const cz = n.x * up.y - n.y * up.x;
    const len = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1;
    return {
      z_direction: [n.x, n.y, n.z],
      x_direction: [cx / len, cy / len, cz / len],
    };
  };

  const handleSurfaceClick = (modelId: string, event: ModelClickEvent) => {
    if (store.currentStep !== 4 || !placingLabel) return;
    const model = usePrintSession.getState().models.find((m) => m.uploadId === modelId);
    if (!model) return;
    setLabelPlacements((prev) => ({
      ...prev,
      [model.uploadId]: { point: event.point, normal: event.normal },
    }));
    setPlacingLabel(false);
  };

  const applyLabels = async () => {
    const state = usePrintSession.getState();
    if (!state.preformSceneId || !state.labelEnabled) return;

    // Ensure every model has a placement
    const modelsWithoutPlacement = state.models.filter((m) => !labelPlacements[m.uploadId]);
    if (modelsWithoutPlacement.length > 0) {
      setError(`Click on each model to place the label. Missing: ${modelsWithoutPlacement.map((m) => m.fileName).join(", ")}`);
      return;
    }

    store.setProcessing(true, "Applying labels...");
    setError("");
    try {
      // Refresh scene data to get current bounding boxes from PreForm
      await refreshSceneData();
      const freshModels = usePrintSession.getState().models;

      for (const model of freshModels) {
        if (!model.preformModelId) continue;
        const placement = labelPlacements[model.uploadId];
        if (!placement) continue;

        const labelText = getLabelText(model).slice(0, 16);

        // Map viewer click to PreForm coordinates using bounding box
        // The viewer auto-centers models at origin, but PreForm has them
        // at model.position with their own bounding box
        let position: { x: number; y: number; z: number };

        if (model.boundingBox) {
          const bb = model.boundingBox;
          // Get viewer model's approximate extent (centered at origin)
          const vSizeX = bb.max_corner.x - bb.min_corner.x;
          const vSizeY = bb.max_corner.y - bb.min_corner.y;
          const vSizeZ = bb.max_corner.z - bb.min_corner.z;
          // Normalize the click point to 0..1 range relative to viewer model
          // Viewer centers at 0,0 and sits on y=0, so range is roughly [-size/2..size/2] for x,z and [0..sizeY] for y
          const relX = vSizeX > 0 ? (placement.point.x / (vSizeX / 2)) : 0; // -1 to 1
          const relY = vSizeY > 0 ? (placement.point.y / vSizeY) : 0.5; // 0 to 1
          const relZ = vSizeZ > 0 ? (placement.point.z / (vSizeZ / 2)) : 0; // -1 to 1
          // Map to PreForm bounding box
          const pfCenterX = (bb.min_corner.x + bb.max_corner.x) / 2;
          const pfCenterZ = (bb.min_corner.z + bb.max_corner.z) / 2;
          position = {
            x: pfCenterX + relX * (vSizeX / 2),
            y: bb.min_corner.y + relY * vSizeY,
            z: pfCenterZ + relZ * (vSizeZ / 2),
          };
        } else {
          // Fallback: use click point offset by model position
          position = {
            x: placement.point.x + model.position.x,
            y: placement.point.y + model.position.y,
            z: placement.point.z + model.position.z,
          };
        }

        const orientation = normalToOrientation(placement.normal);

        const res = await fetch(`/api/preform/scenes/${state.preformSceneId}/label`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model_id: model.preformModelId,
            label: labelText,
            position,
            orientation,
            application_mode: state.labelMode,
            font_size_mm: state.labelFontSize,
            depth_mm: state.labelDepth,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(`Label failed for ${model.fileName}: ${(err as Record<string, string>).error || res.statusText}`);
        }
        store.updateModel(model.uploadId, { hasLabel: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to apply labels");
    } finally {
      store.setProcessing(false);
    }
  };

  const submitPrint = async () => {
    if (!store.preformSceneId || !store.selectedPrinterId) return;
    store.setProcessing(true, "Sending to printer...");
    setError("");
    try {
      const jobName = `${new Date().toISOString().slice(0, 10)}_${caseId.slice(0, 8)}`;
      const res = await fetch(`/api/preform/scenes/${store.preformSceneId}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          printer: store.selectedPrinterId,
          job_name: jobName,
        }),
      });
      if (!res.ok) throw new Error("Print failed");

      // Record job
      await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          sceneId: store.preformSceneId,
          printerName: store.selectedPrinterName,
          printerId: store.selectedPrinterId,
          jobName,
          status: "submitted",
        }),
      });

      store.setStep(6); // done
    } catch (e) {
      setError(e instanceof Error ? e.message : "Print failed");
    } finally {
      store.setProcessing(false);
    }
  };

  // Determine which steps to show based on print mode
  const shouldShowSupports = store.printMode === "direct";

  // When in model print mode, skip supports step (step 3 → step 4)
  const getNextStep = (current: number) => {
    if (current === 2 && !shouldShowSupports) return 4; // skip supports
    return current + 1;
  };

  // ----- 3D Viewer Models -----
  // PreForm uses Z-up coordinate system, Three.js uses Y-up
  // Swap: viewer X = PreForm X, viewer Y = PreForm Z, viewer Z = PreForm Y
  const viewerModels = store.models.map((m) => ({
    id: m.uploadId,
    url: `/api/uploads/${m.uploadId}/file`,
    name: m.fileName,
    position: [m.position.x, m.position.z, m.position.y] as [number, number, number],
    selected: m.uploadId === store.selectedModelId,
    color: m.hasSupports ? "#22c55e" : "#94a3b8",
  }));

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
      <div className="px-6 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/cases/${caseId}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold">Print Preparation</h1>
          {store.printMode === "direct" && (
            <Badge variant="warning" className="text-[10px]">Direct Print</Badge>
          )}
          {store.printMode === "model" && (
            <Badge variant="outline" className="text-[10px]">Model Print</Badge>
          )}
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((step, i) => {
            // Hide supports step in model print mode
            if (i === 3 && !shouldShowSupports) return null;
            return (
              <div key={i} className="flex items-center">
                <button
                  onClick={() => store.setStep(i)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    i === store.currentStep
                      ? "bg-primary/10 text-primary"
                      : i < store.currentStep
                      ? "text-success"
                      : "text-muted-foreground"
                  }`}
                >
                  {i < store.currentStep ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <step.icon className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden lg:inline">{step.label}</span>
                </button>
                {i < STEPS.length - 1 && !(i === 3 && !shouldShowSupports) && (
                  <ArrowRight className="w-3 h-3 text-border mx-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <STLViewer
            models={viewerModels}
            onModelClick={(id) => store.setSelectedModel(id)}
            onModelSurfaceClick={handleSurfaceClick}
            buildPlateSize={buildPlate}
            className="w-full h-full"
          />
          <ViewerToolbar className="absolute top-4 right-4" />
          {store.isProcessing && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-20">
              <div className="flex items-center gap-3 bg-card px-6 py-4 rounded-xl border border-border shadow-xl">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm font-medium">{store.processingMessage}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-border bg-card overflow-y-auto shrink-0">
          <div className="p-4">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Step 0: Select Models */}
            {store.currentStep === 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Select Models</h3>
                <p className="text-xs text-muted-foreground">Choose which scans to include in this print build.</p>
                <div className="space-y-2">
                  {scans.map((scan) => (
                    <label
                      key={scan.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedScans.has(scan.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedScans.has(scan.id)}
                        onChange={() => toggleScan(scan.id)}
                        className="accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{scan.originalName}</p>
                        {scan.pairGroup && (
                          <p className="text-xs text-muted-foreground">Group: {scan.pairGroup}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <Button
                  className="w-full"
                  disabled={selectedScans.size === 0}
                  onClick={() => store.setStep(1)}
                >
                  Continue with {selectedScans.size} file{selectedScans.size !== 1 ? "s" : ""}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Step 1: Scene Setup + Print Mode */}
            {store.currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Scene Setup</h3>

                {/* Print Mode Selector */}
                <div>
                  <label className="text-xs font-medium mb-2 block">Print Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => store.setPrintMode("model")}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        store.printMode === "model"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <Layers className="w-4 h-4 mb-1" />
                      <p className="text-xs font-medium">Model Print</p>
                      <p className="text-[10px] text-muted-foreground">Flat, no supports. For thermoforming.</p>
                    </button>
                    <button
                      onClick={() => store.setPrintMode("direct")}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        store.printMode === "direct"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <Shield className="w-4 h-4 mb-1" />
                      <p className="text-xs font-medium">Direct Print</p>
                      <p className="text-[10px] text-muted-foreground">{store.directPrintTiltDegrees}° tilt with supports.</p>
                    </button>
                  </div>
                </div>

                <MaterialSelector
                  machineType={store.machineType}
                  materialCode={store.materialCode}
                  layerThicknessMm={store.layerThicknessMm}
                  onMachineTypeChange={store.setMachineType}
                  onMaterialCodeChange={store.setMaterialCode}
                  onLayerThicknessChange={store.setLayerThickness}
                />

                {store.printMode === "direct" && (
                  <div>
                    <label className="text-xs font-medium mb-1 block">
                      Tilt Angle: {store.directPrintTiltDegrees}°
                    </label>
                    <input
                      type="range" min="30" max="90" step="5"
                      value={store.directPrintTiltDegrees}
                      onChange={(e) => store.setDirectPrintTiltDegrees(parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                )}

                <Button className="w-full" onClick={async () => { const id = await createScene(); if (id) { await importModels(id); store.setStep(2); } }}>
                  {store.isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create Scene & Import
                </Button>
              </div>
            )}

            {/* Step 2: Orient & Layout */}
            {store.currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Orient & Layout</h3>
                <p className="text-xs text-muted-foreground">
                  {store.models.length} model{store.models.length !== 1 ? "s" : ""} imported.
                  {store.printMode === "direct" && ` DENTAL orient at ${store.directPrintTiltDegrees}°.`}
                </p>
                <Button className="w-full" variant="secondary" onClick={autoOrient} disabled={store.isProcessing}>
                  {store.printMode === "direct" ? `Dental Orient (${store.directPrintTiltDegrees}°)` : "Auto Orient"}
                </Button>
                <Button className="w-full" variant="secondary" onClick={autoLayout} disabled={store.isProcessing}>
                  Auto Layout
                </Button>
                <Button className="w-full" onClick={() => store.setStep(getNextStep(2))}>
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Step 3: Supports (only for direct print mode) */}
            {store.currentStep === 3 && shouldShowSupports && (
              <div className="space-y-4">
                <h3 className="font-semibold">Support Settings</h3>
                <div>
                  <label className="text-xs font-medium mb-1 block">Density: {store.supportDensity.toFixed(2)}</label>
                  <input
                    type="range" min="0.5" max="2.0" step="0.05"
                    value={store.supportDensity}
                    onChange={(e) => store.setSupportDensity(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Touchpoint: {store.supportTouchpoint.toFixed(2)}mm</label>
                  <input
                    type="range" min="0.3" max="2.0" step="0.05"
                    value={store.supportTouchpoint}
                    onChange={(e) => store.setSupportTouchpoint(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Slope: {store.supportSlope.toFixed(2)}</label>
                  <input
                    type="range" min="0.5" max="2.0" step="0.05"
                    value={store.supportSlope}
                    onChange={(e) => store.setSupportSlope(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
                <Button className="w-full" onClick={async () => { await generateSupports(); store.setStep(4); }} disabled={store.isProcessing}>
                  {store.isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  Generate Supports
                </Button>
              </div>
            )}

            {/* Step 4: Labels */}
            {store.currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Labels</h3>

                {/* Label text source */}
                <div>
                  <label className="text-xs font-medium mb-2 block">Label Text</label>
                  <div className="space-y-2">
                    {([
                      { value: "filename" as const, label: "File Name", desc: store.models[0]?.fileName?.replace(/\.stl$/i, "") || "filename" },
                      { value: "patient" as const, label: "Patient Name", desc: patientName || "—" },
                      { value: "custom" as const, label: "Custom Text", desc: null },
                    ]).map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          store.labelTextMode === opt.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="labelTextMode"
                          value={opt.value}
                          checked={store.labelTextMode === opt.value}
                          onChange={() => { store.setLabelEnabled(true); store.setLabelTextMode(opt.value); }}
                          className="accent-primary mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{opt.label}</p>
                          {opt.desc && (
                            <p className="text-[10px] text-muted-foreground truncate">{opt.desc}</p>
                          )}
                          {opt.value === "custom" && store.labelTextMode === "custom" && (
                            <Input
                              className="mt-2"
                              placeholder="Enter label text..."
                              value={store.labelCustomText}
                              onChange={(e) => store.setLabelCustomText(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Placement */}
                <div>
                  <label className="text-xs font-medium mb-2 block">Placement</label>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Click on each model in the viewer to place the label at that location.
                  </p>
                  <div className="space-y-1.5">
                    {store.models.map((m) => {
                      const placed = !!labelPlacements[m.uploadId];
                      return (
                        <div key={m.uploadId} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-secondary">
                          <div className={`w-2 h-2 rounded-full ${placed ? "bg-success" : "bg-muted-foreground"}`} />
                          <span className="flex-1 truncate">{m.fileName}</span>
                          {placed ? (
                            <span className="text-success text-[10px]">Placed</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[10px] h-6 px-2"
                              onClick={() => setPlacingLabel(true)}
                            >
                              Click to place
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {placingLabel && (
                    <div className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium text-center animate-pulse">
                      Click on the model surface to place label...
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Style</label>
                    <Select value={store.labelMode} onChange={(e) => store.setLabelMode(e.target.value as "ENGRAVE" | "EMBOSS")}>
                      <option value="ENGRAVE">Engrave</option>
                      <option value="EMBOSS">Emboss</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Font: {store.labelFontSize}mm</label>
                    <input
                      type="range" min="2" max="10" step="0.5"
                      value={store.labelFontSize}
                      onChange={(e) => store.setLabelFontSize(parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Depth: {store.labelDepth}mm</label>
                  <input
                    type="range" min="0.2" max="2" step="0.1"
                    value={store.labelDepth}
                    onChange={(e) => store.setLabelDepth(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={async () => { await applyLabels(); if (!error) store.setStep(5); }}
                    disabled={store.isProcessing || Object.keys(labelPlacements).length === 0 || (store.labelTextMode === "custom" && !store.labelCustomText.trim())}
                  >
                    {store.isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                    Apply Labels ({Object.keys(labelPlacements).length}/{store.models.length})
                  </Button>
                  <Button variant="secondary" onClick={() => { store.setLabelEnabled(false); store.setStep(5); }}>
                    Skip
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Print */}
            {store.currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Send to Printer</h3>
                <div>
                  <label className="text-xs font-medium mb-1 block">Select Printer</label>
                  <Select
                    value={store.selectedPrinterId || ""}
                    onChange={(e) => {
                      const dev = devices.find((d) => d.id === e.target.value);
                      store.setPrinter(e.target.value || null, dev?.product_name || null);
                    }}
                  >
                    <option value="">Choose a printer...</option>
                    {devices
                      .filter((d) => {
                        if (!showVirtualPrinters && d.connection_type === "VIRTUAL") return false;
                        const name = (d.product_name || "").toLowerCase();
                        const isLarge = /4\s*l|4\s*bl/i.test(name);
                        return allowedMachineTypes.some((mt) => mt.includes("4L") || mt.includes("4BL"))
                          ? isLarge
                          : !isLarge;
                      })
                      .map((d) => {
                        const materialCode = d.tank_material_code || (d.cartridge_data ? Object.values(d.cartridge_data)[0]?.cartridgeMaterialCode : null);
                        const materialLabel = materialCode ? getMaterialName(materialCode) : null;
                        return (
                          <option key={d.id} value={d.id}>
                            {d.id}{materialLabel ? ` — ${materialLabel}` : ""} ({d.status}){!d.is_connected ? " - offline" : ""}
                          </option>
                        );
                      })}
                  </Select>
                </div>

                <div className="p-3 rounded-lg bg-secondary space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Print Mode</span>
                    <span className="capitalize">{store.printMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Models</span>
                    <span>{store.models.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Material</span>
                    <span>{getMaterialName(store.materialCode)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Layer</span>
                    <span>{store.layerThicknessMm}mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supports</span>
                    <Badge variant={store.models.some((m) => m.hasSupports) ? "success" : store.printMode === "model" ? "outline" : "warning"} className="text-[10px]">
                      {store.models.some((m) => m.hasSupports) ? "Generated" : store.printMode === "model" ? "N/A" : "None"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Labels</span>
                    <Badge variant={store.models.some((m) => m.hasLabel) ? "success" : "outline"} className="text-[10px]">
                      {store.models.some((m) => m.hasLabel) ? "Applied" : "None"}
                    </Badge>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={submitPrint}
                  disabled={!store.selectedPrinterId || store.isProcessing}
                >
                  {store.isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                  Send to Printer
                </Button>
              </div>
            )}

            {/* Step 6: Done */}
            {store.currentStep === 6 && (
              <div className="text-center py-8 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
                <h3 className="font-semibold text-lg">Print Submitted!</h3>
                <p className="text-sm text-muted-foreground">
                  Job sent to {store.selectedPrinterName || "printer"}.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link href={`/cases/${caseId}`}>
                    <Button variant="secondary">Back to Case</Button>
                  </Link>
                  <Link href="/jobs">
                    <Button>View Jobs</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
