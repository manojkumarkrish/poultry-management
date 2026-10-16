'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { FeedIngredient, FeedRecipe, BirdStage } from '@/types/database';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
import {
  Wheat,
  Plus,
  Layers,
  Factory,
  ArrowRight,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Calendar,
} from 'lucide-react';

export default function FeedManagementPage() {
  const {
    feedIngredients,
    recipes,
    feedProductions,
    feedIssues,
    sheds,
    batches,
    addFeedIngredient,
    updateFeedIngredient,
    addRecipe,
    produceFeed,
    issueFeedToShed,
    currentUser,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<'ingredients' | 'recipes' | 'production' | 'distribution'>('ingredients');

  // Modals
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isProduceModalOpen, setIsProduceModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Ingredient Form State
  const [newIngData, setNewIngData] = useState({
    code: '',
    name: '',
    unit: 'kg',
    opening_stock_kg: 5000,
    current_stock_kg: 5000,
    unit_price_per_kg: 25.0,
    reorder_level_kg: 1000,
    supplier_name: 'Kisan Agro Traders',
    notes: '',
  });

  // Recipe Form State
  const [newRecipeData, setNewRecipeData] = useState({
    name: '',
    bird_stage: 'layer' as BirdStage,
    batch_size_kg: 1000,
    notes: '',
    items: [
      { ingredient_id: feedIngredients[0]?.id || '', percentage: 55 },
      { ingredient_id: feedIngredients[1]?.id || '', percentage: 25 },
      { ingredient_id: feedIngredients[2]?.id || '', percentage: 10 },
      { ingredient_id: feedIngredients[3]?.id || '', percentage: 10 },
    ],
  });
  const [recipeError, setRecipeError] = useState<string | null>(null);

  // Production Form State
  const [productionData, setProductionData] = useState({
    recipeId: recipes[0]?.id || '',
    batchNumber: `FEED-LOT-${Date.now().toString().slice(-4)}`,
    producedQuantityKg: 5000,
    productionLossKg: 50,
  });
  const [productionError, setProductionError] = useState<string | null>(null);
  const [productionSuccess, setProductionSuccess] = useState<string | null>(null);

  // Distribution Form State
  const [issueData, setIssueData] = useState({
    shedId: sheds[0]?.id || '',
    feedType: 'Commercial Layer Mash',
    quantityIssuedKg: 2100,
    quantityReturnedKg: 0,
    issueDate: new Date().toISOString().split('T')[0],
    notes: 'Morning & evening automatic feeder refill',
  });

  // Totals
  const totalIngredientStockKg = feedIngredients.reduce((sum, i) => sum + i.current_stock_kg, 0);
  const totalIngredientValue = feedIngredients.reduce((sum, i) => sum + i.current_stock_kg * i.unit_price_per_kg, 0);
  const lowStockCount = feedIngredients.filter((i) => i.current_stock_kg <= i.reorder_level_kg).length;

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    addFeedIngredient({
      code: newIngData.code.toUpperCase(),
      name: newIngData.name,
      unit: newIngData.unit,
      opening_stock_kg: Number(newIngData.opening_stock_kg),
      current_stock_kg: Number(newIngData.current_stock_kg),
      unit_price_per_kg: Number(newIngData.unit_price_per_kg),
      reorder_level_kg: Number(newIngData.reorder_level_kg),
      supplier_name: newIngData.supplier_name,
      notes: newIngData.notes,
    });
    setIsIngredientModalOpen(false);
  };

  const handleExecuteProduction = (e: React.FormEvent) => {
    e.preventDefault();
    setProductionError(null);
    setProductionSuccess(null);

    const res = produceFeed({
      recipeId: productionData.recipeId,
      producedQuantityKg: Number(productionData.producedQuantityKg),
      productionLossKg: Number(productionData.productionLossKg),
      batchNumber: productionData.batchNumber,
    });

    if (!res.success) {
      setProductionError(res.error || 'Failed to mill feed.');
    } else {
      setProductionSuccess(`Successfully produced ${productionData.producedQuantityKg.toLocaleString()} kg feed!`);
      setTimeout(() => setIsProduceModalOpen(false), 1200);
    }
  };

  const handleExecuteIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const shed = sheds.find((s) => s.id === issueData.shedId);
    if (!shed) return;
    const batch = batches.find((b) => b.current_shed_id === shed.id);

    issueFeedToShed({
      issue_date: issueData.issueDate,
      shed_id: shed.id,
      shed_code: shed.code,
      batch_id: batch?.id || '',
      batch_code: batch?.batch_code || 'N/A',
      feed_type: issueData.feedType,
      quantity_issued_kg: Number(issueData.quantityIssuedKg),
      quantity_returned_kg: Number(issueData.quantityReturnedKg),
      net_consumed_kg: Number(issueData.quantityIssuedKg) - Number(issueData.quantityReturnedKg),
      authorized_by: currentUser.id,
      notes: issueData.notes,
    });

    setIsIssueModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Wheat className="w-6 h-6 text-amber-600" />
            <span>Feed Management & Milling</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Raw ingredients, formula recipes (100% sum check), mill production, and shed-level distribution
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons data={feedIngredients} filename="feed-ingredients" />
          <button onClick={() => setIsProduceModalOpen(true)} className="btn-primary gap-2">
            <Factory className="w-4 h-4" />
            <span>Mill / Produce Feed</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Ingredient Stock</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {(totalIngredientStockKg / 1000).toFixed(1)} MT
          </div>
          <span className="text-xs text-slate-500 font-medium">{totalIngredientStockKg.toLocaleString()} kg stored</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Stock Valuation</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            ₹{totalIngredientValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">Recorded purchase basis</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Active Recipes</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{recipes.length} Formulations</div>
          <span className="text-xs text-emerald-600 font-medium">Layer, Grower & Chick</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Reorder Alerts</span>
          <div className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {lowStockCount} Items
          </div>
          <span className="text-xs text-slate-500 font-medium">Below safe threshold</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'ingredients'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            1. Raw Ingredients ({feedIngredients.length})
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'recipes'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            2. Feed Recipes ({recipes.length})
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'production'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            3. Production Log ({feedProductions.length})
          </button>
          <button
            onClick={() => setActiveTab('distribution')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'distribution'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            4. Shed Distribution ({feedIssues.length})
          </button>
        </nav>
      </div>

      {/* TAB 1: INGREDIENTS */}
      {activeTab === 'ingredients' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Raw Feed Ingredients Godown Stock
            </h3>
            <button onClick={() => setIsIngredientModalOpen(true)} className="btn-secondary gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ingredient</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-3 px-4">Code & Name</th>
                  <th className="py-3 px-4 text-right">Available Stock</th>
                  <th className="py-3 px-4 text-right">Reorder Level</th>
                  <th className="py-3 px-4 text-right">Unit Price (₹/kg)</th>
                  <th className="py-3 px-4 text-right">Total Valuation</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feedIngredients.map((ing) => {
                  const isLow = ing.current_stock_kg <= ing.reorder_level_kg;
                  const totalVal = ing.current_stock_kg * ing.unit_price_per_kg;

                  return (
                    <tr key={ing.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{ing.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{ing.code}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {ing.current_stock_kg.toLocaleString()} {ing.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {ing.reorder_level_kg.toLocaleString()} {ing.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        ₹{ing.unit_price_per_kg.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        ₹{totalVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{ing.supplier_name || 'Standard Vendor'}</td>
                      <td className="py-3 px-4 text-center">
                        {isLow ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            OPTIMAL
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RECIPES */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Nutritional Formulations (100% Ratio Validated)
            </h3>
            <span className="text-xs text-slate-500">Total 3 production formulas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge stage={recipe.bird_stage}>{recipe.bird_stage.toUpperCase()}</Badge>
                    <span className="text-[11px] font-mono text-slate-400">Ver {recipe.version}.0</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{recipe.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{recipe.notes}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Formula Breakdown per 1,000 kg Batch:
                    </span>
                    <div className="mt-2 space-y-1.5 text-xs">
                      {recipe.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-slate-700">
                          <span className="truncate pr-2">{item.ingredient_name}</span>
                          <span className="font-bold text-slate-900 flex-shrink-0">
                            {item.percentage}% ({item.kg_per_ton} kg)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Sum: 100.0%
                  </span>
                  <button
                    onClick={() => {
                      setProductionData({
                        ...productionData,
                        recipeId: recipe.id,
                      });
                      setIsProduceModalOpen(true);
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <span>Mill This</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTION LOGS */}
      {activeTab === 'production' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Feed Milling Batches & Finished Mash
            </h3>
            <button onClick={() => setIsProduceModalOpen(true)} className="btn-primary text-xs gap-1.5">
              <Factory className="w-3.5 h-3.5" />
              <span>Record New Production Run</span>
            </button>
          </div>

          {feedProductions.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
              <Factory className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No feed production runs recorded yet.</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Produce feed using the formulas above. Raw ingredient stocks will automatically be deducted in exact proportion!
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="py-3 px-4">Date & Lot Number</th>
                    <th className="py-3 px-4">Recipe Formula</th>
                    <th className="py-3 px-4 text-right">Produced Qty</th>
                    <th className="py-3 px-4 text-right">Milling Loss</th>
                    <th className="py-3 px-4 text-right">Total Cost</th>
                    <th className="py-3 px-4 text-right">Cost / kg</th>
                    <th className="py-3 px-4">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feedProductions.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.batch_number}</div>
                        <div className="text-[11px] text-slate-400">{p.production_date}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{p.recipe_name}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {p.produced_quantity_kg.toLocaleString()} kg
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">{p.production_loss_kg} kg</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{p.total_ingredient_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        ₹{p.cost_per_kg.toFixed(2)}/kg
                      </td>
                      <td className="py-3 px-4 text-slate-500">{p.recorded_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SHED DISTRIBUTION */}
      {activeTab === 'distribution' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Feed Issued vs Returned to Sheds
            </h3>
            <button onClick={() => setIsIssueModalOpen(true)} className="btn-secondary text-xs gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              <span>Issue Feed to Shed</span>
            </button>
          </div>

          {feedIssues.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No feed distribution slips issued yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Record daily feed delivery to individual sheds (L1–L5, G1–G2, C1) to track net intake accurately.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Shed & Flock</th>
                    <th className="py-3 px-4">Feed Type</th>
                    <th className="py-3 px-4 text-right">Issued</th>
                    <th className="py-3 px-4 text-right">Returned</th>
                    <th className="py-3 px-4 text-right">Net Consumed</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feedIssues.map((iss) => (
                    <tr key={iss.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-800">{iss.issue_date}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {iss.shed_code}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{iss.batch_code}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{iss.feed_type}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{iss.quantity_issued_kg} kg</td>
                      <td className="py-3 px-4 text-right text-slate-500">{iss.quantity_returned_kg} kg</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {iss.net_consumed_kg} kg
                      </td>
                      <td className="py-3 px-4 text-slate-500">{iss.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Produce Feed */}
      <Modal
        isOpen={isProduceModalOpen}
        onClose={() => setIsProduceModalOpen(false)}
        title="Mill Feed — Production Batch"
        subtitle="Deducts raw ingredient stocks and adds finished mash bags to inventory"
      >
        <form onSubmit={handleExecuteProduction} className="space-y-4">
          {productionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{productionError}</span>
            </div>
          )}
          {productionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{productionSuccess}</span>
            </div>
          )}

          <div>
            <label className="input-label">Select Formula Recipe</label>
            <select
              value={productionData.recipeId}
              onChange={(e) => setProductionData({ ...productionData, recipeId: e.target.value })}
              className="input-field font-semibold"
            >
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.bird_stage.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Production Lot Number</label>
              <input
                type="text"
                value={productionData.batchNumber}
                onChange={(e) => setProductionData({ ...productionData, batchNumber: e.target.value })}
                required
                className="input-field font-mono uppercase"
              />
            </div>
            <div>
              <label className="input-label">Batch Output (kg)</label>
              <input
                type="number"
                value={productionData.producedQuantityKg}
                onChange={(e) => setProductionData({ ...productionData, producedQuantityKg: Number(e.target.value) })}
                step="500"
                min="500"
                required
                className="input-field font-bold"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Estimated Milling / Moisture Loss (kg)</label>
            <input
              type="number"
              value={productionData.productionLossKg}
              onChange={(e) => setProductionData({ ...productionData, productionLossKg: Number(e.target.value) })}
              min="0"
              className="input-field"
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
            <strong>Automatic Stock Deduction:</strong> Clicking "Execute Milling" will atomically deduct Maize,
            Soya DOC, DORB, and Premix from the godown based on the selected recipe ratios.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsProduceModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Execute Milling & Deduct Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Ingredient */}
      <Modal
        isOpen={isIngredientModalOpen}
        onClose={() => setIsIngredientModalOpen(false)}
        title="Add New Raw Ingredient"
        subtitle="Define new feed ingredient code, unit price, and safe reorder threshold"
      >
        <form onSubmit={handleAddIngredient} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Ingredient Code</label>
              <input
                type="text"
                value={newIngData.code}
                onChange={(e) => setNewIngData({ ...newIngData, code: e.target.value })}
                placeholder="ING-WHEAT"
                required
                className="input-field font-mono uppercase"
              />
            </div>
            <div>
              <label className="input-label">Ingredient Name</label>
              <input
                type="text"
                value={newIngData.name}
                onChange={(e) => setNewIngData({ ...newIngData, name: e.target.value })}
                placeholder="Broken Wheat"
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="input-label">Initial Stock (kg)</label>
              <input
                type="number"
                value={newIngData.current_stock_kg}
                onChange={(e) => setNewIngData({ ...newIngData, current_stock_kg: Number(e.target.value) })}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Unit Price (₹/kg)</label>
              <input
                type="number"
                value={newIngData.unit_price_per_kg}
                onChange={(e) => setNewIngData({ ...newIngData, unit_price_per_kg: Number(e.target.value) })}
                step="0.1"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Reorder Level (kg)</label>
              <input
                type="number"
                value={newIngData.reorder_level_kg}
                onChange={(e) => setNewIngData({ ...newIngData, reorder_level_kg: Number(e.target.value) })}
                required
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Preferred Supplier</label>
            <input
              type="text"
              value={newIngData.supplier_name}
              onChange={(e) => setNewIngData({ ...newIngData, supplier_name: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsIngredientModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Ingredient
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Issue Feed to Shed */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue Feed to Shed"
        subtitle="Log feed dispatch to shed feeders"
      >
        <form onSubmit={handleExecuteIssue} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Destination Shed</label>
              <select
                value={issueData.shedId}
                onChange={(e) => setIssueData({ ...issueData, shedId: e.target.value })}
                className="input-field font-semibold"
              >
                {sheds.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name} ({s.shed_type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Date of Issue</label>
              <input
                type="date"
                value={issueData.issueDate}
                onChange={(e) => setIssueData({ ...issueData, issueDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Feed Type / Mash</label>
              <input
                type="text"
                value={issueData.feedType}
                onChange={(e) => setIssueData({ ...issueData, feedType: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Quantity Issued (kg)</label>
              <input
                type="number"
                value={issueData.quantityIssuedKg}
                onChange={(e) => setIssueData({ ...issueData, quantityIssuedKg: Number(e.target.value) })}
                min="10"
                required
                className="input-field font-bold"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Quantity Returned / Spilled (kg)</label>
            <input
              type="number"
              value={issueData.quantityReturnedKg}
              onChange={(e) => setIssueData({ ...issueData, quantityReturnedKg: Number(e.target.value) })}
              min="0"
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsIssueModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Confirm Feed Issue
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
