import React, { useState } from 'react';
import { StorageService } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import {
  AlertTriangle,
  Download,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  X,
  FileSpreadsheet,
  Users,
  GraduationCap
} from 'lucide-react';

interface ProductionCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductionCleanupModal: React.FC<ProductionCleanupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [backedUp, setBackedUp] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanedDone, setCleanedDone] = useState(false);

  if (!isOpen) return null;

  const demoCounts = StorageService.previewDemoData();
  const isInputValid = confirmText.trim().toUpperCase() === 'RESET PRODUCTION';

  const handleDownloadBackup = () => {
    StorageService.backupAllData();
    setBackedUp(true);
  };

  const handleExecuteCleanup = () => {
    if (!isInputValid) return;
    setIsCleaning(true);

    try {
      const result = StorageService.cleanupDemoData();

      StorageService.addLog({
        performedBy: {
          role: 'ADMIN',
          id: user?.id || 'SF-ADM-001',
          name: user?.name || 'School Administrator',
        },
        action: 'CLEANUP_DEMO_DATA',
        details: `Cleaned up demo data: purged ${result.purgedStudents} students, ${result.purgedTeachers} demo teachers, ${result.purgedMarks} marks records, and ${result.purgedProjects} graph projects.`,
        metadata: result,
      });

      setCleanedDone(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error during cleanup:', err);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">Production Data Cleanup</h3>
              <p className="text-xs text-rose-200/80">Purge sample/demo records for genuine school launch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm text-slate-700">
          {cleanedDone ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Demo Records Purged Successfully!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                All sample students, demo marks, and test graph history have been cleared.
                The application is now primed for genuine teacher marks upload and report generation.
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Preserve Real Data, Clear Old Demo Data
                </p>
                <p>
                  This utility removes only sample mock entries (students with demo IDs, test marks, sample graphs).
                  Any genuine student records or real uploaded examinations will be preserved.
                </p>
              </div>

              {/* Counts to be purged */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Records Identified for Removal
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Demo Students:
                    </span>
                    <span className="font-mono font-bold text-rose-600">{demoCounts.demoStudents}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Demo Teachers:
                    </span>
                    <span className="font-mono font-bold text-rose-600">{demoCounts.demoTeachers}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" /> Demo Marks:
                    </span>
                    <span className="font-mono font-bold text-rose-600">{demoCounts.demoMarks}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" /> Test Projects:
                    </span>
                    <span className="font-mono font-bold text-rose-600">{demoCounts.demoProjects}</span>
                  </div>
                </div>
              </div>

              {/* Backup step */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Step 1: Download Complete Data Backup (Recommended)
                  </label>
                  {backedUp && (
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Backup Saved
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-medium text-xs flex items-center justify-center gap-2 border border-slate-300 transition-colors"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  Download Complete System Backup (JSON)
                </button>
              </div>

              {/* Confirmation input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800">
                  Step 2: Confirm by typing <span className="text-rose-700 font-mono">RESET PRODUCTION</span>
                </label>
                <input
                  type="text"
                  placeholder="RESET PRODUCTION"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!isInputValid || isCleaning}
                  onClick={handleExecuteCleanup}
                  className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  {isCleaning ? 'Purging Records...' : 'Purge Demo Data Now'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
