"use client";

import { Button } from "@/components/ui/Button";
import { RotateCcw, ArrowUp, ArrowRight, Maximize } from "lucide-react";

interface ViewerControlsProps {
  className?: string;
}

export function ViewerToolbar({ className = "" }: ViewerControlsProps) {
  return (
    <div className={`flex gap-1.5 p-1.5 rounded-xl bg-black/60 backdrop-blur-xl border border-white/[0.06] z-10 ${className}`}>
      <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all" title="Reset View">
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
      <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all" title="Top View">
        <ArrowUp className="w-3.5 h-3.5" />
      </button>
      <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all" title="Front View">
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
      <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all" title="Fit All">
        <Maximize className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
