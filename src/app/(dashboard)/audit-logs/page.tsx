"use client";

import { useState, useEffect } from "react";
import { auditService } from "@/services/settings.service";
import { AuditLog } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
import { ClipboardList, Shield, Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await auditService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const columns: Column<AuditLog>[] = [
    {
      header: "Timestamp",
      cell: (log) => (
        <span className="font-mono text-slate-500 text-[11px]">
          {new Date(log.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Action",
      cell: (log) => (
        <span className="font-bold text-purple-900 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-lg text-xs">
          {log.action}
        </span>
      ),
    },
    {
      header: "Entity Type",
      cell: (log) => (
        <span className="font-semibold text-slate-700">{log.entity_type}</span>
      ),
    },
    {
      header: "Actor",
      cell: (log) => (
        <span className="font-bold text-slate-900">
          {log.actor?.full_name || "System Automated"}
        </span>
      ),
    },
    {
      header: "Payload / State Details",
      cell: (log) => (
        <div className="font-mono text-[11px] text-slate-500 truncate max-w-sm">
          {log.after_data ? JSON.stringify(log.after_data) : "—"}
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute permission="view_audit_logs">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-purple-700" />
            <span>System Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log record of all financial, administrative, and inventory transactions.
          </p>
        </div>

        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          searchPlaceholder="Search audit logs by action, entity or actor..."
          searchFilter={(l, q) =>
            l.action.toLowerCase().includes(q) ||
            l.entity_type.toLowerCase().includes(q) ||
            Boolean(l.actor?.full_name && l.actor.full_name.toLowerCase().includes(q))
          }
        />
      </div>
    </ProtectedRoute>
  );
}
