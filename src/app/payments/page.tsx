'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { PaymentTransaction } from '@/types/database';
import { formatCurrency } from '@/lib/utils/formatters';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import PrintBillModal from '@/components/ui/PrintBillModal';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  DollarSign,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Printer,
} from 'lucide-react';

export default function PaymentsAndBalancesPage() {
  const {
    payments,
    updatePayment,
    deletePayment,
    customers,
    suppliers,
    canEdit,
    canDelete,
  } = useFarm();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modals
  const [editingPayment, setEditingPayment] = useState<PaymentTransaction | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<PaymentTransaction | null>(null);
  const [printingPayment, setPrintingPayment] = useState<PaymentTransaction | null>(null);

  // Form State
  const [payForm, setPayForm] = useState({
    amount: 0,
    payment_date: '',
    payment_mode: 'bank_transfer' as PaymentTransaction['payment_mode'],
    reference_no: '',
    notes: '',
  });

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

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

  const handleOpenEdit = (p: PaymentTransaction) => {
    setPayForm({
      amount: p.amount,
      payment_date: p.payment_date,
      payment_mode: p.payment_mode,
      reference_no: p.reference_no || '',
      notes: p.notes || '',
    });
    setEditingPayment(p);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    const res = updatePayment(editingPayment.id, {
      amount: Number(payForm.amount),
      payment_date: payForm.payment_date,
      payment_mode: payForm.payment_mode,
      reference_no: payForm.reference_no,
      notes: payForm.notes,
    });

    if (!res.success) {
      showNotification('error', res.error || 'Failed to update payment transaction.');
      return;
    }

    showNotification('success', `Payment voucher ${editingPayment.receipt_no} updated successfully.`);
    setEditingPayment(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingPayment) return;
    const res = deletePayment(deletingPayment.id);
    if (!res.success) {
      showNotification('error', res.error || 'Failed to cancel payment.');
    } else {
      showNotification('success', `Transaction ${deletingPayment.receipt_no} cancelled and party ledger balance reversed.`);
    }
    setDeletingPayment(null);
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

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
        <ExportButtons data={payments} filename="kpf-payments-ledger" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Customer Inflow</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(totalReceipts, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Collections deposited</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Supplier Outflows</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {formatCurrency(totalDisbursements, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Disbursed to vendors</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Receivables Due</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {formatCurrency(totalCustomerReceivables, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">From egg/bird buyers</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Payables Outstanding</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalSupplierPayables, { maximumFractionDigits: 0 })}
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-3 px-4">Receipt # & Date</th>
                <th className="py-3 px-4">Transaction Type</th>
                <th className="py-3 px-4">Party Name</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">UTR / Ref #</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
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
                        {isReceipt ? '+' : '-'}{formatCurrency(p.amount, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{p.notes}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPrintingPayment(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors inline-flex items-center gap-1"
                            title="Print Payment Receipt / Voucher"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[11px] font-semibold text-blue-700 hidden sm:inline">Print</span>
                          </button>
                          {canEdit(p.payment_date) && (
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                              title="Edit Payment Voucher"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete(true) && (
                            <button
                              onClick={() => setDeletingPayment(p)}
                              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                              title="Cancel Payment Voucher"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit Payment */}
      <Modal
        isOpen={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        title={`Edit Payment Voucher: ${editingPayment?.receipt_no}`}
        subtitle={`Party: ${editingPayment?.party_name}`}
      >
        <form onSubmit={handleSavePayment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Payment Amount (₹)</label>
              <input
                type="number"
                value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })}
                min="1"
                required
                className="input-field font-bold text-base"
              />
            </div>
            <div>
              <label className="input-label">Payment Date</label>
              <input
                type="date"
                value={payForm.payment_date}
                onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Payment Mode</label>
              <select
                value={payForm.payment_mode}
                onChange={(e) => setPayForm({ ...payForm, payment_mode: e.target.value as any })}
                className="input-field"
              >
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="upi">UPI / QR Code</option>
                <option value="cheque">Bank Cheque</option>
                <option value="cash">Cash Voucher</option>
              </select>
            </div>
            <div>
              <label className="input-label">UTR / Reference No.</label>
              <input
                type="text"
                value={payForm.reference_no}
                onChange={(e) => setPayForm({ ...payForm, reference_no: e.target.value })}
                className="input-field font-mono"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Remarks & Notes</label>
            <textarea
              value={payForm.notes}
              onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
              rows={2}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setEditingPayment(null)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Voucher Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation: Delete Payment */}
      <DeleteConfirmModal
        isOpen={!!deletingPayment}
        onClose={() => setDeletingPayment(null)}
        onConfirm={handleConfirmDelete}
        title="Cancel Payment Transaction"
        recordIdentifier={deletingPayment ? `${deletingPayment.receipt_no} (${deletingPayment.party_name}) — ${formatCurrency(deletingPayment.amount)}` : ''}
        consequences={[
          'The transaction will be deleted from the financial movement ledger.',
          `The party balance for ${deletingPayment?.party_name} will be automatically reversed by ${formatCurrency(deletingPayment?.amount)}.`,
        ]}
      />

      {/* Printable Payment Voucher Modal */}
      <PrintBillModal
        isOpen={!!printingPayment}
        onClose={() => setPrintingPayment(null)}
        billType="payment_receipt"
        data={printingPayment}
      />
    </div>
  );
}
