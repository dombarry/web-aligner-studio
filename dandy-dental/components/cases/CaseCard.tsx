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
      <Card className="hover:border-primary/30 transition-colors cursor-pointer group">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{patientName}</h3>
              <p className="text-xs text-muted-foreground font-mono">{id.slice(0, 8)}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Badge variant={statusVariant}>{status}</Badge>
          <span className="text-xs text-muted-foreground">{scanCount} scan{scanCount !== 1 ? "s" : ""}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(createdAt).toLocaleDateString()}
          </span>
        </div>
      </Card>
    </Link>
  );
}
