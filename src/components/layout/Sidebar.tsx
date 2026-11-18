"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Swords,
  ShieldCheck,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/offensive", label: "Offensive Recon", icon: Swords },
  { href: "/defensive", label: "Defensive Telemetry", icon: ShieldCheck },
  { href: "/governance", label: "Governance Logs", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      className="workspace-sidebar relative flex flex-col h-full border-r border-border-default bg-bg-secondary/80 backdrop-blur-xl z-50"
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border-default flex-shrink-0">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-threat-green/10 border border-threat-green/20 flex-shrink-0">
          <Shield className="w-5 h-5 text-threat-green" />
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-threat-green animate-beacon" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-base font-bold text-text-primary tracking-tight">
                ThreatLens<span className="text-threat-green"> AI</span>
              </h1>
              <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">
                SECURITY OPERATIONS
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                  transition-all duration-200 ease-out
                  ${
                    isActive
                      ? "bg-threat-green/10 text-threat-green"
                      : "text-text-secondary hover:text-text-primary hover:bg-white/[0.03]"
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-threat-green shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                    isActive
                      ? "text-threat-green"
                      : "text-text-muted group-hover:text-text-secondary"
                  }`}
                />

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                      className={`text-sm font-medium whitespace-nowrap ${
                        isActive ? "text-threat-green" : ""
                      }`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-bg-tertiary text-text-primary text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-lg border border-border-default z-50">
                    {item.label}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* System Health */}
      <div className="px-3 pb-3 flex-shrink-0">
        <AnimatePresence>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 py-2.5 rounded-lg bg-threat-green/5 border border-threat-green/10"
            >
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3.5 h-3.5 text-threat-green" />
                <span className="text-xs font-semibold text-threat-green">
                  Evidence first
                </span>
              </div>
              <p className="text-[10px] text-text-muted font-mono">
                Inspect. Understand. Remediate.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-threat-green animate-beacon" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-bg-tertiary border border-border-default flex items-center justify-center text-text-muted hover:text-text-primary hover:border-text-muted transition-colors duration-200 z-50"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </motion.aside>
  );
}
