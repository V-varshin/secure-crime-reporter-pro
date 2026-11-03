import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { CrimeReport, CrimeCategory, SeverityLevel, CaseStatus } from '../types';
import { ColorAlertLegend } from './ColorAlertLegend';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  MessageSquare,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart,
  UserCheck,
  RefreshCw,
  FolderOpen,
  Calendar,
  MapPin,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

interface AuthorityDashboardProps {
  reports: CrimeReport[];
  onRefresh: () => void;
  onSelectReport: (report: CrimeReport) => void;
  onOpenCommunication: (report: CrimeReport) => void;
  onQuickUpdateStatus: (reportId: string, status: CaseStatus) => void;
}

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  reports,
  onRefresh,
  onSelectReport,
  onOpenCommunication,
  onQuickUpdateStatus,
}) => {
  const { user } = useAuth();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [activeChartTab, setActiveChartTab] = useState<'category' | 'severity' | 'trend'>('category');

  // Real database metrics computed dynamically
  const metrics = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter((r) => r.status === 'Pending').length;
    const inProgress = reports.filter((r) => r.status === 'In Progress').length;
    const closed = reports.filter((r) => r.status === 'Closed').length;
    const severe = reports.filter((r) => r.severity === 'Severe').length;

    // New complaints: registered in last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const newReports = reports.filter((r) => new Date(r.createdAt).getTime() > oneDayAgo).length;

    return { total, pending, inProgress, closed, severe, newReports };
  }, [reports]);

  // Category distribution
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of reports) {
      counts[r.category] = (counts[r.category] || 0) + 1;
    }
    return counts;
  }, [reports]);

  // Severity distribution
  const severityCounts = useMemo(() => {
    return {
      Severe: reports.filter((r) => r.severity === 'Severe').length,
      Moderate: reports.filter((r) => r.severity === 'Moderate').length,
      'Normal / Low': reports.filter((r) => r.severity === 'Normal / Low').length,
    };
  }, [reports]);

  // Trend over time (grouped by day of current month/recent week)
  const trendData = useMemo(() => {
    const groups: Record<string, number> = {};
    reports.forEach((r) => {
      const dateKey = r.incidentDate || r.createdAt.split('T')[0];
      groups[dateKey] = (groups[dateKey] || 0) + 1;
    });
    // Sort dates
    return Object.entries(groups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7); // Last 7 active dates
  }, [reports]);

  // Filtered complaints
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch =
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.victimName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.assignedOfficer && r.assignedOfficer.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = categoryFilter === 'All' || r.category === categoryFilter;
      const matchesSev = severityFilter === 'All' || r.severity === severityFilter;
      const matchesStat = statusFilter === 'All' || r.status === statusFilter;

      return matchesSearch && matchesCat && matchesSev && matchesStat;
    });
  }, [reports, searchTerm, categoryFilter, severityFilter, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Officer Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-400/20">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-md border border-indigo-400/20">
                Official Law Enforcement Console
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {user?.badgeId ? `Badge: ${user.badgeId}` : 'Authorized Admin'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white mt-1">
              Smart Crime Triage & Incident Command
            </h1>
            <p className="text-xs text-slate-300">
              Department: {user?.department || 'Metropolitan Police Intelligence Division'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Live DB</span>
          </button>
        </div>
      </div>

      {/* STATS METRIC CARDS (Module 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Total Complaints
            </span>
            <FolderOpen className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{metrics.total}</div>
          <span className="text-[11px] text-slate-400 mt-1">Real saved records</span>
        </div>

        {/* New */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
              New (24h)
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-2">{metrics.newReports}</div>
          <span className="text-[11px] text-blue-500 mt-1">Recent intake</span>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wide">
              Pending
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{metrics.pending}</div>
          <span className="text-[11px] text-amber-500 mt-1">Awaiting triage</span>
        </div>

        {/* In Progress */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">
              In Progress
            </span>
            <UserCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-700 mt-2">{metrics.inProgress}</div>
          <span className="text-[11px] text-indigo-500 mt-1">Active officers assigned</span>
        </div>

        {/* Closed */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">
              Closed Status
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{metrics.closed}</div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1">Resolved cases</span>
        </div>

        {/* Severe Priority (RED) */}
        <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-300 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Severe (Urgent)
            </span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-900 mt-2">{metrics.severe}</div>
          <span className="text-[11px] text-rose-700 font-semibold mt-1">Urgent review required</span>
        </div>
      </div>

      {/* Visual Indicator Legend (Module 5) */}
      <ColorAlertLegend />

      {/* CHARTS SECTION (Module 4) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Crime Incident Analytics & Distribution (Module 4)
            </h3>
            <p className="text-xs text-slate-500">Real-time charts generated from active complaint database</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveChartTab('category')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeChartTab === 'category'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Category Breakdown</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('severity')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeChartTab === 'severity'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Severity Spread</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('trend')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeChartTab === 'trend'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Timeline Trend</span>
            </button>
          </div>
        </div>

        {/* Category Chart View */}
        {activeChartTab === 'category' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(categoryCounts).map(([catName, count]) => {
                const percentage = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                return (
                  <div key={catName} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
                      <span className="font-semibold">{catName}</span>
                      <span className="text-slate-500">
                        {count} cases ({percentage}%)
                      </span>
                    </div>
                    {/* Pastel bar */}
                    <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Severity Chart View */}
        {activeChartTab === 'severity' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Severe */}
            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-rose-900">RED ALERT (Severe)</span>
                </div>
                <div className="text-3xl font-extrabold text-rose-900 mt-2">
                  {severityCounts.Severe}
                </div>
                <div className="text-xs text-rose-700 mt-1">
                  {metrics.total > 0
                    ? `${Math.round((severityCounts.Severe / metrics.total) * 100)}% of total complaints`
                    : '0%'}
                </div>
              </div>
              <div className="w-full h-2 bg-rose-200 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full"
                  style={{
                    width: `${
                      metrics.total > 0
                        ? (severityCounts.Severe / metrics.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Moderate */}
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-amber-900">ORANGE ALERT (Moderate)</span>
                </div>
                <div className="text-3xl font-extrabold text-amber-900 mt-2">
                  {severityCounts.Moderate}
                </div>
                <div className="text-xs text-amber-700 mt-1">
                  {metrics.total > 0
                    ? `${Math.round((severityCounts.Moderate / metrics.total) * 100)}% of total complaints`
                    : '0%'}
                </div>
              </div>
              <div className="w-full h-2 bg-amber-200 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${
                      metrics.total > 0
                        ? (severityCounts.Moderate / metrics.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Normal/Low */}
            <div className="p-5 rounded-2xl bg-yellow-50/60 border border-yellow-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-xs font-bold text-yellow-900">YELLOW ALERT (Normal / Low)</span>
                </div>
                <div className="text-3xl font-extrabold text-yellow-900 mt-2">
                  {severityCounts['Normal / Low']}
                </div>
                <div className="text-xs text-yellow-700 mt-1">
                  {metrics.total > 0
                    ? `${Math.round((severityCounts['Normal / Low'] / metrics.total) * 100)}% of total complaints`
                    : '0%'}
                </div>
              </div>
              <div className="w-full h-2 bg-yellow-200 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full"
                  style={{
                    width: `${
                      metrics.total > 0
                        ? (severityCounts['Normal / Low'] / metrics.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Timeline Trend View */}
        {activeChartTab === 'trend' && (
          <div className="space-y-4">
            <div className="flex items-end gap-3 h-44 pt-6 px-2">
              {trendData.map(([dKey, val]) => {
                const maxVal = Math.max(...trendData.map((t) => t[1]), 1);
                const heightPercent = Math.round((val / maxVal) * 100);
                return (
                  <div key={dKey} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[11px] font-bold text-indigo-700">{val}</span>
                    <div
                      className="w-full max-w-[48px] bg-indigo-500 hover:bg-indigo-600 rounded-t-xl transition-all duration-300"
                      style={{ height: `${Math.max(heightPercent, 12)}%` }}
                    />
                    <span className="text-[10px] text-slate-500 truncate max-w-full font-mono">
                      {dKey.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-[11px] text-slate-400">
              Daily volume of incident registrations
            </div>
          </div>
        )}
      </div>

      {/* FILTER & SEARCHABLE COMPLAINT TABLE (Module 4) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, victim, location, title, officer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Theft">Theft</option>
              <option value="Cybercrime">Cybercrime</option>
              <option value="Harassment">Harassment</option>
              <option value="Physical Assault">Physical Assault</option>
              <option value="Sexual Harassment">Sexual Harassment</option>
              <option value="Psycho Crime">Psycho Crime</option>
              <option value="Property Crime">Property Crime</option>
              <option value="Other / Unclassified">Other / Unclassified</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Severities</option>
              <option value="Severe">RED: Severe</option>
              <option value="Moderate">ORANGE: Moderate</option>
              <option value="Normal / Low">YELLOW: Normal/Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Complaint ID</th>
                <th className="py-3 px-4">Complainant / Victim</th>
                <th className="py-3 px-4">Crime Category</th>
                <th className="py-3 px-4">Incident Date & Location</th>
                <th className="py-3 px-4">Severity Alert</th>
                <th className="py-3 px-4">Assigned Officer</th>
                <th className="py-3 px-4">Case Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching crime complaints found in database.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectReport(r)}
                  >
                    {/* Complaint ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                      {r.id}
                    </td>

                    {/* Victim Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{r.victimName}</div>
                      <div className="text-[11px] text-slate-400">{r.victimPhone}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                        {r.category}
                      </span>
                    </td>

                    {/* Incident Date & Location */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-700">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{r.incidentDate}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px] mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                        <span className="truncate">{r.address}</span>
                      </div>
                    </td>

                    {/* Severity Alert Pill (Module 5) */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] uppercase tracking-wide ${
                          r.severity === 'Severe'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : r.severity === 'Moderate'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}
                      >
                        {r.severity === 'Severe' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                        {r.severity === 'Moderate' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                        {r.severity === 'Normal / Low' && <Info className="w-3 h-3 text-yellow-600" />}
                        <span>{r.severity}</span>
                      </span>
                    </td>

                    {/* Assigned Officer */}
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {r.assignedOfficer || (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Case Status Pill (Green for Closed) */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          r.status === 'Closed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : r.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {r.status === 'Closed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {r.status === 'In Progress' && <UserCheck className="w-3 h-3 text-blue-600" />}
                        {r.status === 'Pending' && <Clock className="w-3 h-3 text-slate-500" />}
                        <span>{r.status}</span>
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectReport(r)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          title="View Complete Report Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenCommunication(r)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition"
                          title="Open Private Chat & Call"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Showing {filteredReports.length} of {reports.length} total database records
          </span>
          <span className="text-[11px] text-slate-400">
            Click any row to review evidence, reclassify category/severity, or assign duty officer
          </span>
        </div>
      </div>
    </div>
  );
};
