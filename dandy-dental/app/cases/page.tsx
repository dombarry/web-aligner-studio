"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CaseCard } from "@/components/cases/CaseCard";
import { Plus, Search, FolderOpen, Loader2 } from "lucide-react";

interface CaseRow {
  id: string;
  patientName: string;
  notes: string;
  status: string;
  scanCount: number;
  createdAt: string;
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/cases")
      .then((r) => r.json())
      .then((data) => setCases(data.cases || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = cases.filter((c) =>
    c.patientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Cases</h1>
          <p className="text-muted-foreground text-sm mt-1">{cases.length} patient cases</p>
        </div>
        <Link href="/cases/new">
          <Button>
            <Plus className="w-4 h-4" />
            New Case
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">
            {search ? "No matching cases" : "No cases yet"}
          </p>
          {!search && (
            <Link href="/cases/new" className="mt-4">
              <Button variant="secondary">Create First Case</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CaseCard
              key={c.id}
              id={c.id}
              patientName={c.patientName}
              status={c.status}
              scanCount={c.scanCount}
              createdAt={c.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
