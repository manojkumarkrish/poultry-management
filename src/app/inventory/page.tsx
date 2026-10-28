'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { WarehouseStockItem } from '@/types/database';
import { formatNumber, formatCurrency } from '@/lib/utils/formatters';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import {
  Warehouse,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Package,
  Pencil,
  Trash2,
  XCircle,
} from 'lucide-react';

export default function GodownInventoryPage() {
  const {
    warehouseItems,
    addWarehouseItem,
    updateWarehouseItem,
    deleteWarehouseItem,
    canEdit,
    canDelete,
  } = useFarm();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WarehouseStockItem | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<WarehouseStockItem | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('Physical audit reconciliation');

  const [deletingItem, setDeletingItem] = useState<WarehouseStockItem | null>(null);

  // Form State
  const [itemForm, setItemForm] = useState({
    item_name: '',
    category: 'supplies' as WarehouseStockItem['category'],
    warehouse_name: 'Central Godown',
    location_rack: '',
    unit: 'bags',
    current_quantity: 100,
    reorder_level: 20,
    unit_cost: 0,
  });

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const categories = [
    { label: 'All Warehouses', value: 'all' },
    { label: 'Raw Ingredients', value: 'raw_ingredients' },
    { label: 'Finished Feed Bags', value: 'finished_feed' },
    { label: 'Table Eggs Storage', value: 'eggs' },
    { label: 'Veterinary Vaccines', value: 'medicines' },
    { label: 'Packaging & Supplies', value: 'supplies' },
  ];

  const filteredItems = warehouseItems.filter((item) => {
    const matchesSearch =
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.warehouse_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location_rack && item.location_rack.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalValuation = warehouseItems.reduce(
    (sum, item) => sum + item.current_quantity * (item.unit_cost || 0),
    0
  );
  const lowStockItems = warehouseItems.filter((i) => i.current_quantity <= i.reorder_level);

  // --- Handlers ---
  const handleOpenAddItem = () => {
    setItemForm({
      item_name: '',
      category: 'supplies',
      warehouse_name: 'Central Godown',
      location_rack: '',
      unit: 'bags',
      current_quantity: 100,
      reorder_level: 20,
      unit_cost: 0,
    });
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: WarehouseStockItem) => {
    setItemForm({
      item_name: item.item_name,
      category: item.category,
      warehouse_name: item.warehouse_name,
      location_rack: item.location_rack || '',
      unit: item.unit,
      current_quantity: item.current_quantity,
      reorder_level: item.reorder_level,
      unit_cost: item.unit_cost || 0,
    });
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateWarehouseItem(editingItem.id, {
        item_name: itemForm.item_name,
        category: itemForm.category,
        warehouse_name: itemForm.warehouse_name,
        location_rack: itemForm.location_rack,
        unit: itemForm.unit,
        current_quantity: Number(itemForm.current_quantity),
        reorder_level: Number(itemForm.reorder_level),
        unit_cost: Number(itemForm.unit_cost),
      });
      showNotification('success', `Updated inventory item "${itemForm.item_name}".`);
    } else {
      addWarehouseItem({
        item_name: itemForm.item_name,
        category: itemForm.category,
        warehouse_name: itemForm.warehouse_name,
        location_rack: itemForm.location_rack,
        unit: itemForm.unit,
        current_quantity: Number(itemForm.current_quantity),
        reorder_level: Number(itemForm.reorder_level),
        unit_cost: Number(itemForm.unit_cost),
      });
      showNotification('success', `Added new inventory item "${itemForm.item_name}".`);
    }
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  const handleOpenAdjust = (item: WarehouseStockItem) => {
    setAdjustingItem(item);
    setAdjustmentQty(item.current_quantity);
    setAdjustmentReason('Physical godown cycle count audit');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    updateWarehouseItem(adjustingItem.id, {
      current_quantity: Number(adjustmentQty),
    });

    showNotification(
      'success',
      `Audit count reconciled: ${adjustingItem.item_name} set to ${adjustmentQty} ${adjustingItem.unit}.`
    );
    setIsAdjustModalOpen(false);
    setAdjustingItem(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    const res = deleteWarehouseItem(deletingItem.id);
    if (!res.success) {
      showNotification('error', res.error || 'Failed to delete inventory item.');
    } else {
      showNotification('success', `Inventory item "${deletingItem.item_name}" removed.`);
    }
    setDeletingItem(null);
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
            <Warehouse className="w-6 h-6 text-emerald-600" />
            <span>Godown & Inventory Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized tracking of raw feed, finished bags, egg cold rooms, medicines, and trays
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons data={warehouseItems} filename="kpf-godown-inventory" />
          {canEdit() && (
            <button onClick={handleOpenAddItem} className="btn-primary gap-1.5 text-xs">
              <Plus className="w-4 h-4" />
              <span>Add Stock Item</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Inventory Value</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(totalValuation, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Standard cost evaluation</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Managed Items</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{warehouseItems.length} SKUs</div>
          <span className="text-xs text-slate-500 font-medium">Across all storage sheds</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Low Stock SKUs</span>
          <div className={`text-2xl font-bold mt-1 ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {lowStockItems.length} Alerts
          </div>
          <span className="text-xs text-slate-500 font-medium">At or below reorder buffer</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search items, silos, cold chambers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-9 py-2 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field py-2 text-xs w-full sm:w-56"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-3 px-4">Item SKU & Name</th>
                <th className="py-3 px-4">Godown Location & Rack</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">In Stock</th>
                <th className="py-3 px-4 text-right">Reorder Level</th>
                <th className="py-3 px-4 text-right">Total Value</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isLow = item.current_quantity <= item.reorder_level;
                const itemTotal = item.current_quantity * (item.unit_cost || 0);

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.item_name}</div>
                      <div className="text-[10px] text-slate-400">Unit: {item.unit}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{item.warehouse_name}</div>
                      <div className="text-[11px] text-slate-500">{item.location_rack || 'Main floor'}</div>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600">
                      {item.category.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatNumber(item.current_quantity)} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {formatNumber(item.reorder_level)} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {formatCurrency(itemTotal, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isLow ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          REORDER
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          HEALTHY
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAdjust(item)}
                          className="text-[11px] text-slate-700 hover:text-emerald-700 font-semibold bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
                          title="Reconcile Physical Count"
                        >
                          Audit
                        </button>
                        {canEdit() && (
                          <button
                            onClick={() => handleOpenEditItem(item)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            title="Edit Stock Item Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete() && (
                          <button
                            onClick={() => setDeletingItem(item)}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                            title="Delete Stock Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add / Edit Stock Item */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? `Edit Item: ${editingItem.item_name}` : 'Add Warehouse Stock Item'}
        subtitle="Manage SKU, storage location, unit cost, and safety buffers"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Item / SKU Name</label>
              <input
                type="text"
                value={itemForm.item_name}
                onChange={(e) => setItemForm({ ...itemForm, item_name: e.target.value })}
                required
                className="input-field font-semibold"
                placeholder="e.g. 30-Egg Paper Trays (Bundles)"
              />
            </div>
            <div>
              <label className="input-label">Inventory Category</label>
              <select
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value as WarehouseStockItem['category'] })}
                className="input-field font-semibold"
              >
                <option value="raw_ingredients">Raw Ingredients</option>
                <option value="finished_feed">Finished Feed Bags</option>
                <option value="eggs">Table Eggs Storage</option>
                <option value="medicines">Veterinary Vaccines & Meds</option>
                <option value="supplies">Packaging & Supplies</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Warehouse Name</label>
              <input
                type="text"
                value={itemForm.warehouse_name}
                onChange={(e) => setItemForm({ ...itemForm, warehouse_name: e.target.value })}
                required
                className="input-field"
                placeholder="e.g. Cold Storage Unit 1 / Main Godown"
              />
            </div>
            <div>
              <label className="input-label">Rack / Bay Location</label>
              <input
                type="text"
                value={itemForm.location_rack}
                onChange={(e) => setItemForm({ ...itemForm, location_rack: e.target.value })}
                className="input-field font-mono"
                placeholder="e.g. Bay 3 - Rack D"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="input-label">Unit of Measure</label>
              <input
                type="text"
                value={itemForm.unit}
                onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                required
                className="input-field font-mono"
                placeholder="kg, bags, vials, trays"
              />
            </div>
            <div>
              <label className="input-label">Current Qty</label>
              <input
                type="number"
                value={itemForm.current_quantity}
                onChange={(e) => setItemForm({ ...itemForm, current_quantity: Number(e.target.value) })}
                required
                min="0"
                className="input-field font-bold"
              />
            </div>
            <div>
              <label className="input-label">Reorder Level</label>
              <input
                type="number"
                value={itemForm.reorder_level}
                onChange={(e) => setItemForm({ ...itemForm, reorder_level: Number(e.target.value) })}
                required
                min="0"
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Unit Cost (₹)</label>
              <input
                type="number"
                value={itemForm.unit_cost}
                onChange={(e) => setItemForm({ ...itemForm, unit_cost: Number(e.target.value) })}
                step="0.1"
                min="0"
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsItemModalOpen(false);
                setEditingItem(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingItem ? 'Save Item Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Adjust Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setAdjustingItem(null);
        }}
        title={`Audit & Adjust Stock — ${adjustingItem?.item_name}`}
        subtitle={`Location: ${adjustingItem?.warehouse_name}`}
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-4">
          <div>
            <label className="input-label">Physical Count ({adjustingItem?.unit})</label>
            <input
              type="number"
              value={adjustmentQty}
              onChange={(e) => setAdjustmentQty(Number(e.target.value))}
              min="0"
              required
              className="input-field font-bold text-base"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Previous Recorded: {formatNumber(adjustingItem?.current_quantity)} {adjustingItem?.unit}
            </span>
          </div>

          <div>
            <label className="input-label">Adjustment Reason & Audit Note</label>
            <textarea
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              required
              rows={2}
              className="input-field"
              placeholder="e.g. Monthly physical inventory verification"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAdjustModalOpen(false);
                setAdjustingItem(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Verified Count
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation: Delete Item */}
      <DeleteConfirmModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Warehouse Stock Item"
        recordIdentifier={deletingItem ? `${deletingItem.item_name} (${deletingItem.warehouse_name})` : ''}
        consequences={[
          'This SKU record will be permanently deleted from the warehouse ledger.',
          'Stock valuation and inventory alerts will be recalculated immediately.',
        ]}
      />
    </div>
  );
}
