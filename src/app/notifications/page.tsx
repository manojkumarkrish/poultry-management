'use client';

import React from 'react';
import Link from 'next/link';
import { useFarm } from '@/lib/data/FarmContext';
import Badge from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils/formatters';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Wheat,
  Syringe,
  Home,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, markNotificationRead, currentUser } = useFarm();

  const getIcon = (type: string) => {
    switch (type) {
      case 'stock_low':
        return <Wheat className="w-5 h-5 text-amber-500" />;
      case 'vaccination_due':
        return <Syringe className="w-5 h-5 text-blue-500" />;
      case 'mortality_alert':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'capacity_warning':
        return <Home className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-600" />
            <span>Farm Alerts & In-App Notifications</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time threshold triggers: ingredient reorders, vaccination schedules, and flock biosecurity warnings
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Role: {currentUser.role === 'owner_admin' ? 'Owner / Admin' : 'Manager'}
        </span>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            No active alerts at this moment. All flock parameters within safe operating thresholds.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                n.is_read ? 'bg-white opacity-70' : 'bg-emerald-50/20'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                    {!n.is_read && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {formatDateTime(n.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {n.link && (
                  <Link
                    href={n.link}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
                {!n.is_read && (
                  <button
                    onClick={() => markNotificationRead(n.id)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
