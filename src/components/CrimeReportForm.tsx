import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CrimeCategory, SeverityLevel, ClassificationResult } from '../types';
import { MapPicker } from './MapPicker';
import {
  FileText,
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  Mic,
  MicOff,
  Upload,
  Play,
  Square,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
  Loader2,
  HelpCircle,
} from 'lucide-react';

interface CrimeReportFormProps {
  onSuccess: (complaintId: string) => void;
  onCancel: () => void;
}

const CATEGORIES: { label: CrimeCategory; desc: string }[] = [
  { label: 'Theft', desc: 'Robbery, stolen goods, burglary, pickpocketing' },
  { label: 'Cybercrime', desc: 'Online fraud, unauthorized transfers, phishing, ransomware' },
  { label: 'Harassment', desc: 'Repeated threats, stalking, bullying, intimidation' },
  { label: 'Physical Assault', desc: 'Direct physical violence, weapon attack, bodily harm' },
  { label: 'Sexual Harassment', desc: 'Sexual assault, indecent conduct, non-consensual offense' },
  { label: 'Psycho Crime', desc: 'Extreme psychological coercion or bizarre terrorization' },
  { label: 'Property Crime', desc: 'Vandalism, destruction of private or public assets' },
  { label: 'Other / Unclassified', desc: 'General or unclassified violations requiring review' },
];

