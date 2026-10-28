'use client';

import React, { useState, useEffect } from 'react';
import {
  DateRangePreset,
  GroupingInterval,
  DateRangeState,
  getDateRangeFromPreset,
  getPreviousEquivalentPeriod,
  getDefaultGrouping,
  parseISODate,
} from '@/lib/utils/dateRange';
import { useFarm } from '@/lib/data/FarmContext';
import { Calendar, ChevronDown, RefreshCw, BarChart2, Layers, Check, ArrowRight } from 'lucide-react';

interface DateRangeSelectorProps {
  value: DateRangeState;
  onChange: (newValue: DateRangeState) => void;
  showGrouping?: boolean;
  showComparison?: boolean;
  className?: string;
}

const PRESET_OPTIONS: { id: DateRangePreset; label: string; group: string }[] = [
  { id: 'today', label: 'Today', group: 'Days' },
  { id: 'yesterday', label: 'Yesterday', group: 'Days' },
  { id: 'last_7_days', label: 'Last 7 Days', group: 'Days' },
  { id: 'this_week', label: 'This Week', group: 'Weeks' },
  { id: 'previous_week', label: 'Previous Week', group: 'Weeks' },
  { id: 'last_30_days', label: 'Last 30 Days', group: 'Months' },
  { id: 'this_month', label: 'This Month', group: 'Months' },
  { id: 'previous_month', label: 'Previous Month', group: 'Months' },
  { id: 'last_3_months', label: 'Last 3 Months', group: 'Quarters' },
  { id: 'last_6_months', label: 'Last 6 Months', group: 'Quarters' },
  { id: 'this_year', label: 'This Year (Cal)', group: 'Years' },
  { id: 'previous_year', label: 'Previous Year', group: 'Years' },
  { id: 'financial_year', label: 'Financial Year (FY)', group: 'Years' },
  { id: 'custom', label: 'Custom Date Range', group: 'Custom' },
];

