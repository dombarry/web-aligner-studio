import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FolderOpen, ArrowRight } from "lucide-react";

interface CaseCardProps {
  id: string;
  patientName: string;
  status: string;
  scanCount: number;
  createdAt: string;
}

export function CaseCard({ id, patientName, status, scanCount, createdAt }: CaseCardProps) {
  const statusVariant = status === "completed" ? "success" : status === "in_progress" ? "default" : "outline";

  return (
    <Link href={`/cases/${id}`}>
      <Card className="hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-200 cursor-pointer group">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/[0.08] flex items-center justify-center group-hover:bg-primary/[0.12] transition-colors">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{patientName}</h3>
              <p className="text-[11px] text-muted-foreground/60 font-mono">{id.slice(0, 8)}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Badge variant={statusVariant}>{status}</Badge>
          <span className="text-xs text-muted-foreground">{scanCount} scan{scanCount !== 1 ? "s" : ""}</span>
          <span className="text-xs text-muted-foreground/60 ml-auto">
            {new Date(createdAt).toLocaleDateString()}
          </span>
        </div>
      </Card>
    </Link>
  );
}
