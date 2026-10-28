'use client';

import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Trash2, RotateCcw, AlertOctagon } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  recordType?: string;
  recordIdentifier?: string;
  warningMessage?: string;
  consequences?: string[];
  confirmButtonText?: string;
  confirmText?: string;
  isDestructive?: boolean;
  isReversal?: boolean;
  isSubmitting?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  recordType = 'Record',
  recordIdentifier,
  warningMessage,
  consequences,
  confirmButtonText,
  confirmText,
  isDestructive = true,
  isReversal = false,
  isSubmitting = false,
}: DeleteConfirmModalProps) {
  const defaultConfirmText = confirmText || confirmButtonText || (isReversal ? 'Confirm Reversal' : 'Permanently Delete');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Warning Banner */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            isReversal
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div
            className={`p-2 rounded-lg flex-shrink-0 ${
              isReversal ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {isReversal ? <RotateCcw className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-bold">
              {isReversal ? 'Action Reversal Confirmation' : 'Safe Deletion Confirmation'}
            </h4>
            <p className="text-xs mt-1 leading-relaxed opacity-90">
              {warningMessage ||
                `Are you sure you want to delete this ${recordType.toLowerCase()}? This action will update system balances and maintain an audit log.`}
            </p>
          </div>
        </div>

        {/* Target Record Details */}
        {recordIdentifier && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Target {recordType}
            </span>
            <div className="text-sm font-bold text-slate-900 font-mono">
              {recordIdentifier}
            </div>
          </div>
        )}

        {/* Consequences Checklist */}
        {consequences && consequences.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 block">
              System Recalculation Impact:
            </span>
            <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
              {consequences.map((item, idx) => (
                <li key={idx} className="leading-snug">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Dialog Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-secondary text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 text-white transition-all shadow-sm ${
              isReversal
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20'
            }`}
          >
            {isReversal ? <RotateCcw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>{confirmButtonText || defaultConfirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