export default function DateRangeSelector({
  value,
  onChange,
  showGrouping = true,
  showComparison = true,
  className = '',
}: DateRangeSelectorProps) {
  const { farmProfile } = useFarm();
  const fyStartMonth = farmProfile?.fy_start_month || 4;

  const [localState, setLocalState] = useState<DateRangeState>(value);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setLocalState(value);
  }, [value]);

  // Handle Preset Change
  const handlePresetChange = (newPreset: DateRangePreset) => {
    if (newPreset === 'custom') {
      setLocalState((prev) => ({
        ...prev,
        preset: 'custom',
      }));
      return;
    }

    const { startDate, endDate } = getDateRangeFromPreset(newPreset, fyStartMonth);
    const defaultGrouping = getDefaultGrouping(startDate, endDate);
    const { prevStartDate, prevEndDate } = getPreviousEquivalentPeriod(startDate, endDate, newPreset);

    const updated: DateRangeState = {
      preset: newPreset,
      startDate,
      endDate,
      grouping: defaultGrouping,
      compareWithPrevious: localState.compareWithPrevious,
      prevStartDate,
      prevEndDate,
    };

    setLocalState(updated);
    onChange(updated);
  };

  // Handle Manual Date Change
  const handleStartDateChange = (newStart: string) => {
    let newEnd = localState.endDate;
    if (newStart > newEnd) {
      newEnd = newStart;
    }
    const defaultGrouping = getDefaultGrouping(newStart, newEnd);
    const { prevStartDate, prevEndDate } = getPreviousEquivalentPeriod(newStart, newEnd);

    const updated: DateRangeState = {
      ...localState,
      preset: 'custom',
      startDate: newStart,
      endDate: newEnd,
      grouping: defaultGrouping,
      prevStartDate,
      prevEndDate,
    };
    setLocalState(updated);
    onChange(updated);
  };

  const handleEndDateChange = (newEnd: string) => {
    let newStart = localState.startDate;
    if (newEnd < newStart) {
      newStart = newEnd;
    }
    const defaultGrouping = getDefaultGrouping(newStart, newEnd);
    const { prevStartDate, prevEndDate } = getPreviousEquivalentPeriod(newStart, newEnd);

    const updated: DateRangeState = {
      ...localState,
      preset: 'custom',
      startDate: newStart,
      endDate: newEnd,
      grouping: defaultGrouping,
      prevStartDate,
      prevEndDate,
    };
    setLocalState(updated);
    onChange(updated);
  };

  // Handle Grouping Change
  const handleGroupingChange = (newGrouping: GroupingInterval) => {
    const updated: DateRangeState = {
      ...localState,
      grouping: newGrouping,
    };
    setLocalState(updated);
    onChange(updated);
  };

  // Handle Compare Toggle
  const handleCompareToggle = (checked: boolean) => {
    const { prevStartDate, prevEndDate } = getPreviousEquivalentPeriod(
      localState.startDate,
      localState.endDate,
      localState.preset
    );
    const updated: DateRangeState = {
      ...localState,
      compareWithPrevious: checked,
      prevStartDate,
      prevEndDate,
    };
    setLocalState(updated);
    onChange(updated);
  };

  // Reset to default (This Month)
  const handleReset = () => {
    const { startDate, endDate } = getDateRangeFromPreset('this_month', fyStartMonth);
    const { prevStartDate, prevEndDate } = getPreviousEquivalentPeriod(startDate, endDate, 'this_month');
    const updated: DateRangeState = {
      preset: 'this_month',
      startDate,
      endDate,
      grouping: 'daily',
      compareWithPrevious: false,
      prevStartDate,
      prevEndDate,
    };
    setLocalState(updated);
    onChange(updated);
  };

  // Calculate day count
  const startD = parseISODate(localState.startDate);
  const endD = parseISODate(localState.endDate);
  const dayCount = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / 86400000) + 1);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 space-y-3 ${className}`}>
      {/* Top Header Row with quick summary and pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Selection Indicator */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex-shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                {localState.startDate} to {localState.endDate}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {dayCount} {dayCount === 1 ? 'day' : 'days'}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                {localState.grouping} Grouping
              </span>
              {localState.compareWithPrevious && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Compared vs {localState.prevStartDate} to {localState.prevEndDate}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configured FY Start: Month {fyStartMonth} (April) • Timezone: {farmProfile?.timezone || 'Asia/Kolkata'}
            </p>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            title="Reset to default current month"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-secondary py-1 px-2.5 text-xs gap-1 border-slate-300"
          >
            <span>{isExpanded ? 'Hide Options' : 'More Ranges & Filters'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Select Buttons Pill Bar */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
        {[
          { id: 'today' as const, label: 'Today' },
          { id: 'yesterday' as const, label: 'Yesterday' },
          { id: 'last_7_days' as const, label: 'Last 7 Days' },
          { id: 'this_week' as const, label: 'This Week' },
          { id: 'last_30_days' as const, label: 'Last 30 Days' },
          { id: 'this_month' as const, label: 'This Month' },
          { id: 'previous_month' as const, label: 'Previous Month' },
          { id: 'last_3_months' as const, label: 'Last 3M' },
          { id: 'financial_year' as const, label: 'FY 2026-27' },
        ].map((p) => {
          const isSelected = localState.preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetChange(p.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Expanded Controls: Preset Dropdown, Custom Pickers, Grouping, Compare Toggle */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/70 p-3.5 rounded-xl">
          {/* Preset Dropdown */}
          <div>
            <label className="input-label text-[11px]">Date Preset Selection</label>
            <select
              value={localState.preset}
              onChange={(e) => handlePresetChange(e.target.value as DateRangePreset)}
              className="input-field text-xs py-1.5 font-semibold bg-white"
            >
              {PRESET_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Pickers */}
          <div className="md:col-span-2 grid grid-cols-2 gap-2">
            <div>
              <label className="input-label text-[11px]">Start Date (From)</label>
              <input
                type="date"
                value={localState.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="input-field text-xs py-1.5 bg-white font-mono"
              />
            </div>
            <div>
              <label className="input-label text-[11px]">End Date (To)</label>
              <input
                type="date"
                value={localState.endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="input-field text-xs py-1.5 bg-white font-mono"
              />
            </div>
          </div>

          {/* Grouping Selector */}
          {showGrouping && (
            <div>
              <label className="input-label text-[11px]">Interval Grouping</label>
              <select
                value={localState.grouping}
                onChange={(e) => handleGroupingChange(e.target.value as GroupingInterval)}
                className="input-field text-xs py-1.5 font-semibold bg-white"
              >
                <option value="daily">Daily (Per Day)</option>
                <option value="weekly">Weekly (Per Week)</option>
                <option value="monthly">Monthly (Per Month)</option>
                <option value="quarterly">Quarterly (Per 3M)</option>
                <option value="yearly">Yearly (Per Year)</option>
              </select>
            </div>
          )}

          {/* Compare Toggle */}
          {showComparison && (
            <div className="md:col-span-4 pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={localState.compareWithPrevious}
                  onChange={(e) => handleCompareToggle(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span className="text-xs font-bold text-slate-800">
                  Compare with Previous Equivalent Period
                </span>
                <span className="text-[11px] text-slate-500">
                  ({localState.prevStartDate} to {localState.prevEndDate})
                </span>
              </label>

              <span className="text-[11px] text-slate-400">
                Calculates absolute variance ($Δ$) and growth rate (%) with zero-division handling
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
