'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { WeightRecord } from '@/types/database';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
import {
  Scale,
  Plus,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';

export default function WeightMonitoringPage() {
  const { weightRecords, addWeightRecord, batches, sheds, currentUser } = useFarm();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    batchId: batches[0]?.id || '',
    sampleDate: new Date().toISOString().split('T')[0],
    birdsSampled: 100,
    averageWeightGrams: 820,
    minWeightGrams: 770,
    maxWeightGrams: 870,
    targetWeightGrams: 810,
    ageDays: 75,
    notes: 'Uniform growth observed across sample tiers',
  });

  const selectedBatch = batches.find((b) => b.id === formData.batchId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    const diff = formData.averageWeightGrams - formData.targetWeightGrams;

    addWeightRecord({
      batch_id: selectedBatch.id,
      batch_code: selectedBatch.batch_code,
      shed_id: selectedBatch.current_shed_id,
      shed_code: selectedBatch.current_shed_code,
      sample_date: formData.sampleDate,
      birds_sampled: Number(formData.birdsSampled),
      average_weight_grams: Number(formData.averageWeightGrams),
      min_weight_grams: Number(formData.minWeightGrams),
      max_weight_grams: Number(formData.maxWeightGrams),
      target_weight_grams: Number(formData.targetWeightGrams),
      difference_grams: diff,
      age_days: Number(formData.ageDays),
      notes: formData.notes,
    });

    setIsModalOpen(false);
  };

  const filteredRecords = weightRecords.filter(
    (w) =>
      w.batch_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.shed_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.sample_date.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Scale className="w-6 h-6 text-emerald-600" />
            <span>Flock Weight Monitoring & Growth Curves</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Weekly sample body weight audits vs standard breed growth curves (BV300 / Lohmann)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons data={weightRecords} filename="weight-audit-records" />
          <button onClick={() => setIsModalOpen(true)} className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            <span>Record Weight Sample</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Weight Audits Conducted</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{weightRecords.length} Audits</div>
          <span className="text-xs text-emerald-600 font-medium">Standard 100-bird samples</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Flock Uniformity</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">88.5%</div>
          <span className="text-xs text-slate-500 font-medium">Within ±10% mean band</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Average Growth Adherence</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">+10 grams</div>
          <span className="text-xs text-emerald-600 font-medium">Above breed baseline</span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search flock batch, shed..."
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
              <th className="py-3 px-4">Sample Date</th>
              <th className="py-3 px-4">Flock & Shed</th>
              <th className="py-3 px-4 text-right">Age (Days)</th>
              <th className="py-3 px-4 text-right">Birds Sampled</th>
              <th className="py-3 px-4 text-right">Actual Avg Wt (g)</th>
              <th className="py-3 px-4 text-right">Breed Target (g)</th>
              <th className="py-3 px-4 text-right">Variance</th>
              <th className="py-3 px-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map((w) => {
              const isAhead = w.difference_grams >= 0;

              return (
                <tr key={w.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{w.sample_date}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {w.shed_code}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{w.batch_code}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700">{w.age_days}d</td>
                  <td className="py-3 px-4 text-right text-slate-600">{w.birds_sampled} birds</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{w.average_weight_grams} g</td>
                  <td className="py-3 px-4 text-right text-slate-500">{w.target_weight_grams} g</td>
                  <td className="py-3 px-4 text-right font-bold">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        isAhead ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {isAhead ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{w.difference_grams > 0 ? `+${w.difference_grams}` : w.difference_grams} g</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{w.notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: Record Sample */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Flock Weight Sample"
        subtitle="Sample random crates across front, middle and rear battery cages"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Select Flock Batch</label>
            <select
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              className="input-field font-semibold"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_code} ({b.current_shed_code}) — {b.bird_type} [Age: {b.age_days}d]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Sample Date</label>
              <input
                type="date"
                value={formData.sampleDate}
                onChange={(e) => setFormData({ ...formData, sampleDate: e.target.value })}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Birds Sampled (Count)</label>
              <input
                type="number"
                value={formData.birdsSampled}
                onChange={(e) => setFormData({ ...formData, birdsSampled: Number(e.target.value) })}
                min="10"
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Average Weight (grams)</label>
              <input
                type="number"
                value={formData.averageWeightGrams}
                onChange={(e) => setFormData({ ...formData, averageWeightGrams: Number(e.target.value) })}
                step="5"
                required
                className="input-field font-bold text-base text-slate-900"
              />
            </div>
            <div>
              <label className="input-label">Target Standard Weight (grams)</label>
              <input
                type="number"
                value={formData.targetWeightGrams}
                onChange={(e) => setFormData({ ...formData, targetWeightGrams: Number(e.target.value) })}
                step="5"
                required
                className="input-field font-bold text-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Flock Age in Days</label>
              <input
                type="number"
                value={formData.ageDays}
                onChange={(e) => setFormData({ ...formData, ageDays: Number(e.target.value) })}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Calculated Variance</label>
              <div className="input-field bg-slate-50 font-bold text-slate-900 flex items-center">
                {formData.averageWeightGrams - formData.targetWeightGrams > 0 ? '+' : ''}
                {formData.averageWeightGrams - formData.targetWeightGrams} grams
              </div>
            </div>
          </div>

          <div>
            <label className="input-label">Audit Notes & Uniformity</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Weight Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
