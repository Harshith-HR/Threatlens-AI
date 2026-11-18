"use client";

import React from "react";
import { motion } from "motion/react";
import { Users, Lock, Key } from "lucide-react";
import { rbacRoles } from "@/lib/governance-data";

export default function RbacPanel() {
  const totalUsers = rbacRoles.reduce((sum, r) => sum + r.assignedUsers, 0);

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-threat-green/10 border border-threat-green/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-threat-green" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">RBAC Roles</h3>
            <p className="text-[10px] text-text-muted">{totalUsers} users across {rbacRoles.length} roles</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-2.5">
        {rbacRoles.map((role, i) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.06] transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono"
                  style={{ backgroundColor: `${role.color}15`, color: role.color, border: `1px solid ${role.color}30` }}
                >
                  L{role.level}
                </div>
                <span className="text-xs font-semibold text-text-primary">{role.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-text-muted" />
                <span className="text-[10px] font-mono text-text-secondary">{role.assignedUsers}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {role.permissions.map((perm) => (
                <span
                  key={perm}
                  className="inline-flex items-center gap-0.5 text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-text-muted"
                >
                  {perm.includes("execute") || perm.includes("access") ? (
                    <Key className="w-2 h-2" />
                  ) : (
                    <Lock className="w-2 h-2" />
                  )}
                  {perm.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
