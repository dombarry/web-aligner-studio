// Universal numbering system (1-32)
export type ToothNumber = number;

export interface ToothSegment {
  toothNumber: ToothNumber;
  label: string; // e.g., "Upper Right Third Molar"
  arch: "upper" | "lower";
  quadrant: 1 | 2 | 3 | 4;
  // Vertex indices from the original mesh that belong to this tooth
  vertexIndices: number[];
  // Centroid position in model coordinates
  centroid: { x: number; y: number; z: number };
  // Bounding box of this tooth segment
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  // Color for visualization
  color: string;
}

export interface SegmentationResult {
  scanId: string;
  arch: "upper" | "lower";
  teeth: ToothSegment[];
  // Total vertices in the mesh
  totalVertices: number;
  // Vertices assigned to gingiva (not any tooth)
  gingivaVertexIndices: number[];
  // Timestamp
  segmentedAt: string;
}

export interface TreatmentStep {
  stepNumber: number;
  description: string;
  // Per-tooth movements for this step
  movements: Array<{
    toothNumber: ToothNumber;
    translation: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number }; // euler degrees
  }>;
}

export interface TreatmentPlan {
  id: string;
  caseId: string;
  steps: TreatmentStep[];
  createdAt: string;
  updatedAt: string;
}

// Tooth naming reference
export const TOOTH_NAMES: Record<number, string> = {
  1: "Upper Right Third Molar",
  2: "Upper Right Second Molar",
  3: "Upper Right First Molar",
  4: "Upper Right Second Premolar",
  5: "Upper Right First Premolar",
  6: "Upper Right Canine",
  7: "Upper Right Lateral Incisor",
  8: "Upper Right Central Incisor",
  9: "Upper Left Central Incisor",
  10: "Upper Left Lateral Incisor",
  11: "Upper Left Canine",
  12: "Upper Left First Premolar",
  13: "Upper Left Second Premolar",
  14: "Upper Left First Molar",
  15: "Upper Left Second Molar",
  16: "Upper Left Third Molar",
  17: "Lower Left Third Molar",
  18: "Lower Left Second Molar",
  19: "Lower Left First Molar",
  20: "Lower Left Second Premolar",
  21: "Lower Left First Premolar",
  22: "Lower Left Canine",
  23: "Lower Left Lateral Incisor",
  24: "Lower Left Central Incisor",
  25: "Lower Right Central Incisor",
  26: "Lower Right Lateral Incisor",
  27: "Lower Right Canine",
  28: "Lower Right First Premolar",
  29: "Lower Right Second Premolar",
  30: "Lower Right First Molar",
  31: "Lower Right Second Molar",
  32: "Lower Right Third Molar",
};

export const TOOTH_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
];

export function getToothColor(toothNumber: number): string {
  return TOOTH_COLORS[(toothNumber - 1) % TOOTH_COLORS.length];
}

export function getToothQuadrant(toothNumber: number): 1 | 2 | 3 | 4 {
  if (toothNumber >= 1 && toothNumber <= 8) return 1;
  if (toothNumber >= 9 && toothNumber <= 16) return 2;
  if (toothNumber >= 17 && toothNumber <= 24) return 3;
  return 4;
}

export function getToothArch(toothNumber: number): "upper" | "lower" {
  return toothNumber <= 16 ? "upper" : "lower";
}
