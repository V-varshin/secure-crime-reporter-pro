import React from 'react';
import { PhoneCall, ShieldAlert, HeartPulse, Laptop, AlertOctagon } from 'lucide-react';

export const EmergencyBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 rounded-3xl p-5 border border-rose-200/80 shadow-xs mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-rose-500 text-white rounded-2xl shadow-sm shrink-0">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider font-bold bg-rose-200/70 text-rose-900 px-2 py-0.5 rounded-md">
                Immediate Danger Notice
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-800 mt-0.5">
              If a crime is currently in progress or a life is endangered, dial emergency response immediately.
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Online complaints are triaged by police duty desks. For instant armed dispatch, use the hotlines below.
            </p>
          </div>
        </div>

        {/* Hotlines */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="tel:911"
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Police Dispatch (911 / 100)</span>
          </a>

          <a
            href="tel:1091"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-slate-700 border border-rose-200 rounded-xl text-xs font-bold transition"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            <span>Women Helpline (1091)</span>
          </a>

          <a
            href="tel:1930"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-slate-700 border border-rose-200 rounded-xl text-xs font-bold transition"
          >
            <Laptop className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cyber Fraud (1930)</span>
          </a>

          <a
            href="tel:108"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-slate-700 border border-rose-200 rounded-xl text-xs font-bold transition"
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
            <span>Medical (108)</span>
          </a>
        </div>
      </div>
    </div>
  );
};
