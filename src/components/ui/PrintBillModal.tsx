'use client';

import React from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { EggSale, BirdSale, SupplierBill, PaymentTransaction, convertEggsToTrays } from '@/types/database';
import { formatNumber, formatCurrency } from '@/lib/utils/formatters';
import { Printer, X, Download, ShieldCheck, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export type BillType = 'egg_sale' | 'bird_sale' | 'supplier_bill' | 'payment_receipt';

interface PrintBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  billType: BillType;
  data: EggSale | BirdSale | SupplierBill | PaymentTransaction | null;
}

// Convert numbers to Indian Rupees words
function numberToIndianRupees(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen ',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(num);
  const paise = Math.round((num - n) * 100);

  function convertChunk(val: number): string {
    let str = '';
    if (val > 99) {
      str += a[Math.floor(val / 100)] + 'Hundred ';
      val %= 100;
    }
    if (val > 19) {
      str += b[Math.floor(val / 10)] + ' ' + a[val % 10];
    } else if (val > 0) {
      str += a[val];
    }
    return str;
  }

  let words = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remainder = n % 1000;

  if (crore > 0) words += convertChunk(crore) + 'Crore ';
  if (lakh > 0) words += convertChunk(lakh) + 'Lakh ';
  if (thousand > 0) words += convertChunk(thousand) + 'Thousand ';
  if (remainder > 0) words += convertChunk(remainder);

  words = words.trim() + ' Rupees';

  if (paise > 0) {
    words += ' and ' + convertChunk(paise).trim() + ' Paise';
  }

  return words + ' Only';
}

