"use client";

import { useState, useEffect, useMemo } from "react";
import { Select } from "@/components/ui/Select";
import { Loader2 } from "lucide-react";
import type { MaterialInfo } from "@/lib/types";

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
  const [materialData, setMaterialData] = useState<MaterialInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/preform/materials")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch materials");
        return r.json();
      })
      .then((data) => {
        // The API returns an array of MaterialInfo objects
        setMaterialData(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Available machine types
  const machineTypes = useMemo(
    () => materialData.map((m) => ({ id: m.machine_type_id, name: m.machine_type_name })),
    [materialData]
  );

  // Materials for selected machine type
  const selectedMachine = useMemo(
    () => materialData.find((m) => m.machine_type_id === machineType),
    [materialData, machineType]
  );

  const materials = useMemo(
    () => selectedMachine?.materials || [],
    [selectedMachine]
  );

  // Find the currently selected material
  const selectedMaterial = useMemo(
    () => materials.find((m) => m.material_code === materialCode),
    [materials, materialCode]
  );

  // Layer thickness options for selected material
  const layerOptions = useMemo(
    () =>
      selectedMaterial?.material_settings.map((ms) => ({
        thickness: ms.scene_settings.layer_thickness_mm,
        printSetting: ms.scene_settings.print_setting,
        name: ms.setting_name,
        description: ms.setting_description,
      })) || [],
    [selectedMaterial]
  );

  // Auto-select first material when machine type changes
  const handleMachineTypeChange = (newType: string) => {
    onMachineTypeChange(newType);
    const machine = materialData.find((m) => m.machine_type_id === newType);
    if (machine?.materials.length) {
      const firstMat = machine.materials[0];
      onMaterialCodeChange(firstMat.material_code);
      if (firstMat.material_settings.length) {
        const firstSetting = firstMat.material_settings[0];
        onLayerThicknessChange(firstSetting.scene_settings.layer_thickness_mm);
        onPrintSettingChange?.(firstSetting.scene_settings.print_setting);
      }
    }
  };

  // Auto-select first layer thickness when material changes
  const handleMaterialChange = (newCode: string) => {
    onMaterialCodeChange(newCode);
    const mat = materials.find((m) => m.material_code === newCode);
    if (mat?.material_settings.length) {
      const firstSetting = mat.material_settings[0];
      onLayerThicknessChange(firstSetting.scene_settings.layer_thickness_mm);
      onPrintSettingChange?.(firstSetting.scene_settings.print_setting);
    }
  };

  const handleLayerChange = (thicknessStr: string) => {
    const thickness = parseFloat(thicknessStr);
    onLayerThicknessChange(thickness);
    const setting = selectedMaterial?.material_settings.find(
      (ms) => ms.scene_settings.layer_thickness_mm === thickness
    );
    if (setting) {
      onPrintSettingChange?.(setting.scene_settings.print_setting);
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

  if (error || materialData.length === 0) {
    // Fallback to manual inputs
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
            <option value="0.025">0.025mm (25μm)</option>
            <option value="0.05">0.050mm (50μm)</option>
            <option value="0.1">0.100mm (100μm)</option>
          </Select>
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        <label className="text-xs font-medium mb-1 block">Machine Type</label>
        <Select value={machineType} onChange={(e) => handleMachineTypeChange(e.target.value)}>
          {machineTypes.map((mt) => (
            <option key={mt.id} value={mt.id}>
              {mt.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Material</label>
        <Select value={materialCode} onChange={(e) => handleMaterialChange(e.target.value)}>
          {materials.length === 0 && <option value="">No materials available</option>}
          {materials.map((mat) => (
            <option key={mat.material_code} value={mat.material_code}>
              {mat.material_name}
            </option>
          ))}
        </Select>
        {selectedMaterial && (
          <p className="text-[10px] text-muted-foreground mt-1">{selectedMaterial.material_description}</p>
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
              {opt.thickness}mm - {opt.name}
            </option>
          ))}
        </Select>
        {layerOptions.find((o) => o.thickness === layerThicknessMm)?.description && (
          <p className="text-[10px] text-muted-foreground mt-1">
            {layerOptions.find((o) => o.thickness === layerThicknessMm)?.description}
          </p>
        )}
      </div>
    </>
  );
}
