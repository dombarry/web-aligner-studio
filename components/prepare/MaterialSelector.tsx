"use client";

import { useState, useEffect, useMemo } from "react";
import { Select } from "@/components/ui/Select";
import { Loader2 } from "lucide-react";
import { useMaterialLibrary, type PrinterType, type MaterialEntry } from "@/store/material-library";

interface MaterialSelectorProps {
  machineType: string;
  materialCode: string;
  layerThicknessMm: number;
  onMachineTypeChange: (v: string) => void;
  onMaterialCodeChange: (v: string) => void;
  onLayerThicknessChange: (v: number) => void;
  onPrintSettingChange?: (v: string) => void;
}

export function MaterialSelector({
  machineType,
  materialCode,
  layerThicknessMm,
  onMachineTypeChange,
  onMaterialCodeChange,
  onLayerThicknessChange,
  onPrintSettingChange,
}: MaterialSelectorProps) {
  const { printerTypes, loaded, loading, error, fetch: fetchMaterials } = useMaterialLibrary();

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Find the printer type that contains the current machine type
  const selectedPrinterType = useMemo(
    () => printerTypes.find((pt) => pt.supportedMachineTypeIds.includes(machineType)),
    [printerTypes, machineType]
  );

  const materials = selectedPrinterType?.materials || [];

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.code === materialCode),
    [materials, materialCode]
  );

  const layerOptions = useMemo(
    () => selectedMaterial?.settings.map((s) => ({
      thickness: s.sceneSettings.layer_thickness_mm,
      printSetting: s.sceneSettings.print_setting,
      name: s.label,
    })) || [],
    [selectedMaterial]
  );

  const handlePrinterTypeChange = (newMachineType: string) => {
    onMachineTypeChange(newMachineType);
    const pt = printerTypes.find((p) => p.supportedMachineTypeIds.includes(newMachineType));
    if (pt?.materials.length) {
      const firstMat = pt.materials[0];
      onMaterialCodeChange(firstMat.code);
      if (firstMat.settings.length) {
        onLayerThicknessChange(firstMat.settings[0].sceneSettings.layer_thickness_mm);
        onPrintSettingChange?.(firstMat.settings[0].sceneSettings.print_setting);
      }
    }
  };

  const handleMaterialChange = (newCode: string) => {
    onMaterialCodeChange(newCode);
    const mat = materials.find((m) => m.code === newCode);
    if (mat?.settings.length) {
      onLayerThicknessChange(mat.settings[0].sceneSettings.layer_thickness_mm);
      onPrintSettingChange?.(mat.settings[0].sceneSettings.print_setting);
    }
  };

  const handleLayerChange = (thicknessStr: string) => {
    const thickness = parseFloat(thicknessStr);
    onLayerThicknessChange(thickness);
    const setting = selectedMaterial?.settings.find(
      (s) => s.sceneSettings.layer_thickness_mm === thickness
    );
    if (setting) {
      onPrintSettingChange?.(setting.sceneSettings.print_setting);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Loading materials...</span>
      </div>
    );
  }

  if (error || printerTypes.length === 0) {
    return (
      <>
        {error && (
          <p className="text-[10px] text-muted-foreground mb-2">
            Could not load materials from PreForm. Using manual input.
          </p>
        )}
        <div>
          <label className="text-xs font-medium mb-1 block">Machine Type</label>
          <Select value={machineType} onChange={(e) => onMachineTypeChange(e.target.value)}>
            <option value="FORM-4-0">Form 4</option>
            <option value="FORM-4L-0">Form 4L</option>
            <option value="FORM-3-0">Form 3+</option>
            <option value="FORM-3L-0">Form 3L</option>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Material Code</label>
          <input
            type="text"
            value={materialCode}
            onChange={(e) => onMaterialCodeChange(e.target.value)}
            placeholder="e.g., FLDLCO11"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Layer Thickness (mm)</label>
          <Select
            value={String(layerThicknessMm)}
            onChange={(e) => onLayerThicknessChange(parseFloat(e.target.value))}
          >
            <option value="0.025">0.025mm (25um)</option>
            <option value="0.05">0.050mm (50um)</option>
            <option value="0.1">0.100mm (100um)</option>
          </Select>
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        <label className="text-xs font-medium mb-1 block">Printer Type</label>
        <Select
          value={machineType}
          onChange={(e) => handlePrinterTypeChange(e.target.value)}
        >
          {printerTypes.map((pt) => (
            <option key={pt.supportedMachineTypeIds[0]} value={pt.supportedMachineTypeIds[0]}>
              {pt.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Material</label>
        <Select value={materialCode} onChange={(e) => handleMaterialChange(e.target.value)}>
          {materials.length === 0 && <option value="">No materials available</option>}
          {materials.map((mat) => (
            <option key={mat.code} value={mat.code}>
              {mat.label}
            </option>
          ))}
        </Select>
        {selectedMaterial && (
          <p className="text-[10px] text-muted-foreground mt-1">{selectedMaterial.description}</p>
        )}
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Layer Thickness</label>
        <Select
          value={String(layerThicknessMm)}
          onChange={(e) => handleLayerChange(e.target.value)}
        >
          {layerOptions.length === 0 && <option value="">Select a material first</option>}
          {layerOptions.map((opt) => (
            <option key={`${opt.thickness}-${opt.printSetting}`} value={String(opt.thickness)}>
              {opt.name || `${opt.thickness}mm`}
            </option>
          ))}
        </Select>
      </div>
    </>
  );
}