export const CrimeReportForm: React.FC<CrimeReportFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { user, authFetch } = useAuth();

  // Contact details
  const [victimName, setVictimName] = useState(user?.name || '');
  const [victimEmail, setVictimEmail] = useState(user?.email || '');
  const [victimPhone, setVictimPhone] = useState(user?.phone || '');

  // Crime incident details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CrimeCategory>('Other / Unclassified');
  const [severity, setSeverity] = useState<SeverityLevel>('Normal / Low');

  // Date and Time
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTimeStr = new Date().toTimeString().slice(0, 5);
  const [incidentDate, setIncidentDate] = useState(todayStr);
  const [incidentTime, setIncidentTime] = useState(nowTimeStr);

  // Location
  const [locationName, setLocationName] = useState('Central Location');
  const [address, setAddress] = useState('742 5th Avenue, Metro District, NY 10019');
  const [latitude, setLatitude] = useState(40.7638);
  const [longitude, setLongitude] = useState(-73.9729);

  // Image Upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Audio Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Uploaded Audio File (alternate)
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);

  // Audio Playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // AI Classification state
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiResult, setAiResult] = useState<ClassificationResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdComplaintId, setCreatedComplaintId] = useState<string | null>(null);

  // Pre-fill user contact when user loads
  useEffect(() => {
    if (user) {
      if (!victimName) setVictimName(user.name);
      if (!victimEmail) setVictimEmail(user.email);
      if (!victimPhone) setVictimPhone(user.phone);
    }
  }, [user]);

  // Clean up object URLs and recording timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
      if (uploadedAudioUrl) URL.revokeObjectURL(uploadedAudioUrl);
    };
  }, [recordedAudioUrl, uploadedAudioUrl]);

  // Handle Location from MapPicker
  const handleLocationSelect = (loc: {
    lat: number;
    lng: number;
    address: string;
    locationName?: string;
  }) => {
    setLatitude(loc.lat);
    setLongitude(loc.lng);
    setAddress(loc.address);
    if (loc.locationName) setLocationName(loc.locationName);
  };

  // Image File Selection & Preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError('Image size exceeds 10MB limit.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setFormError(null);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  // Voice Recording with Microphone
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setFormError('Microphone audio recording is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        // Turn off tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setFormError('Could not access microphone. Please grant browser microphone permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const clearRecordedAudio = () => {
    setRecordedAudioBlob(null);
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setRecordedAudioUrl(null);
    setRecordDuration(0);
    setIsPlayingAudio(false);
  };

  // Upload an existing audio file
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setFormError('Please select a valid audio file (MP3, WAV, WEBM, M4A).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setFormError('Audio file exceeds 15MB limit.');
      return;
    }

    setUploadedAudioFile(file);
    const url = URL.createObjectURL(file);
    setUploadedAudioUrl(url);
    // clear mic recorded audio if any
    clearRecordedAudio();
  };

  const removeUploadedAudio = () => {
    setUploadedAudioFile(null);
    if (uploadedAudioUrl) URL.revokeObjectURL(uploadedAudioUrl);
    setUploadedAudioUrl(null);
  };

  // Audio Playback toggle
  const toggleAudioPlayback = () => {
    const activeUrl = recordedAudioUrl || uploadedAudioUrl;
    if (!activeUrl) return;

    if (!audioPlayerRef.current) {
      const audio = new Audio(activeUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.src = activeUrl;
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // AI Classification Trigger
  const runAiAnalysis = async () => {
    if (!title.trim() && !description.trim()) {
      setFormError('Please write an incident title and description before running AI analysis.');
      return;
    }

    setIsAnalyzingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (!res.ok) {
        throw new Error('AI analysis service unavailable.');
      }

      const data: ClassificationResult = await res.json();
      setAiResult(data);
      // Pre-select category and severity suggestions
      setCategory(data.category);
      setSeverity(data.severity);
    } catch (err: any) {
      console.warn('AI Analysis failed:', err);
      setAiError('AI service is temporarily unavailable. You can manually classify your report.');
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // Helper to upload blob/file to server
  const uploadAttachment = async (fileOrBlob: File | Blob, defaultName: string): Promise<string | undefined> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const mimeType = fileOrBlob.type || 'application/octet-stream';
          const filename = (fileOrBlob as File).name || defaultName;

          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: base64Data,
              filename,
              mimeType,
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to upload attachment');
          }
          const data = await res.json();
          resolve(data.url);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBlob);
    });
  };

  // Submit crime report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Please enter a descriptive crime incident title.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please provide detailed incident facts in the description field.');
      return;
    }
    if (!incidentDate) {
      setFormError('Please select the incident date.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl: string | undefined;
      let finalAudioUrl: string | undefined;

      // 1. Upload image if present
      if (imageFile) {
        setIsUploadingImage(true);
        finalImageUrl = await uploadAttachment(imageFile, 'evidence_image.jpg');
      }

      // 2. Upload audio if recorded or uploaded
      if (recordedAudioBlob) {
        finalAudioUrl = await uploadAttachment(recordedAudioBlob, 'voice_recording.webm');
      } else if (uploadedAudioFile) {
        finalAudioUrl = await uploadAttachment(uploadedAudioFile, uploadedAudioFile.name);
      }

      // 3. Post full crime report
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        incidentDate,
        incidentTime,
        locationName,
        address,
        latitude,
        longitude,
        imageUrl: finalImageUrl,
        audioUrl: finalAudioUrl,
        victimName: victimName.trim() || user?.name,
        victimPhone: victimPhone.trim() || user?.phone,
        victimEmail: victimEmail.trim() || user?.email,
        aiSuggestedCategory: aiResult?.category,
        aiSuggestedSeverity: aiResult?.severity,
        aiExplanation: aiResult?.explanation,
      };

      const res = await authFetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to submit report');
      }

      setCreatedComplaintId(resData.complaintId);
    } catch (err: any) {
      console.error('Submission error:', err);
      setFormError(err.message || 'An error occurred while submitting your crime report. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  // If successfully created, display celebratory confirmation modal
  if (createdComplaintId) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm max-w-2xl mx-auto text-center animate-fade-in">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200/60 mb-2">
          Report Logged & Securely Transmitted
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Crime Complaint Registered
        </h2>
        <p className="text-slate-600 text-sm mb-6 max-w-lg mx-auto">
          Your report has been securely registered in the police department database. An intake officer will review your evidence shortly.
        </p>

        {/* Complaint ID Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto mb-6 text-left">
          <div className="text-xs text-slate-500 font-medium">Your Unique Complaint ID:</div>
          <div className="text-2xl font-mono font-bold text-indigo-700 tracking-wider mt-0.5">
            {createdComplaintId}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Save this complaint reference number for case tracking and officer communications.</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onSuccess(createdComplaintId)}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition shadow-sm cursor-pointer"
          >
            Track Case & Open Communication
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition border border-slate-200 cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Form Top Banner */}
      <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold">File Smart Crime Incident Report</h2>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Complete all incident details, pin the exact map location, and upload photo/voice evidence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full border border-indigo-400/20">
            Encrypted & Audited
          </span>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {formError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs md:text-sm rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">{formError}</div>
          </div>
        )}

        {/* SECTION 1: Victim Contact Details */}
        <div>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h3 className="text-sm font-bold text-slate-800">Complainant / Victim Contact Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={victimName}
                onChange={(e) => setVictimName(e.target.value)}
                placeholder="Victim Full Name"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={victimPhone}
                onChange={(e) => setVictimPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={victimEmail}
                onChange={(e) => setVictimEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Crime Details */}
        <div>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-sm font-bold text-slate-800">Incident Description & AI Classification</h3>
            </div>
            {/* Run AI Analysis Helper */}
            <button
              type="button"
              onClick={runAiAnalysis}
              disabled={isAnalyzingAi || (!title.trim() && !description.trim())}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isAnalyzingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Facts...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze with Forensic AI</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Crime Title / Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Armed mugging and physical assault near Metro station entrance"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Incident Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe sequence of events, perpetrators, weapons involved, injuries, stolen items, vehicle plates, or online traces..."
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 leading-relaxed resize-y"
              />
            </div>

            {/* AI Suggestion Card (Module 3) */}
            {aiResult && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-900">
                      Preliminary AI Triage Assessment (Module 3)
                    </span>
                  </div>
                  {aiResult.isFallback && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200/70 text-slate-600 font-medium">
                      Heuristic Mode
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Suggested Category: </span>
                    <strong className="text-slate-800">{aiResult.category}</strong>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Suggested Severity: </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        aiResult.severity === 'Severe'
                          ? 'bg-rose-100 text-rose-800'
                          : aiResult.severity === 'Moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {aiResult.severity === 'Severe' && '🔴 RED Alert - Severe'}
                      {aiResult.severity === 'Moderate' && '🟠 ORANGE Alert - Moderate'}
                      {aiResult.severity === 'Normal / Low' && '🟡 YELLOW Alert - Normal / Low'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-indigo-900/80 leading-relaxed italic">
                  "{aiResult.explanation}"
                </p>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-indigo-100">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    Classifications are preliminary triage suggestions for authority review, not verified legal facts. Authorities may adjust this during investigation.
                  </span>
                </div>
              </div>
            )}

            {aiError && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Category and Severity Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Crime Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CrimeCategory)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.label} value={c.label}>
                      {c.label} ({c.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Severity Alert Level <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSeverity('Severe')}
                    className={`p-2 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                      severity === 'Severe'
                        ? 'bg-rose-100 border-rose-400 text-rose-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-rose-50'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>RED (Severe)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity('Moderate')}
                    className={`p-2 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                      severity === 'Moderate'
                        ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-amber-50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>ORANGE (Mod.)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity('Normal / Low')}
                    className={`p-2 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                      severity === 'Normal / Low'
                        ? 'bg-yellow-100 border-yellow-400 text-yellow-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-yellow-50'
                    }`}
                  >
                    <Info className="w-4 h-4 text-yellow-600" />
                    <span>YELLOW (Norm.)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Date, Time & Location Map */}
        <div>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h3 className="text-sm font-bold text-slate-800">Date, Time & Exact Crime Scene Location</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Incident Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    max={todayStr}
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Incident Time <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    required
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
            </div>

            {/* Interactive Map Picker (Module 2 & 8) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Interactive Crime Location Pin <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-normal text-slate-500">
                  Search address or drag the map pin to mark exact site
                </span>
              </label>
              <MapPicker
                initialLat={latitude}
                initialLng={longitude}
                address={address}
                severity={severity}
                onLocationSelect={handleLocationSelect}
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Evidentiary Attachments (Photo & Voice Recording) */}
        <div>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
              4
            </span>
            <h3 className="text-sm font-bold text-slate-800">
              Evidentiary Attachments: Crime Scene Photo & Audio Recording
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Crime Scene Photo Upload */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-4 h-4 text-indigo-500" />
                  <h4 className="text-xs font-bold text-slate-800">Crime Scene Photo / Evidence</h4>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Upload photographic evidence (damage, weapon, injuries, vehicle, suspect screenshot).
                </p>

                {imagePreviewUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 mb-3 bg-black/5 aspect-video flex items-center justify-center">
                    <img
                      src={imagePreviewUrl}
                      alt="Crime Scene Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600/90 text-white rounded-lg hover:bg-rose-700 transition shadow-md cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-white rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-700">Choose Crime Scene Image</span>
                    <span className="text-[11px] text-slate-400 mt-1">Supports JPG, PNG, WEBP (Max 10MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {imageFile && (
                <div className="text-[11px] text-emerald-700 font-medium mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Selected: {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)</span>
                </div>
              )}
            </div>

            {/* Voice Recording / Audio Evidence */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="w-4 h-4 text-indigo-500" />
                  <h4 className="text-xs font-bold text-slate-800">Voice Statement / Audio Recording</h4>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Record verbal statement using microphone or upload an audio file.
                </p>

                {/* Microphone Recording UI */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isRecording ? (
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                          <span className="text-xs font-bold text-rose-600">Recording Audio...</span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-700">Mic Statement</span>
                      )}
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {Math.floor(recordDuration / 60)}:
                      {(recordDuration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5 text-rose-600" />
                        <span>Start Recording</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <Square className="w-3.5 h-3.5 fill-white" />
                        <span>Stop & Save Recording</span>
                      </button>
                    )}

                    {(recordedAudioUrl || uploadedAudioUrl) && (
                      <button
                        type="button"
                        onClick={toggleAudioPlayback}
                        className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        {isPlayingAudio ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-indigo-600" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-indigo-600" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    )}

                    {recordedAudioUrl && (
                      <button
                        type="button"
                        onClick={clearRecordedAudio}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Delete recording"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Alternate file upload option */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">Or upload existing recording:</span>
                    <label className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline">
                      Browse audio file
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {uploadedAudioFile && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                      <span className="truncate max-w-[200px]">📁 {uploadedAudioFile.name}</span>
                      <button
                        type="button"
                        onClick={removeUploadedAudio}
                        className="text-rose-600 hover:text-rose-800 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {(recordedAudioBlob || uploadedAudioFile) && (
                <div className="text-[11px] text-emerald-700 font-medium mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    Audio attached:{' '}
                    {recordedAudioBlob
                      ? `Voice Note (${recordDuration}s recorded)`
                      : uploadedAudioFile?.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition border border-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {isUploadingImage ? 'Uploading Evidence...' : 'Registering Complaint...'}
                </span>
              </>
            ) : (
              <span>Submit Crime Complaint</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
