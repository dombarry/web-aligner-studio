"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Printer, Wifi, WifiOff, Droplets } from "lucide-react";
import type { DeviceStatus } from "@/lib/types";

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "online" || s === "idle") return <Badge variant="success">Idle</Badge>;
  if (s === "printing") return <Badge variant="default">Printing</Badge>;
  if (s === "offline") return <Badge variant="destructive">Offline</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function getResinLevel(device: DeviceStatus): number | null {
  if (!device.cartridge_data) return null;
  const cartridges = Object.values(device.cartridge_data);
  if (cartridges.length === 0) return null;
  const c = cartridges[0];
  if (!c.cartridgeOriginalVolume_mL) return null;
  const remaining = c.cartridgeOriginalVolume_mL - c.cartridgeEstimatedVolumeDispensed_mL;
  return Math.max(0, Math.round((remaining / c.cartridgeOriginalVolume_mL) * 100));
}

export function PrinterCard({ device }: { device: DeviceStatus }) {
  const resinLevel = getResinLevel(device);
  const cartridges = device.cartridge_data ? Object.values(device.cartridge_data) : [];
  const resinCode = cartridges.length > 0 ? cartridges[0].cartridgeMaterialCode : null;

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Printer className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{device.product_name}</h3>
            <p className="text-xs text-muted-foreground">{device.id}</p>
          </div>
        </div>
        {getStatusBadge(device.status)}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {device.is_connected ? (
            <Wifi className="w-3.5 h-3.5 text-success" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-destructive" />
          )}
          <span>{device.ip_address || "No IP"}</span>
          <span className="text-border">|</span>
          <span>{device.connection_type}</span>
        </div>

        {device.tank_material_code && (
          <div className="flex items-center gap-2 text-xs">
            <Droplets className="w-3.5 h-3.5 text-accent" />
            <span className="text-muted-foreground">Tank:</span>
            <span className="font-mono">{device.tank_material_code}</span>
          </div>
        )}

        {resinLevel !== null && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Resin {resinCode && `(${resinCode})`}</span>
              <span className="font-mono">{resinLevel}%</span>
            </div>
            <Progress
              value={resinLevel}
              color={resinLevel > 30 ? "success" : resinLevel > 10 ? "warning" : "destructive"}
            />
          </div>
        )}

        {device.firmware_version && (
          <p className="text-xs text-muted-foreground">
            FW: {device.firmware_version}
          </p>
        )}

        {device.estimated_print_time_remaining_ms != null && device.estimated_print_time_remaining_ms > 0 && (
          <div className="text-xs text-muted-foreground">
            Time remaining: {Math.round(device.estimated_print_time_remaining_ms / 60000)}min
          </div>
        )}
      </div>
    </Card>
  );
}
