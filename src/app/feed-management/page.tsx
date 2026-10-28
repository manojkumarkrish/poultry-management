'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { FeedIngredient, FeedRecipe, BirdStage, FeedIssue, FeedProduction } from '@/types/database';
import { formatNumber, formatCurrency } from '@/lib/utils/formatters';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
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
  Pencil,
  Trash2,
  Undo2,
  XCircle,
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
    deleteFeedIngredient,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    produceFeed,
    cancelFeedProduction,
    issueFeedToShed,
    updateFeedIssue,
    deleteFeedIssue,
    currentUser,
    canEdit,
    canDelete,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<'ingredients' | 'recipes' | 'production' | 'distribution'>('ingredients');

  // Modals
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<FeedIngredient | null>(null);
  const [deletingIngredient, setDeletingIngredient] = useState<FeedIngredient | null>(null);

  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<FeedRecipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<FeedRecipe | null>(null);

  const [isProduceModalOpen, setIsProduceModalOpen] = useState(false);
  const [cancellingProduction, setCancellingProduction] = useState<FeedProduction | null>(null);

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<FeedIssue | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<FeedIssue | null>(null);

  // Notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Ingredient Form State
  const [ingForm, setIngForm] = useState({
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
  const [recipeForm, setRecipeForm] = useState<{
    name: string;
    bird_stage: BirdStage;
    batch_size_kg: number;
    notes: string;
    items: { ingredient_id: string; percentage: number }[];
  }>({
    name: '',
    bird_stage: 'layer',
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

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // --- Ingredient Actions ---
  const handleOpenAddIngredient = () => {
    setIngForm({
      code: '',
      name: '',
      unit: 'kg',
      opening_stock_kg: 5000,
      current_stock_kg: 5000,
      unit_price_per_kg: 25.0,
      reorder_level_kg: 1000,
      supplier_name: '',
      notes: '',
    });
    setEditingIngredient(null);
    setIsIngredientModalOpen(true);
  };

  const handleOpenEditIngredient = (ing: FeedIngredient) => {
    setIngForm({
      code: ing.code,
      name: ing.name,
      unit: ing.unit,
      opening_stock_kg: ing.opening_stock_kg,
      current_stock_kg: ing.current_stock_kg,
      unit_price_per_kg: ing.unit_price_per_kg,
      reorder_level_kg: ing.reorder_level_kg,
      supplier_name: ing.supplier_name || '',
      notes: ing.notes || '',
    });
    setEditingIngredient(ing);
    setIsIngredientModalOpen(true);
  };

  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIngredient) {
      updateFeedIngredient(editingIngredient.id, {
        code: ingForm.code.toUpperCase(),
        name: ingForm.name,
        unit: ingForm.unit,
        current_stock_kg: Number(ingForm.current_stock_kg),
        unit_price_per_kg: Number(ingForm.unit_price_per_kg),
        reorder_level_kg: Number(ingForm.reorder_level_kg),
        supplier_name: ingForm.supplier_name,
        notes: ingForm.notes,
      });
      showNotification('success', `Updated ingredient "${ingForm.name}".`);
    } else {
      addFeedIngredient({
        code: ingForm.code.toUpperCase(),
        name: ingForm.name,
        unit: ingForm.unit,
        opening_stock_kg: Number(ingForm.opening_stock_kg),
        current_stock_kg: Number(ingForm.current_stock_kg),
        unit_price_per_kg: Number(ingForm.unit_price_per_kg),
        reorder_level_kg: Number(ingForm.reorder_level_kg),
        supplier_name: ingForm.supplier_name,
        notes: ingForm.notes,
      });
      showNotification('success', `Added new ingredient "${ingForm.name}".`);
    }
    setIsIngredientModalOpen(false);
    setEditingIngredient(null);
  };

  const handleConfirmDeleteIngredient = () => {
    if (!deletingIngredient) return;
    const res = deleteFeedIngredient(deletingIngredient.id);
    if (!res.success) {
      showNotification('error', res.error || 'Failed to delete ingredient.');
    } else {
      showNotification('success', `Deleted ingredient "${deletingIngredient.name}".`);
    }
    setDeletingIngredient(null);
  };

  // --- Recipe Actions ---
  const handleOpenAddRecipe = () => {
    setRecipeForm({
      name: '',
      bird_stage: 'layer',
      batch_size_kg: 1000,
      notes: '',
      items: feedIngredients.slice(0, 4).map((ing, idx) => ({
        ingredient_id: ing.id,
        percentage: idx === 0 ? 55 : idx === 1 ? 25 : idx === 2 ? 10 : 10,
      })),
    });
    setEditingRecipe(null);
    setRecipeError(null);
    setIsRecipeModalOpen(true);
  };

  const handleOpenEditRecipe = (recipe: FeedRecipe) => {
    setRecipeForm({
      name: recipe.name,
      bird_stage: recipe.bird_stage,
      batch_size_kg: recipe.batch_size_kg,
      notes: recipe.notes || '',
      items: recipe.items.map((item) => ({
        ingredient_id: item.ingredient_id,
        percentage: item.percentage,
      })),
    });
    setEditingRecipe(recipe);
    setRecipeError(null);
    setIsRecipeModalOpen(true);
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    setRecipeError(null);

    const sumPercentage = recipeForm.items.reduce((s, it) => s + Number(it.percentage || 0), 0);
    if (Math.abs(sumPercentage - 100) > 0.1) {
      setRecipeError(`Ingredient percentages must equal 100% exactly (Current sum: ${sumPercentage}%).`);
      return;
    }

    const recipeItems = recipeForm.items.map((it) => {
      const ing = feedIngredients.find((i) => i.id === it.ingredient_id);
      return {
        ingredient_id: it.ingredient_id,
        ingredient_name: ing?.name || 'Unknown',
        percentage: Number(it.percentage),
        kg_per_ton: Number(it.percentage) * 10,
      };
    });

    if (editingRecipe) {
      const res = updateRecipe(editingRecipe.id, {
        name: recipeForm.name,
        bird_stage: recipeForm.bird_stage,
        batch_size_kg: Number(recipeForm.batch_size_kg),
        notes: recipeForm.notes,
        items: recipeItems,
      });
      if (!res.success) {
        setRecipeError(res.error || 'Failed to update recipe.');
        return;
      }
      showNotification('success', `Recipe "${recipeForm.name}" updated successfully.`);
    } else {
      addRecipe({
        name: recipeForm.name,
        bird_stage: recipeForm.bird_stage,
        batch_size_kg: Number(recipeForm.batch_size_kg),
        effective_date: new Date().toISOString().split('T')[0],
        version: 1,
        is_active: true,
        notes: recipeForm.notes,
        items: recipeItems,
      });
      showNotification('success', `Created recipe "${recipeForm.name}".`);
    }
    setIsRecipeModalOpen(false);
    setEditingRecipe(null);
  };

  const handleConfirmDeleteRecipe = () => {
    if (!deletingRecipe) return;
    const res = deleteRecipe(deletingRecipe.id);
    if (!res.success) {
      showNotification('error', res.error || 'Failed to delete recipe.');
    } else {
      showNotification('success', `Recipe "${deletingRecipe.name}" removed / archived.`);
    }
    setDeletingRecipe(null);
  };

  // --- Production Actions ---
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
      setProductionSuccess(`Successfully produced ${formatNumber(productionData.producedQuantityKg)} kg feed!`);
      showNotification('success', `Successfully milled ${formatNumber(productionData.producedQuantityKg)} kg feed.`);
      setTimeout(() => setIsProduceModalOpen(false), 1200);
    }
  };

  const handleConfirmCancelProduction = () => {
    if (!cancellingProduction) return;
    const res = cancelFeedProduction(cancellingProduction.id);
    if (!res.success) {
      showNotification('error', res.error || 'Failed to cancel production run.');
    } else {
      showNotification('success', `Production ${cancellingProduction.batch_number} reversed. Raw ingredients restored.`);
    }
    setCancellingProduction(null);
  };

  // --- Distribution / Issue Actions ---
  const handleOpenAddIssue = () => {
    setIssueData({
      shedId: sheds[0]?.id || '',
      feedType: 'Commercial Layer Mash',
      quantityIssuedKg: 2100,
      quantityReturnedKg: 0,
      issueDate: new Date().toISOString().split('T')[0],
      notes: 'Daily feed distribution',
    });
    setEditingIssue(null);
    setIsIssueModalOpen(true);
  };

  const handleOpenEditIssue = (iss: FeedIssue) => {
    setIssueData({
      shedId: iss.shed_id,
      feedType: iss.feed_type,
      quantityIssuedKg: iss.quantity_issued_kg,
      quantityReturnedKg: iss.quantity_returned_kg,
      issueDate: iss.issue_date,
      notes: iss.notes || '',
    });
    setEditingIssue(iss);
    setIsIssueModalOpen(true);
  };

  const handleExecuteIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const shed = sheds.find((s) => s.id === issueData.shedId);
    if (!shed) return;
    const batch = batches.find((b) => b.current_shed_id === shed.id);

    if (editingIssue) {
      const res = updateFeedIssue(editingIssue.id, {
        issue_date: issueData.issueDate,
        shed_id: shed.id,
        shed_code: shed.code,
        batch_id: batch?.id || '',
        batch_code: batch?.batch_code || 'N/A',
        feed_type: issueData.feedType,
        quantity_issued_kg: Number(issueData.quantityIssuedKg),
        quantity_returned_kg: Number(issueData.quantityReturnedKg),
        net_consumed_kg: Number(issueData.quantityIssuedKg) - Number(issueData.quantityReturnedKg),
        notes: issueData.notes,
      });
      if (!res.success) {
        showNotification('error', res.error || 'Failed to update feed issue.');
        return;
      }
      showNotification('success', `Feed issue for ${shed.code} updated.`);
    } else {
      const res = issueFeedToShed({
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
      if (!res.success) {
        showNotification('error', res.error || 'Failed to record feed issue.');
        return;
      }
      showNotification('success', `Feed issued to ${shed.code} successfully.`);
    }

    setIsIssueModalOpen(false);
    setEditingIssue(null);
  };

  const handleConfirmDeleteIssue = () => {
    if (!deletingIssue) return;
    const res = deleteFeedIssue(deletingIssue.id);
    if (!res.success) {
      showNotification('error', res.error || 'Failed to delete feed issue slip.');
    } else {
      showNotification('success', 'Feed issue record removed.');
    }
    setDeletingIssue(null);
  };

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
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
            <Wheat className="w-6 h-6 text-amber-600" />
            <span>Feed Management & Milling</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Raw ingredients, formula recipes (100% sum check), mill production, and shed-level distribution
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons data={feedIngredients} filename="kpf-feed-ingredients" />
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
          <span className="text-xs text-slate-500 font-medium">{formatNumber(totalIngredientStockKg)} kg stored</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-500 uppercase">Stock Valuation</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(totalIngredientValue, { maximumFractionDigits: 0 })}
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
        <nav className="flex space-x-6 text-xs font-bold uppercase tracking-wider overflow-x-auto">
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'ingredients'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            1. Raw Ingredients ({feedIngredients.length})
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'recipes'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            2. Feed Recipes ({recipes.length})
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'production'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            3. Production Log ({feedProductions.length})
          </button>
          <button
            onClick={() => setActiveTab('distribution')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${
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
            {canEdit() && (
              <button onClick={handleOpenAddIngredient} className="btn-secondary gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Ingredient</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="py-3 px-4">Code & Name</th>
                    <th className="py-3 px-4 text-right">Available Stock</th>
                    <th className="py-3 px-4 text-right">Reorder Level</th>
                    <th className="py-3 px-4 text-right">Unit Price (₹/kg)</th>
                    <th className="py-3 px-4 text-right">Total Valuation</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
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
                          {formatNumber(ing.current_stock_kg)} {ing.unit}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">
                          {formatNumber(ing.reorder_level_kg)} {ing.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          ₹{ing.unit_price_per_kg.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {formatCurrency(totalVal, { maximumFractionDigits: 0 })}
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
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canEdit() && (
                              <button
                                onClick={() => handleOpenEditIngredient(ing)}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                title="Edit Ingredient Details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete() && (
                              <button
                                onClick={() => setDeletingIngredient(ing)}
                                className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                                title="Delete Ingredient"
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
        </div>
      )}

      {/* TAB 2: RECIPES */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Nutritional Formulations (100% Ratio Validated)
              </h3>
              <span className="text-xs text-slate-500">Total {recipes.length} production formulas</span>
            </div>
            {canEdit() && (
              <button onClick={handleOpenAddRecipe} className="btn-secondary gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" />
                <span>New Formula Recipe</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge stage={recipe.bird_stage}>{recipe.bird_stage.toUpperCase()}</Badge>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-mono text-slate-400 mr-1">Ver {recipe.version}.0</span>
                      {canEdit() && (
                        <button
                          onClick={() => handleOpenEditRecipe(recipe)}
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                          title="Edit Recipe"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete() && (
                        <button
                          onClick={() => setDeletingRecipe(recipe)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete / Archive Recipe"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{recipe.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{recipe.notes || 'Nutritionally balanced farm blend'}</p>

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
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="py-3 px-4">Date & Lot Number</th>
                      <th className="py-3 px-4">Recipe Formula</th>
                      <th className="py-3 px-4 text-right">Produced Qty</th>
                      <th className="py-3 px-4 text-right">Milling Loss</th>
                      <th className="py-3 px-4 text-right">Total Cost</th>
                      <th className="py-3 px-4 text-right">Cost / kg</th>
                      <th className="py-3 px-4">Operator</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {feedProductions.map((p) => {
                      const isCancelled = p.status === 'cancelled';
                      return (
                        <tr key={p.id} className={`hover:bg-slate-50 ${isCancelled ? 'opacity-50 bg-slate-50' : ''}`}>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{p.batch_number}</div>
                            <div className="text-[11px] text-slate-400">{p.production_date}</div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{p.recipe_name}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-700">
                            {formatNumber(p.produced_quantity_kg)} kg
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500">{p.production_loss_kg} kg</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            {formatCurrency(p.total_ingredient_cost, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-800">
                            ₹{p.cost_per_kg.toFixed(2)}/kg
                          </td>
                          <td className="py-3 px-4 text-slate-500">{p.recorded_by}</td>
                          <td className="py-3 px-4 text-center">
                            {isCancelled ? (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                CANCELLED
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                POSTED
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!isCancelled && canDelete(true) && (
                              <button
                                onClick={() => setCancellingProduction(p)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded transition-colors"
                                title="Cancel Production Run and Restore Raw Ingredients"
                              >
                                <Undo2 className="w-3 h-3" />
                                <span>Revert</span>
                              </button>
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
        </div>
      )}

      {/* TAB 4: SHED DISTRIBUTION */}
      {activeTab === 'distribution' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Feed Issued vs Returned to Sheds
            </h3>
            <button onClick={handleOpenAddIssue} className="btn-secondary text-xs gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              <span>Issue Feed to Shed</span>
            </button>
          </div>

          {feedIssues.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No feed distribution slips issued yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Record daily feed delivery to individual sheds to track net intake accurately.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Shed & Flock</th>
                      <th className="py-3 px-4">Feed Type</th>
                      <th className="py-3 px-4 text-right">Issued</th>
                      <th className="py-3 px-4 text-right">Returned</th>
                      <th className="py-3 px-4 text-right">Net Consumed</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-4 text-right">Actions</th>
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
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canEdit(iss.issue_date) && (
                              <button
                                onClick={() => handleOpenEditIssue(iss)}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                title="Edit Distribution Record"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete() && (
                              <button
                                onClick={() => setDeletingIssue(iss)}
                                className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                                title="Delete Distribution Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Mill / Produce Feed */}
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

      {/* Modal: Add / Edit Ingredient */}
      <Modal
        isOpen={isIngredientModalOpen}
        onClose={() => {
          setIsIngredientModalOpen(false);
          setEditingIngredient(null);
        }}
        title={editingIngredient ? `Edit Ingredient: ${editingIngredient.name}` : 'Add New Raw Ingredient'}
        subtitle="Define ingredient code, unit price, stock on hand, and reorder alert"
      >
        <form onSubmit={handleSaveIngredient} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Ingredient Code</label>
              <input
                type="text"
                value={ingForm.code}
                onChange={(e) => setIngForm({ ...ingForm, code: e.target.value })}
                placeholder="ING-MAIZE"
                required
                className="input-field font-mono uppercase"
              />
            </div>
            <div>
              <label className="input-label">Ingredient Name</label>
              <input
                type="text"
                value={ingForm.name}
                onChange={(e) => setIngForm({ ...ingForm, name: e.target.value })}
                placeholder="Yellow Maize / Corn"
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="input-label">Current Stock (kg)</label>
              <input
                type="number"
                value={ingForm.current_stock_kg}
                onChange={(e) => setIngForm({ ...ingForm, current_stock_kg: Number(e.target.value) })}
                required
                className="input-field font-bold"
              />
            </div>
            <div>
              <label className="input-label">Unit Price (₹/kg)</label>
              <input
                type="number"
                value={ingForm.unit_price_per_kg}
                onChange={(e) => setIngForm({ ...ingForm, unit_price_per_kg: Number(e.target.value) })}
                step="0.01"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Reorder Level (kg)</label>
              <input
                type="number"
                value={ingForm.reorder_level_kg}
                onChange={(e) => setIngForm({ ...ingForm, reorder_level_kg: Number(e.target.value) })}
                required
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Preferred Supplier</label>
            <input
              type="text"
              value={ingForm.supplier_name}
              onChange={(e) => setIngForm({ ...ingForm, supplier_name: e.target.value })}
              className="input-field"
              placeholder="e.g. Kisan Agro Commodities"
            />
          </div>

          <div>
            <label className="input-label">Notes & Specifications</label>
            <input
              type="text"
              value={ingForm.notes}
              onChange={(e) => setIngForm({ ...ingForm, notes: e.target.value })}
              className="input-field"
              placeholder="Moisture < 12%, standard feed grade"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsIngredientModalOpen(false);
                setEditingIngredient(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingIngredient ? 'Update Ingredient' : 'Save Ingredient'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add / Edit Recipe */}
      <Modal
        isOpen={isRecipeModalOpen}
        onClose={() => {
          setIsRecipeModalOpen(false);
          setEditingRecipe(null);
        }}
        title={editingRecipe ? `Edit Formula Recipe: ${editingRecipe.name}` : 'Create Feed Formula Recipe'}
        subtitle="Formulations must sum to 100.0% exactly"
      >
        <form onSubmit={handleSaveRecipe} className="space-y-4">
          {recipeError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{recipeError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Formula Name</label>
              <input
                type="text"
                value={recipeForm.name}
                onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                placeholder="Phase 1 Layer Mash (High Protein)"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Bird Stage</label>
              <select
                value={recipeForm.bird_stage}
                onChange={(e) => setRecipeForm({ ...recipeForm, bird_stage: e.target.value as BirdStage })}
                className="input-field font-semibold"
              >
                <option value="layer">Layer (Weeks 18-80)</option>
                <option value="grower">Grower (Weeks 9-18)</option>
                <option value="chick">Chick (Weeks 0-8)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="input-label">Notes & Nutritional Goals</label>
            <input
              type="text"
              value={recipeForm.notes}
              onChange={(e) => setRecipeForm({ ...recipeForm, notes: e.target.value })}
              className="input-field"
              placeholder="e.g. 17.5% CP, 2750 kcal ME, 3.8% Ca"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="input-label mb-0">Ingredient Proportions (%)</label>
              <span className="text-xs font-bold text-slate-700">
                Sum:{' '}
                <span
                  className={
                    Math.abs(recipeForm.items.reduce((s, it) => s + Number(it.percentage || 0), 0) - 100) < 0.1
                      ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded'
                      : 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded'
                  }
                >
                  {recipeForm.items.reduce((s, it) => s + Number(it.percentage || 0), 0)}%
                </span>
              </span>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
              {recipeForm.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={item.ingredient_id}
                    onChange={(e) => {
                      const newItems = [...recipeForm.items];
                      newItems[idx].ingredient_id = e.target.value;
                      setRecipeForm({ ...recipeForm, items: newItems });
                    }}
                    className="input-field text-xs flex-1"
                  >
                    {feedIngredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.code})
                      </option>
                    ))}
                  </select>
                  <div className="w-28 flex items-center gap-1">
                    <input
                      type="number"
                      value={item.percentage}
                      onChange={(e) => {
                        const newItems = [...recipeForm.items];
                        newItems[idx].percentage = Number(e.target.value);
                        setRecipeForm({ ...recipeForm, items: newItems });
                      }}
                      step="0.5"
                      min="0"
                      max="100"
                      className="input-field text-xs text-right font-bold"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                  {recipeForm.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = recipeForm.items.filter((_, i) => i !== idx);
                        setRecipeForm({ ...recipeForm, items: newItems });
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const remaining = feedIngredients.find(
                    (ing) => !recipeForm.items.some((it) => it.ingredient_id === ing.id)
                  );
                  if (remaining) {
                    setRecipeForm({
                      ...recipeForm,
                      items: [...recipeForm.items, { ingredient_id: remaining.id, percentage: 0 }],
                    });
                  }
                }}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 pt-2"
              >
                <Plus className="w-3 h-3" />
                <span>Add Ingredient Line</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsRecipeModalOpen(false);
                setEditingRecipe(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingRecipe ? 'Save Recipe Changes' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Issue Feed to Shed (Add/Edit) */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => {
          setIsIssueModalOpen(false);
          setEditingIssue(null);
        }}
        title={editingIssue ? `Edit Feed Distribution #${editingIssue.id.slice(-6)}` : 'Issue Feed to Shed'}
        subtitle="Log feed dispatch to shed feeders and monitor net intake"
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

          <div>
            <label className="input-label">Notes</label>
            <input
              type="text"
              value={issueData.notes}
              onChange={(e) => setIssueData({ ...issueData, notes: e.target.value })}
              className="input-field"
              placeholder="e.g. Feeder check ok, morning batch"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsIssueModalOpen(false);
                setEditingIssue(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingIssue ? 'Update Distribution' : 'Confirm Feed Issue'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation: Delete Ingredient */}
      <DeleteConfirmModal
        isOpen={!!deletingIngredient}
        onClose={() => setDeletingIngredient(null)}
        onConfirm={handleConfirmDeleteIngredient}
        title="Delete Feed Ingredient"
        recordIdentifier={deletingIngredient ? `${deletingIngredient.name} (${deletingIngredient.code})` : ''}
        consequences={[
          'The ingredient will be permanently removed from godown stock records.',
          'Deletions are automatically blocked if the ingredient is used in any active recipe formula.',
          'Stock valuation metrics will adjust immediately.',
        ]}
      />

      {/* Confirmation: Delete Recipe */}
      <DeleteConfirmModal
        isOpen={!!deletingRecipe}
        onClose={() => setDeletingRecipe(null)}
        onConfirm={handleConfirmDeleteRecipe}
        title="Archive / Remove Formula Recipe"
        recordIdentifier={deletingRecipe ? `${deletingRecipe.name} (${deletingRecipe.bird_stage.toUpperCase()})` : ''}
        consequences={[
          'If this formula has past production history, it will be safely deactivated/archived to protect historical production logs.',
          'Operators will no longer be able to select this formula for new milling runs.',
        ]}
      />

      {/* Confirmation: Cancel Production */}
      <DeleteConfirmModal
        isOpen={!!cancellingProduction}
        onClose={() => setCancellingProduction(null)}
        onConfirm={handleConfirmCancelProduction}
        title="Revert & Cancel Production Run"
        recordIdentifier={cancellingProduction ? `Batch ${cancellingProduction.batch_number} (${formatNumber(cancellingProduction.produced_quantity_kg)} kg)` : ''}
        confirmText="Confirm Reversal"
        consequences={[
          'All deducted raw ingredients (Maize, Soya DOC, DORB, Premix) will be restored to Godown stock.',
          'Produced finished feed mash will be deducted from warehouse inventory.',
          'The production lot will be stamped as CANCELLED with an audit log record.',
        ]}
      />

      {/* Confirmation: Delete Issue */}
      <DeleteConfirmModal
        isOpen={!!deletingIssue}
        onClose={() => setDeletingIssue(null)}
        onConfirm={handleConfirmDeleteIssue}
        title="Delete Feed Issue Slip"
        recordIdentifier={deletingIssue ? `${deletingIssue.shed_code} — ${deletingIssue.quantity_issued_kg} kg on ${deletingIssue.issue_date}` : ''}
        consequences={[
          'This feed distribution record will be removed.',
          'Feed consumption and FCR metrics for this shed will be recalculated accordingly.',
        ]}
      />
    </div>
  );
}
