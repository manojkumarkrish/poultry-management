'use client';

import React from 'react';
import { Download, Printer } from 'lucide-react';

interface ExportButtonsProps {
  data: any[];
  filename?: string;
  onPrint?: () => void;
  title?: string;
}

export default function ExportButtons({
  data,
  filename = 'kpf-export',
  onPrint,
  title = 'Export',
}: ExportButtonsProps) {
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert('No records available to export.');
      return;
    }

    // Extract headers with Kasthuri Poultry Farm official record prefix
    const headers = Object.keys(data[0]);
    const csvRows = [
      `# Kasthuri Poultry Farm (KPF) - Official System Record - Generated: ${new Date().toISOString()}`,
      headers.join(','),
    ];

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header];
        if (val === null || val === undefined) return '""';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={exportToCSV}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
      >
        <Download className="w-3.5 h-3.5 text-slate-500" />
        <span>Export CSV</span>
      </button>
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
      >
        <Printer className="w-3.5 h-3.5 text-slate-500" />
        <span>Print</span>
      </button>
    </div>
  );
}
