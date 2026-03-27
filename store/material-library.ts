import { create } from "zustand";

export interface PrinterType {
  label: string;
  buildVolumeDimensions: number[];
  supportedMachineTypeIds: string[];
  supportedProductNames: string[];
  materials: MaterialEntry[];
}

export interface MaterialEntry {
  label: string;
  description: string;
  code: string;
  settings: MaterialSetting[];
}

export interface MaterialSetting {
  label: string;
  sceneSettings: {
    machine_type: string;
    material_code: string;
    layer_thickness_mm: number;
    print_setting: string;
  };
}

interface MaterialLibraryState {
  printerTypes: PrinterType[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  // Code → name lookup maps
  materialNameByCode: Map<string, string>;
  printerNameByMachineType: Map<string, string>;
  fetch: () => Promise<void>;
  getMaterialName: (code: string) => string;
  getPrinterTypeName: (machineType: string) => string;
}

export const useMaterialLibrary = create<MaterialLibraryState>((set, get) => ({
  printerTypes: [],
  loaded: false,
  loading: false,
  error: null,
  materialNameByCode: new Map(),
  printerNameByMachineType: new Map(),

  fetch: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await window.fetch("/api/preform/materials");
      if (!res.ok) throw new Error("Failed to fetch materials");
      const data = await res.json();

      const raw = data.printer_types || data || [];
      const materialNameByCode = new Map<string, string>();
      const printerNameByMachineType = new Map<string, string>();

      const printerTypes: PrinterType[] = raw.map((pt: Record<string, unknown>) => {
        const label = pt.label as string;
        const machineTypeIds = (pt.supported_machine_type_ids || []) as string[];
        machineTypeIds.forEach((id) => printerNameByMachineType.set(id, label));

        const materials = ((pt.materials || []) as Record<string, unknown>[]).map((mat) => {
          const matLabel = mat.label as string;
          const matDesc = (mat.description || "") as string;
          const matSettings = ((mat.material_settings || []) as Record<string, unknown>[]).map((ms) => {
            const ss = ms.scene_settings as Record<string, unknown>;
            const code = ss.material_code as string;
            materialNameByCode.set(code, matLabel);
            return {
              label: (ms.label || "") as string,
              sceneSettings: {
                machine_type: ss.machine_type as string,
                material_code: code,
                layer_thickness_mm: ss.layer_thickness_mm as number,
                print_setting: (ss.print_setting || "DEFAULT") as string,
              },
            };
          });
          // Also map from first setting's code
          if (matSettings.length > 0) {
            materialNameByCode.set(matSettings[0].sceneSettings.material_code, matLabel);
          }
          return { label: matLabel, description: matDesc, code: matSettings[0]?.sceneSettings.material_code || "", settings: matSettings };
        });

        return {
          label,
          buildVolumeDimensions: (pt.build_volume_dimensions_mm || []) as number[],
          supportedMachineTypeIds: machineTypeIds,
          supportedProductNames: (pt.supported_product_names || []) as string[],
          materials,
        };
      });

      set({ printerTypes, materialNameByCode, printerNameByMachineType, loaded: true, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to load materials", loading: false });
    }
  },

  getMaterialName: (code) => get().materialNameByCode.get(code) || code,
  getPrinterTypeName: (machineType) => get().printerNameByMachineType.get(machineType) || machineType,
}));
