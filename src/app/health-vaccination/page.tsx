'use client';

import React, { useState } from 'react';
import { useFarm } from '@/lib/data/FarmContext';
import { VaccinationRecord, HealthEvent, VaccinationStatus } from '@/types/database';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ExportButtons from '@/components/ui/ExportButtons';
import {
  HeartPulse,
  Syringe,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function HealthAndVaccinationPage() {
  const {
    vaccinationRecords,
    vaccinationSchedules,
    healthEvents,
    sheds,
    batches,
    addVaccinationRecord,
    updateVaccinationStatus,
    addHealthEvent,
    currentUser,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<'vaccinations' | 'health_events' | 'schedules'>('vaccinations');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isVaccineModalOpen, setIsVaccineModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  // New Vaccination State
  const [vaccineForm, setVaccineForm] = useState({
    batchId: batches[0]?.id || '',
    vaccineName: 'Infectious Coryza (Bivalent)',
    scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    cost: 3200,
    administeredBy: 'Veterinary Tech Team A',
    notes: 'Subcutaneous neck injection',
  });

  // Health Event State
  const [healthForm, setHealthForm] = useState({
    batchId: batches[0]?.id || '',
    symptoms: 'Mild respiratory rales & reduced feed intake',
    diagnosis: 'Mycoplasma Gallisepticum (CRD)',
    vetAdvice: 'Tilmicosin phosphate in drinking water for 3 consecutive days',
    medicine: 'Tilmicosin 25% Oral',
    dosage: '15 ml per 100 birds',
    cost: 4500,
    associatedMortality: 6,
    followUpDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    responsiblePerson: 'Dr. Srinivasan (Consultant Vet)',
    notes: 'Isolate affected bay curtains',
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Vaccination alerts classification (7 days before, due today, overdue)
  const getVaccineUrgency = (scheduledDate: string, status: VaccinationStatus) => {
    if (status === 'completed') return { label: 'Completed', color: 'success' };
    if (status === 'missed') return { label: 'Missed', color: 'danger' };
    if (status === 'postponed') return { label: 'Postponed', color: 'warning' };

    const diffDays = Math.ceil(
      (new Date(scheduledDate).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24)
    );

    if (diffDays < 0) return { label: `Overdue by ${Math.abs(diffDays)}d`, color: 'danger' };
    if (diffDays === 0) return { label: 'Due Today', color: 'warning' };
    if (diffDays <= 7) return { label: `Approaching (${diffDays}d)`, color: 'info' };
    return { label: `Scheduled (${diffDays}d)`, color: 'neutral' };
  };

  const handleCreateVaccination = (e: React.FormEvent) => {
    e.preventDefault();
    const batch = batches.find((b) => b.id === vaccineForm.batchId);
    if (!batch) return;

    addVaccinationRecord({
      batch_id: batch.id,
      batch_code: batch.batch_code,
      shed_id: batch.current_shed_id,
      shed_code: batch.current_shed_code,
      vaccine_name: vaccineForm.vaccineName,
      scheduled_date: vaccineForm.scheduledDate,
      status: 'scheduled',
      cost: Number(vaccineForm.cost),
      administered_by: vaccineForm.administeredBy,
      notes: vaccineForm.notes,
    });

    setIsVaccineModalOpen(false);
  };

  const handleCreateHealthEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const batch = batches.find((b) => b.id === healthForm.batchId);
    if (!batch) return;

    addHealthEvent({
      event_date: new Date().toISOString().split('T')[0],
      batch_id: batch.id,
      batch_code: batch.batch_code,
      shed_id: batch.current_shed_id,
      shed_code: batch.current_shed_code,
      symptoms: healthForm.symptoms,
      diagnosis: healthForm.diagnosis,
      veterinary_advice: healthForm.vetAdvice,
      treatment_medicine: healthForm.medicine,
      dosage: healthForm.dosage,
      cost: Number(healthForm.cost),
      associated_mortality: Number(healthForm.associatedMortality),
      follow_up_date: healthForm.followUpDate,
      responsible_person: healthForm.responsiblePerson,
      notes: healthForm.notes,
    });

    setIsHealthModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-rose-600" />
            <span>Health, Vaccination & Biosecurity</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Vaccination schedules (7-day, due, overdue alerts), veterinary diagnoses, treatments, and associated mortality
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons data={vaccinationRecords} filename="vaccination-records" />
          <button onClick={() => setIsHealthModalOpen(true)} className="btn-secondary gap-1.5 text-xs">
            <FileText className="w-4 h-4 text-rose-500" />
            <span>Log Health Event</span>
          </button>
          <button onClick={() => setIsVaccineModalOpen(true)} className="btn-primary gap-1.5 text-xs">
            <Syringe className="w-4 h-4" />
            <span>Schedule Vaccine</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('vaccinations')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'vaccinations'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Vaccination Records & Reminders ({vaccinationRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('health_events')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'health_events'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Health & Treatment Events ({healthEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'schedules'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Standard Master Schedules ({vaccinationSchedules.length})
          </button>
        </nav>
      </div>

      {/* TAB 1: VACCINATIONS */}
      {activeTab === 'vaccinations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-3 px-4">Flock & Shed</th>
                  <th className="py-3 px-4">Vaccine Name</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Status & Urgency</th>
                  <th className="py-3 px-4">Administered By</th>
                  <th className="py-3 px-4 text-right">Cost (₹)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vaccinationRecords.map((vr) => {
                  const urgency = getVaccineUrgency(vr.scheduled_date, vr.status);

                  return (
                    <tr key={vr.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {vr.shed_code}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{vr.batch_code}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{vr.vaccine_name}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{vr.scheduled_date}</td>
                      <td className="py-3 px-4">
                        <Badge variant={urgency.color as any}>{urgency.label}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{vr.administered_by}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">₹{vr.cost}</td>
                      <td className="py-3 px-4 text-center">
                        {vr.status === 'scheduled' ? (
                          <button
                            onClick={() => updateVaccinationStatus(vr.id, 'completed')}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md"
                          >
                            Mark Done
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-medium">✓ Completed</span>
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

      {/* TAB 2: HEALTH EVENTS */}
      {activeTab === 'health_events' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {healthEvents.map((he) => (
              <div key={he.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">
                      Diagnosis: {he.diagnosis}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-800 mt-1">
                      Shed {he.shed_code} • {he.batch_code}
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{he.event_date}</span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg text-slate-700">
                    <strong className="text-slate-900">Symptoms:</strong> {he.symptoms}
                  </div>
                  {he.veterinary_advice && (
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-lg text-emerald-900">
                      <strong>Veterinary Advice:</strong> {he.veterinary_advice}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-600 pt-1">
                    <span>
                      Medication: <strong>{he.treatment_medicine}</strong> ({he.dosage})
                    </span>
                    <span className="text-rose-600 font-bold">Mortality: {he.associated_mortality} birds</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-100 text-[11px]">
                    <span>Attending: {he.responsible_person}</span>
                    <span>Treatment Cost: ₹{he.cost}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MASTER SCHEDULES */}
      {activeTab === 'schedules' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4 text-right">Age (Days)</th>
                <th className="py-3 px-4">Vaccine Name</th>
                <th className="py-3 px-4">Target Disease</th>
                <th className="py-3 px-4">Administration Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vaccinationSchedules.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <Badge stage={s.bird_stage}>{s.bird_stage.toUpperCase()}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">Day {s.target_age_days}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{s.vaccine_name}</td>
                  <td className="py-3 px-4 text-slate-600">{s.disease_targeted}</td>
                  <td className="py-3 px-4 capitalize text-slate-500">
                    {s.route_of_administration.replace('_', ' ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Schedule Vaccination */}
      <Modal
        isOpen={isVaccineModalOpen}
        onClose={() => setIsVaccineModalOpen(false)}
        title="Schedule Flock Immunization"
        subtitle="Set up reminder and veterinary dispatch"
      >
        <form onSubmit={handleCreateVaccination} className="space-y-4">
          <div>
            <label className="input-label">Select Flock / Batch</label>
            <select
              value={vaccineForm.batchId}
              onChange={(e) => setVaccineForm({ ...vaccineForm, batchId: e.target.value })}
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
              <label className="input-label">Vaccine Name</label>
              <input
                type="text"
                value={vaccineForm.vaccineName}
                onChange={(e) => setVaccineForm({ ...vaccineForm, vaccineName: e.target.value })}
                required
                className="input-field font-semibold"
              />
            </div>
            <div>
              <label className="input-label">Scheduled Date</label>
              <input
                type="date"
                value={vaccineForm.scheduledDate}
                onChange={(e) => setVaccineForm({ ...vaccineForm, scheduledDate: e.target.value })}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Estimated Cost (₹)</label>
              <input
                type="number"
                value={vaccineForm.cost}
                onChange={(e) => setVaccineForm({ ...vaccineForm, cost: Number(e.target.value) })}
                className="input-field font-bold"
              />
            </div>
            <div>
              <label className="input-label">Administering Vet / Team</label>
              <input
                type="text"
                value={vaccineForm.administeredBy}
                onChange={(e) => setVaccineForm({ ...vaccineForm, administeredBy: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Instructions / Route</label>
            <textarea
              value={vaccineForm.notes}
              onChange={(e) => setVaccineForm({ ...vaccineForm, notes: e.target.value })}
              rows={2}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsVaccineModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Schedule Immunization
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Log Health Event */}
      <Modal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        title="Log Veterinary Health Event"
        subtitle="Record symptoms, clinical diagnosis, prescribed medication, and mortality"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateHealthEvent} className="space-y-4">
          <div>
            <label className="input-label">Flock Batch</label>
            <select
              value={healthForm.batchId}
              onChange={(e) => setHealthForm({ ...healthForm, batchId: e.target.value })}
              className="input-field font-semibold"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_code} ({b.current_shed_code}) — {b.bird_type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Symptoms Observed</label>
              <input
                type="text"
                value={healthForm.symptoms}
                onChange={(e) => setHealthForm({ ...healthForm, symptoms: e.target.value })}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Clinical Diagnosis</label>
              <input
                type="text"
                value={healthForm.diagnosis}
                onChange={(e) => setHealthForm({ ...healthForm, diagnosis: e.target.value })}
                required
                className="input-field font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Veterinary Advice & Prescription</label>
            <textarea
              value={healthForm.vetAdvice}
              onChange={(e) => setHealthForm({ ...healthForm, vetAdvice: e.target.value })}
              rows={2}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="input-label">Medicine</label>
              <input
                type="text"
                value={healthForm.medicine}
                onChange={(e) => setHealthForm({ ...healthForm, medicine: e.target.value })}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Dosage</label>
              <input
                type="text"
                value={healthForm.dosage}
                onChange={(e) => setHealthForm({ ...healthForm, dosage: e.target.value })}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Associated Mortality</label>
              <input
                type="number"
                value={healthForm.associatedMortality}
                onChange={(e) => setHealthForm({ ...healthForm, associatedMortality: Number(e.target.value) })}
                min="0"
                className="input-field text-rose-600 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Attending Vet / Officer</label>
              <input
                type="text"
                value={healthForm.responsiblePerson}
                onChange={(e) => setHealthForm({ ...healthForm, responsiblePerson: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Medicine Cost (₹)</label>
              <input
                type="number"
                value={healthForm.cost}
                onChange={(e) => setHealthForm({ ...healthForm, cost: Number(e.target.value) })}
                className="input-field font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsHealthModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Clinical Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
