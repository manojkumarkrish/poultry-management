'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { PaymentTransaction } from '@/types/database';
import Badge from '@/components/ui/Badge';
import ExportButtons from '@/components/ui/ExportButtons';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  DollarSign,
} from 'lucide-react';

export default function PaymentsAndBalancesPage() {
  const { payments, customers, suppliers } = useFarm();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const totalReceipts = payments
    .filter((p) => p.type === 'customer_receipt')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDisbursements = payments
    .filter((p) => p.type === 'supplier_payment')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCustomerReceivables = customers.reduce((sum, c) => sum + c.current_balance, 0);
  const totalSupplierPayables = suppliers.reduce((sum, s) => sum + s.current_balance, 0);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.receipt_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.party_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.reference_no && p.reference_no.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || p.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <span>Payments & Outstanding Balances</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cash, UPI & Bank transaction movements, partial settlements, receivables, and payables ledger
          </p>
        </div>
        <ExportButtons data={payments} filename="payments-ledger" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Customer Inflow</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            ₹{totalReceipts.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Collections deposited</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Supplier Outflows</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            ₹{totalDisbursements.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Disbursed to vendors</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Receivables Due</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            ₹{totalCustomerReceivables.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">From egg/bird buyers</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Payables Outstanding</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            ₹{totalSupplierPayables.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Due to grain & chick vendors</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search receipt #, party, UTR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9 py-2 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input-field py-2 text-xs w-full sm:w-56"
          >
            <option value="all">All Payment Types</option>
            <option value="customer_receipt">Customer Receipts (Inflow)</option>
            <option value="supplier_payment">Supplier Disbursements (Outflow)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <th className="py-3 px-4">Receipt # & Date</th>
              <th className="py-3 px-4">Transaction Type</th>
              <th className="py-3 px-4">Party Name</th>
              <th className="py-3 px-4">Payment Mode</th>
              <th className="py-3 px-4">UTR / Ref #</th>
              <th className="py-3 px-4 text-right">Amount (₹)</th>
              <th className="py-3 px-4">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                  No payment transactions recorded in this period.
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => {
                const isReceipt = p.type === 'customer_receipt';

                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.receipt_no}</div>
                      <div className="text-[11px] text-slate-400">{p.payment_date}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                          isReceipt
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isReceipt ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        <span>{isReceipt ? 'Receipt (Inflow)' : 'Disbursement (Outflow)'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.party_name}</td>
                    <td className="py-3 px-4 uppercase font-mono text-slate-600">{p.payment_mode}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.reference_no || '—'}</td>
                    <td
                      className={`py-3 px-4 text-right font-black text-sm ${
                        isReceipt ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {isReceipt ? '+' : '-'}₹{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{p.notes}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
