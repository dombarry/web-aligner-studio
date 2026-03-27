"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { PrinterCard } from "@/components/printers/PrinterCard";
import { RefreshCw, Search, Radio, Loader2 } from "lucide-react";
import type { DeviceStatus } from "@/lib/types";

export default function PrintersPage() {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [ipAddress, setIpAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/preform/devices");
      if (!res.ok) throw new Error("Failed to fetch devices");
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection error");
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 15000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const discoverDevices = async () => {
    setDiscovering(true);
    try {
      const body: Record<string, unknown> = { timeout_seconds: 10 };
      if (ipAddress.trim()) body.ip_address = ipAddress.trim();
      await fetch("/api/preform/devices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      await fetchDevices();
    } catch {
      setError("Discovery failed");
    } finally {
      setDiscovering(false);
    }
  };

  const onlinePrinters = devices.filter((d) => d.is_connected);
  const offlinePrinters = devices.filter((d) => !d.is_connected);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Printers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {devices.length} device{devices.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={fetchDevices} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Discover Printers</label>
            <Input
              placeholder="IP address (optional, leave empty for broadcast)"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
            />
          </div>
          <Button onClick={discoverDevices} disabled={discovering}>
            {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
            {discovering ? "Scanning..." : "Discover"}
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Make sure PreForm Server is running on localhost:44388
          </p>
        </Card>
      )}

      {loading && devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p>Connecting to PreForm Server...</p>
        </div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Search className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No printers found</p>
          <p className="text-sm mt-2">Try discovering devices or check your network connection</p>
        </div>
      ) : (
        <div className="space-y-8">
          {onlinePrinters.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                Online ({onlinePrinters.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {onlinePrinters.map((device) => (
                  <PrinterCard key={device.id} device={device} />
                ))}
              </div>
            </div>
          )}
          {offlinePrinters.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                Offline ({offlinePrinters.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offlinePrinters.map((device) => (
                  <PrinterCard key={device.id} device={device} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
