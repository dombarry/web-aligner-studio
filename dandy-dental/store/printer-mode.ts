import { create } from "zustand";

export type PrinterFamily = "form4" | "form4l";

export interface PrinterFamilyConfig {
  label: string;
  machineTypes: string[];
  buildPlate: { x: number; y: number };
}

export const PRINTER_FAMILIES: Record<PrinterFamily, PrinterFamilyConfig> = {
  form4: {
    label: "Form 4 / 4B",
    machineTypes: ["FORM-4-0", "FORM-4B-0"],
    buildPlate: { x: 200, y: 125 },
  },
  form4l: {
    label: "Form 4L / 4BL",
    machineTypes: ["FORM-4L-0", "FORM-4BL-0"],
    buildPlate: { x: 353, y: 196 },
  },
};

interface PrinterModeState {
  printerFamily: PrinterFamily;
  setPrinterFamily: (family: PrinterFamily) => void;
  getBuildPlate: () => { x: number; y: number };
  getMachineTypes: () => string[];
}

export const usePrinterMode = create<PrinterModeState>((set, get) => ({
  printerFamily: "form4",
  setPrinterFamily: (family) => set({ printerFamily: family }),
  getBuildPlate: () => PRINTER_FAMILIES[get().printerFamily].buildPlate,
  getMachineTypes: () => PRINTER_FAMILIES[get().printerFamily].machineTypes,
}));
