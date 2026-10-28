'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { DailyEggRecord, convertEggsToTrays, calculateEggProductionPct } from '@/types/database';
import { formatNumber } from '@/lib/utils/formatters';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import {
  Egg,
  Plus,
  Search,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

export default function EggProductionPage() {
  const {
    sheds,
    batches,
    dailyEggRecords,
    addDailyEggRecord,
    updateDailyEggRecord,
    deleteDailyEggRecord,
    currentUser,
    canEdit,
    canDelete,
  } = useFarm();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShed, setSelectedShed] = useState<string>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DailyEggRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<DailyEggRecord | null>(null);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Form State
  const layerSheds = sheds.filter((s) => s.shed_type === 'layer');
  const [formData, setFormData] = useState({
    collection_date: new Date().toISOString().split('T')[0],
    shed_id: layerSheds[0]?.id || '',
    total_eggs: 16500,
    damaged_eggs: 110,
    broken_eggs: 40,
    notes: 'Morning and afternoon conveyor collections',
  });

  const activeShed = sheds.find((s) => s.id === formData.shed_id);
  const activeBatch = batches.find((b) => b.current_shed_id === formData.shed_id);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtered
  const filteredRecords = dailyEggRecords.filter((r) => {
    const matchesSearch =
      r.shed_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.batch_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.collection_date.includes(searchTerm);
    const matchesShed = selectedShed === 'all' || r.shed_id === selectedShed;
    const matchesStart = !startDate || r.collection_date >= startDate;
    const matchesEnd = !endDate || r.collection_date <= endDate;
    return matchesSearch && matchesShed && matchesStart && matchesEnd;
  });

  // Calculations for period egg statistics
  const totalEggsCollected = filteredRecords.reduce((sum, r) => sum + r.total_eggs_collected, 0);
  const totalGoodEggs = filteredRecords.reduce((sum, r) => sum + r.good_eggs, 0);
  const totalTrays = convertEggsToTrays(totalGoodEggs);

  const handleOpenAdd = () => {
    setFormData({
      collection_date: new Date().toISOString().split('T')[0],
      shed_id: layerSheds[0]?.id || '',
      total_eggs: 16500,
      damaged_eggs: 110,
      broken_eggs: 40,
      notes: 'Standard conveyor harvest',
    });
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: DailyEggRecord) => {
    setFormData({
      collection_date: rec.collection_date,
      shed_id: rec.shed_id,
      total_eggs: rec.total_eggs_collected,
      damaged_eggs: rec.damaged_eggs,
      broken_eggs: rec.broken_eggs,
      notes: rec.notes || '',
    });
    setEditingRecord(rec);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShed) return;
    const batch = activeBatch || batches.find((b) => b.id === (editingRecord ? editingRecord.batch_id : ''));

    const good = Math.max(0, formData.total_eggs - formData.damaged_eggs - formData.broken_eggs);
    const trayInfo = convertEggsToTrays(good);
    const openingCount = batch ? batch.current_count : activeShed.current_birds;
    const pct = calculateEggProductionPct(formData.total_eggs, openingCount);

    if (editingRecord) {
      const res = updateDailyEggRecord(editingRecord.id, {
        collection_date: formData.collection_date,
        total_eggs_collected: Number(formData.total_eggs),
        damaged_eggs: Number(formData.damaged_eggs),
        broken_eggs: Number(formData.broken_eggs),
        good_eggs: good,
        trays_count: trayInfo.trays,
        loose_eggs_count: trayInfo.loose,
        production_percentage: pct,
        notes: formData.notes,
      });

      if (!res.success) {
        showNotification('error', res.error || 'Failed to update egg record.');
        return;
      }
      showNotification('success', `Egg collection for ${editingRecord.shed_code} on ${formData.collection_date} updated.`);
    } else {
      const res = addDailyEggRecord({
        collection_date: formData.collection_date,
        shed_id: activeShed.id,
        shed_code: activeShed.code,
        batch_id: batch?.id || '',
        batch_code: batch?.batch_code || 'N/A',
        opening_layer_birds: openingCount,
        total_eggs_collected: Number(formData.total_eggs),
        good_eggs: good,
        damaged_eggs: Number(formData.damaged_eggs),
        broken_eggs: Number(formData.broken_eggs),
        rejected_eggs: 0,
        trays_count: trayInfo.trays,
        loose_eggs_count: trayInfo.loose,
        production_percentage: pct,
        notes: formData.notes,
        entered_by: currentUser.id,
      });

      if (!res.success) {
        showNotification('error', res.error || 'Failed to add egg collection record.');
        return;
      }
      showNotification('success', `Logged collection of ${formatNumber(formData.total_eggs)} eggs for ${activeShed.code}.`);
    }

    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingRecord) return;
    const res = deleteDailyEggRecord(deletingRecord.id);
    if (!res.success) {
      showNotification('error', res.error || 'Failed to delete egg collection record.');
    } else {
      showNotification('success', `Egg record for ${deletingRecord.shed_code} on ${deletingRecord.collection_date} deleted.`);
    }
    setDeletingRecord(null);
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
            <Egg className="w-6 h-6 text-amber-500" />
            <span>Daily Egg Production</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Layer flock collections, opening bird count basis, and 30-egg tray conversion
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons data={dailyEggRecords} filename="kpf-egg-collections" />
          <button onClick={handleOpenAdd} className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            <span>Log Egg Collection</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Eggs Collected</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatNumber(totalEggsCollected)}
          </div>
          <span className="text-xs text-emerald-600 font-medium">Logged in system</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Commercial Good Eggs</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {formatNumber(totalGoodEggs)}
          </div>
          <span className="text-xs text-slate-500 font-medium">Grade A Table Eggs</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Tray Conversion (30/tray)</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatNumber(totalTrays.trays)} Trays
          </div>
          <span className="text-xs text-slate-500 font-medium">+ {totalTrays.loose} loose eggs</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Layer Sheds Monitored</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">5 Sheds</div>
          <span className="text-xs text-slate-500 font-medium">L1, L2, L3, L4, L5</span>
        </div>
      </div>

      {/* Rearing Shed Rule Alert */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900">
          <strong>Poultry Rule Enforced:</strong> Egg production applies exclusively to mature Layer batches (Sheds L1 to L5).
          Grower flocks (G1, G2) and Chick brooder (C1) are marked as <strong>N/A</strong> (not 0%) to prevent skewing lay performance averages.
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search date, shed, batch code..."
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
              value={selectedShed}
              onChange={(e) => setSelectedShed(e.target.value)}
              className="input-field py-1.5 text-xs w-full sm:w-44"
            >
              <option value="all">All Layer Sheds</option>
              {layerSheds.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} ({s.name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-3 px-4">Collection Date</th>
                <th className="py-3 px-4">Shed & Flock</th>
                <th className="py-3 px-4 text-right">Opening Birds</th>
                <th className="py-3 px-4 text-right">Total Eggs</th>
                <th className="py-3 px-4 text-right">Good Eggs</th>
                <th className="py-3 px-4 text-right">Damaged/Broken</th>
                <th className="py-3 px-4 text-right">Full Trays</th>
                <th className="py-3 px-4 text-right">Loose Eggs</th>
                <th className="py-3 px-4 text-right">Laying %</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                    No independent egg collection entries logged yet. Use "Log Egg Collection" or submit daily logs.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.collection_date}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                        {r.shed_code}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{r.batch_code}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatNumber(r.opening_layer_birds)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatNumber(r.total_eggs_collected)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {formatNumber(r.good_eggs)}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600">
                      {formatNumber(r.damaged_eggs + r.broken_eggs)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">
                      {formatNumber(r.trays_count)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">{r.loose_eggs_count}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700">
                      {r.production_percentage}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canEdit(r.collection_date) && (
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            title="Edit Egg Record"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete() && (
                          <button
                            onClick={() => setDeletingRecord(r)}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                            title="Delete Egg Record"
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

      {/* Log / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        title={editingRecord ? `Edit Egg Collection: ${editingRecord.shed_code}` : 'Log Layer Egg Collection'}
        subtitle="Record daily harvest from automated egg belts or manual collection carts"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Collection Date</label>
              <input
                type="date"
                value={formData.collection_date}
                onChange={(e) => setFormData({ ...formData, collection_date: e.target.value })}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Layer Shed</label>
              <select
                value={formData.shed_id}
                onChange={(e) => setFormData({ ...formData, shed_id: e.target.value })}
                className="input-field font-semibold"
                disabled={!!editingRecord}
              >
                {layerSheds.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name} [Live: {formatNumber(s.current_birds)}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="input-label">Total Eggs</label>
              <input
                type="number"
                value={formData.total_eggs}
                onChange={(e) => setFormData({ ...formData, total_eggs: Number(e.target.value) })}
                min="0"
                required
                className="input-field font-bold text-base"
              />
            </div>
            <div>
              <label className="input-label">Damaged Eggs</label>
              <input
                type="number"
                value={formData.damaged_eggs}
                onChange={(e) => setFormData({ ...formData, damaged_eggs: Number(e.target.value) })}
                min="0"
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Broken Shells</label>
              <input
                type="number"
                value={formData.broken_eggs}
                onChange={(e) => setFormData({ ...formData, broken_eggs: Number(e.target.value) })}
                min="0"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="input-field"
              placeholder="e.g. Belt conveyor smooth, afternoon batch"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingRecord(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingRecord ? 'Save Changes' : 'Post Collection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingRecord}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Egg Collection Record"
        recordIdentifier={deletingRecord ? `${deletingRecord.shed_code} — ${formatNumber(deletingRecord.total_eggs_collected)} eggs on ${deletingRecord.collection_date}` : ''}
        consequences={[
          'The egg collection entry will be permanently removed.',
          'Warehouse egg stock will be safely deducted to match physical harvest count.',
          'Layer laying percentage and flock production statistics will be recalculated.',
        ]}
      />
    </div>
  );
}
