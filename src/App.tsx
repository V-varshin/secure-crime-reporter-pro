import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CrimeReport, CaseStatus } from './types';
import { Navbar } from './components/Navbar';
import { EmergencyBanner } from './components/EmergencyBanner';
import { CrimeReportForm } from './components/CrimeReportForm';
import { AuthorityDashboard } from './components/AuthorityDashboard';
import { VictimReportsView } from './components/VictimReportsView';
import { ReportDetailModal } from './components/ReportDetailModal';
import { CommunicationModal } from './components/CommunicationModal';
import { VictimAuthModal } from './components/VictimAuthModal';
import { AuthorityAuthModal } from './components/AuthorityAuthModal';
import {
  FileText,
  ShieldCheck,
  PhoneCall,
  Loader2,
  Lock,
  ArrowRight,
  Shield,
  HelpCircle,
} from 'lucide-react';

function MainApp() {
  const { user, token, authFetch } = useAuth();

  // Navigation: 'report' | 'my-reports' | 'authority' | 'emergency'
  const [currentView, setCurrentView] = useState<'report' | 'my-reports' | 'authority' | 'emergency'>('report');

  // Reports collection
  const [reports, setReports] = useState<CrimeReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Modals state
  const [selectedReportForDetail, setSelectedReportForDetail] = useState<CrimeReport | null>(null);
  const [selectedReportForCommunication, setSelectedReportForCommunication] = useState<CrimeReport | null>(null);
  const [victimAuthOpen, setVictimAuthOpen] = useState(false);
  const [victimAuthTab, setVictimAuthTab] = useState<'login' | 'register'>('login');
  const [authorityAuthOpen, setAuthorityAuthOpen] = useState(false);

  // Automatically switch view based on user role
  useEffect(() => {
    if (user?.role === 'authority') {
      setCurrentView('authority');
    } else if (user?.role === 'victim' && currentView === 'authority') {
      setCurrentView('my-reports');
    }
  }, [user]);

  // Load complaints from backend
  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await authFetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token]);

  // Handle newly registered complaint
  const handleReportCreated = (complaintId: string) => {
    fetchReports();
    // Locate newly created report
    setTimeout(() => {
      setReports((prev) => {
        const found = prev.find((r) => r.id === complaintId);
        if (found) {
          setSelectedReportForDetail(found);
        }
        return prev;
      });
    }, 500);
  };

  // Handle report updated from detail modal
  const handleReportUpdated = (updated: CrimeReport) => {
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (selectedReportForDetail?.id === updated.id) {
      setSelectedReportForDetail(updated);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenVictimAuth={(tab = 'login') => {
          setVictimAuthTab(tab);
          setVictimAuthOpen(true);
        }}
        onOpenAuthorityAuth={() => setAuthorityAuthOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Emergency Notice Ribbon for quick helpline dialing */}
        <EmergencyBanner />

        {/* VIEW 1: FILE CRIME REPORT (Module 2) */}
        {currentView === 'report' && (
          <div className="space-y-6">
            {!user && (
              <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 p-4 rounded-3xl border border-sky-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sky-600 text-white rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Reporting as Citizen Guest or Registered Complainant
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Sign in or create a victim account to track your investigation and receive private officer call alerts.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVictimAuthTab('register');
                      setVictimAuthOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                  >
                    Victim Register
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVictimAuthTab('login');
                      setVictimAuthOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}

            <CrimeReportForm
              onSuccess={handleReportCreated}
              onCancel={() => setCurrentView(user?.role === 'victim' ? 'my-reports' : 'report')}
            />
          </div>
        )}

        {/* VIEW 2: MY FILED REPORTS (Victim Portal) */}
        {currentView === 'my-reports' && (
          <div>
            {!user ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto shadow-sm">
                <Lock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Complainant Sign In Required</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                  Victims must be authenticated to access their own private complaint records and officer conversations.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setVictimAuthTab('login');
                    setVictimAuthOpen(true);
                  }}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                >
                  Sign In to Victim Portal
                </button>
              </div>
            ) : (
              <VictimReportsView
                reports={reports}
                onNewReport={() => setCurrentView('report')}
                onSelectReport={(r) => setSelectedReportForDetail(r)}
                onOpenCommunication={(r) => setSelectedReportForCommunication(r)}
              />
            )}
          </div>
        )}

        {/* VIEW 3: AUTHORITY DASHBOARD (Module 4) */}
        {currentView === 'authority' && (
          <div>
            {user?.role !== 'authority' ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto shadow-sm">
                <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Restricted Authority Access</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                  This command console is restricted to authorized law enforcement officers and forensic triage intake staff.
                </p>
                <button
                  type="button"
                  onClick={() => setAuthorityAuthOpen(true)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                >
                  Officer / Authority Login
                </button>
              </div>
            ) : (
              <AuthorityDashboard
                reports={reports}
                onRefresh={fetchReports}
                onSelectReport={(r) => setSelectedReportForDetail(r)}
                onOpenCommunication={(r) => setSelectedReportForCommunication(r)}
                onQuickUpdateStatus={(reportId, status) => {
                  authFetch(`/api/reports/${reportId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status }),
                  }).then(() => fetchReports());
                }}
              />
            )}
          </div>
        )}

        {/* VIEW 4: EMERGENCY HELPLINES */}
        {currentView === 'emergency' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Emergency Response & Victim Support Helplines
                  </h2>
                  <p className="text-xs text-slate-500">
                    24/7 Toll-free immediate police dispatch, medical crisis intervention, and cyber defense desks.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-rose-900 tracking-wider">
                      Police Control Room
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800">
                      Priority 1 Dispatch
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-rose-700 font-mono">911 / 100</div>
                  <p className="text-xs text-rose-800/80 mt-1">
                    For active armed robbery, physical assault, intruder in home, or immediate life threat.
                  </p>
                  <a
                    href="tel:911"
                    className="inline-block mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    Call Police Immediately
                  </a>
                </div>

                <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-purple-900 tracking-wider">
                      Women & Domestic Safety Cell
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-800">
                      Confidential
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-purple-700 font-mono">1091 / 181</div>
                  <p className="text-xs text-purple-800/80 mt-1">
                    Stalking, harassment, domestic abuse intervention, non-consensual trauma support.
                  </p>
                  <a
                    href="tel:1091"
                    className="inline-block mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    Contact Safety Helpline
                  </a>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-indigo-900 tracking-wider">
                      Cybercrime & Financial Fraud Desk
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200 text-indigo-800">
                      Asset Freeze
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-indigo-700 font-mono">1930 / IC3</div>
                  <p className="text-xs text-indigo-800/80 mt-1">
                    Call within the "golden hour" of unauthorized wire transfer or digital phishing theft.
                  </p>
                  <a
                    href="tel:1930"
                    className="inline-block mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    Report Fraud Line
                  </a>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-emerald-900 tracking-wider">
                      Medical & Trauma Ambulance
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">
                      Paramedics
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-700 font-mono">911 / 108</div>
                  <p className="text-xs text-emerald-800/80 mt-1">
                    Trauma care, wound emergency dispatch, ambulance medical services.
                  </p>
                  <a
                    href="tel:108"
                    className="inline-block mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    Dispatch Ambulance
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">
              Smart Crime Reporting & Law Enforcement Triage System
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Leaflet OpenStreetMap Integration</span>
            <span>•</span>
            <span>WebRTC Audio & Video Calling</span>
            <span>•</span>
            <span>Gemini AI Forensic Triage</span>
          </div>
        </div>
      </footer>

      {/* MODAL: Report Details (Evidence, Map, Management, Audit) */}
      {selectedReportForDetail && (
        <ReportDetailModal
          isOpen={!!selectedReportForDetail}
          onClose={() => setSelectedReportForDetail(null)}
          report={selectedReportForDetail}
          onReportUpdated={handleReportUpdated}
          onOpenCommunication={() => {
            setSelectedReportForCommunication(selectedReportForDetail);
          }}
        />
      )}

      {/* MODAL: Case Communication (Private Chat & WebRTC Voice/Video Call) */}
      {selectedReportForCommunication && (
        <CommunicationModal
          isOpen={!!selectedReportForCommunication}
          onClose={() => setSelectedReportForCommunication(null)}
          report={selectedReportForCommunication}
        />
      )}

      {/* MODAL: Victim Auth (Login & Register) */}
      <VictimAuthModal
        isOpen={victimAuthOpen}
        onClose={() => setVictimAuthOpen(false)}
        defaultTab={victimAuthTab}
      />

      {/* MODAL: Authority Auth */}
      <AuthorityAuthModal
        isOpen={authorityAuthOpen}
        onClose={() => setAuthorityAuthOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
