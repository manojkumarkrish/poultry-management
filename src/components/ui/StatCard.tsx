'use client';

import React from 'react';
import { formatNumber } from '@/lib/utils/formatters';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon?: any;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  highlightColor?: 'emerald' | 'amber' | 'blue' | 'purple' | 'rose' | 'slate';
  isFinancial?: boolean;
  canViewFinancial?: boolean;
}

export default function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  highlightColor = 'emerald',
  isFinancial = false,
  canViewFinancial = true,
}: StatCardProps) {
  // If financial metric and user lacks permission, omit or show restricted
  if (isFinancial && !canViewFinancial) {
    return null;
  }

  const colorStyles = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {typeof value === 'number' ? formatNumber(value) : value}
            </span>
            {subValue && <span className="text-xs text-slate-500 font-medium">{subValue}</span>}
          </div>
          {trend && (
            <div className="mt-2 flex items-center text-xs">
              <span
                className={`font-semibold mr-1.5 ${
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-slate-400">{trend.label || 'vs target'}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${colorStyles[highlightColor]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
