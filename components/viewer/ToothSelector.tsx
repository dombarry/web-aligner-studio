"use client";

import { useState } from "react";
import type { ToothSegment } from "@/lib/segmentation/types";
import { TOOTH_NAMES } from "@/lib/segmentation/types";

interface ToothSelectorProps {
  teeth: ToothSegment[];
  selectedTeeth: Set<number>;
  onToothSelect: (toothNumber: number) => void;
  onToothDeselect: (toothNumber: number) => void;
}

export function ToothSelector({
  teeth,
  selectedTeeth,
  onToothSelect,
  onToothDeselect,
}: ToothSelectorProps) {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);

  const upperTeeth = teeth.filter((t) => t.arch === "upper").sort((a, b) => a.toothNumber - b.toothNumber);
  const lowerTeeth = teeth.filter((t) => t.arch === "lower").sort((a, b) => a.toothNumber - b.toothNumber);

  const toggleTooth = (num: number) => {
    if (selectedTeeth.has(num)) {
      onToothDeselect(num);
    } else {
      onToothSelect(num);
    }
  };

  const renderToothRow = (teethRow: ToothSegment[]) => (
    <div className="flex gap-1 justify-center">
      {teethRow.map((tooth) => {
        const isSelected = selectedTeeth.has(tooth.toothNumber);
        const isHovered = hoveredTooth === tooth.toothNumber;
        return (
          <button
            key={tooth.toothNumber}
            onClick={() => toggleTooth(tooth.toothNumber)}
            onMouseEnter={() => setHoveredTooth(tooth.toothNumber)}
            onMouseLeave={() => setHoveredTooth(null)}
            className={`w-7 h-8 rounded text-[10px] font-mono font-bold transition-all ${
              isSelected
                ? "ring-2 ring-primary shadow-lg scale-110"
                : isHovered
                ? "ring-1 ring-primary/50 scale-105"
                : ""
            }`}
            style={{
              backgroundColor: isSelected ? tooth.color : `${tooth.color}40`,
              color: isSelected ? "#fff" : tooth.color,
            }}
            title={tooth.label}
          >
            {tooth.toothNumber}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Tooth chart */}
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground text-center">Upper Arch</p>
        {renderToothRow(upperTeeth)}
        <div className="border-t border-border" />
        {renderToothRow(lowerTeeth)}
        <p className="text-[10px] text-muted-foreground text-center">Lower Arch</p>
      </div>

      {/* Selected info */}
      {hoveredTooth && (
        <div className="p-2 rounded bg-secondary text-xs">
          <span className="font-medium">#{hoveredTooth}</span>{" "}
          <span className="text-muted-foreground">{TOOTH_NAMES[hoveredTooth]}</span>
        </div>
      )}

      {selectedTeeth.size > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedTeeth.size} tooth{selectedTeeth.size !== 1 ? "teeth" : ""} selected
        </div>
      )}
    </div>
  );
}
