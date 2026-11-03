import React, { useState } from 'react';
import { CrimeReport } from '../types';
import {
  FileText,
  Calendar,
  MapPin,
  MessageSquare,
  Eye,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  PlusCircle,
  Search,
  Shield,
} from 'lucide-react';

interface VictimReportsViewProps {
  reports: CrimeReport[];
  onNewReport: () => void;
  onSelectReport: (report: CrimeReport) => void;
  onOpenCommunication: (report: CrimeReport) => void;
}

export const VictimReportsView: React.FC<VictimReportsViewProps> = ({
  reports,
  onNewReport,
  onSelectReport,
  onOpenCommunication,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = reports.filter(
    (r) =>
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">My Registered Crime Reports</h2>
          </div>
          <p className="text-xs text-slate-500">
            Track official police investigation status, review submitted evidence, and communicate securely with assigned officers.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewReport}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>File New Complaint</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Complaint ID or incident keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-xs md:text-sm bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-xs"
        />
      </div>

      {/* Reports List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No Crime Reports Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            You haven't filed any complaints yet, or no complaints match your search query.
          </p>
          <button
            type="button"
            onClick={onNewReport}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl transition shadow-sm cursor-pointer"
          >
            File First Crime Complaint
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    {r.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Severity Pill */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.severity === 'Severe'
                          ? 'bg-rose-100 text-rose-800'
                          : r.severity === 'Moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {r.severity}
                    </span>
                    {/* Status Pill */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.status === 'Closed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-800 group-hover:text-sky-700 transition">
                  {r.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {r.description}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Incident Date: {r.incidentDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{r.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Officer: {r.assignedOfficer || 'Under Initial Intake'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onSelectReport(r)}
                  className="text-xs font-bold text-slate-700 hover:text-sky-700 flex items-center gap-1 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Full Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenCommunication(r)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat / Call Officer</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
