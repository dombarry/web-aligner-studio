"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardTitle } from "@/components/ui/Card";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Printer,
  Stethoscope,
  Plus,
  Trash2,
  Upload,
  Layers,
} from "lucide-react";
import Link from "next/link";

type WorkflowType = "print" | "design" | null;

interface BatchEntry {
  id: string;
  patientName: string;
  notes: string;
}

let entryIdCounter = 0;
function newEntry(): BatchEntry {
  return { id: `entry-${++entryIdCounter}`, patientName: "", notes: "" };
}

export default function NewCasePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [workflow, setWorkflow] = useState<WorkflowType>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Single case fields
  const [patientName, setPatientName] = useState("");
  const [notes, setNotes] = useState("");

  // Batch mode (for print workflow)
  const [batchEntries, setBatchEntries] = useState<BatchEntry[]>([newEntry()]);

  const addBatchEntry = () => {
    setBatchEntries((prev) => [...prev, newEntry()]);
  };

  const removeBatchEntry = (id: string) => {
    setBatchEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateBatchEntry = (id: string, field: "patientName" | "notes", value: string) => {
    setBatchEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleWorkflowSelect = (type: WorkflowType) => {
    setWorkflow(type);
    setStep(1);
  };

  const handleCreateSingle = async () => {
    if (!patientName.trim()) {
      setError("Patient name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientName: patientName.trim(), notes }),
      });
      if (!res.ok) throw new Error("Failed to create case");
      const newCase = await res.json();
      if (workflow === "design") {
        router.push(`/cases/${newCase.id}`);
      } else {
        router.push(`/cases/${newCase.id}/prepare`);
      }
    } catch {
      setError("Failed to create case. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBatch = async () => {
    const validEntries = batchEntries.filter((e) => e.patientName.trim());
    if (validEntries.length === 0) {
      setError("At least one patient name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const createdIds: string[] = [];
      for (const entry of validEntries) {
        const res = await fetch("/api/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientName: entry.patientName.trim(),
            notes: entry.notes,
          }),
        });
        if (!res.ok) throw new Error(`Failed to create case for ${entry.patientName}`);
        const newCase = await res.json();
        createdIds.push(newCase.id);
      }
      // If batch, go to cases list so they can upload scans to each and then batch print
      if (createdIds.length === 1) {
        router.push(`/cases/${createdIds[0]}/prepare`);
      } else {
        router.push(`/cases?batch=${createdIds.join(",")}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create cases.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/cases" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Cases
      </Link>

      {/* Step 0: Choose Workflow */}
      {step === 0 && (
        <div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold">New Case</h1>
            <p className="text-muted-foreground text-sm mt-1">
              What would you like to do?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleWorkflowSelect("print")}
              className="text-left p-6 rounded-xl border-2 border-border hover:border-primary/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Printer className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Print Models</h3>
              <p className="text-sm text-muted-foreground">
                Upload STL files and send them to a printer. Best for thermoforming molds, study models, or direct-printed aligners.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Badge text="Supports batch printing" />
              </div>
            </button>

            <button
              onClick={() => handleWorkflowSelect("design")}
              className="text-left p-6 rounded-xl border-2 border-border hover:border-accent/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Stethoscope className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-1">Design a Case</h3>
              <p className="text-sm text-muted-foreground">
                Upload scans, segment teeth, plan treatment, and then print. Full case design workflow.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Badge text="Includes segmentation" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Patient Details */}
      {step === 1 && workflow === "design" && (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Design a Case</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Enter patient details. You&apos;ll upload scans and segment teeth in the next step.
            </p>
          </div>

          <Card>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateSingle();
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium mb-2 block">Patient Name *</label>
                <Input
                  placeholder="Enter patient name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Notes</label>
                <textarea
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  rows={3}
                  placeholder="Treatment notes, prescriptions, etc..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setStep(0)}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create & Upload Scans
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Step 1: Print Models - Single or Batch */}
      {step === 1 && workflow === "print" && (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Print Models</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Add one or more patients. You can batch multiple cases into a single print build.
            </p>
          </div>

          <div className="space-y-3">
            {batchEntries.map((entry, idx) => (
              <Card key={entry.id}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Patient name *"
                      value={entry.patientName}
                      onChange={(e) => updateBatchEntry(entry.id, "patientName", e.target.value)}
                      autoFocus={idx === batchEntries.length - 1}
                    />
                    <textarea
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      rows={2}
                      placeholder="Notes (optional)"
                      value={entry.notes}
                      onChange={(e) => updateBatchEntry(entry.id, "notes", e.target.value)}
                    />
                  </div>
                  {batchEntries.length > 1 && (
                    <button
                      onClick={() => removeBatchEntry(entry.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <button
            onClick={addBatchEntry}
            className="mt-3 w-full p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/30 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Another Patient
          </button>

          {batchEntries.length > 1 && (
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 text-xs">
                <Layers className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">Batch Mode</span>
                <span className="text-muted-foreground">
                  {batchEntries.filter((e) => e.patientName.trim()).length} patient{batchEntries.filter((e) => e.patientName.trim()).length !== 1 ? "s" : ""} will be created. Upload scans to each, then combine into one print build.
                </span>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive mt-3">{error}</p>}

          <div className="flex gap-3 mt-6">
            <Button variant="secondary" onClick={() => setStep(0)}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={handleCreateBatch} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {batchEntries.length > 1 ? (
                <>Create {batchEntries.filter((e) => e.patientName.trim()).length} Cases</>
              ) : (
                <>Create & Prepare Print</>
              )}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Small inline badge component for the workflow cards
function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground font-medium">
      {text}
    </span>
  );
}
