"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppSettings } from "@/store/app-settings";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const { showVirtualPrinters, setShowVirtualPrinters } = useAppSettings();
  const [machineType, setMachineType] = useState("FORM-4-0");
  const [materialCode, setMaterialCode] = useState("FLDLCO11");
  const [layerThickness, setLayerThickness] = useState("0.1");
  const [density, setDensity] = useState("1.10");
  const [touchpoint, setTouchpoint] = useState("1.00");
  const [slope, setSlope] = useState("1.35");
  const [labelMode, setLabelMode] = useState("ENGRAVE");
  const [labelFont, setLabelFont] = useState("3.0");
  const [labelDepth, setLabelDepth] = useState("0.5");

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground text-sm mb-8">Default configuration for new print jobs</p>

      <div className="space-y-6">
        <Card>
          <CardTitle>Connection</CardTitle>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">PreForm Server URL</label>
              <Input defaultValue="http://localhost:44388" />
              <p className="text-xs text-muted-foreground mt-1">The PreFormServer must be running locally</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Default Scene Settings</CardTitle>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Machine Type</label>
              <Select value={machineType} onChange={(e) => setMachineType(e.target.value)}>
                <option value="FORM-4-0">Form 4</option>
                <option value="FORM-4L-0">Form 4L</option>
                <option value="FORM-3-0">Form 3+</option>
                <option value="FORM-3L-0">Form 3L</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Material Code</label>
              <Input value={materialCode} onChange={(e) => setMaterialCode(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Layer Thickness (mm)</label>
              <Input value={layerThickness} onChange={(e) => setLayerThickness(e.target.value)} />
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Default Support Settings</CardTitle>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Density</label>
              <Input value={density} onChange={(e) => setDensity(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Touchpoint (mm)</label>
              <Input value={touchpoint} onChange={(e) => setTouchpoint(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Slope</label>
              <Input value={slope} onChange={(e) => setSlope(e.target.value)} />
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Default Label Settings</CardTitle>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Mode</label>
              <Select value={labelMode} onChange={(e) => setLabelMode(e.target.value)}>
                <option value="ENGRAVE">Engrave</option>
                <option value="EMBOSS">Emboss</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Font Size (mm)</label>
              <Input value={labelFont} onChange={(e) => setLabelFont(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Depth (mm)</label>
              <Input value={labelDepth} onChange={(e) => setLabelDepth(e.target.value)} />
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Development</CardTitle>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showVirtualPrinters}
                onChange={(e) => setShowVirtualPrinters(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              <div>
                <p className="text-sm font-medium">Show virtual printers</p>
                <p className="text-xs text-muted-foreground">Display virtual/simulated printers in the printer selection dropdown</p>
              </div>
            </label>
          </div>
        </Card>

        <div className="flex justify-end">
          <Badge variant="outline">Settings are stored in-memory for this session</Badge>
        </div>
      </div>
    </div>
  );
}
