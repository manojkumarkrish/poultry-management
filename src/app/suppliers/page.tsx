'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { Supplier, SupplierBill, PaymentStatus } from '@/types/database';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
import {
  Truck,
  Plus,
  Search,
  Receipt,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from 'lucide-react';

export default function SuppliersPurchasesPage() {
  const { suppliers, addSupplier, supplierBills, createSupplierBill, recordPayment, currentUser } = useFarm();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // New Supplier Form
  const [newSupp, setNewSupp] = useState({
    code: '',
    name: '',
    phone: '',
    email: '',
    category: 'feed_ingredients' as Supplier['category'],
    opening_balance: 0,
    address: '',
  });

  // New Bill Form
  const [billData, setBillData] = useState({
    supplierId: suppliers[0]?.id || '',
    billNo: `BILL-${Date.now().toString().slice(-5)}`,
    billDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    itemsSummary: '10 MT Yellow Maize (Moisture < 12%)',
    totalAmount: 235000,
    paidAmount: 50000,
    notes: 'Direct mill delivery via trailer',
  });

  // Payment Form
  const [payData, setPayData] = useState({
    amount: 50000,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'bank_transfer' as 'cash' | 'bank_transfer' | 'upi' | 'cheque',
    referenceNo: `NEFT-${Date.now().toString().slice(-6)}`,
    notes: 'Vendor payment toward raw feed ingredients',
  });

  const totalPayables = suppliers.reduce((sum, s) => sum + s.current_balance, 0);

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    addSupplier({
      code: newSupp.code.toUpperCase(),
      name: newSupp.name,
      phone: newSupp.phone,
      email: newSupp.email,
      category: newSupp.category,
      opening_balance: Number(newSupp.opening_balance),
      current_balance: Number(newSupp.opening_balance),
      address: newSupp.address,
    });
    setIsSupplierModalOpen(false);
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const supp = suppliers.find((s) => s.id === billData.supplierId);
    if (!supp) return;

    const outstanding = Math.max(0, billData.totalAmount - billData.paidAmount);
    const status: PaymentStatus = outstanding === 0 ? 'paid' : billData.paidAmount > 0 ? 'partial' : 'unpaid';

    createSupplierBill({
      bill_no: billData.billNo,
      supplier_id: supp.id,
      supplier_name: supp.name,
      bill_date: billData.billDate,
      due_date: billData.dueDate,
      items_summary: billData.itemsSummary,
      total_amount: Number(billData.totalAmount),
      paid_amount: Number(billData.paidAmount),
      outstanding_amount: outstanding,
      payment_status: status,
      notes: billData.notes,
    });

    setIsBillModalOpen(false);
  };

  const handleOpenDisbursement = (supp: Supplier) => {
    setSelectedSupplier(supp);
    setPayData({
      amount: Math.min(supp.current_balance, 50000),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'bank_transfer',
      referenceNo: `NEFT-${Date.now().toString().slice(-6)}`,
      notes: 'Vendor payment disbursement',
    });
    setIsPaymentModalOpen(true);
  };

  const handleSaveDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    recordPayment({
      receipt_no: `DISB-${Date.now().toString().slice(-6)}`,
      type: 'supplier_payment',
      party_type: 'supplier',
      party_id: selectedSupplier.id,
      party_name: selectedSupplier.name,
      amount: Number(payData.amount),
      payment_date: payData.paymentDate,
      payment_mode: payData.paymentMode,
      reference_no: payData.referenceNo,
      notes: payData.notes,
      recorded_by: currentUser.id,
    });

    setIsPaymentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-600" />
            <span>Suppliers & Purchases (Accounts Payable)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Feed ingredient merchants, hatcheries, vet pharma suppliers, bills, and payment disbursements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons data={suppliers} filename="suppliers-payables" />
          <button onClick={() => setIsBillModalOpen(true)} className="btn-secondary gap-1.5 text-xs">
            <Receipt className="w-4 h-4" />
            <span>Record Purchase Bill</span>
          </button>
          <button onClick={() => setIsSupplierModalOpen(true)} className="btn-primary gap-1.5 text-xs">
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Payables</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            ₹{totalPayables.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Farm debt to suppliers</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Active Suppliers</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{suppliers.length} Vendors</div>
          <span className="text-xs text-slate-500 font-medium">Feed, chicks & medicines</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Purchase Bills Logged</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{supplierBills.length} Invoices</div>
          <span className="text-xs text-emerald-600 font-medium">Traceable raw materials</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor name, code, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9 py-2 text-xs"
          />
        </div>
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredSuppliers.map((supp) => (
          <div
            key={supp.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{supp.code}</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{supp.name}</h3>
                </div>
                <Badge variant="purple">{supp.category.replace('_', ' ').toUpperCase()}</Badge>
              </div>

              <div className="mt-3 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{supp.phone}</span>
                </div>
                {supp.address && (
                  <div className="flex items-center gap-1.5 text-slate-500 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{supp.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Payable Balance:</span>
                <span className="text-sm font-black text-rose-600">
                  ₹{supp.current_balance.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => handleOpenDisbursement(supp)}
                className="btn-secondary text-xs gap-1.5 py-1 px-3"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                <span>Pay Supplier</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Supplier Bills Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">
          Purchase Bills & Raw Material Invoices ({supplierBills.length})
        </h3>
        {supplierBills.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 italic">
            No purchase bills recorded yet. Use "Record Purchase Bill" to log incoming feedstock or medicines.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-2.5 px-3">Bill No & Date</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3">Items Summary</th>
                  <th className="py-2.5 px-3 text-right">Total Bill (₹)</th>
                  <th className="py-2.5 px-3 text-right">Paid (₹)</th>
                  <th className="py-2.5 px-3 text-right">Outstanding (₹)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{b.bill_no}</div>
                      <div className="text-[11px] text-slate-400">{b.bill_date}</div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{b.supplier_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{b.items_summary}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      ₹{b.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      ₹{b.paid_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                      ₹{b.outstanding_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant={b.payment_status === 'paid' ? 'success' : 'warning'}>
                        {b.payment_status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Supplier */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title="Add Supplier / Vendor Account"
        subtitle="Hatchery, grain trader, mineral manufacturer, or pharma vendor"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Supplier Code</label>
              <input
                type="text"
                value={newSupp.code}
                onChange={(e) => setNewSupp({ ...newSupp, code: e.target.value })}
                placeholder="SUPP-AGRO"
                required
                className="input-field font-mono uppercase"
              />
            </div>
            <div>
              <label className="input-label">Company / Firm Name</label>
              <input
                type="text"
                value={newSupp.name}
                onChange={(e) => setNewSupp({ ...newSupp, name: e.target.value })}
                placeholder="e.g. Godrej Agrovet Ltd"
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Contact Phone</label>
              <input
                type="text"
                value={newSupp.phone}
                onChange={(e) => setNewSupp({ ...newSupp, phone: e.target.value })}
                placeholder="+91 22 2500..."
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Supply Category</label>
              <select
                value={newSupp.category}
                onChange={(e) => setNewSupp({ ...newSupp, category: e.target.value as any })}
                className="input-field"
              >
                <option value="feed_ingredients">Raw Feed Ingredients (Maize/Soya)</option>
                <option value="chicks">Day-old Chicks Hatchery</option>
                <option value="medicines">Veterinary Medicines & Vaccines</option>
                <option value="equipment">Farm Equipment & Cages</option>
                <option value="general">General Farm Consumables</option>
              </select>
            </div>
          </div>

          <div>
            <label className="input-label">Opening Payable Balance (₹)</label>
            <input
              type="number"
              value={newSupp.opening_balance}
              onChange={(e) => setNewSupp({ ...newSupp, opening_balance: Number(e.target.value) })}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Address / Plant Location</label>
            <textarea
              value={newSupp.address}
              onChange={(e) => setNewSupp({ ...newSupp, address: e.target.value })}
              rows={2}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Register Supplier
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Purchase Bill */}
      <Modal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        title="Record Supplier Purchase Bill"
        subtitle="Log incoming raw materials, update stock liability, and avoid double counting"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateBill} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Select Vendor</label>
              <select
                value={billData.supplierId}
                onChange={(e) => setBillData({ ...billData, supplierId: e.target.value })}
                className="input-field font-semibold"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Vendor Bill / Invoice #</label>
              <input
                type="text"
                value={billData.billNo}
                onChange={(e) => setBillData({ ...billData, billNo: e.target.value })}
                required
                className="input-field font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Bill Date</label>
              <input
                type="date"
                value={billData.billDate}
                onChange={(e) => setBillData({ ...billData, billDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Payment Due Date</label>
              <input
                type="date"
                value={billData.dueDate}
                onChange={(e) => setBillData({ ...billData, dueDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Items Summary / Specification</label>
            <input
              type="text"
              value={billData.itemsSummary}
              onChange={(e) => setBillData({ ...billData, itemsSummary: e.target.value })}
              placeholder="e.g. 15 MT Soya Meal DOC 46%"
              required
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Total Bill Amount (₹)</label>
              <input
                type="number"
                value={billData.totalAmount}
                onChange={(e) => setBillData({ ...billData, totalAmount: Number(e.target.value) })}
                min="1"
                required
                className="input-field font-bold text-base"
              />
            </div>
            <div>
              <label className="input-label">Advance / Paid Amount (₹)</label>
              <input
                type="number"
                value={billData.paidAmount}
                onChange={(e) => setBillData({ ...billData, paidAmount: Number(e.target.value) })}
                min="0"
                max={billData.totalAmount}
                className="input-field font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsBillModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Post Purchase Bill
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Disburse Payment */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Disburse Payment — ${selectedSupplier?.name}`}
        subtitle={`Current Ledger Payable: ₹${selectedSupplier?.current_balance.toLocaleString()}`}
      >
        <form onSubmit={handleSaveDisbursement} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Payment Amount (₹)</label>
              <input
                type="number"
                value={payData.amount}
                onChange={(e) => setPayData({ ...payData, amount: Number(e.target.value) })}
                min="1"
                required
                className="input-field font-bold text-amber-700 text-base"
              />
            </div>
            <div>
              <label className="input-label">Payment Date</label>
              <input
                type="date"
                value={payData.paymentDate}
                onChange={(e) => setPayData({ ...payData, paymentDate: e.target.value })}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Disbursement Mode</label>
              <select
                value={payData.paymentMode}
                onChange={(e) => setPayData({ ...payData, paymentMode: e.target.value as any })}
                className="input-field"
              >
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="cheque">Account Payee Cheque</option>
                <option value="upi">Company UPI</option>
                <option value="cash">Cash Voucher</option>
              </select>
            </div>
            <div>
              <label className="input-label">Transaction / UTR #</label>
              <input
                type="text"
                value={payData.referenceNo}
                onChange={(e) => setPayData({ ...payData, referenceNo: e.target.value })}
                className="input-field font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Confirm Disbursement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
