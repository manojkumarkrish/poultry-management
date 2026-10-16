'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { ElectricityBill, EmployeeSalary, PaymentStatus } from '@/types/database';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
import {
  Zap,
  Users,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  CreditCard,
  Gauge,
} from 'lucide-react';

export default function ElectricityAndLabourPage() {
  const { electricityBills, addElectricityBill, salaries, addSalaryRecord, sheds, currentUser } = useFarm();
  const [activeTab, setActiveTab] = useState<'electricity' | 'labour'>('electricity');

  const [isElecModalOpen, setIsElecModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);

  // Electricity Form
  const [elecForm, setElecForm] = useState({
    billingMonth: '2026-10',
    meterNumber: 'EB-MTR-98214',
    previousReading: 48250,
    currentReading: 54600,
    ratePerUnit: 7.8,
    dueDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
    shedId: sheds[0]?.id || '',
    notes: 'Power grid bill for Layer Sheds ventilation and lighting',
  });

  // Salary Form
  const [salForm, setSalForm] = useState({
    employeeName: '',
    roleDesignation: 'Shed Attendant',
    assignedShedCode: 'L1',
    month: '2026-10',
    basicSalary: 22000,
    allowances: 2000,
    deductions: 0,
  });

  // Electricity calculations
  const unitsConsumed = Math.max(0, elecForm.currentReading - elecForm.previousReading);
  const totalElecAmount = unitsConsumed * elecForm.ratePerUnit;

  const handleCreateElecBill = (e: React.FormEvent) => {
    e.preventDefault();
    const shed = sheds.find((s) => s.id === elecForm.shedId);

    addElectricityBill({
      billing_month: elecForm.billingMonth,
      meter_number: elecForm.meterNumber,
      previous_reading: Number(elecForm.previousReading),
      current_reading: Number(elecForm.currentReading),
      units_consumed: unitsConsumed,
      rate_per_unit: Number(elecForm.ratePerUnit),
      total_amount: Number(totalElecAmount.toFixed(2)),
      due_date: elecForm.dueDate,
      shed_id: shed?.id,
      shed_code: shed?.code,
      status: 'unpaid',
      notes: elecForm.notes,
    });

    setIsElecModalOpen(false);
  };

  const handleCreateSalary = (e: React.FormEvent) => {
    e.preventDefault();
    const net = Number(salForm.basicSalary) + Number(salForm.allowances) - Number(salForm.deductions);

    addSalaryRecord({
      employee_name: salForm.employeeName,
      role_designation: salForm.roleDesignation,
      assigned_shed_code: salForm.assignedShedCode,
      month: salForm.month,
      basic_salary: Number(salForm.basicSalary),
      allowances: Number(salForm.allowances),
      deductions_or_advance: Number(salForm.deductions),
      net_salary: net,
      payment_status: 'paid',
      payment_date: new Date().toISOString().split('T')[0],
    });

    setIsSalaryModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            <span>Electricity & Labour Operations</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Meter readings, units consumed, grid billing, workforce assignments, and salary payrolls
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'electricity' ? (
            <button onClick={() => setIsElecModalOpen(true)} className="btn-primary gap-1.5 text-xs">
              <Plus className="w-4 h-4" />
              <span>Log Meter Bill</span>
            </button>
          ) : (
            <button onClick={() => setIsSalaryModalOpen(true)} className="btn-primary gap-1.5 text-xs">
              <Plus className="w-4 h-4" />
              <span>Record Salary Payroll</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('electricity')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'electricity'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            ⚡ Electricity & Energy Units ({electricityBills.length})
          </button>
          <button
            onClick={() => setActiveTab('labour')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'labour'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            👷 Labour & Staff Payroll ({salaries.length})
          </button>
        </nav>
      </div>

      {/* TAB 1: ELECTRICITY */}
      {activeTab === 'electricity' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4">Meter Number</th>
                  <th className="py-3 px-4">Shed Bay</th>
                  <th className="py-3 px-4 text-right">Prev Reading</th>
                  <th className="py-3 px-4 text-right">Current Reading</th>
                  <th className="py-3 px-4 text-right">Units (kWh)</th>
                  <th className="py-3 px-4 text-right">Rate/Unit (₹)</th>
                  <th className="py-3 px-4 text-right">Bill Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {electricityBills.map((eb) => (
                  <tr key={eb.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{eb.billing_month}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{eb.meter_number}</td>
                    <td className="py-3 px-4">
                      {eb.shed_code ? (
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {eb.shed_code}
                        </span>
                      ) : (
                        <span className="text-slate-400">All Sheds</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">{eb.previous_reading.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {eb.current_reading.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-700">
                      {eb.units_consumed.toLocaleString()} kWh
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">₹{eb.rate_per_unit}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      ₹{eb.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={eb.status === 'paid' ? 'success' : 'warning'}>
                        {eb.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LABOUR */}
      {activeTab === 'labour' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Assigned Shed</th>
                  <th className="py-3 px-4">Payroll Month</th>
                  <th className="py-3 px-4 text-right">Basic Pay (₹)</th>
                  <th className="py-3 px-4 text-right">Allowances</th>
                  <th className="py-3 px-4 text-right">Advances/Deductions</th>
                  <th className="py-3 px-4 text-right">Net Paid (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salaries.map((sal) => (
                  <tr key={sal.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{sal.employee_name}</td>
                    <td className="py-3 px-4 text-slate-700">{sal.role_designation}</td>
                    <td className="py-3 px-4">
                      {sal.assigned_shed_code ? (
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {sal.assigned_shed_code}
                        </span>
                      ) : (
                        <span className="text-slate-400">General</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{sal.month}</td>
                    <td className="py-3 px-4 text-right text-slate-700">₹{sal.basic_salary.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-emerald-700">+₹{sal.allowances.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-rose-600">
                      -₹{sal.deductions_or_advance.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      ₹{sal.net_salary.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={sal.payment_status === 'paid' ? 'success' : 'warning'}>
                        {sal.payment_status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Log Electricity Bill */}
      <Modal
        isOpen={isElecModalOpen}
        onClose={() => setIsElecModalOpen(false)}
        title="Log Electricity Meter Reading & Bill"
        subtitle="Record transformer/sub-meter reading and units consumed"
      >
        <form onSubmit={handleCreateElecBill} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Billing Month</label>
              <input
                type="month"
                value={elecForm.billingMonth}
                onChange={(e) => setElecForm({ ...elecForm, billingMonth: e.target.value })}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Meter Number</label>
              <input
                type="text"
                value={elecForm.meterNumber}
                onChange={(e) => setElecForm({ ...elecForm, meterNumber: e.target.value })}
                required
                className="input-field font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Previous Meter Reading</label>
              <input
                type="number"
                value={elecForm.previousReading}
                onChange={(e) => setElecForm({ ...elecForm, previousReading: Number(e.target.value) })}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Current Meter Reading</label>
              <input
                type="number"
                value={elecForm.currentReading}
                onChange={(e) => setElecForm({ ...elecForm, currentReading: Number(e.target.value) })}
                required
                className="input-field font-bold"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-900">
              Units Consumed: <strong>{unitsConsumed.toLocaleString()} kWh</strong>
            </span>
            <span className="font-bold text-amber-900">
              Bill: ₹{totalElecAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Rate / Unit (₹)</label>
              <input
                type="number"
                value={elecForm.ratePerUnit}
                onChange={(e) => setElecForm({ ...elecForm, ratePerUnit: Number(e.target.value) })}
                step="0.1"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Payment Due Date</label>
              <input
                type="date"
                value={elecForm.dueDate}
                onChange={(e) => setElecForm({ ...elecForm, dueDate: e.target.value })}
                required
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Shed Allocation</label>
            <select
              value={elecForm.shedId}
              onChange={(e) => setElecForm({ ...elecForm, shedId: e.target.value })}
              className="input-field"
            >
              <option value="">Farm Wide Main Transformer</option>
              {sheds.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsElecModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Electricity Bill
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Salary */}
      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title="Record Employee Salary Payroll"
        subtitle="Log monthly farm labour wages, deductions and allowances"
      >
        <form onSubmit={handleCreateSalary} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Employee Full Name</label>
              <input
                type="text"
                value={salForm.employeeName}
                onChange={(e) => setSalForm({ ...salForm, employeeName: e.target.value })}
                placeholder="Ramu Murugan"
                required
                className="input-field font-semibold"
              />
            </div>
            <div>
              <label className="input-label">Designation / Role</label>
              <input
                type="text"
                value={salForm.roleDesignation}
                onChange={(e) => setSalForm({ ...salForm, roleDesignation: e.target.value })}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Assigned Shed</label>
              <select
                value={salForm.assignedShedCode}
                onChange={(e) => setSalForm({ ...salForm, assignedShedCode: e.target.value })}
                className="input-field font-semibold"
              >
                {sheds.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.code} ({s.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Payroll Month</label>
              <input
                type="month"
                value={salForm.month}
                onChange={(e) => setSalForm({ ...salForm, month: e.target.value })}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="input-label">Basic Salary (₹)</label>
              <input
                type="number"
                value={salForm.basicSalary}
                onChange={(e) => setSalForm({ ...salForm, basicSalary: Number(e.target.value) })}
                required
                className="input-field font-bold"
              />
            </div>
            <div>
              <label className="input-label">Allowances (₹)</label>
              <input
                type="number"
                value={salForm.allowances}
                onChange={(e) => setSalForm({ ...salForm, allowances: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Advances / Deduct (₹)</label>
              <input
                type="number"
                value={salForm.deductions}
                onChange={(e) => setSalForm({ ...salForm, deductions: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsSalaryModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Confirm Payroll Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
