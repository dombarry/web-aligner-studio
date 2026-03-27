"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  FolderOpen,
  Printer,
  ClipboardList,
  Settings,
  Activity,
  ChevronDown,
} from "lucide-react";
import { usePrinterMode, PRINTER_FAMILIES, type PrinterFamily } from "@/store/printer-mode";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cases", label: "Cases", icon: FolderOpen },
  { href: "/printers", label: "Printers", icon: Printer },
  { href: "/jobs", label: "Jobs", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { printerFamily, setPrinterFamily, getBuildPlate } = usePrinterMode();
  const buildPlate = getBuildPlate();

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Web Aligner Studio</h1>
            <p className="text-xs text-muted-foreground">Aligner Manufacturing</p>
          </div>
        </Link>
      </div>

      {/* Printer Family Selector */}
      <div className="px-4 pt-4 pb-2">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
          Printer Mode
        </label>
        <div className="relative">
          <select
            value={printerFamily}
            onChange={(e) => setPrinterFamily(e.target.value as PrinterFamily)}
            className="w-full appearance-none rounded-lg border border-border bg-secondary px-3 py-2 pr-8 text-sm font-medium text-foreground cursor-pointer hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          >
            {(Object.entries(PRINTER_FAMILIES) as [PrinterFamily, typeof PRINTER_FAMILIES[PrinterFamily]][]).map(
              ([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              )
            )}
          </select>
          <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Build plate: {buildPlate.x} x {buildPlate.y} mm
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <PreformStatus />
      </div>
    </aside>
  );
}

function PreformStatus() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch("/api/preform/devices");
        const data = await res.json();
        if (mounted) setConnected(res.ok && !data.error);
      } catch {
        if (mounted) setConnected(false);
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
      <div
        className={clsx(
          "w-2 h-2 rounded-full",
          connected === null
            ? "bg-muted-foreground animate-pulse"
            : connected
            ? "bg-success"
            : "bg-destructive"
        )}
      />
      <span className="text-xs text-muted-foreground">
        PreForm {connected === null ? "Checking..." : connected ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
}
