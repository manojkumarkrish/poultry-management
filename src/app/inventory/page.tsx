'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { WarehouseStockItem } from '@/types/database';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
import {
  Warehouse,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Package,
} from 'lucide-react';

export default function GodownInventoryPage() {
  const { warehouseItems, updateWarehouseItem, currentUser } = useFarm();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WarehouseStockItem | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('Physical audit reconciliation');
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);

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

  const handleOpenAdjust = (item: WarehouseStockItem) => {
    setSelectedItem(item);
    setAdjustmentQty(item.current_quantity);
    setAdjustmentReason('Physical godown cycle count audit');
    setAdjustSuccess(null);
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    updateWarehouseItem(selectedItem.id, {
      current_quantity: Number(adjustmentQty),
    });

    setAdjustSuccess(`Adjusted ${selectedItem.item_name} to ${adjustmentQty} ${selectedItem.unit}.`);
    setTimeout(() => setIsAdjustModalOpen(false), 1000);
  };

  return (
    <div className="space-y-6">
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
        <ExportButtons data={warehouseItems} filename="godown-inventory" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Inventory Value</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            ₹{totalValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <th className="py-3 px-4">Item SKU & Name</th>
              <th className="py-3 px-4">Godown Location & Rack</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">In Stock</th>
              <th className="py-3 px-4 text-right">Reorder Level</th>
              <th className="py-3 px-4 text-right">Total Value</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
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
                    {item.current_quantity.toLocaleString()} {item.unit}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500">
                    {item.reorder_level.toLocaleString()} {item.unit}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">
                    ₹{itemTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleOpenAdjust(item)}
                      className="text-xs text-slate-700 hover:text-emerald-700 font-semibold bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
                    >
                      Audit / Adjust
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Adjust Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Audit & Adjust Stock — ${selectedItem?.item_name}`}
        subtitle={`Location: ${selectedItem?.warehouse_name}`}
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-4">
          {adjustSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{adjustSuccess}</span>
            </div>
          )}

          <div>
            <label className="input-label">Physical Count ({selectedItem?.unit})</label>
            <input
              type="number"
              value={adjustmentQty}
              onChange={(e) => setAdjustmentQty(Number(e.target.value))}
              min="0"
              required
              className="input-field font-bold text-base"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Previous Recorded: {selectedItem?.current_quantity.toLocaleString()} {selectedItem?.unit}
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
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Verified Count
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
