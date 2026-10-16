'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { Batch, BirdStage, Shed } from '@/types/database';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
import {
  Layers,
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  History,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export default function BirdBatchManagementPage() {
  const { batches, sheds, batchMovements, addBatch, transferBirds, currentUser } = useFarm();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false);
  const [selectedBatchForTransfer, setSelectedBatchForTransfer] = useState<Batch | null>(null);

  // Transfer Form State
  const [transferData, setTransferData] = useState({
    toShedId: '',
    quantity: 1000,
    reason: 'Graduation from grower to layer production cages',
  });
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  // New Batch Form State
  const [newBatchData, setNewBatchData] = useState({
    batch_code: '',
    name: '',
    bird_type: 'BV300 White Leghorn',
    stage: 'chick' as BirdStage,
    current_shed_id: sheds[0]?.id || '',
    purchase_date: new Date().toISOString().split('T')[0],
    initial_count: 5000,
    age_days: 1,
    cost_per_bird: 48.0,
    supplier_hatchery: 'Venkateshwara Hatcheries Ltd',
    notes: '',
  });

  const totalBirds = batches.reduce((sum, b) => sum + b.current_count, 0);

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.batch_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bird_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.current_shed_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = selectedStage === 'all' || b.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const handleOpenTransfer = (batch: Batch) => {
    setSelectedBatchForTransfer(batch);
    // Find eligible destination sheds (excluding current shed)
    const availableShed = sheds.find((s) => s.id !== batch.current_shed_id);
    setTransferData({
      toShedId: availableShed?.id || '',
      quantity: Math.min(1000, batch.current_count),
      reason: 'Standard flock movement / stage graduation',
    });
    setTransferError(null);
    setTransferSuccess(null);
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    setTransferSuccess(null);

    if (!selectedBatchForTransfer) return;
    if (!transferData.toShedId) {
      setTransferError('Please select a destination shed.');
      return;
    }
    if (transferData.toShedId === selectedBatchForTransfer.current_shed_id) {
      setTransferError('Destination shed cannot be the same as the current shed.');
      return;
    }

    const res = transferBirds({
      batchId: selectedBatchForTransfer.id,
      fromShedId: selectedBatchForTransfer.current_shed_id,
      toShedId: transferData.toShedId,
      quantity: Number(transferData.quantity),
      reason: transferData.reason,
    });

    if (!res.success) {
      setTransferError(res.error || 'Failed to transfer birds.');
    } else {
      setTransferSuccess(`Successfully transferred ${transferData.quantity.toLocaleString()} birds!`);
      setTimeout(() => {
        setIsTransferModalOpen(false);
      }, 1200);
    }
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const shed = sheds.find((s) => s.id === newBatchData.current_shed_id);
    if (!shed) return;

    const purchaseCost = newBatchData.initial_count * newBatchData.cost_per_bird;

    addBatch({
      batch_code: newBatchData.batch_code.toUpperCase(),
      name: newBatchData.name,
      bird_type: newBatchData.bird_type,
      stage: newBatchData.stage,
      current_shed_id: shed.id,
      current_shed_code: shed.code,
      purchase_date: newBatchData.purchase_date,
      initial_count: Number(newBatchData.initial_count),
      current_count: Number(newBatchData.initial_count),
      age_days: Number(newBatchData.age_days),
      cost_per_bird: Number(newBatchData.cost_per_bird),
      purchase_cost: purchaseCost,
      supplier_hatchery: newBatchData.supplier_hatchery,
      status: 'active',
      notes: newBatchData.notes,
    });

    setIsAddBatchModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bird & Batch Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track active flocks through Chick → Grower → Layer stages with verified reconciliation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons data={batches} filename="flock-batches" />
          <button onClick={() => setIsAddBatchModalOpen(true)} className="btn-primary gap-2">
            <Plus className="w-4 h-4" />
            <span>Add Flock Batch</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Active Batches</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{batches.length}</div>
          <span className="text-xs text-slate-500 font-medium">Across 8 Sheds</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Birds in Batches</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{totalBirds.toLocaleString()}</div>
          <span className="text-xs text-slate-500 font-medium">Reconciled live count</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Layer Flocks (L1–L5)</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {batches.filter((b) => b.stage === 'layer').reduce((s, b) => s + b.current_count, 0).toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 font-medium">In daily egg production</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Rearing Flocks (C1, G1–G2)</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {batches.filter((b) => b.stage !== 'layer').reduce((s, b) => s + b.current_count, 0).toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 font-medium">Growing replacements</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search batch code, breed, shed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9 py-2 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="input-field py-2 text-xs w-full sm:w-44"
          >
            <option value="all">All Stages</option>
            <option value="chick">Chick (0–8 Weeks)</option>
            <option value="grower">Grower (9–18 Weeks)</option>
            <option value="layer">Layer (18+ Weeks)</option>
          </select>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Batch Code & Name</th>
                <th className="py-3 px-4">Breed & Hatchery</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Shed Location</th>
                <th className="py-3 px-4 text-right">Age (Days)</th>
                <th className="py-3 px-4 text-right">Current Live</th>
                <th className="py-3 px-4 text-right">Initial Count</th>
                <th className="py-3 px-4 text-right">Mortality / Loss</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredBatches.map((batch) => {
                const totalLoss = batch.initial_count - batch.current_count;
                const lossPct = ((totalLoss / batch.initial_count) * 100).toFixed(1);

                return (
                  <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{batch.batch_code}</div>
                      <div className="text-[11px] text-slate-500">{batch.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{batch.bird_type}</div>
                      <div className="text-[11px] text-slate-400">{batch.supplier_hatchery}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge stage={batch.stage}>{batch.stage.toUpperCase()}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                        {batch.current_shed_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {batch.age_days} days
                      <div className="text-[10px] text-slate-400">
                        {Math.floor(batch.age_days / 7)} wks
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {batch.current_count.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {batch.initial_count.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-rose-600">{totalLoss.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400 block">({lossPct}%)</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenTransfer(batch)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Transfer</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer History Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Recent Inter-Shed Bird Movements
            </h3>
          </div>
          <span className="text-xs text-slate-500">{batchMovements.length} transfers recorded</span>
        </div>

        {batchMovements.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 italic">
            No inter-shed transfers recorded yet. Use the "Transfer" button on any batch to move birds between sheds.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {batchMovements.map((mov) => (
              <div key={mov.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{mov.batch_code}</span>
                  <div className="text-slate-500 mt-0.5">{mov.reason}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 font-semibold text-slate-800">
                    <span className="px-2 py-0.5 bg-slate-100 rounded">{mov.from_shed_code}</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">{mov.to_shed_code}</span>
                  </div>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                    +{mov.quantity.toLocaleString()} birds
                  </span>
                  <span className="text-slate-400">{mov.movement_date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfer Birds Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title={`Transfer Birds — ${selectedBatchForTransfer?.batch_code}`}
        subtitle={`Current Shed: ${selectedBatchForTransfer?.current_shed_code} | Available Flock: ${selectedBatchForTransfer?.current_count.toLocaleString()}`}
      >
        <form onSubmit={handleExecuteTransfer} className="space-y-4">
          {transferError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{transferError}</span>
            </div>
          )}
          {transferSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{transferSuccess}</span>
            </div>
          )}

          <div>
            <label className="input-label">Destination Shed</label>
            <select
              value={transferData.toShedId}
              onChange={(e) => setTransferData({ ...transferData, toShedId: e.target.value })}
              required
              className="input-field"
            >
              <option value="">Select Destination Shed</option>
              {sheds
                .filter((s) => s.id !== selectedBatchForTransfer?.current_shed_id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name} ({s.shed_type.toUpperCase()}) [Cur: {s.current_birds.toLocaleString()} / Max:{' '}
                    {s.capacity.toLocaleString()}]
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="input-label">Quantity to Transfer</label>
            <input
              type="number"
              value={transferData.quantity}
              onChange={(e) => setTransferData({ ...transferData, quantity: Number(e.target.value) })}
              min="1"
              max={selectedBatchForTransfer?.current_count || 1000}
              required
              className="input-field font-semibold"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Live count remaining in source shed:{' '}
              {((selectedBatchForTransfer?.current_count || 0) - transferData.quantity).toLocaleString()} birds
            </span>
          </div>

          <div>
            <label className="input-label">Transfer Reason & Authorization</label>
            <textarea
              value={transferData.reason}
              onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
              required
              rows={2}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Confirm & Post Transfer
            </button>
          </div>
        </form>
      </Modal>

      {/* Add New Batch Modal */}
      <Modal
        isOpen={isAddBatchModalOpen}
        onClose={() => setIsAddBatchModalOpen(false)}
        title="Add New Flock Batch"
        subtitle="Record arrival of day-old chicks or imported grower pullets"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Batch Code</label>
              <input
                type="text"
                value={newBatchData.batch_code}
                onChange={(e) => setNewBatchData({ ...newBatchData, batch_code: e.target.value })}
                placeholder="BATCH-C2-2026"
                required
                className="input-field uppercase font-mono"
              />
            </div>
            <div>
              <label className="input-label">Batch Name / Reference</label>
              <input
                type="text"
                value={newBatchData.name}
                onChange={(e) => setNewBatchData({ ...newBatchData, name: e.target.value })}
                placeholder="Flock 2026 Chick Brooder"
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Breed / Bird Type</label>
              <input
                type="text"
                value={newBatchData.bird_type}
                onChange={(e) => setNewBatchData({ ...newBatchData, bird_type: e.target.value })}
                placeholder="BV300, Cobb 500, Lohmann..."
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Lifecycle Stage</label>
              <select
                value={newBatchData.stage}
                onChange={(e) => setNewBatchData({ ...newBatchData, stage: e.target.value as BirdStage })}
                className="input-field"
              >
                <option value="chick">Chick (0–8 Wks)</option>
                <option value="grower">Grower (9–18 Wks)</option>
                <option value="layer">Layer (18+ Wks)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Initial Shed Assignment</label>
              <select
                value={newBatchData.current_shed_id}
                onChange={(e) => setNewBatchData({ ...newBatchData, current_shed_id: e.target.value })}
                className="input-field"
              >
                {sheds.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name} ({s.shed_type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Arrival / Purchase Date</label>
              <input
                type="date"
                value={newBatchData.purchase_date}
                onChange={(e) => setNewBatchData({ ...newBatchData, purchase_date: e.target.value })}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="input-label">Initial Birds</label>
              <input
                type="number"
                value={newBatchData.initial_count}
                onChange={(e) => setNewBatchData({ ...newBatchData, initial_count: Number(e.target.value) })}
                min="100"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Age in Days</label>
              <input
                type="number"
                value={newBatchData.age_days}
                onChange={(e) => setNewBatchData({ ...newBatchData, age_days: Number(e.target.value) })}
                min="1"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Cost/Bird (₹)</label>
              <input
                type="number"
                value={newBatchData.cost_per_bird}
                onChange={(e) => setNewBatchData({ ...newBatchData, cost_per_bird: Number(e.target.value) })}
                step="0.5"
                required
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Supplier / Hatchery</label>
            <input
              type="text"
              value={newBatchData.supplier_hatchery}
              onChange={(e) => setNewBatchData({ ...newBatchData, supplier_hatchery: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddBatchModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Register Flock Batch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
