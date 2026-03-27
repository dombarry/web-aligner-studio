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
    <aside className="w-64 border-r border-white/[0.06] bg-white/[0.01] backdrop-blur-xl flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_20px_rgba(0,112,243,0.2)] group-hover:shadow-[0_0_30px_rgba(0,112,243,0.3)] transition-shadow duration-300">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Web Aligner</h1>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Studio</p>
          </div>
        </Link>
      </div>

      {/* Printer Mode Selector */}
      <div className="px-4 pt-4 pb-2">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
          Printer Mode
        </label>
        <div className="relative">
          <select
            value={printerFamily}
            onChange={(e) => setPrinterFamily(e.target.value as PrinterFamily)}
            className="w-full appearance-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 pr-8 text-sm font-medium text-foreground cursor-pointer hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
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
        <p className="text-[10px] text-muted-foreground/60 mt-1.5">
          {buildPlate.x} x {buildPlate.y} mm build plate
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
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
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(0,112,243,0.15)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              )}
            >
              <item.icon className={clsx("w-[18px] h-[18px]", isActive && "drop-shadow-[0_0_4px_rgba(0,112,243,0.5)]")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* PreForm Status */}
      <div className="p-4 border-t border-white/[0.06]">
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
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <div
        className={clsx(
          "w-2 h-2 rounded-full",
          connected === null
            ? "bg-muted-foreground animate-pulse"
            : connected
            ? "bg-success pulse-ring"
            : "bg-destructive"
        )}
      />
      <span className="text-xs text-muted-foreground">
        PreForm {connected === null ? "Checking..." : connected ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
}
