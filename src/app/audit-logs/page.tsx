'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import Badge from '@/components/ui/Badge';
import ExportButtons from '@/components/ui/ExportButtons';
import {
  History,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
} from 'lucide-react';

export default function AuditLogsPage() {
  const { auditLogs, approvalRequests, reviewApprovalRequest, currentUser } = useFarm();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'audit' | 'approvals'>('audit');

  const isAdmin = currentUser.role === 'owner_admin';

  const filteredLogs = auditLogs.filter(
    (a) =>
      a.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.actor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.entity_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl border border-rose-200 text-center">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">
          Audit logs and approval queues are restricted to the Owner / Administrator role.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            <span>Audit Trail & Approval Workflows</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable transaction history, mutation tracking, old vs new payloads, and supervisor approvals
          </p>
        </div>
        <ExportButtons data={auditLogs} filename="audit-trail-logs" />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            System Mutation Trail ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'approvals'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Pending Approval Requests ({approvalRequests.filter((a) => a.status === 'pending').length})
          </button>
        </nav>
      </div>

      {/* TAB 1: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search action, actor, entity ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-9 py-2 text-xs"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">Tamper-evident logs</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Entity Type & Reference</th>
                  <th className="py-3 px-4">Audit Payload State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.actor_name}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 uppercase">
                        {log.actor_role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-800 font-mono">{log.action}</td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-semibold">{log.entity_type}</span>: {log.entity_id}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate font-mono text-[11px]">
                      {log.new_values || 'Recorded state transition'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {approvalRequests.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
              No retrospective correction requests currently pending review.
            </div>
          ) : (
            <div className="space-y-3">
              {approvalRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 uppercase">
                        {req.action_type.replace('_', ' ')}
                      </span>
                      <Badge variant={req.status === 'pending' ? 'warning' : req.status === 'approved' ? 'success' : 'danger'}>
                        {req.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      <strong>Requested By:</strong> {req.requested_by_name} • {new Date(req.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-700 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong>Reason:</strong> {req.reason}
                    </p>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => reviewApprovalRequest(req.id, 'approved', 'Authorized by owner')}
                        className="btn-primary text-xs gap-1 py-1.5 px-3 bg-emerald-600"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => reviewApprovalRequest(req.id, 'rejected', 'Declined by owner')}
                        className="btn-danger text-xs gap-1 py-1.5 px-3"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
