import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface ColorAlertLegendProps {
  compact?: boolean;
}

export const ColorAlertLegend: React.FC<ColorAlertLegendProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-600 mr-1">Alert Levels:</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-medium">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          Severe (Red)
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Moderate (Orange)
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">
          <Info className="w-3 h-3 text-yellow-600" />
          Normal/Low (Yellow)
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Closed Case (Green)
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur border border-slate-200/80 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
          <h4 className="text-sm font-semibold text-slate-800">
            Standard Severity & Status Visual Indicators (Module 5)
          </h4>
        </div>
        <span className="text-xs text-slate-500">Multimodal Icons & Color-Coded</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* RED */}
        <div className="flex items-start gap-3 p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/70">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                RED ALERT
              </span>
            </div>
            <p className="text-xs font-semibold text-rose-800">Severe Priority</p>
            <p className="text-[11px] text-rose-700/80 leading-relaxed mt-0.5">
              Armed incidents, violence, life endangerment requiring urgent triage.
            </p>
          </div>
        </div>

        {/* ORANGE */}
        <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                ORANGE ALERT
              </span>
            </div>
            <p className="text-xs font-semibold text-amber-800">Moderate Severity</p>
            <p className="text-[11px] text-amber-700/80 leading-relaxed mt-0.5">
              Extortion, repeated harassment, major digital financial theft.
            </p>
          </div>
        </div>

        {/* YELLOW */}
        <div className="flex items-start gap-3 p-2.5 rounded-xl bg-yellow-50/70 border border-yellow-200/70">
          <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-xs font-bold text-yellow-900 uppercase tracking-wide">
                YELLOW ALERT
              </span>
            </div>
            <p className="text-xs font-semibold text-yellow-800">Normal / Low</p>
            <p className="text-[11px] text-yellow-700/80 leading-relaxed mt-0.5">
              Property vandalism, petty theft, non-imminent complaints.
            </p>
          </div>
        </div>

        {/* GREEN */}
        <div className="flex items-start gap-3 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                GREEN STATUS
              </span>
            </div>
            <p className="text-xs font-semibold text-emerald-800">Closed Case</p>
            <p className="text-[11px] text-emerald-700/80 leading-relaxed mt-0.5">
              Investigation concluded. Note: Closed status does not diminish original severity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
