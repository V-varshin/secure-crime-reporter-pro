import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CrimeReport, CrimeCategory, SeverityLevel, CaseStatus, AuthorityOfficer } from '../types';
import { MapPicker } from './MapPicker';
import {
  X,
  Shield,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  MessageSquare,
  History,
  Edit3,
  Save,
  Loader2,
  ExternalLink,
  Volume2,
  ImageIcon,
} from 'lucide-react';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CrimeReport;
  onReportUpdated?: (updated: CrimeReport) => void;
  onOpenCommunication?: () => void;
}

const CATEGORIES: CrimeCategory[] = [
  'Theft',
  'Cybercrime',
  'Harassment',
  'Physical Assault',
  'Sexual Harassment',
  'Psycho Crime',
  'Property Crime',
  'Other / Unclassified',
];

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  isOpen,
  onClose,
  report,
  onReportUpdated,
  onOpenCommunication,
}) => {
  const { user, authFetch } = useAuth();
  const isAuthority = user?.role === 'authority';

  // Editable authority fields
  const [status, setStatus] = useState<CaseStatus>(report.status);
  const [severity, setSeverity] = useState<SeverityLevel>(report.severity);
  const [category, setCategory] = useState<CrimeCategory>(report.category);
  const [assignedOfficer, setAssignedOfficer] = useState(report.assignedOfficer || '');
  const [officerNotes, setOfficerNotes] = useState(report.officerNotes || '');
  const [availableOfficers, setAvailableOfficers] = useState<AuthorityOfficer[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if report prop updates
  useEffect(() => {
    setStatus(report.status);
    setSeverity(report.severity);
    setCategory(report.category);
    setAssignedOfficer(report.assignedOfficer || '');
    setOfficerNotes(report.officerNotes || '');
  }, [report]);

  // Load available authority officers for assignment dropdown
  useEffect(() => {
    if (isAuthority && isOpen) {
      authFetch('/api/auth/authorities')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setAvailableOfficers(data))
        .catch((err) => console.error('Failed to load officers:', err));
    }
  }, [isAuthority, isOpen]);

  if (!isOpen) return null;

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthority) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await authFetch(`/api/reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          severity,
          category,
          assignedOfficer,
          officerNotes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSaveSuccess(true);
        if (onReportUpdated && data.report) {
          onReportUpdated(data.report);
        }
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update complaint:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-400/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                  {report.id}
                </span>
                {/* Severity Pill */}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    report.severity === 'Severe'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : report.severity === 'Moderate'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                  }`}
                >
                  {report.severity === 'Severe' && '🔴 RED Alert'}
                  {report.severity === 'Moderate' && '🟠 ORANGE Alert'}
                  {report.severity === 'Normal / Low' && '🟡 YELLOW Alert'}
                </span>
                {/* Status Pill */}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    report.status === 'Closed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : report.status === 'In Progress'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-slate-700 text-slate-300 border border-slate-600'
                  }`}
                >
                  {report.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">{report.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCommunication && (
              <button
                type="button"
                onClick={onOpenCommunication}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Case Communication</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 bg-slate-50/50">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Authority case adjustments and audit records have been saved successfully.</span>
            </div>
          )}

          {/* Complainant & Key Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Complainant / Victim
              </div>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-500" />
                <span>{report.victimName}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{report.victimPhone}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                <span className="truncate">{report.victimEmail}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Incident Timing
              </div>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>{new Date(report.incidentDate).toLocaleDateString()}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Occurred at {report.incidentTime}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Logged on {new Date(report.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Officer Assignment
              </div>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>{report.assignedOfficer || 'Unassigned Intake'}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Current Status:{' '}
                <strong
                  className={`font-semibold ${
                    report.status === 'Closed' ? 'text-emerald-700' : 'text-indigo-700'
                  }`}
                >
                  {report.status}
                </strong>
              </div>
              {onOpenCommunication && (
                <button
                  type="button"
                  onClick={onOpenCommunication}
                  className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 underline cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Start Live Call / Message</span>
                </button>
              )}
            </div>
          </div>

          {/* Crime Description */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Full Incident Description</span>
            </h4>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
              {report.description}
            </p>
          </div>

          {/* AI Forensic Triage vs Authority Category (Module 3) */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-indigo-900">
                  Forensic Classification & Triage (Module 3)
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Preliminary AI vs Verified Officer Review
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-indigo-100">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                  AI Preliminary Recommendation
                </div>
                <div className="font-semibold text-slate-800">
                  Category: {report.aiSuggestedCategory || report.category}
                </div>
                <div className="mt-1">
                  Severity:{' '}
                  <span
                    className={`font-bold ${
                      (report.aiSuggestedSeverity || report.severity) === 'Severe'
                        ? 'text-rose-600'
                        : (report.aiSuggestedSeverity || report.severity) === 'Moderate'
                        ? 'text-amber-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {report.aiSuggestedSeverity || report.severity}
                  </span>
                </div>
                {report.aiExplanation && (
                  <p className="mt-1 text-[11px] text-slate-500 italic">
                    "{report.aiExplanation}"
                  </p>
                )}
              </div>

              <div className="bg-white p-3 rounded-xl border border-indigo-100">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Current Official Classification
                </div>
                <div className="font-semibold text-slate-800">
                  Category: <strong>{report.category}</strong>
                </div>
                <div className="mt-1">
                  Severity Level:{' '}
                  <span
                    className={`font-bold ${
                      report.severity === 'Severe'
                        ? 'text-rose-600'
                        : report.severity === 'Moderate'
                        ? 'text-amber-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {report.severity}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Authorized authorities can correct this classification below.
                </div>
              </div>
            </div>
          </div>

          {/* Incident Location Map (Module 8) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Reported Crime Scene Location
                </h4>
              </div>
              <span className="text-xs text-slate-500">{report.locationName}</span>
            </div>
            <MapPicker
              initialLat={report.latitude}
              initialLng={report.longitude}
              address={report.address}
              severity={report.status === 'Closed' ? 'Closed' : report.severity}
              readOnly={true}
            />
          </div>

          {/* Evidence Attachments (Image & Audio) */}
          {(report.imageUrl || report.audioUrl) && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>Forensic Attachments</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {report.imageUrl && (
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                      <ImageIcon className="w-4 h-4 text-indigo-500" />
                      <span>Crime Scene Photo</span>
                    </div>
                    <div className="rounded-lg overflow-hidden border border-slate-200 aspect-video bg-black/5">
                      <img
                        src={report.imageUrl}
                        alt="Crime Evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <a
                      href={report.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                    >
                      <span>Open full resolution image</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {report.audioUrl && (
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                        <Volume2 className="w-4 h-4 text-indigo-500" />
                        <span>Voice Statement / Audio Evidence</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        Recorded statement submitted by the complainant during report intake.
                      </p>
                      <audio controls src={report.audioUrl} className="w-full h-10" />
                    </div>
                    <a
                      href={report.audioUrl}
                      download
                      className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                    >
                      <span>Download audio file</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AUTHORITY MANAGEMENT CONTROLS (Only for authorities) */}
          {isAuthority && (
            <form onSubmit={handleSaveChanges} className="bg-slate-900 text-white p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-bold text-white">
                    Authority Case Actions & Classification Correction (Module 4)
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">All updates write to official audit logs</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Case Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CaseStatus)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Pending">Pending Review</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed Investigation (Green)</option>
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Severity Alert Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Severe">RED: Severe Priority</option>
                    <option value="Moderate">ORANGE: Moderate Severity</option>
                    <option value="Normal / Low">YELLOW: Normal / Low</option>
                  </select>
                </div>

                {/* Category Correction */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Verified Crime Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CrimeCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assign Officer */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assigned Officer
                  </label>
                  <select
                    value={assignedOfficer}
                    onChange={(e) => setAssignedOfficer(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {availableOfficers.map((o) => (
                      <option key={o.id} value={o.name}>
                        {o.name} ({o.badgeId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Official Officer Investigation Notes
                </label>
                <textarea
                  rows={2}
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="Record investigative actions, forensic subpoena numbers, or victim outreach notes..."
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Note: A closed case retains its original severity classification for records integrity.
                </span>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save & Apply Authority Updates</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* AUDIT LOG TIMELINE (Module 9) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
              <History className="w-4 h-4 text-slate-500" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Forensic Case Audit Log & History
              </h4>
            </div>

            <div className="space-y-2">
              {report.auditLogs && report.auditLogs.length > 0 ? (
                report.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-slate-500 ml-1.5">by {log.officerName}</span>
                      {log.field && (
                        <span className="text-indigo-600 ml-1.5">
                          ({log.previousValue} → {log.newValue})
                        </span>
                      )}
                      {log.note && <div className="text-[11px] text-slate-500 italic mt-0.5">{log.note}</div>}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">No historical modifications recorded.</div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">Case ID: {report.id}</span>
          <div className="flex items-center gap-2">
            {onOpenCommunication && (
              <button
                type="button"
                onClick={onOpenCommunication}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open Communication (Chat & WebRTC Call)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
