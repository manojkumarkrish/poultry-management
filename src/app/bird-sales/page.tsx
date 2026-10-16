'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { BirdSale, PaymentStatus } from '@/types/database';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Receipt,
} from 'lucide-react';

export default function BirdSalesPage() {
  const { customers, birdSales, createBirdSale, sheds, batches, currentUser } = useFarm();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

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

  // KPI Metrics
  const totalRevenue = birdSales.reduce((sum, s) => sum + s.net_amount, 0);
  const totalBirdsSold = birdSales.reduce((sum, s) => sum + s.bird_quantity, 0);
  const totalReceivables = birdSales.reduce((sum, s) => sum + s.outstanding_amount, 0);

  const filteredSales = birdSales.filter((s) => {
    return (
      s.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.shed_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sale_date.includes(searchTerm)
    );
  });

  const handleCreateBirdSale = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cust = customers.find((c) => c.id === formData.customerId);
    if (!cust || !selectedShed || !selectedBatch) {
      setFormError('Please select valid customer, shed, and batch.');
      return;
    }

    if (formData.birdQuantity > selectedBatch.current_count) {
      setFormError(
        `Cannot sell ${formData.birdQuantity} birds. Batch only has ${selectedBatch.current_count.toLocaleString()} live birds.`
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
      batch_id: selectedBatch.id,
      batch_code: selectedBatch.batch_code,
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
    } else {
      setFormSuccess(
        `Invoice ${invNo} recorded! Live flock reduced by ${formData.birdQuantity} birds in shed ${selectedShed.code}.`
      );
      setTimeout(() => setIsModalOpen(false), 1200);
    }
  };

  return (
    <div className="space-y-6">
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
          <ExportButtons data={birdSales} filename="bird-sales-invoices" />
          <button onClick={() => setIsModalOpen(true)} className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            <span>Record Bird Sale</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Birds Sold</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalBirdsSold.toLocaleString()} Birds</div>
          <span className="text-xs text-emerald-600 font-medium">Flock count deducted</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Bird Sales Revenue</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            ₹{totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Recorded sales invoices</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Pending Receivables</span>
          <div className={`text-2xl font-bold mt-1 ${totalReceivables > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            ₹{totalReceivables.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Due from live bird traders</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice, buyer, shed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9 py-2 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                  No live bird sales recorded yet. Click "Record Bird Sale" to dispatch birds.
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
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {s.shed_code}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{s.batch_code}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {s.bird_quantity.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {s.average_weight_kg} kg / <strong className="text-slate-800">{s.total_weight_kg} kg</strong>
                  </td>
                  <td className="py-3 px-4 text-right">
                    ₹{s.price_per_bird_or_kg} / {s.pricing_basis === 'per_kg' ? 'kg' : 'bird'}
                  </td>
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

      {/* Record Bird Sale Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Live Bird Sale Invoice"
        subtitle={`Deducts live birds from shed and batch automatically`}
        maxWidth="xl"
      >
        <form onSubmit={handleCreateBirdSale} className="space-y-4">
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
              <label className="input-label">Buyer / Customer</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                required
                className="input-field font-semibold"
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
              >
                {sheds.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name} [Available: {s.current_birds.toLocaleString()} birds]
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Batch In Shed</label>
              <input
                type="text"
                disabled
                value={selectedBatch ? `${selectedBatch.batch_code} (${selectedBatch.bird_type})` : 'None'}
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
                Gross: ₹{grossAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Balance Receivable:</span>
              <div className="font-bold text-rose-600">₹{outstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Generate Bill & Deduct Birds
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
