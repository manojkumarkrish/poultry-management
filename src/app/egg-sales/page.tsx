'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { EggSale, convertEggsToTrays, PaymentStatus } from '@/types/database';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
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
} from 'lucide-react';

export default function EggStockAndSalesPage() {
  const { customers, eggSales, createEggSale, warehouseItems, currentUser, visibilitySettings } = useFarm();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  // Available egg stock in warehouse
  const eggInventoryItem = warehouseItems.find((w) => w.category === 'eggs');
  const availableEggStock = eggInventoryItem ? eggInventoryItem.current_quantity : 76500;
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
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Derived calculations for current form entry
  const formTrays = convertEggsToTrays(formData.totalEggs);
  const grossAmount = formData.totalEggs * formData.pricePerEgg;
  const netAmount = Math.max(0, grossAmount - formData.discountAmount);
  const outstanding = Math.max(0, netAmount - formData.paidAmount);
  const paymentStatus: PaymentStatus =
    outstanding === 0 ? 'paid' : formData.paidAmount > 0 ? 'partial' : 'unpaid';

  // Summary Metrics
  const totalSalesRevenue = eggSales.reduce((sum, s) => sum + s.net_amount, 0);
  const totalEggsSold = eggSales.reduce((sum, s) => sum + s.total_eggs, 0);
  const totalEggReceivables = eggSales.reduce((sum, s) => sum + s.outstanding_amount, 0);

  const filteredSales = eggSales.filter((s) => {
    return (
      s.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sale_date.includes(searchTerm)
    );
  });

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const customer = customers.find((c) => c.id === formData.customerId);
    if (!customer) {
      setFormError('Please select a customer.');
      return;
    }

    if (formData.totalEggs > availableEggStock) {
      setFormError(
        `Cannot sell ${formData.totalEggs.toLocaleString()} eggs. Available cold storage stock is only ${availableEggStock.toLocaleString()} eggs.`
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
    } else {
      setFormSuccess(
        `Invoice ${invoiceNo} generated! Stock deducted by ${formData.totalEggs.toLocaleString()} eggs.`
      );
      setTimeout(() => {
        setIsSaleModalOpen(false);
      }, 1200);
    }
  };

  return (
    <div className="space-y-6">
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
          <ExportButtons data={eggSales} filename="egg-sales-invoices" />
          <button onClick={() => setIsSaleModalOpen(true)} className="btn-primary gap-2">
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
            {availableEggStock.toLocaleString()} Eggs
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {availableTrays.trays.toLocaleString()} Trays + {availableTrays.loose} loose
          </span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Eggs Sold</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalEggsSold.toLocaleString()}</div>
          <span className="text-xs text-emerald-600 font-medium">Billed to buyers</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Egg Sales Revenue</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            ₹{totalSalesRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Excludes unsold stock</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Outstanding Receivables</span>
          <div className={`text-2xl font-bold mt-1 ${totalEggReceivables > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            ₹{totalEggReceivables.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Due from egg buyers</span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number, buyer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9 py-2 text-xs"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                  No egg sale invoices created yet. Click "Create Egg Sale Invoice" to dispatch stock.
                </td>
              </tr>
            ) : (
              filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{s.invoice_no}</div>
                    <div className="text-[11px] text-slate-400">{s.sale_date}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{s.customer_name}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {s.total_eggs.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {s.trays_count.toLocaleString()} T, {s.loose_eggs_count} L
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700">₹{s.price_per_egg.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    ₹{s.net_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">
                    ₹{s.paid_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-rose-600">
                    ₹{s.outstanding_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={s.payment_status === 'paid' ? 'success' : s.payment_status === 'partial' ? 'warning' : 'danger'}>
                      {s.payment_status.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Sale Modal */}
      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        title="Create Wholesale Egg Sale Invoice"
        subtitle={`Available Cold Storage Stock: ${availableEggStock.toLocaleString()} eggs (${availableTrays.trays.toLocaleString()} trays)`}
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSale} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{formSuccess}</span>
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
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Cur Bal: ₹{c.current_balance.toLocaleString()})
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
              <span className="text-slate-500">Gross: ₹{grossAmount.toLocaleString()}</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                Net Invoice Amount: <strong className="text-emerald-700">₹{netAmount.toLocaleString()}</strong>
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Balance Due:</span>
              <div className="text-sm font-bold text-rose-600">₹{outstanding.toLocaleString()}</div>
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
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsSaleModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Generate Invoice & Deduct Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
