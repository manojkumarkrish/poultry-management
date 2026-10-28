'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { ExpenseRecord } from '@/types/database';
import { formatCurrency } from '@/lib/utils/formatters';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingDown,
  Calendar,
  Layers,
  Home,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

export default function ExpensesManagementPage() {
  const {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    sheds,
    batches,
    currentUser,
    canEdit,
    canDelete,
  } = useFarm();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseRecord | null>(null);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Form State
  const [formData, setFormData] = useState({
    category: 'maintenance_repairs' as ExpenseRecord['category'],
    expense_date: new Date().toISOString().split('T')[0],
    amount: 12000,
    payment_method: 'bank_transfer' as ExpenseRecord['payment_method'],
    payee: 'Apex Electricals & Motor Works',
    reference_no: `EXP-${Date.now().toString().slice(-5)}`,
    shed_id: sheds[0]?.id || '',
    notes: 'Exhaust fan motor rewinding for cooling pads',
    is_accrual: false,
  });

  const categories = [
    { label: 'All Categories', value: 'all' },
    { label: 'Feed & Raw Materials', value: 'feed_raw_materials' },
    { label: 'Medicines & Vaccines', value: 'medicines_vaccines' },
    { label: 'Labour Wages & Labourers', value: 'labour_wages' },
    { label: 'Salaries', value: 'salaries' },
    { label: 'Electricity & Power', value: 'electricity' },
    { label: 'Water Supply', value: 'water' },
    { label: 'Transport & Freight', value: 'transport' },
    { label: 'Maintenance & Repairs', value: 'maintenance_repairs' },
    { label: 'Packaging & Egg Trays', value: 'packaging_trays' },
    { label: 'Administrative & Security', value: 'administrative' },
    { label: 'Miscellaneous', value: 'miscellaneous' },
  ];

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.reference_no && e.reference_no.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
    const matchesStart = !startDate || e.expense_date >= startDate;
    const matchesEnd = !endDate || e.expense_date <= endDate;
    return matchesSearch && matchesCategory && matchesStart && matchesEnd;
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleOpenAdd = () => {
    setFormData({
      category: 'maintenance_repairs',
      expense_date: new Date().toISOString().split('T')[0],
      amount: 12000,
      payment_method: 'bank_transfer',
      payee: '',
      reference_no: `EXP-${Date.now().toString().slice(-5)}`,
      shed_id: '',
      notes: '',
      is_accrual: false,
    });
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: ExpenseRecord) => {
    setFormData({
      category: exp.category,
      expense_date: exp.expense_date,
      amount: exp.amount,
      payment_method: exp.payment_method,
      payee: exp.payee,
      reference_no: exp.reference_no || '',
      shed_id: exp.shed_id || '',
      notes: exp.notes || '',
      is_accrual: !!exp.is_accrual,
    });
    setEditingExpense(exp);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const shed = sheds.find((s) => s.id === formData.shed_id);
    const batch = batches.find((b) => b.current_shed_id === shed?.id);

    if (editingExpense) {
      const res = updateExpense(editingExpense.id, {
        category: formData.category,
        expense_date: formData.expense_date,
        amount: Number(formData.amount),
        payment_method: formData.payment_method,
        payee: formData.payee,
        reference_no: formData.reference_no,
        shed_id: shed?.id,
        shed_code: shed?.code,
        batch_id: batch?.id,
        batch_code: batch?.batch_code,
        notes: formData.notes,
        is_accrual: formData.is_accrual,
      });

      if (!res.success) {
        showNotification('error', res.error || 'Failed to update expense.');
        return;
      }
      showNotification('success', `Expense record for ${formData.payee} updated.`);
    } else {
      addExpense({
        category: formData.category,
        expense_date: formData.expense_date,
        amount: Number(formData.amount),
        payment_method: formData.payment_method,
        payee: formData.payee,
        reference_no: formData.reference_no,
        shed_id: shed?.id,
        shed_code: shed?.code,
        batch_id: batch?.id,
        batch_code: batch?.batch_code,
        notes: formData.notes,
        is_accrual: formData.is_accrual,
      });
      showNotification('success', `Recorded expense of ${formatCurrency(formData.amount)} to ${formData.payee}.`);
    }

    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingExpense) return;
    const res = deleteExpense(deletingExpense.id);
    if (!res.success) {
      showNotification('error', res.error || 'Failed to delete expense record.');
    } else {
      showNotification('success', `Expense of ${formatCurrency(deletingExpense.amount)} removed.`);
    }
    setDeletingExpense(null);
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
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>Farm Operating Expenses & Costs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Categorized operational outlays, shed allocations, cash flow vs accruals (no duplicate bill counting)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons data={expenses} filename="kpf-expenses-ledger" />
          <button onClick={handleOpenAdd} className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            <span>Record Farm Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Logged Expenses</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalExpenses, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-rose-600 font-medium">Operating outflows</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Electricity Outlay</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(
              expenses
                .filter((e) => e.category === 'electricity')
                .reduce((s, e) => s + e.amount, 0),
              { maximumFractionDigits: 0 }
            )}
          </div>
          <span className="text-xs text-slate-500 font-medium">3-phase power & backup</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Egg Packaging Trays</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(
              expenses
                .filter((e) => e.category === 'packaging_trays')
                .reduce((s, e) => s + e.amount, 0),
              { maximumFractionDigits: 0 }
            )}
          </div>
          <span className="text-xs text-slate-500 font-medium">Paper pulp trays</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search payee, voucher #, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9 py-2 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field py-1.5 px-2.5 text-xs w-auto"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field py-1.5 px-2.5 text-xs w-auto"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
            >
              Clear
            </button>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field py-1.5 text-xs w-full sm:w-48"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-3 px-4">Date & Ref #</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payee / Vendor</th>
                <th className="py-3 px-4">Shed / Flock</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    No expense records found. Click &quot;Add Expense&quot; to log farm expenditures.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{exp.expense_date}</div>
                    <div className="text-[11px] font-mono text-slate-400">{exp.reference_no}</div>
                  </td>
                  <td className="py-3 px-4 capitalize font-medium text-slate-800">
                    {exp.category.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{exp.payee}</td>
                  <td className="py-3 px-4">
                    {exp.shed_code ? (
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {exp.shed_code}
                      </span>
                    ) : (
                      <span className="text-slate-400">Farm Wide</span>
                    )}
                  </td>
                  <td className="py-3 px-4 uppercase text-slate-600 font-mono text-[11px]">
                    {exp.payment_method.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                    {formatCurrency(exp.amount, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{exp.notes}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {canEdit(exp.expense_date) && (
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          title="Edit Expense"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete(true) && (
                        <button
                          onClick={() => setDeletingExpense(exp)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? `Edit Expense: ${editingExpense.payee}` : 'Record Farm Operating Expense'}
        subtitle="Post overhead, utility or maintenance expense"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Expense Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="input-field"
              >
                <option value="maintenance_repairs">Maintenance & Repairs</option>
                <option value="electricity">Electricity & Generator Diesel</option>
                <option value="water">Water Supply & Borewell</option>
                <option value="labour_wages">Daily Labour Wages</option>
                <option value="salaries">Staff Salaries</option>
                <option value="packaging_trays">Packaging & Egg Trays</option>
                <option value="transport">Transport & Logistics</option>
                <option value="medicines_vaccines">Medicines & Disinfectants</option>
                <option value="administrative">Administrative & Audit</option>
                <option value="miscellaneous">Miscellaneous</option>
              </select>
            </div>
            <div>
              <label className="input-label">Expense Date</label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Amount (₹)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                min="1"
                required
                className="input-field font-bold text-base text-slate-900"
              />
            </div>
            <div>
              <label className="input-label">Payee / Service Provider</label>
              <input
                type="text"
                value={formData.payee}
                onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                required
                className="input-field font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Payment Mode</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                className="input-field"
              >
                <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="upi">UPI</option>
                <option value="cheque">Bank Cheque</option>
                <option value="cash">Cash Voucher</option>
              </select>
            </div>
            <div>
              <label className="input-label">Voucher / UTR Number</label>
              <input
                type="text"
                value={formData.reference_no}
                onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                className="input-field font-mono"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Shed Cost Allocation (Optional)</label>
            <select
              value={formData.shed_id}
              onChange={(e) => setFormData({ ...formData, shed_id: e.target.value })}
              className="input-field"
            >
              <option value="">General Farm Wide Overhead</option>
              {sheds.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Expense Purpose & Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingExpense(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingExpense ? 'Save Changes' : 'Record Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation: Delete Expense */}
      <DeleteConfirmModal
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Expense Record"
        recordIdentifier={deletingExpense ? `${formatCurrency(deletingExpense.amount)} to ${deletingExpense.payee} on ${deletingExpense.expense_date}` : ''}
        consequences={[
          'The expense transaction will be deleted from the financial ledger.',
          'Operational cost metrics and P&L totals will be updated accordingly.',
        ]}
      />
    </div>
  );
}
