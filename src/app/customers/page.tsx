'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { Customer } from '@/types/database';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Receipt,
  AlertCircle,
} from 'lucide-react';

export default function CustomersPage() {
  const { customers, addCustomer, eggSales, birdSales, recordPayment, currentUser } = useFarm();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    customer_type: 'egg_buyer' as 'egg_buyer' | 'bird_buyer' | 'both',
    opening_balance: 0,
    credit_limit: 500000,
    address: '',
  });

  // Payment Receipt State
  const [paymentData, setPaymentData] = useState({
    amount: 10000,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'bank_transfer' as 'cash' | 'bank_transfer' | 'upi' | 'cheque',
    referenceNo: '',
    notes: 'Partial ledger settlement against invoices',
  });

  const totalReceivables = customers.reduce((sum, c) => sum + c.current_balance, 0);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      customer_type: formData.customer_type,
      opening_balance: Number(formData.opening_balance),
      current_balance: Number(formData.opening_balance),
      credit_limit: Number(formData.credit_limit),
      address: formData.address,
    });
    setIsCustomerModalOpen(false);
  };

  const handleOpenReceipt = (cust: Customer) => {
    setSelectedCustomer(cust);
    setPaymentData({
      amount: Math.min(cust.current_balance, 25000),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'bank_transfer',
      referenceNo: `UTR-${Date.now().toString().slice(-6)}`,
      notes: 'Customer collection receipt',
    });
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    recordPayment({
      receipt_no: `REC-${Date.now().toString().slice(-6)}`,
      type: 'customer_receipt',
      party_type: 'customer',
      party_id: selectedCustomer.id,
      party_name: selectedCustomer.name,
      amount: Number(paymentData.amount),
      payment_date: paymentData.paymentDate,
      payment_mode: paymentData.paymentMode,
      reference_no: paymentData.referenceNo,
      notes: paymentData.notes,
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
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Customers & Buyer Accounts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Wholesale egg buyers, live bird traders, credit limits, invoices, and payment receipts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons data={customers} filename="customers-roster" />
          <button onClick={() => setIsCustomerModalOpen(true)} className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            <span>Add Customer Account</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Receivables</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            ₹{totalReceivables.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Outstanding buyer balances</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Customer Accounts</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{customers.length} Accounts</div>
          <span className="text-xs text-slate-500 font-medium">Egg & live bird buyers</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Average Credit Limit</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">₹4,00,000</div>
          <span className="text-xs text-emerald-600 font-medium">Safe commercial terms</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer name, phone, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9 py-2 text-xs"
          />
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCustomers.map((cust) => {
          const isHighCredit = cust.current_balance > cust.credit_limit * 0.8;

          return (
            <div
              key={cust.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{cust.name}</h3>
                    <Badge variant="info">
                      {cust.customer_type === 'egg_buyer'
                        ? 'Egg Wholesaler'
                        : cust.customer_type === 'bird_buyer'
                        ? 'Bird Trader'
                        : 'Eggs & Birds'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Balance Due</span>
                    <div className="text-base font-black text-rose-600">
                      ₹{cust.current_balance.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cust.phone}</span>
                  </div>
                  {cust.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cust.email}</span>
                    </div>
                  )}
                  {cust.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{cust.address}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                  <span>Credit Limit:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{cust.credit_limit.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {isHighCredit && <span className="text-amber-600 font-semibold">Near Credit Cap</span>}
                </span>
                <button
                  onClick={() => handleOpenReceipt(cust)}
                  className="btn-secondary text-xs gap-1.5 py-1 px-3"
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Receive Payment</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Add Customer / Buyer Account"
        subtitle="Register new egg merchant or live bird trader"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="input-label">Customer / Trading Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Bangalore Egg Wholesalers"
              required
              className="input-field font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98450 00000"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Buyer Category</label>
              <select
                value={formData.customer_type}
                onChange={(e) => setFormData({ ...formData, customer_type: e.target.value as any })}
                className="input-field"
              >
                <option value="egg_buyer">Table Eggs Wholesaler</option>
                <option value="bird_buyer">Live Spent Hen / Bird Buyer</option>
                <option value="both">Both Eggs & Birds</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Opening Balance (₹)</label>
              <input
                type="number"
                value={formData.opening_balance}
                onChange={(e) => setFormData({ ...formData, opening_balance: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Credit Limit (₹)</label>
              <input
                type="number"
                value={formData.credit_limit}
                onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                step="50000"
                required
                className="input-field font-bold"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Mandi / Market Yard Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Register Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Receive Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Receive Payment — ${selectedCustomer?.name}`}
        subtitle={`Current Ledger Outstanding: ₹${selectedCustomer?.current_balance.toLocaleString()}`}
      >
        <form onSubmit={handleSavePayment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Amount Received (₹)</label>
              <input
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                min="1"
                required
                className="input-field font-bold text-emerald-700 text-base"
              />
            </div>
            <div>
              <label className="input-label">Payment Date</label>
              <input
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Payment Mode</label>
              <select
                value={paymentData.paymentMode}
                onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value as any })}
                className="input-field"
              >
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="upi">UPI / QR Code</option>
                <option value="cheque">Bank Cheque</option>
                <option value="cash">Cash Collection</option>
              </select>
            </div>
            <div>
              <label className="input-label">UTR / Reference No.</label>
              <input
                type="text"
                value={paymentData.referenceNo}
                onChange={(e) => setPaymentData({ ...paymentData, referenceNo: e.target.value })}
                placeholder="UTR, cheque #..."
                className="input-field font-mono"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Receipt Remarks</label>
            <textarea
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              rows={2}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Record Collection Receipt
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
