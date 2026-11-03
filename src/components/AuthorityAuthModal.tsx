import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, ShieldAlert, Mail, Lock, AlertCircle, Loader2, KeyRound } from 'lucide-react';

interface AuthorityAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthorityAuthModal: React.FC<AuthorityAuthModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(email, password, 'authority');
      if (!result.success) {
        setError(result.error || 'Official login credentials failed');
      } else {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillOfficer = (officerEmail: string) => {
    setEmail(officerEmail);
    setPassword('authority123');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Navy Header for Authority Portal */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-2xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-400/20">
                  Restricted Portal
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">Law Enforcement Intake</h3>
              <p className="text-xs text-slate-300">Authorized Police Personnel & Triage Staff</p>
            </div>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Official Department Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="officer@police.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Security Key / Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                'Access Authority Dashboard'
              )}
            </button>
          </div>

          {/* Preset Officer Profiles for Quick Testing */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium">
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              <span>Select pre-configured officer for testing:</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => fillOfficer('officer@police.gov')}
                className="text-left px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 hover:bg-indigo-50 border border-slate-200/70 text-slate-700 flex justify-between items-center transition cursor-pointer"
              >
                <span className="font-semibold">Officer Sarah Jenkins</span>
                <span className="text-[11px] text-slate-500">Badge AP-4892</span>
              </button>
              <button
                type="button"
                onClick={() => fillOfficer('marcus@police.gov')}
                className="text-left px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 hover:bg-indigo-50 border border-slate-200/70 text-slate-700 flex justify-between items-center transition cursor-pointer"
              >
                <span className="font-semibold">Detective Marcus Vance</span>
                <span className="text-[11px] text-slate-500">Cyber Unit</span>
              </button>
              <button
                type="button"
                onClick={() => fillOfficer('emily@police.gov')}
                className="text-left px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 hover:bg-indigo-50 border border-slate-200/70 text-slate-700 flex justify-between items-center transition cursor-pointer"
              >
                <span className="font-semibold">Inspector Emily Chen</span>
                <span className="text-[11px] text-slate-500">Special Victims</span>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 text-[11px] text-amber-800 leading-relaxed border border-amber-200/60">
            ⚠️ <strong>Legal Notice:</strong> Official access is monitored and logged in forensic audit records. Unauthorized attempts are strictly prohibited.
          </div>
        </form>
      </div>
    </div>
  );
};
