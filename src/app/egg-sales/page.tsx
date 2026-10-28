'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { EggSale, convertEggsToTrays, PaymentStatus } from '@/types/database';
import { formatNumber, formatCurrency } from '@/lib/utils/formatters';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import PrintBillModal from '@/components/ui/PrintBillModal';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  DollarSign,
  Warehouse,
  Pencil,
  Undo2,
  XCircle,
  Printer,
} from 'lucide-react';

export default function EggStockAndSalesPage() {
  const {
    customers,
    eggSales,
    createEggSale,
    updateEggSale,
    cancelEggSale,
    warehouseItems,
    currentUser,
    canEdit,
    canDelete,
  } = useFarm();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<EggSale | null>(null);
  const [cancellingSale, setCancellingSale] = useState<EggSale | null>(null);
  const [printingSale, setPrintingSale] = useState<EggSale | null>(null);

  // Available egg stock in warehouse
  const eggInventoryItem = warehouseItems.find((w) => w.category === 'eggs');
  const availableEggStock = eggInventoryItem ? eggInventoryItem.current_quantity : 0;
  const availableTrays = convertEggsToTrays(availableEggStock);

  // Form State
  const [formData, setFormData] = useState({
    customerId: customers[0]?.id || '',
    saleDate: new Date().toISOString().split('T')[0],
    eggCategory: 'good' as 'good' | 'damaged' | 'mixed',
    totalEggs: 15000,
    pricePerEgg: 5.2,
    discountAmount: 0,
    paidAmount: 50000,
    paymentMode: 'bank_transfer' as 'cash' | 'bank_transfer' | 'upi' | 'credit',
    notes: 'Direct wholesale delivery via farm reefer vehicle',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Derived calculations for current form entry
  const formTrays = convertEggsToTrays(formData.totalEggs);
  const grossAmount = formData.totalEggs * formData.pricePerEgg;
  const netAmount = Math.max(0, grossAmount - formData.discountAmount);
  const outstanding = Math.max(0, netAmount - formData.paidAmount);
  const paymentStatus: PaymentStatus =
    outstanding === 0 ? 'paid' : formData.paidAmount > 0 ? 'partial' : 'unpaid';

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredSales = eggSales.filter((s) => {
    const matchesSearch =
      s.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sale_date.includes(searchTerm);
    const matchesStart = !startDate || s.sale_date >= startDate;
    const matchesEnd = !endDate || s.sale_date <= endDate;
    return matchesSearch && matchesStart && matchesEnd;
  });

  // Summary Metrics (ignoring cancelled sales, strictly within filtered date range)
  const activeSales = filteredSales.filter((s) => s.status !== 'cancelled');
  const totalSalesRevenue = activeSales.reduce((sum, s) => sum + s.net_amount, 0);
  const totalEggsSold = activeSales.reduce((sum, s) => sum + s.total_eggs, 0);
  const totalEggReceivables = activeSales.reduce((sum, s) => sum + s.outstanding_amount, 0);

  const handleOpenCreateSale = () => {
    setFormData({
      customerId: customers[0]?.id || '',
      saleDate: new Date().toISOString().split('T')[0],
      eggCategory: 'good',
      totalEggs: 15000,
      pricePerEgg: 5.2,
      discountAmount: 0,
      paidAmount: 50000,
      paymentMode: 'bank_transfer',
      notes: 'Direct wholesale delivery via farm reefer vehicle',
    });
    setEditingSale(null);
    setFormError(null);
    setIsSaleModalOpen(true);
  };

  const handleOpenEditSale = (sale: EggSale) => {
    setFormData({
      customerId: sale.customer_id,
      saleDate: sale.sale_date,
      eggCategory: sale.egg_category,
      totalEggs: sale.total_eggs,
      pricePerEgg: sale.price_per_egg,
      discountAmount: sale.discount_amount,
      paidAmount: sale.paid_amount,
      paymentMode: (sale.payment_mode === 'cheque' ? 'bank_transfer' : sale.payment_mode) || 'bank_transfer',
      notes: sale.notes || '',
    });
    setEditingSale(sale);
    setFormError(null);
    setIsSaleModalOpen(true);
  };

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const customer = customers.find((c) => c.id === formData.customerId);
    if (!customer) {
      setFormError('Please select a customer.');
      return;
    }

    if (editingSale) {
      const res = updateEggSale(editingSale.id, {
        sale_date: formData.saleDate,
        egg_category: formData.eggCategory,
        total_eggs: Number(formData.totalEggs),
        trays_count: formTrays.trays,
        loose_eggs_count: formTrays.loose,
        price_per_egg: Number(formData.pricePerEgg),
        price_per_tray: Number(formData.pricePerEgg * 30),
        gross_amount: grossAmount,
        discount_amount: Number(formData.discountAmount),
        net_amount: netAmount,
        paid_amount: Number(formData.paidAmount),
        outstanding_amount: outstanding,
        payment_status: paymentStatus,
        payment_mode: formData.paymentMode,
        notes: formData.notes,
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to update invoice.');
        return;
      }
      showNotification('success', `Invoice ${editingSale.invoice_no} updated successfully.`);
    } else {
      if (formData.totalEggs > availableEggStock) {
        setFormError(
          `Cannot sell ${formatNumber(formData.totalEggs)} eggs. Available cold storage stock is only ${formatNumber(availableEggStock)} eggs.`
        );
        return;
      }

      const invoiceNo = `INV-EGG-${Date.now().toString().slice(-6)}`;

      const res = createEggSale({
        invoice_no: invoiceNo,
        customer_id: customer.id,
        customer_name: customer.name,
        sale_date: formData.saleDate,
        egg_category: formData.eggCategory,
        total_eggs: Number(formData.totalEggs),
        trays_count: formTrays.trays,
        loose_eggs_count: formTrays.loose,
        price_per_egg: Number(formData.pricePerEgg),
        price_per_tray: Number(formData.pricePerEgg * 30),
        gross_amount: grossAmount,
        discount_amount: Number(formData.discountAmount),
        net_amount: netAmount,
        paid_amount: Number(formData.paidAmount),
        outstanding_amount: outstanding,
        payment_status: paymentStatus,
        payment_mode: formData.paymentMode,
        notes: formData.notes,
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to post sale.');
        return;
      }
      showNotification('success', `Invoice ${invoiceNo} generated! Stock deducted by ${formatNumber(formData.totalEggs)} eggs.`);
    }

    setIsSaleModalOpen(false);
    setEditingSale(null);
  };

  const handleConfirmCancelSale = () => {
    if (!cancellingSale) return;
    const res = cancelEggSale(cancellingSale.id);
    if (!res.success) {
      showNotification('error', res.error || 'Failed to cancel invoice.');
    } else {
      showNotification('success', `Invoice ${cancellingSale.invoice_no} cancelled. ${formatNumber(cancellingSale.total_eggs)} eggs restored to cold room.`);
    }
    setCancellingSale(null);
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
            <ShoppingCart className="w-6 h-6 text-emerald-600" />
            <span>Egg Stock & Commercial Sales</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch wholesale eggs from cold rooms, generate invoices, deduct stock, and track buyer receivables
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons data={eggSales} filename="kpf-egg-sales-invoices" />
          <button onClick={handleOpenCreateSale} className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            <span>Create Egg Sale Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Available In Cold Room</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {formatNumber(availableEggStock)} Eggs
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {formatNumber(availableTrays.trays)} Trays + {availableTrays.loose} loose
          </span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Eggs Sold</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(totalEggsSold)}</div>
          <span className="text-xs text-emerald-600 font-medium">Billed to buyers</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Egg Sales Revenue</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(totalSalesRevenue, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Active sales total</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Outstanding Receivables</span>
          <div className={`text-2xl font-bold mt-1 ${totalEggReceivables > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatCurrency(totalEggReceivables, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Due from egg buyers</span>
        </div>
      </div>

      {/* Search & Date Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number, buyer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9 py-2 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
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
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-3 px-4">Invoice & Date</th>
                <th className="py-3 px-4">Buyer / Customer</th>
                <th className="py-3 px-4 text-right">Eggs Sold</th>
                <th className="py-3 px-4 text-right">Trays (30s)</th>
                <th className="py-3 px-4 text-right">Rate / Egg</th>
                <th className="py-3 px-4 text-right">Net Bill (₹)</th>
                <th className="py-3 px-4 text-right">Paid (₹)</th>
                <th className="py-3 px-4 text-right">Due Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                    No egg sale invoices created yet. Click "Create Egg Sale Invoice" to dispatch stock.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const isCancelled = s.status === 'cancelled';
                  return (
                    <tr key={s.id} className={`hover:bg-slate-50 ${isCancelled ? 'opacity-50 bg-slate-50' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{s.invoice_no}</div>
                        <div className="text-[11px] text-slate-400">{s.sale_date}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{s.customer_name}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatNumber(s.total_eggs)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatNumber(s.trays_count)} T, {s.loose_eggs_count} L
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">₹{s.price_per_egg.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(s.net_amount, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatCurrency(s.paid_amount, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        {formatCurrency(s.outstanding_amount, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCancelled ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            CANCELLED
                          </span>
                        ) : (
                          <Badge variant={s.payment_status === 'paid' ? 'success' : s.payment_status === 'partial' ? 'warning' : 'danger'}>
                            {s.payment_status.toUpperCase()}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPrintingSale(s)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors inline-flex items-center gap-1"
                            title="Print Individual Egg Sale Bill"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[11px] font-semibold text-blue-700 hidden sm:inline">Print Bill</span>
                          </button>
                          {!isCancelled && (
                            <>
                              {canEdit(s.sale_date) && (
                                <button
                                  onClick={() => handleOpenEditSale(s)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                  title="Edit Invoice Details"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDelete(true) && (
                                <button
                                  onClick={() => setCancellingSale(s)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded transition-colors"
                                  title="Cancel Invoice and Restore Eggs to Cold Storage"
                                >
                                  <Undo2 className="w-3 h-3" />
                                  <span>Cancel</span>
                                </button>
                              )}
                            </>
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

      {/* Create / Edit Sale Modal */}
      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => {
          setIsSaleModalOpen(false);
          setEditingSale(null);
        }}
        title={editingSale ? `Edit Invoice: ${editingSale.invoice_no}` : 'Create Wholesale Egg Sale Invoice'}
        subtitle={`Available Cold Storage Stock: ${formatNumber(availableEggStock)} eggs (${formatNumber(availableTrays.trays)} trays)`}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmitSale} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Select Customer / Buyer</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                required
                className="input-field font-semibold"
                disabled={!!editingSale}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Cur Bal: {formatCurrency(c.current_balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Sale / Dispatch Date</label>
              <input
                type="date"
                value={formData.saleDate}
                onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="input-label">Eggs Sold</label>
              <input
                type="number"
                value={formData.totalEggs}
                onChange={(e) => setFormData({ ...formData, totalEggs: Number(e.target.value) })}
                min="30"
                step="30"
                required
                className="input-field font-bold text-base"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                = {formTrays.trays} Trays + {formTrays.loose} Loose
              </span>
            </div>
            <div>
              <label className="input-label">Price per Egg (₹)</label>
              <input
                type="number"
                value={formData.pricePerEgg}
                onChange={(e) => setFormData({ ...formData, pricePerEgg: Number(e.target.value) })}
                step="0.05"
                min="1"
                required
                className="input-field font-bold text-base"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                ₹{(formData.pricePerEgg * 30).toFixed(1)} / Tray
              </span>
            </div>
            <div>
              <label className="input-label">Discount (₹)</label>
              <input
                type="number"
                value={formData.discountAmount}
                onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                min="0"
                className="input-field"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Gross: {formatCurrency(grossAmount)}</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                Net Invoice Amount: <strong className="text-emerald-700">{formatCurrency(netAmount)}</strong>
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Balance Due:</span>
              <div className="text-sm font-bold text-rose-600">{formatCurrency(outstanding)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Amount Paid Today (₹)</label>
              <input
                type="number"
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                min="0"
                max={netAmount}
                className="input-field font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="input-label">Payment Mode</label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as any })}
                className="input-field"
              >
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="upi">UPI / QR Code</option>
                <option value="cash">Cash Collection</option>
                <option value="credit">Pure Credit (0 Paid)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="input-label">Dispatch Notes & Vehicle Number</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="input-field"
              placeholder="e.g. TN-38-AB-1234, dispatch driver Murugan"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsSaleModalOpen(false);
                setEditingSale(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingSale ? 'Save Invoice Changes' : 'Generate Invoice & Deduct Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation: Cancel Egg Sale */}
      <DeleteConfirmModal
        isOpen={!!cancellingSale}
        onClose={() => setCancellingSale(null)}
        onConfirm={handleConfirmCancelSale}
        title="Cancel Egg Sale Invoice"
        recordIdentifier={cancellingSale ? `${cancellingSale.invoice_no} (${cancellingSale.customer_name}) — ${formatCurrency(cancellingSale.net_amount)}` : ''}
        confirmText="Confirm Invoice Cancellation"
        consequences={[
          `All ${formatNumber(cancellingSale?.total_eggs)} eggs will be automatically returned to cold room stock.`,
          `Customer receivable balance will be adjusted downward by ${formatCurrency(cancellingSale?.outstanding_amount)}.`,
          'The invoice will be stamped as CANCELLED with an audit log.',
        ]}
      />

      {/* Printable Individual Egg Bill Modal */}
      <PrintBillModal
        isOpen={!!printingSale}
        onClose={() => setPrintingSale(null)}
        billType="egg_sale"
        data={printingSale}
      />
    </div>
  );
}
