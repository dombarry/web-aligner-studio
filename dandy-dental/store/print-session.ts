import { create } from "zustand";

interface ModelInScene {
  uploadId: string;
  preformModelId: string | null;
  fileName: string;
  position: { x: number; y: number; z: number };
  boundingBox: { min_corner: { x: number; y: number; z: number }; max_corner: { x: number; y: number; z: number } } | null;
  hasSupports: boolean;
  hasLabel: boolean;
}

interface PrintSessionState {
  // Scene
  preformSceneId: string | null;
  machineType: string;
  materialCode: string;
  layerThicknessMm: number;
  printSetting: string;

  // Models
  models: ModelInScene[];
  selectedModelId: string | null;

  // Settings
  supportDensity: number;
  supportTouchpoint: number;
  supportSlope: number;
  labelEnabled: boolean;
  labelFontSize: number;
  labelDepth: number;
  labelMode: "ENGRAVE" | "EMBOSS";

  // Workflow
  currentStep: number;
  isProcessing: boolean;
  processingMessage: string;

  // Target
  selectedPrinterId: string | null;
  selectedPrinterName: string | null;

  // Actions
  setSceneId: (id: string) => void;
  setMachineType: (v: string) => void;
  setMaterialCode: (v: string) => void;
  setLayerThickness: (v: number) => void;
  addModel: (m: ModelInScene) => void;
  updateModel: (uploadId: string, updates: Partial<ModelInScene>) => void;
  setSelectedModel: (id: string | null) => void;
  setStep: (step: number) => void;
  setProcessing: (processing: boolean, message?: string) => void;
  setSupportDensity: (v: number) => void;
  setSupportTouchpoint: (v: number) => void;
  setSupportSlope: (v: number) => void;
  setLabelEnabled: (v: boolean) => void;
  setLabelFontSize: (v: number) => void;
  setLabelDepth: (v: number) => void;
  setLabelMode: (v: "ENGRAVE" | "EMBOSS") => void;
  setPrinter: (id: string | null, name: string | null) => void;
  reset: () => void;
}

const initialState = {
  preformSceneId: null,
  machineType: "FORM-4-0",
  materialCode: "FLDLCO11",
  layerThicknessMm: 0.1,
  printSetting: "DEFAULT",
  models: [],
  selectedModelId: null,
  supportDensity: 1.10,
  supportTouchpoint: 1.00,
  supportSlope: 1.35,
  labelEnabled: true,
  labelFontSize: 3.0,
  labelDepth: 0.5,
  labelMode: "ENGRAVE" as const,
  currentStep: 0,
  isProcessing: false,
  processingMessage: "",
  selectedPrinterId: null,
  selectedPrinterName: null,
};

export const usePrintSession = create<PrintSessionState>((set) => ({
  ...initialState,
  setSceneId: (id) => set({ preformSceneId: id }),
  setMachineType: (v) => set({ machineType: v }),
  setMaterialCode: (v) => set({ materialCode: v }),
  setLayerThickness: (v) => set({ layerThicknessMm: v }),
  addModel: (m) => set((s) => ({ models: [...s.models, m] })),
  updateModel: (uploadId, updates) =>
    set((s) => ({
      models: s.models.map((m) => (m.uploadId === uploadId ? { ...m, ...updates } : m)),
    })),
  setSelectedModel: (id) => set({ selectedModelId: id }),
  setStep: (step) => set({ currentStep: step }),
  setProcessing: (processing, message = "") => set({ isProcessing: processing, processingMessage: message }),
  setSupportDensity: (v) => set({ supportDensity: v }),
  setSupportTouchpoint: (v) => set({ supportTouchpoint: v }),
  setSupportSlope: (v) => set({ supportSlope: v }),
  setLabelEnabled: (v) => set({ labelEnabled: v }),
  setLabelFontSize: (v) => set({ labelFontSize: v }),
  setLabelDepth: (v) => set({ labelDepth: v }),
  setLabelMode: (v) => set({ labelMode: v }),
  setPrinter: (id, name) => set({ selectedPrinterId: id, selectedPrinterName: name }),
  reset: () => set(initialState),
}));
