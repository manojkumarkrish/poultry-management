'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { Batch, BirdStage, Shed, BatchMovement } from '@/types/database';
import { formatNumber } from '@/lib/utils/formatters';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
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
  Edit,
  Trash2,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export default function BirdBatchManagementPage() {
  const {
    batches,
    sheds,
    batchMovements,
    addBatch,
    updateBatch,
    deleteBatch,
    transferBirds,
    reverseBatchMovement,
    currentUser,
    canEdit,
    canDelete,
  } = useFarm();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false);
  const [isEditBatchModalOpen, setIsEditBatchModalOpen] = useState(false);
  const [selectedBatchForTransfer, setSelectedBatchForTransfer] = useState<Batch | null>(null);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [deleteTargetBatch, setDeleteTargetBatch] = useState<Batch | null>(null);
  const [reversalTargetMovement, setReversalTargetMovement] = useState<BatchMovement | null>(null);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Edit Batch Form State
  const [editFormData, setEditFormData] = useState({
    name: '',
    bird_type: '',
    stage: 'layer' as BirdStage,
    age_days: 0,
    cost_per_bird: 0,
    status: 'active' as Batch['status'],
    supplier_hatchery: '',
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
    setTransferData({
      toShedId: '',
      quantity: Math.min(1000, batch.current_count),
      reason: 'Standard growth phase inter-shed relocation',
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
      setTransferSuccess(`Successfully transferred ${formatNumber(transferData.quantity)} birds!`);
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
    setFeedbackMsg({ type: 'success', text: `Registered batch ${newBatchData.batch_code.toUpperCase()} successfully.` });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleOpenEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setEditFormData({
      name: batch.name,
      bird_type: batch.bird_type,
      stage: batch.stage,
      age_days: batch.age_days,
      cost_per_bird: batch.cost_per_bird,
      status: batch.status,
      supplier_hatchery: batch.supplier_hatchery || '',
      notes: batch.notes || '',
    });
    setIsEditBatchModalOpen(true);
  };

  const handleSaveBatchEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    const res = updateBatch(editingBatch.id, {
      name: editFormData.name,
      bird_type: editFormData.bird_type,
      stage: editFormData.stage,
      age_days: Number(editFormData.age_days),
      cost_per_bird: Number(editFormData.cost_per_bird),
      status: editFormData.status,
      supplier_hatchery: editFormData.supplier_hatchery,
      notes: editFormData.notes,
    });

    if (res.success) {
      setFeedbackMsg({ type: 'success', text: `Updated batch ${editingBatch.batch_code} successfully.` });
      setIsEditBatchModalOpen(false);
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'Failed to update batch.' });
    }
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleConfirmDeleteBatch = () => {
    if (!deleteTargetBatch) return;
    const res = deleteBatch(deleteTargetBatch.id);
    if (!res.success) {
      setFeedbackMsg({ type: 'error', text: res.error || 'Failed to delete batch.' });
    } else {
      setFeedbackMsg({ type: 'success', text: `Batch ${deleteTargetBatch.batch_code} removed successfully.` });
    }
    setDeleteTargetBatch(null);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleConfirmReverseMovement = () => {
    if (!reversalTargetMovement) return;
    const res = reverseBatchMovement(reversalTargetMovement.id);
    if (!res.success) {
      setFeedbackMsg({ type: 'error', text: res.error || 'Failed to reverse bird movement.' });
    } else {
      setFeedbackMsg({
        type: 'success',
        text: `Successfully reversed ${formatNumber(reversalTargetMovement.quantity)} birds back to ${reversalTargetMovement.from_shed_code}!`,
      });
    }
    setReversalTargetMovement(null);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kasthuri Poultry Farm — Bird & Batch Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track active flocks through Chick → Grower → Layer stages with verified reconciliation & inter-shed transfers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons data={batches} filename="kpf-flock-batches" />
          {canEdit() && (
            <button onClick={() => setIsAddBatchModalOpen(true)} className="btn-primary gap-2">
              <Plus className="w-4 h-4" />
              <span>Add Flock Batch</span>
            </button>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Live Birds</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(totalBirds)}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Reconciled closing counts</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Active Batches</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{batches.length}</div>
          <span className="text-[11px] text-slate-500">Across 8 physical sheds</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Layer Stage Birds</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatNumber(
              batches
                .filter((b) => b.stage === 'layer')
                .reduce((sum, b) => sum + b.current_count, 0)
            )}
          </div>
          <span className="text-[11px] text-amber-600 font-medium">Active egg laying production</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Chick & Grower Birds</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatNumber(
              batches
                .filter((b) => b.stage !== 'layer')
                .reduce((sum, b) => sum + b.current_count, 0)
            )}
          </div>
          <span className="text-[11px] text-blue-600 font-medium">Active rearing & brooding</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by batch code, breed, shed, or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="input-field text-xs py-2 w-full sm:w-44"
          >
            <option value="all">All Stages</option>
            <option value="chick">Chick Stage</option>
            <option value="grower">Grower Stage</option>
            <option value="layer">Layer Stage</option>
          </select>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4">Batch Code & Name</th>
                <th className="py-3 px-4">Breed / Type</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Current Shed</th>
                <th className="py-3 px-4 text-right">Age</th>
                <th className="py-3 px-4 text-right">Live Count</th>
                <th className="py-3 px-4 text-right">Initial Birds</th>
                <th className="py-3 px-4 text-right">Mortality / Loss</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                    No active flock batches found. Click &quot;Add Batch&quot; to register a new flock.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                const totalLoss = batch.initial_count - batch.current_count;
                const lossPct = ((totalLoss / batch.initial_count) * 100).toFixed(1);

                return (
                  <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 font-mono">{batch.batch_code}</div>
                      <div className="text-[11px] text-slate-500">{batch.name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{batch.bird_type}</td>
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
                      {formatNumber(batch.current_count)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatNumber(batch.initial_count)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-rose-600">{formatNumber(totalLoss)}</span>
                      <span className="text-[10px] text-slate-400 block">({lossPct}%)</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenTransfer(batch)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                          title="Transfer birds to another shed"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Transfer</span>
                        </button>
                        {canEdit() && (
                          <button
                            onClick={() => handleOpenEdit(batch)}
                            className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Edit batch details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete() && (
                          <button
                            onClick={() => setDeleteTargetBatch(batch)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title={batch.current_count > 0 ? "Cannot delete batch with live flock" : "Delete flock batch"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }))}
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
            {batchMovements.map((mov) => {
              const isReversed = mov.movement_status === 'reversed';
              return (
                <div key={mov.id} className={`py-3 flex items-center justify-between text-xs ${isReversed ? 'opacity-60 bg-slate-50/50 px-2 rounded-lg' : ''}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{mov.batch_code}</span>
                      {isReversed && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          REVERSED
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 mt-0.5">{mov.reason}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 font-semibold text-slate-800">
                      <span className="px-2 py-0.5 bg-slate-100 rounded">{mov.from_shed_code}</span>
                      <span>→</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">{mov.to_shed_code}</span>
                    </div>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                      +{formatNumber(mov.quantity)} birds
                    </span>
                    <span className="text-slate-400">{mov.movement_date}</span>
                    {!isReversed && canEdit() && (
                      <button
                        onClick={() => setReversalTargetMovement(mov)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                        title="Reverse this movement and return birds back"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reverse</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transfer Birds Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title={`Transfer Birds — ${selectedBatchForTransfer?.batch_code}`}
        subtitle={`Current Shed: ${selectedBatchForTransfer?.current_shed_code} | Available Flock: ${formatNumber(selectedBatchForTransfer?.current_count)}`}
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
                    {s.code} — {s.name} ({s.shed_type.toUpperCase()}) [Cur: {formatNumber(s.current_birds)} / Max:{' '}
                    {formatNumber(s.capacity)}]
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
              {formatNumber((selectedBatchForTransfer?.current_count || 0) - transferData.quantity)} birds
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

      {/* Edit Batch Modal */}
      {editingBatch && (
        <Modal
          isOpen={isEditBatchModalOpen}
          onClose={() => setIsEditBatchModalOpen(false)}
          title={`Edit Flock Batch — ${editingBatch.batch_code}`}
          subtitle={`Current Shed: ${editingBatch.current_shed_code} | Live Count: ${formatNumber(editingBatch.current_count)}`}
        >
          <form onSubmit={handleSaveBatchEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Batch Name / Reference</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Breed / Bird Strain</label>
                <input
                  type="text"
                  value={editFormData.bird_type}
                  onChange={(e) => setEditFormData({ ...editFormData, bird_type: e.target.value })}
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Lifecycle Stage</label>
                <select
                  value={editFormData.stage}
                  onChange={(e) => setEditFormData({ ...editFormData, stage: e.target.value as BirdStage })}
                  className="input-field"
                >
                  <option value="chick">Chick (0–8 Wks)</option>
                  <option value="grower">Grower (9–18 Wks)</option>
                  <option value="layer">Layer (18+ Wks)</option>
                  <option value="completed">Completed / Culled</option>
                </select>
              </div>
              <div>
                <label className="input-label">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as Batch['status'] })}
                  className="input-field"
                >
                  <option value="active">Active Flock</option>
                  <option value="transferred">Transferred</option>
                  <option value="culled">Culled / Depopulated</option>
                  <option value="completed">Completed Lifecycle</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Flock Age (Days)</label>
                <input
                  type="number"
                  value={editFormData.age_days}
                  onChange={(e) => setEditFormData({ ...editFormData, age_days: Number(e.target.value) })}
                  min="1"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Cost per Bird (₹)</label>
                <input
                  type="number"
                  value={editFormData.cost_per_bird}
                  onChange={(e) => setEditFormData({ ...editFormData, cost_per_bird: Number(e.target.value) })}
                  step="0.5"
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Supplier / Hatchery Source</label>
              <input
                type="text"
                value={editFormData.supplier_hatchery}
                onChange={(e) => setEditFormData({ ...editFormData, supplier_hatchery: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="input-label">Observations & Production Notes</label>
              <textarea
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                rows={2}
                className="input-field"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditBatchModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Batch Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Batch Confirmation Modal */}
      {deleteTargetBatch && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeleteTargetBatch(null)}
          onConfirm={handleConfirmDeleteBatch}
          title={`Delete Batch — ${deleteTargetBatch.batch_code}`}
          recordType="Batch"
          recordIdentifier={`${deleteTargetBatch.batch_code}: ${deleteTargetBatch.name}`}
          warningMessage={
            deleteTargetBatch.current_count > 0
              ? `Warning: Batch ${deleteTargetBatch.batch_code} still contains ${formatNumber(deleteTargetBatch.current_count)} live birds. Permanent deletion is blocked to protect flock counts. Please complete lifecycle or cull before deleting.`
              : `Are you sure you want to permanently delete Batch ${deleteTargetBatch.batch_code}?`
          }
          consequences={
            deleteTargetBatch.current_count > 0
              ? [
                  `Live birds present: ${formatNumber(deleteTargetBatch.current_count)}`,
                  'System rule: Batches with live birds cannot be permanently deleted',
                ]
              : [
                  'Batch record will be removed from flock rosters',
                  'Historical log will track this batch deletion',
                ]
          }
          confirmButtonText={deleteTargetBatch.current_count > 0 ? 'Cannot Delete (Flock Present)' : 'Delete Empty Batch'}
        />
      )}

      {/* Reversal Confirmation Modal */}
      {reversalTargetMovement && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setReversalTargetMovement(null)}
          onConfirm={handleConfirmReverseMovement}
          title="Reverse Inter-Shed Bird Transfer"
          recordType="Movement"
          isReversal={true}
          recordIdentifier={`${reversalTargetMovement.batch_code}: ${reversalTargetMovement.from_shed_code} → ${reversalTargetMovement.to_shed_code} (${formatNumber(reversalTargetMovement.quantity)} birds)`}
          warningMessage={`Are you sure you want to reverse this bird transfer? This will move ${formatNumber(reversalTargetMovement.quantity)} birds back from ${reversalTargetMovement.to_shed_code} into ${reversalTargetMovement.from_shed_code}.`}
          consequences={[
            `Source shed ${reversalTargetMovement.from_shed_code} live count will INCREASE by +${formatNumber(reversalTargetMovement.quantity)} birds`,
            `Destination shed ${reversalTargetMovement.to_shed_code} live count will DECREASE by -${formatNumber(reversalTargetMovement.quantity)} birds`,
            'Movement will be marked as REVERSED in historical records',
          ]}
          confirmButtonText="Confirm Transfer Reversal"
        />
      )}
    </div>
  );
}
