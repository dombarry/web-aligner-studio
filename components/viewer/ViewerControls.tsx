"use client";

import { useThree } from "@react-three/fiber";
import { Button } from "@/components/ui/Button";
import { RotateCcw, ArrowUp, ArrowRight, Maximize } from "lucide-react";

interface ViewerControlsProps {
  className?: string;
}

export function ViewerToolbar({ className = "" }: ViewerControlsProps) {
  return (
    <div className={`absolute top-4 right-4 flex gap-2 z-10 ${className}`}>
      <Button variant="secondary" size="sm" title="Reset View">
        <RotateCcw className="w-4 h-4" />
      </Button>
      <Button variant="secondary" size="sm" title="Top View">
        <ArrowUp className="w-4 h-4" />
      </Button>
      <Button variant="secondary" size="sm" title="Front View">
        <ArrowRight className="w-4 h-4" />
      </Button>
      <Button variant="secondary" size="sm" title="Fit All">
        <Maximize className="w-4 h-4" />
      </Button>
    </div>
  );
}
