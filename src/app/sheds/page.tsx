'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { Shed, ShedType, ShedStatus } from '@/types/database';
import { formatNumber } from '@/lib/utils/formatters';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import ExportButtons from '@/components/ui/ExportButtons';
import {
  Home,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Search,
  Filter,
  Users,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

export default function ShedManagementPage() {
  const { sheds, addShed, updateShed, deleteShed, currentUser, canEdit, canDelete } = useFarm();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShed, setEditingShed] = useState<Shed | null>(null);
  const [deleteTargetShed, setDeleteTargetShed] = useState<Shed | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    shed_type: 'layer' as ShedType,
    capacity: 18000,
    current_birds: 0,
    status: 'active' as ShedStatus,
    group_name: '',
    assigned_manager_name: '',
    location: '',
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Calculations
  const totalCapacity = sheds.reduce((sum, s) => sum + s.capacity, 0);
  const totalBirds = sheds.reduce((sum, s) => sum + s.current_birds, 0);
  const totalUtilization = totalCapacity > 0 ? ((totalBirds / totalCapacity) * 100).toFixed(1) : '0';

  const filteredSheds = sheds.filter((shed) => {
    const matchesSearch =
      shed.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shed.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shed.group_name && shed.group_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || shed.shed_type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleOpenAdd = () => {
    setEditingShed(null);
    setFormData({
      code: '',
      name: '',
      shed_type: 'layer',
      capacity: 18000,
      current_birds: 0,
      status: 'active',
      group_name: 'East Production Wing',
      assigned_manager_name: currentUser.full_name,
      location: '',
      notes: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shed: Shed) => {
    setEditingShed(shed);
    setFormData({
      code: shed.code,
      name: shed.name,
      shed_type: shed.shed_type,
      capacity: shed.capacity,
      current_birds: shed.current_birds,
      status: shed.status,
      group_name: shed.group_name || '',
      assigned_manager_name: shed.assigned_manager_name || '',
      location: shed.location || '',
      notes: shed.notes || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.code.trim() || !formData.name.trim()) {
      setFormError('Shed code and name are required.');
      return;
    }

    if (formData.capacity <= 0) {
      setFormError('Capacity must be a positive number.');
      return;
    }

    if (editingShed) {
      if (formData.capacity < editingShed.current_birds) {
        setFormError(
          `Cannot reduce capacity to ${formatNumber(formData.capacity)} because shed currently holds ${formatNumber(editingShed.current_birds)} live birds.`
        );
        return;
      }
      updateShed(editingShed.id, {
        code: formData.code.toUpperCase(),
        name: formData.name,
        shed_type: formData.shed_type,
        capacity: Number(formData.capacity),
        status: formData.status,
        group_name: formData.group_name,
        assigned_manager_name: formData.assigned_manager_name,
        location: formData.location,
        notes: formData.notes,
      });
    } else {
      // Check code uniqueness
      if (sheds.some((s) => s.code.toLowerCase() === formData.code.trim().toLowerCase())) {
        setFormError(`Shed code "${formData.code}" already exists.`);
        return;
      }
      addShed({
        code: formData.code.toUpperCase(),
        name: formData.name,
        shed_type: formData.shed_type,
        capacity: Number(formData.capacity),
        current_birds: Number(formData.current_birds),
        status: formData.status,
        group_name: formData.group_name,
        assigned_manager_name: formData.assigned_manager_name,
        location: formData.location,
        notes: formData.notes,
      });
    }

    setIsModalOpen(false);
    setFeedbackMsg({
      type: 'success',
      text: editingShed ? `Shed ${editingShed.code} updated successfully.` : `Shed ${formData.code.toUpperCase()} added successfully.`,
    });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetShed) return;
    const res = deleteShed(deleteTargetShed.id);
    if (!res.success) {
      setFeedbackMsg({ type: 'error', text: res.error || 'Failed to delete shed.' });
    } else {
      setFeedbackMsg({ type: 'success', text: `Shed ${deleteTargetShed.code} was safely removed.` });
    }
    setDeleteTargetShed(null);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kasthuri Poultry Farm — Shed Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure physical sheds, manage capacities, assigned flocks, and shed managers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons data={sheds} filename="kpf-sheds-roster" />
          {canEdit() && (
            <button onClick={handleOpenAdd} className="btn-primary gap-2">
              <Plus className="w-4 h-4" />
              <span>Add New Shed</span>
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Sheds</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{sheds.length}</div>
          <span className="text-xs text-emerald-600 font-medium">{sheds.filter((s) => s.status === 'active').length} Active Units</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Farm Capacity</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(totalCapacity)}</div>
          <span className="text-xs text-slate-500 font-medium">Configured maximum capacity</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Current Live Birds</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{formatNumber(totalBirds)}</div>
          <span className="text-xs text-slate-500 font-medium">Active in rearing & lay</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Capacity Utilization</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalUtilization}%</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${Math.min(100, Number(totalUtilization))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search shed code, name, wing..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9 py-2 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input-field py-2 text-xs w-full sm:w-44"
          >
            <option value="all">All Shed Types</option>
            <option value="layer">Layer Sheds</option>
            <option value="grower">Grower Sheds</option>
            <option value="chick">Chick Brooders</option>
          </select>
        </div>
      </div>

      {/* Shed Cards Visual Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredSheds.map((shed) => {
          const utilPct = shed.capacity > 0 ? ((shed.current_birds / shed.capacity) * 100).toFixed(1) : '0';
          const isOvercrowded = shed.current_birds > shed.capacity;

          return (
            <div
              key={shed.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900 tracking-tight">{shed.code}</span>
                      <Badge stage={shed.shed_type}>{shed.shed_type.toUpperCase()}</Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 mt-1">{shed.name}</p>
                    <p className="text-[11px] text-slate-400">{shed.group_name || 'Individual Shed'}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      shed.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {shed.status.toUpperCase()}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-500 font-medium">Occupancy</span>
                    <span className={`font-bold ${isOvercrowded ? 'text-rose-600' : 'text-slate-800'}`}>
                      {utilPct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOvercrowded ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Number(utilPct))}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-600 mt-2">
                    <span>
                      Live: <strong className="text-slate-900">{formatNumber(shed.current_birds)}</strong>
                    </span>
                    <span>
                      Cap: <strong className="text-slate-900">{formatNumber(shed.capacity)}</strong>
                    </span>
                  </div>
                </div>

                {shed.location && (
                  <div className="mt-3 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-600">Location:</span> {shed.location}
                  </div>
                )}
                {shed.assigned_manager_name && (
                  <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>Mgr: {shed.assigned_manager_name}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Updated: {new Date(shed.updated_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  {canEdit() && (
                    <button
                      onClick={() => handleOpenEdit(shed)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 p-1 hover:bg-emerald-50 rounded transition-colors"
                      title="Edit shed configuration"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}
                  {canDelete() && (
                    <button
                      onClick={() => setDeleteTargetShed(shed)}
                      className="text-xs text-slate-400 hover:text-rose-600 font-semibold flex items-center gap-1 p-1 hover:bg-rose-50 rounded transition-colors"
                      title={shed.current_birds > 0 ? "Holds active flock (Safe deletion blocked)" : "Delete empty shed"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                  {!canEdit() && !canDelete() && (
                    <span className="text-[10px] text-slate-400 italic">View Only</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingShed ? `Edit Shed — ${editingShed.code}` : 'Add New Shed Unit'}
        subtitle="Configure capacity, type, assigned managers, and operational state"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Shed Code (e.g. L6, G3)</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="L1, G1, C1..."
                required
                className="input-field uppercase font-mono"
              />
            </div>
            <div>
              <label className="input-label">Shed Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Layer Shed 6"
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Shed Type</label>
              <select
                value={formData.shed_type}
                onChange={(e) => setFormData({ ...formData, shed_type: e.target.value as ShedType })}
                className="input-field"
              >
                <option value="layer">Layer (Egg Production)</option>
                <option value="grower">Grower (Pullets Rearing)</option>
                <option value="chick">Chick (Brooder 0–8 Wks)</option>
              </select>
            </div>
            <div>
              <label className="input-label">Capacity (Max Birds)</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                min="100"
                step="100"
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Group / Wing Name</label>
              <input
                type="text"
                value={formData.group_name}
                onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                placeholder="e.g. East Production Wing"
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Operational Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ShedStatus })}
                className="input-field"
              >
                <option value="active">Active</option>
                <option value="cleaning">Cleaning & Disinfection</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="input-label">Assigned Manager</label>
            <input
              type="text"
              value={formData.assigned_manager_name}
              onChange={(e) => setFormData({ ...formData, assigned_manager_name: e.target.value })}
              placeholder="e.g. Suresh Kumar"
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Location / Physical Notes</label>
            <textarea
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Bay details, ventilation equipment, feeder type..."
              rows={2}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingShed ? 'Save Shed Changes' : 'Create Shed'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Shed Modal */}
      {deleteTargetShed && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeleteTargetShed(null)}
          onConfirm={handleConfirmDelete}
          title={`Delete Shed — ${deleteTargetShed.code}`}
          recordType="Shed"
          recordIdentifier={`${deleteTargetShed.code}: ${deleteTargetShed.name}`}
          warningMessage={
            deleteTargetShed.current_birds > 0
              ? `Warning: Shed ${deleteTargetShed.code} currently holds ${formatNumber(deleteTargetShed.current_birds)} live birds. Unsafe deletion is blocked to prevent corrupting flock counts. Please transfer birds or deactivate the shed.`
              : `Are you sure you want to permanently delete Shed ${deleteTargetShed.code}? This will remove it from the roster.`
          }
          consequences={
            deleteTargetShed.current_birds > 0
              ? [
                  `Active birds present: ${formatNumber(deleteTargetShed.current_birds)} birds`,
                  'Flock safety rule: Shed must be completely emptied via transfer before deletion',
                ]
              : [
                  'Shed capacity will be deducted from farm target capacity',
                  'Immutable audit trail will record this deletion',
                ]
          }
          confirmButtonText={deleteTargetShed.current_birds > 0 ? 'Cannot Delete (Flock Present)' : 'Delete Empty Shed'}
        />
      )}
    </div>
  );
}
