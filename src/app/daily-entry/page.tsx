'use client';

import React, { useState, useEffect } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { DailyBirdRecord, convertEggsToTrays, calculateClosingBirds } from '@/types/database';
import { formatNumber } from '@/lib/utils/formatters';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import {
  ClipboardPen,
  Calendar,
  Home,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Egg,
  Wheat,
  Thermometer,
  Droplets,
  HeartPulse,
  Edit,
  Trash2,
} from 'lucide-react';

export default function DailyFarmEntryPage() {
  const {
    sheds,
    batches,
    dailyBirdRecords,
    addDailyBirdRecord,
    updateDailyBirdRecord,
    deleteDailyBirdRecord,
    currentUser,
    visibilitySettings,
    canEdit,
    canDelete,
  } = useFarm();

  const todayStr = new Date().toISOString().split('T')[0];

  const [recordDate, setRecordDate] = useState(todayStr);
  const [selectedShedId, setSelectedShedId] = useState(sheds[0]?.id || '');
  const [selectedBatchId, setSelectedBatchId] = useState('');

  // Form entries
  const [openingBirds, setOpeningBirds] = useState(0);
  const [birdsReceived, setBirdsReceived] = useState(0);
  const [transfersIn, setTransfersIn] = useState(0);
  const [transfersOut, setTransfersOut] = useState(0);
  const [mortality, setMortality] = useState(0);
  const [culls, setCulls] = useState(0);
  const [birdSales, setBirdSales] = useState(0);
  const [otherRemovals, setOtherRemovals] = useState(0);

  const [feedConsumedKg, setFeedConsumedKg] = useState(2100);
  const [waterConsumedLitres, setWaterConsumedLitres] = useState(4200);

  // Layer specific
  const [eggCount, setEggCount] = useState(16200);
  const [damagedEggs, setDamagedEggs] = useState(120);
  const [brokenEggs, setBrokenEggs] = useState(45);

  // Ambient
  const [temperatureC, setTemperatureC] = useState(26.5);
  const [humidityPct, setHumidityPct] = useState(65);
  const [healthNotes, setHealthNotes] = useState('');
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Edit / Delete Record State
  const [editingRecord, setEditingRecord] = useState<DailyBirdRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteTargetRecord, setDeleteTargetRecord] = useState<DailyBirdRecord | null>(null);
  const [editRecordData, setEditRecordData] = useState({
    opening_birds: 0,
    birds_received: 0,
    transfers_in: 0,
    transfers_out: 0,
    mortality: 0,
    culls: 0,
    bird_sales: 0,
    other_removals: 0,
    feed_consumed_kg: 0,
    water_consumed_litres: 0,
    egg_count: 0,
    damaged_eggs: 0,
    broken_eggs: 0,
    health_observations: '',
    notes: '',
  });

  const handleOpenEditRecord = (record: DailyBirdRecord) => {
    setEditingRecord(record);
    setEditRecordData({
      opening_birds: record.opening_birds,
      birds_received: record.birds_received || 0,
      transfers_in: record.transfers_in || 0,
      transfers_out: record.transfers_out || 0,
      mortality: record.mortality,
      culls: record.culls,
      bird_sales: record.bird_sales,
      other_removals: record.other_removals,
      feed_consumed_kg: record.feed_consumed_kg,
      water_consumed_litres: record.water_consumed_litres || 0,
      egg_count: record.egg_count || 0,
      damaged_eggs: record.damaged_eggs || 0,
      broken_eggs: record.broken_eggs || 0,
      health_observations: record.health_observations || '',
      notes: record.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const res = updateDailyBirdRecord(editingRecord.id, editRecordData);
    if (!res.success) {
      setFormError(res.error || 'Failed to update record.');
    } else {
      setFormSuccess(`Updated daily record for ${editingRecord.shed_code} (${editingRecord.record_date}) successfully.`);
      setIsEditModalOpen(false);
      setTimeout(() => setFormSuccess(null), 3500);
    }
  };

  const handleConfirmDeleteRecord = () => {
    if (!deleteTargetRecord) return;
    const res = deleteDailyBirdRecord(deleteTargetRecord.id);
    if (!res.success) {
      setFormError(res.error || 'Failed to delete record.');
    } else {
      setFormSuccess(`Daily record for ${deleteTargetRecord.shed_code} (${deleteTargetRecord.record_date}) deleted and balances reverted.`);
      setTimeout(() => setFormSuccess(null), 3500);
    }
    setDeleteTargetRecord(null);
  };

  // When shed changes, auto-select corresponding batch and populate current birds as opening birds
  useEffect(() => {
    const shed = sheds.find((s) => s.id === selectedShedId);
    if (shed) {
      const batch = batches.find((b) => b.current_shed_id === shed.id);
      if (batch) {
        setSelectedBatchId(batch.id);
        setOpeningBirds(batch.current_count);
      } else {
        setSelectedBatchId('');
        setOpeningBirds(shed.current_birds);
      }

      // Default feed and egg values based on stage
      if (shed.shed_type === 'layer') {
        // ~115g to 120g feed per bird per day for layers
        const approxFeed = Math.round((shed.current_birds * 0.118));
        setFeedConsumedKg(approxFeed);
        // ~90% laying rate
        setEggCount(Math.round(shed.current_birds * 0.92));
        setDamagedEggs(Math.round(shed.current_birds * 0.005));
        setBrokenEggs(Math.round(shed.current_birds * 0.002));
      } else if (shed.shed_type === 'grower') {
        setFeedConsumedKg(Math.round(shed.current_birds * 0.065));
        setEggCount(0);
        setDamagedEggs(0);
        setBrokenEggs(0);
      } else {
        setFeedConsumedKg(Math.round(shed.current_birds * 0.025));
        setEggCount(0);
        setDamagedEggs(0);
        setBrokenEggs(0);
      }
    }
  }, [selectedShedId, sheds, batches]);

  const activeShed = sheds.find((s) => s.id === selectedShedId);
  const activeBatch = batches.find((b) => b.id === selectedBatchId);
  const isLayer = activeShed?.shed_type === 'layer';

  // Live closing bird calculation
  const calculatedClosing = calculateClosingBirds(
    openingBirds,
    birdsReceived,
    transfersIn,
    transfersOut,
    mortality,
    culls,
    birdSales,
    otherRemovals
  );

  // Egg trays calculation
  const goodEggs = Math.max(0, eggCount - damagedEggs - brokenEggs);
  const trayConversion = convertEggsToTrays(goodEggs);
  const eggProdPct = openingBirds > 0 && isLayer ? ((eggCount / openingBirds) * 100).toFixed(2) : '0';

  // Feed consumption per bird in grams
  const feedPerBirdGrams =
    openingBirds > 0 && feedConsumedKg > 0 ? ((feedConsumedKg * 1000) / openingBirds).toFixed(1) : '0';

  const handleSubmit = (isDraft: boolean) => {
    setFormError(null);
    setFormSuccess(null);

    if (!selectedShedId || !selectedBatchId) {
      setFormError('Please select both a shed and an active batch.');
      return;
    }

    if (calculatedClosing < 0) {
      setFormError('Closing bird count cannot be negative. Check mortality, culls, and removals.');
      return;
    }

    if (feedConsumedKg <= 0) {
      setFormError('Please enter valid feed consumption.');
      return;
    }

    const res = addDailyBirdRecord({
      record_date: recordDate,
      shed_id: activeShed!.id,
      shed_code: activeShed!.code,
      batch_id: activeBatch!.id,
      batch_code: activeBatch!.batch_code,
      opening_birds: Number(openingBirds),
      birds_received: Number(birdsReceived),
      transfers_in: Number(transfersIn),
      transfers_out: Number(transfersOut),
      mortality: Number(mortality),
      culls: Number(culls),
      bird_sales: Number(birdSales),
      other_removals: Number(otherRemovals),
      closing_birds: calculatedClosing,
      feed_consumed_kg: Number(feedConsumedKg),
      water_consumed_litres: Number(waterConsumedLitres),
      egg_count: isLayer ? Number(eggCount) : undefined,
      damaged_eggs: isLayer ? Number(damagedEggs) : undefined,
      broken_eggs: isLayer ? Number(brokenEggs) : undefined,
      temperature_c: Number(temperatureC),
      humidity_pct: Number(humidityPct),
      health_observations: healthNotes,
      notes: notes,
      entered_by: currentUser.id,
      entered_by_name: currentUser.full_name,
      is_draft: isDraft,
      status: isDraft ? 'draft' : 'submitted',
    });

    if (!res.success) {
      setFormError(res.error || 'Failed to submit daily record.');
    } else {
      setFormSuccess(
        `Daily log for ${activeShed!.code} (${recordDate}) saved successfully! Closing count: ${formatNumber(calculatedClosing)} birds.`
      );
      // reset losses for next entry
      setMortality(0);
      setCulls(0);
      setBirdsReceived(0);
      setTransfersIn(0);
      setTransfersOut(0);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ClipboardPen className="w-6 h-6 text-emerald-600" />
            <span>Kasthuri Poultry Farm — Daily Farm Log Entry</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mobile-optimized daily recording of bird counts, mortality, feed intake, and egg collections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Logger:</span>
          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            {currentUser.full_name} ({currentUser.role === 'owner_admin' ? 'Admin' : 'Manager'})
          </span>
        </div>
      </div>

      {/* Alerts */}
      {formError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{formError}</span>
        </div>
      )}
      {formSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold">{formSuccess}</span>
        </div>
      )}

      {/* Main Entry Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-6">
        {/* Step 1: Date, Shed & Batch Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-100">
          <div>
            <label className="input-label flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Record Date</span>
            </label>
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="input-field font-semibold"
            />
          </div>

          <div>
            <label className="input-label flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span>Select Physical Shed</span>
            </label>
            <select
              value={selectedShedId}
              onChange={(e) => setSelectedShedId(e.target.value)}
              className="input-field font-semibold text-slate-900"
            >
              {sheds.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name} ({s.shed_type.toUpperCase()}) [Live: {formatNumber(s.current_birds)}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Active Batch In Shed</label>
            <input
              type="text"
              disabled
              value={activeBatch ? `${activeBatch.batch_code} (${activeBatch.bird_type})` : 'No flock in shed'}
              className="input-field bg-slate-50 font-medium text-slate-600 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Step 2: Flock Reconciliation (Closing = Opening + In - Out - Losses) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              1. Flock Count Reconciliation
            </h3>
            <span className="text-xs text-slate-500">Live bird tracking</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Opening Birds</label>
              <input
                type="number"
                value={openingBirds}
                onChange={(e) => setOpeningBirds(Number(e.target.value))}
                className="input-field font-bold bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-emerald-700 block mb-1">+ Birds Received</label>
              <input
                type="number"
                value={birdsReceived}
                onChange={(e) => setBirdsReceived(Number(e.target.value))}
                min="0"
                className="input-field bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-emerald-700 block mb-1">+ Transfers In</label>
              <input
                type="number"
                value={transfersIn}
                onChange={(e) => setTransfersIn(Number(e.target.value))}
                min="0"
                className="input-field bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-amber-700 block mb-1">- Transfers Out</label>
              <input
                type="number"
                value={transfersOut}
                onChange={(e) => setTransfersOut(Number(e.target.value))}
                min="0"
                className="input-field bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-rose-600 block mb-1">- Today's Mortality (Deaths)</label>
              <input
                type="number"
                value={mortality}
                onChange={(e) => setMortality(Number(e.target.value))}
                min="0"
                className="input-field bg-white font-bold text-rose-700 border-rose-300"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-rose-600 block mb-1">- Culls (Weak Birds)</label>
              <input
                type="number"
                value={culls}
                onChange={(e) => setCulls(Number(e.target.value))}
                min="0"
                className="input-field bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">- Bird Sales</label>
              <input
                type="number"
                value={birdSales}
                onChange={(e) => setBirdSales(Number(e.target.value))}
                min="0"
                className="input-field bg-white"
              />
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                Calculated Closing Birds
              </span>
              <span className="text-xl font-black text-emerald-900 mt-0.5">
                {formatNumber(calculatedClosing)}
              </span>
            </div>
          </div>
        </div>

        {/* Step 3: Feed & Water Consumption */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Wheat className="w-4 h-4 text-amber-600" />
              <span>2. Feed & Water Consumption</span>
            </h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {feedPerBirdGrams} g / bird
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Feed Consumed Today (kg)</label>
              <input
                type="number"
                value={feedConsumedKg}
                onChange={(e) => setFeedConsumedKg(Number(e.target.value))}
                min="1"
                step="1"
                required
                className="input-field text-base font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Approx {Math.round(feedConsumedKg / 50)} bags (50kg each)
              </span>
            </div>
            <div>
              <label className="input-label flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span>Water Consumed (Litres)</span>
              </label>
              <input
                type="number"
                value={waterConsumedLitres}
                onChange={(e) => setWaterConsumedLitres(Number(e.target.value))}
                min="0"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Egg Collection (Layer batches only) */}
        {isLayer ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Egg className="w-4 h-4 text-amber-500" />
                <span>3. Daily Egg Collection (Layer Shed {activeShed?.code})</span>
              </h3>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Lay Rate: {eggProdPct}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-amber-50/40 p-4 rounded-xl border border-amber-200/60">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Total Eggs Collected</label>
                <input
                  type="number"
                  value={eggCount}
                  onChange={(e) => setEggCount(Number(e.target.value))}
                  min="0"
                  className="input-field font-black text-slate-900 text-lg bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Damaged / Dirty Eggs</label>
                <input
                  type="number"
                  value={damagedEggs}
                  onChange={(e) => setDamagedEggs(Number(e.target.value))}
                  min="0"
                  className="input-field bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Broken Shell Eggs</label>
                <input
                  type="number"
                  value={brokenEggs}
                  onChange={(e) => setBrokenEggs(Number(e.target.value))}
                  min="0"
                  className="input-field bg-white"
                />
              </div>
            </div>

            {/* Trays Conversion Display */}
            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600">Standard Conversion (30 eggs/tray):</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {formatNumber(trayConversion.trays)} Full Trays
                </span>
                <span className="text-slate-400">+</span>
                <span className="font-semibold text-slate-800">{trayConversion.loose} Loose Eggs</span>
              </div>
              <span className="text-slate-500 font-medium">Good Eggs: {formatNumber(goodEggs)}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
            Egg Collection is not applicable for {activeShed?.shed_type.toUpperCase()} shed ({activeShed?.code}).
            Egg production marked as N/A.
          </div>
        )}

        {/* Step 5: Ambient & Health Observations */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <span>4. Shed Environment & Flock Observations</span>
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="input-label flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                <span>Inside Temp (°C)</span>
              </label>
              <input
                type="number"
                value={temperatureC}
                onChange={(e) => setTemperatureC(Number(e.target.value))}
                step="0.1"
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span>Relative Humidity (%)</span>
              </label>
              <input
                type="number"
                value={humidityPct}
                onChange={(e) => setHumidityPct(Number(e.target.value))}
                step="1"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Health Observations / Vet Notes</label>
            <textarea
              value={healthNotes}
              onChange={(e) => setHealthNotes(e.target.value)}
              placeholder="Flock sound, droppings consistency, feed conversion observations, medication if administered..."
              rows={2}
              className="input-field"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="btn-secondary w-full sm:w-auto gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save as Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="btn-primary w-full sm:w-auto gap-2 px-6 py-2.5 font-bold shadow-md shadow-emerald-900/20"
          >
            <Send className="w-4 h-4" />
            <span>Submit Official Daily Record</span>
          </button>
        </div>
      </div>

      {/* Submitted Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">
          Recently Submitted Daily Logs ({dailyBirdRecords.length})
        </h3>
        {dailyBirdRecords.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 italic">
            No daily records submitted in this session yet. Submit today's log above to update shed and batch figures.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Shed</th>
                  <th className="py-2.5 px-3">Opening</th>
                  <th className="py-2.5 px-3 text-rose-600">Mortality</th>
                  <th className="py-2.5 px-3 text-emerald-700">Closing</th>
                  <th className="py-2.5 px-3">Feed (kg)</th>
                  <th className="py-2.5 px-3">Eggs Collected</th>
                  <th className="py-2.5 px-3">Logged By</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyBirdRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{r.record_date}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{r.shed_code}</td>
                    <td className="py-2.5 px-3 text-slate-600">{formatNumber(r.opening_birds)}</td>
                    <td className="py-2.5 px-3 font-bold text-rose-600">{r.mortality}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">{formatNumber(r.closing_birds)}</td>
                    <td className="py-2.5 px-3">{formatNumber(r.feed_consumed_kg)} kg</td>
                    <td className="py-2.5 px-3">
                      {r.egg_count ? `${formatNumber(r.egg_count)} eggs` : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{r.entered_by_name}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canEdit(r.record_date) && (
                          <button
                            onClick={() => handleOpenEditRecord(r)}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            title="Edit daily entry"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete(true) && (
                          <button
                            onClick={() => setDeleteTargetRecord(r)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete daily entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!canEdit(r.record_date) && !canDelete(true) && (
                          <span className="text-[10px] text-slate-400 italic">Locked</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Daily Record Modal */}
      {editingRecord && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Daily Record — ${editingRecord.shed_code} (${editingRecord.record_date})`}
          subtitle="Update bird counts, feed, or egg collection figures with live reconciliation"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveEditRecord} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Opening Birds</label>
                <input
                  type="number"
                  value={editRecordData.opening_birds}
                  onChange={(e) => setEditRecordData({ ...editRecordData, opening_birds: Number(e.target.value) })}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Mortality (Deaths)</label>
                <input
                  type="number"
                  value={editRecordData.mortality}
                  onChange={(e) => setEditRecordData({ ...editRecordData, mortality: Number(e.target.value) })}
                  min="0"
                  required
                  className="input-field text-rose-700 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="input-label">Culls</label>
                <input
                  type="number"
                  value={editRecordData.culls}
                  onChange={(e) => setEditRecordData({ ...editRecordData, culls: Number(e.target.value) })}
                  min="0"
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Bird Sales</label>
                <input
                  type="number"
                  value={editRecordData.bird_sales}
                  onChange={(e) => setEditRecordData({ ...editRecordData, bird_sales: Number(e.target.value) })}
                  min="0"
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Other Removals</label>
                <input
                  type="number"
                  value={editRecordData.other_removals}
                  onChange={(e) => setEditRecordData({ ...editRecordData, other_removals: Number(e.target.value) })}
                  min="0"
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Feed Consumed (kg)</label>
                <input
                  type="number"
                  value={editRecordData.feed_consumed_kg}
                  onChange={(e) => setEditRecordData({ ...editRecordData, feed_consumed_kg: Number(e.target.value) })}
                  min="1"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">Water Consumed (L)</label>
                <input
                  type="number"
                  value={editRecordData.water_consumed_litres}
                  onChange={(e) => setEditRecordData({ ...editRecordData, water_consumed_litres: Number(e.target.value) })}
                  min="0"
                  className="input-field"
                />
              </div>
            </div>

            {editingRecord.egg_count !== undefined && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-3">
                <span className="text-xs font-bold text-amber-900 block">Layer Egg Production</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="input-label">Total Eggs</label>
                    <input
                      type="number"
                      value={editRecordData.egg_count}
                      onChange={(e) => setEditRecordData({ ...editRecordData, egg_count: Number(e.target.value) })}
                      min="0"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="input-label">Damaged Eggs</label>
                    <input
                      type="number"
                      value={editRecordData.damaged_eggs}
                      onChange={(e) => setEditRecordData({ ...editRecordData, damaged_eggs: Number(e.target.value) })}
                      min="0"
                      className="input-field text-rose-600"
                    />
                  </div>
                  <div>
                    <label className="input-label">Broken Eggs</label>
                    <input
                      type="number"
                      value={editRecordData.broken_eggs}
                      onChange={(e) => setEditRecordData({ ...editRecordData, broken_eggs: Number(e.target.value) })}
                      min="0"
                      className="input-field text-rose-600"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="input-label">Health Observations & Notes</label>
              <textarea
                value={editRecordData.health_observations}
                onChange={(e) => setEditRecordData({ ...editRecordData, health_observations: e.target.value })}
                rows={2}
                className="input-field"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Daily Record Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Daily Record Confirmation Modal */}
      {deleteTargetRecord && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeleteTargetRecord(null)}
          onConfirm={handleConfirmDeleteRecord}
          title={`Delete Daily Record — ${deleteTargetRecord.shed_code}`}
          recordType="Daily Log"
          recordIdentifier={`${deleteTargetRecord.shed_code} on ${deleteTargetRecord.record_date} (Closing: ${formatNumber(deleteTargetRecord.closing_birds)} birds)`}
          warningMessage={`Are you sure you want to delete the daily log for ${deleteTargetRecord.shed_code} on ${deleteTargetRecord.record_date}?`}
          consequences={[
            `Closing bird delta of ${deleteTargetRecord.closing_birds - deleteTargetRecord.opening_birds} will be safely reverted`,
            deleteTargetRecord.egg_count
              ? `Egg collection of ${formatNumber(deleteTargetRecord.egg_count)} eggs will be deducted from warehouse inventory`
              : 'Flock live count will restore to previous opening balance',
            'Full audit record will be logged with your timestamp',
          ]}
          confirmButtonText="Confirm Delete & Revert"
        />
      )}
    </div>
  );
}