export default function PrintBillModal({ isOpen, onClose, billType, data }: PrintBillModalProps) {
  const { farmProfile, customers, suppliers } = useFarm();

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  // Find customer or supplier details if relevant
  let recipientName = '';
  let recipientPhone = '';
  let recipientEmail = '';
  let recipientAddress = '';

  if (billType === 'egg_sale') {
    const sale = data as EggSale;
    recipientName = sale.customer_name;
    const cust = customers.find((c) => c.id === sale.customer_id || c.name === sale.customer_name);
    if (cust) {
      recipientPhone = cust.phone || '';
      recipientEmail = cust.email || '';
      recipientAddress = cust.address || '';
    }
  } else if (billType === 'bird_sale') {
    const sale = data as BirdSale;
    recipientName = sale.customer_name;
    const cust = customers.find((c) => c.id === sale.customer_id || c.name === sale.customer_name);
    if (cust) {
      recipientPhone = cust.phone || '';
      recipientEmail = cust.email || '';
      recipientAddress = cust.address || '';
    }
  } else if (billType === 'supplier_bill') {
    const bill = data as SupplierBill;
    recipientName = bill.supplier_name;
    const supp = suppliers.find((s) => s.id === bill.supplier_id || s.name === bill.supplier_name);
    if (supp) {
      recipientPhone = supp.phone || '';
      recipientEmail = supp.email || '';
      recipientAddress = supp.address || '';
    }
  } else if (billType === 'payment_receipt') {
    const pay = data as PaymentTransaction;
    recipientName = pay.party_name;
    if (pay.party_type === 'customer') {
      const cust = customers.find((c) => c.id === pay.party_id || c.name === pay.party_name);
      if (cust) {
        recipientPhone = cust.phone || '';
        recipientEmail = cust.email || '';
        recipientAddress = cust.address || '';
      }
    } else if (pay.party_type === 'supplier') {
      const supp = suppliers.find((s) => s.id === pay.party_id || s.name === pay.party_name);
      if (supp) {
        recipientPhone = supp.phone || '';
        recipientEmail = supp.email || '';
        recipientAddress = supp.address || '';
      }
    }
  }

  // Get Bill Title, Type Label, Number & Timestamps (Clean, Simple, No GST)
  let billTitle = 'BILL';
  let billTypeLabel = 'Bill';
  let billNumber = '';
  let billDate = '';
  let paymentStatus: string = '';
  let grandTotal = 0;

  if (billType === 'egg_sale') {
    const sale = data as EggSale;
    billTitle = 'EGG SALE BILL';
    billTypeLabel = 'Egg Sale Bill';
    billNumber = sale.invoice_no;
    billDate = sale.sale_date;
    paymentStatus = sale.payment_status;
    grandTotal = sale.net_amount;
  } else if (billType === 'bird_sale') {
    const sale = data as BirdSale;
    billTitle = 'LIVE BIRD SALE BILL';
    billTypeLabel = 'Live Bird Sale Bill';
    billNumber = sale.invoice_no;
    billDate = sale.sale_date;
    paymentStatus = sale.payment_status;
    grandTotal = sale.net_amount;
  } else if (billType === 'supplier_bill') {
    const bill = data as SupplierBill;
    billTitle = 'PURCHASE BILL';
    billTypeLabel = 'Supplier Purchase Bill';
    billNumber = bill.bill_no;
    billDate = bill.bill_date;
    paymentStatus = bill.payment_status;
    grandTotal = bill.total_amount;
  } else if (billType === 'payment_receipt') {
    const pay = data as PaymentTransaction;
    billTitle =
      pay.type === 'customer_receipt'
        ? 'PAYMENT RECEIPT'
        : 'PAYMENT VOUCHER';
    billTypeLabel =
      pay.type === 'customer_receipt' ? 'Customer Payment Receipt' : 'Supplier Payment Voucher';
    billNumber = pay.receipt_no;
    billDate = pay.payment_date;
    paymentStatus = 'paid';
    grandTotal = pay.amount;
  }

  // Format Date and Time
  const rawCreatedAt = (data as { created_at?: string })?.created_at;
  let formattedTime = '';
  if (rawCreatedAt) {
    try {
      const dt = new Date(rawCreatedAt);
      if (!isNaN(dt.getTime())) {
        formattedTime = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    } catch {
      // fallback
    }
  }
  if (!formattedTime) {
    formattedTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  const billDateTime = `${billDate} at ${formattedTime}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none">
        {/* Action Controls Bar (Hidden during printing) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Bill Print Preview — {billNumber}
              </span>
              <span className="text-[11px] text-slate-400">
                A4-ready print format • KASTHURI POULTRY FARM
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-primary py-1.5 px-4 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-500 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Bill Area */}
        <div
          id="printable-bill-area"
          className="p-6 sm:p-8 bg-white text-slate-900 text-xs font-sans print:p-6 print:text-black"
        >
          {/* Clean, Simple & Neat Official Bill Header */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              {/* Company Name & Address */}
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-slate-900 font-serif print:text-2xl">
                  {farmProfile?.farm_name || 'KASTHURI POULTRY FARM'}
                </h1>
                {farmProfile?.tagline && (
                  <p className="text-xs font-semibold text-slate-600 tracking-wide mt-0.5 uppercase">
                    {farmProfile.tagline}
                  </p>
                )}
                <div className="mt-1.5 text-xs text-slate-700 space-y-0.5 max-w-lg leading-relaxed">
                  <p className="font-medium text-slate-800">
                    <strong className="text-slate-900">Address: </strong>
                    {farmProfile?.address || 'Kasthuri Poultry Farm, Dharapuram Road, Tirupur, Tamil Nadu'}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-slate-700 text-xs pt-0.5">
                    {farmProfile?.phone && <span><strong>Phone:</strong> {farmProfile.phone}</span>}
                    {farmProfile?.email && <span><strong>Email:</strong> {farmProfile.email}</span>}
                  </div>
                </div>
              </div>

              {/* Bill Details Box: Bill Type, Bill No, Date & Time, Payment Status */}
              <div className="bg-slate-50 border border-slate-300 p-3 rounded-lg text-left sm:text-right min-w-[230px] print:bg-white print:border-slate-400">
                <div className="inline-block bg-slate-900 text-white font-extrabold text-xs tracking-wider uppercase px-2.5 py-1 rounded mb-2">
                  {billTitle}
                </div>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-slate-600 font-semibold">Bill Type: </span>
                    <strong className="text-slate-900">{billTypeLabel}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold">Bill No: </span>
                    <strong className="text-slate-900 font-mono text-sm">{billNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold">Date & Time: </span>
                    <strong className="text-slate-900">{billDateTime}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold">Payment Status: </span>
                    <span
                      className={`inline-block font-black uppercase text-[10px] px-2 py-0.5 rounded ml-1 ${
                        paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : paymentStatus === 'partial'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {paymentStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Party Details (Billed To / Received From / Supplier) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-5 text-[11px] print:bg-white print:border-slate-300">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                {billType === 'supplier_bill'
                  ? 'Supplier Details (Invoiced By):'
                  : billType === 'payment_receipt'
                  ? 'Party Details:'
                  : 'Billed To (Customer / Buyer):'}
              </span>
              <div className="font-bold text-slate-900 text-sm">{recipientName || 'Counter Cash Sale'}</div>
              {recipientAddress && <div className="text-slate-600 mt-0.5 leading-snug">{recipientAddress}</div>}
              <div className="flex flex-wrap gap-x-3 text-slate-600 mt-1">
                {recipientPhone && <span>Phone: {recipientPhone}</span>}
                {recipientEmail && <span>Email: {recipientEmail}</span>}
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Transaction References:
              </span>
              {billType === 'egg_sale' && (
                <>
                  <div>
                    <span className="text-slate-500">Egg Grade / Type: </span>
                    <strong className="capitalize">{(data as EggSale).egg_category} Table Eggs</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Standard Conversion: </span>
                    <span>30 Eggs = 1 Full Commercial Tray</span>
                  </div>
                  {(data as EggSale).payment_mode && (
                    <div>
                      <span className="text-slate-500">Payment Mode: </span>
                      <strong className="uppercase">{(data as EggSale).payment_mode}</strong>
                    </div>
                  )}
                </>
              )}

              {billType === 'bird_sale' && (
                <>
                  <div>
                    <span className="text-slate-500">Flock Shed / Batch: </span>
                    <strong>Shed {(data as BirdSale).shed_code} ({(data as BirdSale).batch_code})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Pricing Basis: </span>
                    <strong className="uppercase">Rate per {(data as BirdSale).pricing_basis === 'per_kg' ? 'Kilogram (Kg)' : 'Live Bird'}</strong>
                  </div>
                </>
              )}

              {billType === 'supplier_bill' && (
                <>
                  <div>
                    <span className="text-slate-500">Payment Due Date: </span>
                    <strong className="text-rose-700">{(data as SupplierBill).due_date}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Voucher Status: </span>
                    <strong className="uppercase">{(data as SupplierBill).bill_status || 'Active'}</strong>
                  </div>
                </>
              )}

              {billType === 'payment_receipt' && (
                <>
                  <div>
                    <span className="text-slate-500">Settlement Mode: </span>
                    <strong className="uppercase">{(data as PaymentTransaction).payment_mode}</strong>
                  </div>
                  {(data as PaymentTransaction).reference_no && (
                    <div>
                      <span className="text-slate-500">UTR / Ref No: </span>
                      <strong className="font-mono">{(data as PaymentTransaction).reference_no}</strong>
                    </div>
                  )}
                  {(data as PaymentTransaction).allocated_invoice_or_bill_id && (
                    <div>
                      <span className="text-slate-500">Allocated Against: </span>
                      <strong>{(data as PaymentTransaction).allocated_invoice_or_bill_id}</strong>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-5 overflow-hidden border border-slate-300 rounded-lg">
            {billType === 'egg_sale' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px] text-slate-700">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Description of Goods</th>
                    <th className="py-2.5 px-3 text-right">Total Eggs</th>
                    <th className="py-2.5 px-3 text-right">Packaging (30s)</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(() => {
                    const s = data as EggSale;
                    const traysInfo = convertEggsToTrays(s.total_eggs);
                    return (
                      <tr>
                        <td className="py-3 px-3 font-semibold text-slate-500">1</td>
                        <td className="py-3 px-3">
                          <strong className="text-slate-900 block font-bold">
                            Commercial Table Eggs ({s.egg_category.toUpperCase()} GRADE)
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            Farm fresh daily egg dispatch • Packed in standardized paper pulp trays
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 text-sm">
                          {formatNumber(s.total_eggs)}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-700">
                          {formatNumber(traysInfo.trays)} Trays
                          {traysInfo.loose > 0 ? ` + ${traysInfo.loose} Loose` : ''}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium">
                          ₹{s.price_per_egg.toFixed(2)} / egg
                          <div className="text-[10px] text-slate-500">
                            (₹{(s.price_per_egg * 30).toFixed(2)} / tray)
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 text-sm">
                          {formatCurrency(s.gross_amount, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            )}

            {billType === 'bird_sale' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px] text-slate-700">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Description of Poultry Stock</th>
                    <th className="py-2.5 px-3 text-right">Bird Quantity</th>
                    <th className="py-2.5 px-3 text-right">Avg Wt / Total Wt</th>
                    <th className="py-2.5 px-3 text-right">Rate Basis</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(() => {
                    const s = data as BirdSale;
                    return (
                      <tr>
                        <td className="py-3 px-3 font-semibold text-slate-500">1</td>
                        <td className="py-3 px-3">
                          <strong className="text-slate-900 block font-bold">
                            Live Flock Sale — Shed {s.shed_code} ({s.batch_code})
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            Culled / Spent layer birds weighed on farm vehicle bridge scale
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 text-sm">
                          {formatNumber(s.bird_quantity)} birds
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-700">
                          {s.average_weight_kg} kg/bird
                          <div className="font-bold text-slate-900">{formatNumber(s.total_weight_kg)} kg Total</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium">
                          ₹{s.price_per_bird_or_kg.toFixed(2)} / {s.pricing_basis === 'per_kg' ? 'kg' : 'bird'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 text-sm">
                          {formatCurrency(s.gross_amount, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            )}

            {billType === 'supplier_bill' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px] text-slate-700">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Purchased Material & Specifications</th>
                    <th className="py-2.5 px-3">Supplier Category</th>
                    <th className="py-2.5 px-3 text-right">Invoiced Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(() => {
                    const b = data as SupplierBill;
                    return (
                      <tr>
                        <td className="py-3 px-3 font-semibold text-slate-500">1</td>
                        <td className="py-3 px-3">
                          <strong className="text-slate-900 block font-bold">{b.items_summary}</strong>
                          <span className="text-[11px] text-slate-500">
                            Supplied by {b.supplier_name} • Verification completed upon inward gate entry
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700 capitalize">
                          Feed / Vet / Poultry Supplies
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 text-sm">
                          {formatCurrency(b.total_amount)}
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            )}

            {billType === 'payment_receipt' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px] text-slate-700">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Transaction Description</th>
                    <th className="py-2.5 px-3">Payment Channel</th>
                    <th className="py-2.5 px-3 text-right">Settled Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(() => {
                    const p = data as PaymentTransaction;
                    return (
                      <tr>
                        <td className="py-3 px-3 font-semibold text-slate-500">1</td>
                        <td className="py-3 px-3">
                          <strong className="text-slate-900 block font-bold">
                            {p.type === 'customer_receipt' ? 'Customer Account Receipt' : 'Supplier Account Disbursement'}
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            Party: {p.party_name} {p.notes ? `• ${p.notes}` : ''}
                          </span>
                        </td>
                        <td className="py-3 px-3 uppercase font-medium text-slate-700">
                          {p.payment_mode} {p.reference_no ? `(Ref: ${p.reference_no})` : ''}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 text-sm">
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            )}
          </div>

          {/* Financial Breakdown & Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* Amount in words & Bank Details */}
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 print:border-slate-300">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Amount Chargeable (in words):
                </span>
                <p className="font-bold text-slate-900 text-xs mt-1 leading-snug">
                  {numberToIndianRupees(grandTotal)}
                </p>
              </div>

              {farmProfile?.bank_account_no && (
                <div className="p-3 border border-dashed border-slate-300 rounded-lg text-[11px] space-y-1">
                  <div className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                    Bank Remittance Account Details:
                  </div>
                  <div className="text-slate-600">
                    Bank: <strong>{farmProfile.bank_name || 'State Bank of India'}</strong> | Branch:{' '}
                    <strong>{farmProfile.bank_branch || 'Main Branch'}</strong>
                  </div>
                  <div className="text-slate-600">
                    A/C No: <strong className="font-mono">{farmProfile.bank_account_no}</strong> | IFSC:{' '}
                    <strong className="font-mono uppercase">{farmProfile.bank_ifsc || 'SBIN0001245'}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs print:bg-white print:border-slate-300">
              {billType === 'egg_sale' && (
                <>
                  {(() => {
                    const s = data as EggSale;
                    return (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal (Gross Value):</span>
                          <span>{formatCurrency(s.gross_amount)}</span>
                        </div>
                        {s.discount_amount > 0 && (
                          <div className="flex justify-between text-rose-600">
                            <span>Discount Allowed:</span>
                            <span>-{formatCurrency(s.discount_amount)}</span>
                          </div>
                        )}
                        <div className="border-t-2 border-slate-300 pt-2 flex justify-between font-black text-slate-900 text-sm">
                          <span>Total Amount:</span>
                          <span>{formatCurrency(s.net_amount)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-bold pt-1">
                          <span>Amount Paid / Received:</span>
                          <span>{formatCurrency(s.paid_amount)}</span>
                        </div>
                        <div className="flex justify-between text-rose-700 font-bold border-t border-slate-200 pt-1">
                          <span>Balance Outstanding:</span>
                          <span>{formatCurrency(s.outstanding_amount)}</span>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}

              {billType === 'bird_sale' && (
                <>
                  {(() => {
                    const s = data as BirdSale;
                    return (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>Gross Bird Valuation:</span>
                          <span>{formatCurrency(s.gross_amount)}</span>
                        </div>
                        {s.transport_charges > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span>Transport Charges:</span>
                            <span>+{formatCurrency(s.transport_charges)}</span>
                          </div>
                        )}
                        <div className="border-t-2 border-slate-300 pt-2 flex justify-between font-black text-slate-900 text-sm">
                          <span>Total Amount:</span>
                          <span>{formatCurrency(s.net_amount)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-bold pt-1">
                          <span>Amount Paid:</span>
                          <span>{formatCurrency(s.paid_amount)}</span>
                        </div>
                        <div className="flex justify-between text-rose-700 font-bold border-t border-slate-200 pt-1">
                          <span>Balance Due:</span>
                          <span>{formatCurrency(s.outstanding_amount)}</span>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}

              {billType === 'supplier_bill' && (
                <>
                  {(() => {
                    const b = data as SupplierBill;
                    return (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>Gross Bill Value:</span>
                          <span>{formatCurrency(b.total_amount)}</span>
                        </div>
                        <div className="border-t-2 border-slate-300 pt-2 flex justify-between font-black text-slate-900 text-sm">
                          <span>Total Amount:</span>
                          <span>{formatCurrency(b.total_amount)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-bold pt-1">
                          <span>Amount Disbursed:</span>
                          <span>{formatCurrency(b.paid_amount)}</span>
                        </div>
                        <div className="flex justify-between text-rose-700 font-bold border-t border-slate-200 pt-1">
                          <span>Pending Payable Balance:</span>
                          <span>{formatCurrency(b.outstanding_amount)}</span>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}

              {billType === 'payment_receipt' && (
                <>
                  {(() => {
                    const p = data as PaymentTransaction;
                    return (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>Voucher Type:</span>
                          <span className="font-semibold uppercase">{p.type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Transaction Mode:</span>
                          <span className="font-semibold uppercase font-mono">{p.payment_mode}</span>
                        </div>
                        <div className="border-t-2 border-slate-300 pt-2 flex justify-between font-black text-slate-900 text-sm">
                          <span>Total Amount Settled:</span>
                          <span className="text-emerald-700">{formatCurrency(p.amount)}</span>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>

          {/* Simple Note & Acknowledgment */}
          <div className="border-t border-slate-200 pt-3 text-xs text-slate-500 mb-6">
            <p className="italic">
              Thank you for your business! Please inspect goods upon receipt.
            </p>
          </div>

          {/* Signature Block */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300">
            <div className="text-center">
              <div className="h-12 flex items-end justify-center">
                <span className="text-slate-400 italic text-xs">Customer acknowledgment</span>
              </div>
              <div className="border-t border-slate-400 pt-1.5">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-xs block">
                  Customer / Receiver Signature
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="h-12 flex items-end justify-center">
                <div className="text-emerald-800 font-bold text-xs uppercase tracking-wider">
                  For {farmProfile?.farm_name || 'KASTHURI POULTRY FARM'}
                </div>
              </div>
              <div className="border-t border-slate-400 pt-1.5">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-xs block">
                  Authorized Signatory
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Close bar for mobile/desktop preview */}
        <div className="no-print bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Tip: In Chrome / Edge print dialog, select <strong>Save as PDF</strong> under Destination.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary py-1.5 px-4 text-xs font-bold gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
