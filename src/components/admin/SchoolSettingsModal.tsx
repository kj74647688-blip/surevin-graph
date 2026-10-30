import React, { useState } from 'react';
import { SchoolSettings } from '../../types';
import { StorageService } from '../../utils/storage';
import { Building2, X, Check } from 'lucide-react';

interface SchoolSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const SchoolSettingsModal: React.FC<SchoolSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [settings, setSettings] = useState<SchoolSettings>(() => StorageService.getSchoolSettings());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSchoolSettings(settings);
    StorageService.addLog({
      performedBy: {
        role: 'ADMIN',
        id: 'SF-ADM-001',
        name: 'Dr. Alok Verma (Administrator)',
      },
      action: 'UPDATE_SCHOOL_SETTINGS',
      details: `Updated school entity settings: "${settings.schoolName}" (Session: ${settings.academicSession}).`,
    });
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold">School Entity Settings</h2>
              <p className="text-2xs text-slate-400">Institutional branding for reports & PDF headers</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              School / Institution Name *
            </label>
            <input
              type="text"
              required
              value={settings.schoolName}
              onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Academic Session *
            </label>
            <input
              type="text"
              required
              value={settings.academicSession}
              onChange={(e) => setSettings({ ...settings, academicSession: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Board Affiliation / Code
            </label>
            <input
              type="text"
              value={settings.affiliationNumber || ''}
              onChange={(e) => setSettings({ ...settings, affiliationNumber: e.target.value })}
              placeholder="e.g. CBSE-AFF-2130849"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Campus Address
            </label>
            <input
              type="text"
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save School Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
