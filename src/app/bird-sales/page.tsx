'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { BirdSale, PaymentStatus } from '@/types/database';
import { formatNumber, formatCurrency } from '@/lib/utils/formatters';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import PrintBillModal from '@/components/ui/PrintBillModal';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Receipt,
  Pencil,
  Undo2,
  XCircle,
  Printer,
} from 'lucide-react';

export default function BirdSalesPage() {
  const {
    customers,
    birdSales,
    createBirdSale,
    updateBirdSale,
    cancelBirdSale,
    sheds,
    batches,
    currentUser,
    canEdit,
    canDelete,
  } = useFarm();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<BirdSale | null>(null);
  const [cancellingSale, setCancellingSale] = useState<BirdSale | null>(null);
  const [printingSale, setPrintingSale] = useState<BirdSale | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    customerId: customers[2]?.id || customers[0]?.id || '',
    shedId: sheds[0]?.id || '',
    saleDate: new Date().toISOString().split('T')[0],
    birdQuantity: 500,
    averageWeightKg: 1.45,
    pricingBasis: 'per_kg' as 'per_bird' | 'per_kg',
    pricePerUnit: 92.0, // Rs/kg or Rs/bird
    transportCharges: 0,
    paidAmount: 40000,
    notes: 'Culled spent hens sold to live bird market trader',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const selectedShed = sheds.find((s) => s.id === formData.shedId);
  const selectedBatch = batches.find((b) => b.current_shed_id === formData.shedId);

  // Calculation
  const totalWeight = formData.birdQuantity * formData.averageWeightKg;
  const grossAmount =
    formData.pricingBasis === 'per_kg'
      ? totalWeight * formData.pricePerUnit
      : formData.birdQuantity * formData.pricePerUnit;
  const netAmount = grossAmount + formData.transportCharges;
  const outstanding = Math.max(0, netAmount - formData.paidAmount);
  const paymentStatus: PaymentStatus =
    outstanding === 0 ? 'paid' : formData.paidAmount > 0 ? 'partial' : 'unpaid';

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredSales = birdSales.filter((s) => {
    const matchesSearch =
      s.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.shed_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sale_date.includes(searchTerm);
    const matchesStart = !startDate || s.sale_date >= startDate;
    const matchesEnd = !endDate || s.sale_date <= endDate;
    return matchesSearch && matchesStart && matchesEnd;
  });

  // KPI Metrics (active sales only within filtered date range)
  const activeSales = filteredSales.filter((s) => s.status !== 'cancelled');
  const totalRevenue = activeSales.reduce((sum, s) => sum + s.net_amount, 0);
  const totalBirdsSold = activeSales.reduce((sum, s) => sum + s.bird_quantity, 0);
  const totalReceivables = activeSales.reduce((sum, s) => sum + s.outstanding_amount, 0);

  const handleOpenCreate = () => {
    setFormData({
      customerId: customers[2]?.id || customers[0]?.id || '',
      shedId: sheds[0]?.id || '',
      saleDate: new Date().toISOString().split('T')[0],
      birdQuantity: 500,
      averageWeightKg: 1.45,
      pricingBasis: 'per_kg',
      pricePerUnit: 92.0,
      transportCharges: 0,
      paidAmount: 40000,
      notes: 'Culled spent hens sold to live bird market trader',
    });
    setEditingSale(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sale: BirdSale) => {
    setFormData({
      customerId: sale.customer_id,
      shedId: sale.shed_id,
      saleDate: sale.sale_date,
      birdQuantity: sale.bird_quantity,
      averageWeightKg: sale.average_weight_kg,
      pricingBasis: sale.pricing_basis,
      pricePerUnit: sale.price_per_bird_or_kg,
      transportCharges: sale.transport_charges,
      paidAmount: sale.paid_amount,
      notes: sale.notes || '',
    });
    setEditingSale(sale);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cust = customers.find((c) => c.id === formData.customerId);
    if (!cust || !selectedShed) {
      setFormError('Please select valid customer and shed.');
      return;
    }

    const batch = selectedBatch || batches.find((b) => b.id === (editingSale ? editingSale.batch_id : ''));

    if (editingSale) {
      const res = updateBirdSale(editingSale.id, {
        sale_date: formData.saleDate,
        bird_quantity: Number(formData.birdQuantity),
        average_weight_kg: Number(formData.averageWeightKg),
        total_weight_kg: Number(totalWeight.toFixed(2)),
        price_per_bird_or_kg: Number(formData.pricePerUnit),
        pricing_basis: formData.pricingBasis,
        gross_amount: Number(grossAmount.toFixed(2)),
        transport_charges: Number(formData.transportCharges),
        net_amount: Number(netAmount.toFixed(2)),
        paid_amount: Number(formData.paidAmount),
        outstanding_amount: Number(outstanding.toFixed(2)),
        payment_status: paymentStatus,
        notes: formData.notes,
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to update bird sale.');
        return;
      }
      showNotification('success', `Invoice ${editingSale.invoice_no} updated successfully.`);
    } else {
      if (!batch) {
        setFormError('No batch currently active in selected shed.');
        return;
      }

      if (formData.birdQuantity > batch.current_count) {
        setFormError(
          `Cannot sell ${formData.birdQuantity} birds. Batch only has ${formatNumber(batch.current_count)} live birds.`
        );
        return;
      }

      const invNo = `INV-BIRD-${Date.now().toString().slice(-6)}`;

      const res = createBirdSale({
        invoice_no: invNo,
        customer_id: cust.id,
        customer_name: cust.name,
        shed_id: selectedShed.id,
        shed_code: selectedShed.code,
        batch_id: batch.id,
        batch_code: batch.batch_code,
        sale_date: formData.saleDate,
        bird_quantity: Number(formData.birdQuantity),
        average_weight_kg: Number(formData.averageWeightKg),
        total_weight_kg: Number(totalWeight.toFixed(2)),
        price_per_bird_or_kg: Number(formData.pricePerUnit),
        pricing_basis: formData.pricingBasis,
        gross_amount: Number(grossAmount.toFixed(2)),
        transport_charges: Number(formData.transportCharges),
        net_amount: Number(netAmount.toFixed(2)),
        paid_amount: Number(formData.paidAmount),
        outstanding_amount: Number(outstanding.toFixed(2)),
        payment_status: paymentStatus,
        notes: formData.notes,
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to post bird sale.');
        return;
      }
      showNotification(
        'success',
        `Invoice ${invNo} recorded! Live flock reduced by ${formData.birdQuantity} birds in shed ${selectedShed.code}.`
      );
    }

    setIsModalOpen(false);
    setEditingSale(null);
  };

  const handleConfirmCancel = () => {
    if (!cancellingSale) return;
    const res = cancelBirdSale(cancellingSale.id);
    if (!res.success) {
      showNotification('error', res.error || 'Failed to cancel bird sale.');
    } else {
      showNotification(
        'success',
        `Invoice ${cancellingSale.invoice_no} cancelled. ${formatNumber(cancellingSale.bird_quantity)} birds restored to shed ${cancellingSale.shed_code}.`
      );
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
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <span>Bird & Spent Hen Sales</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch live birds or culled hens, deduct flock counts atomically, and track buyer accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons data={birdSales} filename="kpf-bird-sales-invoices" />
          <button onClick={handleOpenCreate} className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            <span>Record Bird Sale</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Birds Sold</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(totalBirdsSold)} Birds</div>
          <span className="text-xs text-emerald-600 font-medium">Flock count deducted</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Bird Sales Revenue</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(totalRevenue, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Active sales invoices</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Pending Receivables</span>
          <div className={`text-2xl font-bold mt-1 ${totalReceivables > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatCurrency(totalReceivables, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Due from live bird traders</span>
        </div>
      </div>

      {/* Search & Date Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice, buyer, shed..."
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-3 px-4">Invoice & Date</th>
                <th className="py-3 px-4">Buyer Name</th>
                <th className="py-3 px-4">Source Shed & Batch</th>
                <th className="py-3 px-4 text-right">Birds Sold</th>
                <th className="py-3 px-4 text-right">Avg Wt / Total Wt</th>
                <th className="py-3 px-4 text-right">Rate Basis</th>
                <th className="py-3 px-4 text-right">Net Bill (₹)</th>
                <th className="py-3 px-4 text-right">Paid (₹)</th>
                <th className="py-3 px-4 text-right">Due (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 italic">
                    No live bird sales recorded yet. Click "Record Bird Sale" to dispatch birds.
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
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {s.shed_code}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{s.batch_code}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatNumber(s.bird_quantity)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {s.average_weight_kg} kg / <strong className="text-slate-800">{s.total_weight_kg} kg</strong>
                      </td>
                      <td className="py-3 px-4 text-right">
                        ₹{s.price_per_bird_or_kg} / {s.pricing_basis === 'per_kg' ? 'kg' : 'bird'}
                      </td>
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
                            title="Print Individual Live Bird Sale Bill"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[11px] font-semibold text-blue-700 hidden sm:inline">Print Bill</span>
                          </button>
                          {!isCancelled && (
                            <>
                              {canEdit(s.sale_date) && (
                                <button
                                  onClick={() => handleOpenEdit(s)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                  title="Edit Bird Sale Invoice"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDelete(true) && (
                                <button
                                  onClick={() => setCancellingSale(s)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded transition-colors"
                                  title="Cancel Invoice and Restore Birds to Flock"
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

      {/* Record / Edit Bird Sale Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSale(null);
        }}
        title={editingSale ? `Edit Invoice: ${editingSale.invoice_no}` : 'Record Live Bird Sale Invoice'}
        subtitle="Deducts live birds from shed and batch automatically"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Buyer / Customer</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                required
                className="input-field font-semibold"
                disabled={!!editingSale}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customer_type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Sale Date</label>
              <input
                type="date"
                value={formData.saleDate}
                onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Select Source Shed</label>
              <select
                value={formData.shedId}
                onChange={(e) => setFormData({ ...formData, shedId: e.target.value })}
                className="input-field font-semibold"
                disabled={!!editingSale}
              >
                {sheds.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name} [Available: {formatNumber(s.current_birds)} birds]
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Batch In Shed</label>
              <input
                type="text"
                disabled
                value={selectedBatch ? `${selectedBatch.batch_code} (${selectedBatch.bird_type})` : (editingSale ? editingSale.batch_code : 'None')}
                className="input-field bg-slate-50 text-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="input-label">Quantity (Birds)</label>
              <input
                type="number"
                value={formData.birdQuantity}
                onChange={(e) => setFormData({ ...formData, birdQuantity: Number(e.target.value) })}
                min="1"
                required
                className="input-field font-bold text-base"
              />
            </div>
            <div>
              <label className="input-label">Avg Weight (kg)</label>
              <input
                type="number"
                value={formData.averageWeightKg}
                onChange={(e) => setFormData({ ...formData, averageWeightKg: Number(e.target.value) })}
                step="0.05"
                min="0.2"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Rate (₹)</label>
              <input
                type="number"
                value={formData.pricePerUnit}
                onChange={(e) => setFormData({ ...formData, pricePerUnit: Number(e.target.value) })}
                step="0.5"
                required
                className="input-field font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Pricing Basis</label>
              <select
                value={formData.pricingBasis}
                onChange={(e) => setFormData({ ...formData, pricingBasis: e.target.value as any })}
                className="input-field"
              >
                <option value="per_kg">Per Kilogram (Live Weight)</option>
                <option value="per_bird">Per Bird (Fixed Headcount)</option>
              </select>
            </div>
            <div>
              <label className="input-label">Amount Paid (₹)</label>
              <input
                type="number"
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                min="0"
                max={netAmount}
                className="input-field font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between text-xs">
            <div>
              <span className="text-slate-500">Total Live Weight: {totalWeight.toFixed(1)} kg</span>
              <div className="font-bold text-slate-900 mt-0.5">
                Gross: {formatCurrency(grossAmount, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Balance Receivable:</span>
              <div className="font-bold text-rose-600">{formatCurrency(outstanding, { maximumFractionDigits: 0 })}</div>
            </div>
          </div>

          <div>
            <label className="input-label">Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              placeholder="e.g. Weighbridge receipt #5521"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingSale(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingSale ? 'Save Changes' : 'Generate Bill & Deduct Birds'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation: Cancel Bird Sale */}
      <DeleteConfirmModal
        isOpen={!!cancellingSale}
        onClose={() => setCancellingSale(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Bird Sale Invoice"
        recordIdentifier={cancellingSale ? `${cancellingSale.invoice_no} (${cancellingSale.customer_name}) — ${formatNumber(cancellingSale.bird_quantity)} birds` : ''}
        confirmText="Confirm Sale Cancellation"
        consequences={[
          `All ${formatNumber(cancellingSale?.bird_quantity)} birds will be restored to Shed ${cancellingSale?.shed_code} and Batch ${cancellingSale?.batch_code}.`,
          `Customer receivable balance will be adjusted downward by ${formatCurrency(cancellingSale?.outstanding_amount)}.`,
          'The invoice will be stamped as CANCELLED with an audit log.',
        ]}
      />

      {/* Printable Individual Bird Sale Bill Modal */}
      <PrintBillModal
        isOpen={!!printingSale}
        onClose={() => setPrintingSale(null)}
        billType="bird_sale"
        data={printingSale}
      />
    </div>
  );
}
