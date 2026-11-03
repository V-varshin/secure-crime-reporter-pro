import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { CrimeReport, ChatMessage } from '../types';
import {
  X,
  Send,
  Phone,
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Shield,
  User,
  Clock,
  Check,
  CheckCheck,
  Loader2,
  AlertCircle,
  PhoneCall,
  Volume2,
  Info,
} from 'lucide-react';

interface CommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CrimeReport;
}

export const CommunicationModal: React.FC<CommunicationModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const { user, authFetch } = useAuth();

  // Mode: 'chat' | 'call'
  const [activeTab, setActiveTab] = useState<'chat' | 'call'>('chat');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebRTC / Call state
  const [callType, setCallType] = useState<'voice' | 'video'>('video');
  const [callStatus, setCallStatus] = useState<
    'idle' | 'calling' | 'incoming' | 'connected' | 'ended' | 'error'
  >('idle');
  const [callerName, setCallerName] = useState<string>('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callError, setCallError] = useState<string | null>(null);

  // Media & WebRTC Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const callTimerRef = useRef<any>(null);

  const isAuthority = user?.role === 'authority';
  const otherPartyLabel = isAuthority
    ? `Victim: ${report.victimName}`
    : `Officer: ${report.assignedOfficer || 'Intake Duty Officer'}`;

  // 1. Load initial messages
  const loadMessages = async () => {
    try {
      const res = await authFetch(`/api/reports/${report.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen, report.id]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  // Call duration counter
  useEffect(() => {
    if (callStatus === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callStatus]);

  // 2. Initialize WebSocket for Real-Time Chat & WebRTC Signaling
  useEffect(() => {
    if (!isOpen) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'join_room',
          complaintId: report.id,
          userId: user?.id,
          userName: user?.name,
          role: user?.role,
        })
      );
    };

    socket.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Chat message broadcast
        if (msg.type === 'chat_message' && msg.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.message.id)) return prev;
            return [...prev, msg.message];
          });
        }

        // WebRTC Signaling events
        if (msg.type === 'call_initiate') {
          // Incoming call from peer
          if (msg.fromUserId !== user?.id) {
            setCallerName(msg.fromUserName || 'Officer / Complainant');
            setCallType(msg.callType || 'video');
            setCallStatus('incoming');
            setActiveTab('call');
          }
        } else if (msg.type === 'call_offer') {
          // Received SDP Offer
          if (msg.fromUserId !== user?.id) {
            handleReceiveOffer(msg.offer, msg.callType);
          }
        } else if (msg.type === 'call_answer') {
          // Received SDP Answer
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(msg.answer));
            setCallStatus('connected');
          }
        } else if (msg.type === 'ice_candidate') {
          // Received ICE Candidate
          if (peerConnectionRef.current && msg.candidate) {
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
            } catch (err) {
              console.warn('Error adding ICE candidate:', err);
            }
          }
        } else if (msg.type === 'call_reject') {
          setCallStatus('ended');
          setCallError('The remote party declined the call.');
          cleanupMedia();
        } else if (msg.type === 'call_end') {
          setCallStatus('ended');
          cleanupMedia();
        }
      } catch (err) {
        console.error('Error parsing socket event:', err);
      }
    };

    return () => {
      socket.close();
      cleanupMedia();
    };
  }, [isOpen, report.id, user?.id]);

  // Clean up streams & peer connection
  const cleanupMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  // WebRTC PeerConnection Setup
  const setupPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'ice_candidate',
            complaintId: report.id,
            candidate: event.candidate,
          })
        );
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setCallStatus('error');
        setCallError('Peer connection disconnected or failed.');
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Start outgoing call
  const startCall = async (type: 'voice' | 'video') => {
    setCallType(type);
    setCallStatus('calling');
    setCallError(null);
    setActiveTab('call');

    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === 'video',
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = setupPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Notify peer of incoming call and send offer
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'call_initiate',
            complaintId: report.id,
            fromUserId: user?.id,
            fromUserName: user?.name,
            callType: type,
          })
        );

        wsRef.current.send(
          JSON.stringify({
            type: 'call_offer',
            complaintId: report.id,
            fromUserId: user?.id,
            callType: type,
            offer,
          })
        );
      }
    } catch (err: any) {
      console.error('Call initiation error:', err);
      setCallStatus('error');
      setCallError(
        'Could not access camera or microphone. Please ensure browser media permissions are allowed.'
      );
    }
  };

  // Accept incoming call
  const acceptIncomingCall = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video',
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add local stream tracks to existing peer connection
      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => peerConnectionRef.current?.addTrack(track, stream));

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'call_answer',
              complaintId: report.id,
              answer,
            })
          );
        }
        setCallStatus('connected');
      }
    } catch (err: any) {
      console.error('Error accepting call:', err);
      setCallStatus('error');
      setCallError('Microphone or camera permission denied.');
    }
  };

  const handleReceiveOffer = async (offer: RTCSessionDescriptionInit, type: 'voice' | 'video') => {
    setCallType(type);
    const pc = setupPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
  };

  const rejectIncomingCall = () => {
    setCallStatus('idle');
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'call_reject',
          complaintId: report.id,
        })
      );
    }
    cleanupMedia();
  };

  const endCall = () => {
    setCallStatus('ended');
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'call_end',
          complaintId: report.id,
        })
      );
    }
    cleanupMedia();
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoDisabled(!videoTrack.enabled);
      }
    }
  };

  // Send Chat message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isSending) return;

    const textToSend = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    try {
      const res = await authFetch(`/api/reports/${report.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-400/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                  {report.id}
                </span>
                <span className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md font-medium">
                  {report.title}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected with {otherPartyLabel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Call Action shortcuts */}
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              <button
                type="button"
                onClick={() => startCall('voice')}
                disabled={callStatus === 'connected' || callStatus === 'calling'}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition cursor-pointer disabled:opacity-40"
                title="Start Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => startCall('video')}
                disabled={callStatus === 'connected' || callStatus === 'calling'}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition cursor-pointer disabled:opacity-40"
                title="Start Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`py-2 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'chat'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Private Text Chat</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded-full">
              {messages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('call')}
            className={`py-2 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'call'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Live Voice & Video Call</span>
            {callStatus === 'connected' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            )}
            {callStatus === 'incoming' && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" />
            )}
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 flex overflow-hidden bg-slate-50/50">
          {/* TAB 1: PRIVATE CHAT */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col h-full bg-white">
              {/* Message List */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
                <div className="text-center my-2">
                  <span className="text-[11px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200/60">
                    🔒 Official Case Communication Channel — Associated with {report.id}
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
                    <User className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm font-semibold text-slate-600">No messages in case thread yet</p>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Send a message to initiate communication between complainant and authorized officers.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOwnMessage = m.senderId === user?.id;
                    const isSenderAuthority = m.senderRole === 'authority';

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          isOwnMessage ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-700">{m.senderName}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              isSenderAuthority
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {isSenderAuthority ? 'Authority Officer' : 'Victim'}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] md:max-w-md p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed shadow-xs ${
                            isOwnMessage
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.text}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                              isOwnMessage ? 'text-indigo-200' : 'text-slate-400'
                            }`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            <span>
                              {new Date(m.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isOwnMessage && (
                              <CheckCheck className="w-3 h-3 text-indigo-200" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 md:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={`Send confidential message regarding ${report.id}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="submit"
                  disabled={isSending || !messageInput.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition shadow-sm cursor-pointer disabled:opacity-40"
                  title="Send message"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: LIVE VOICE & VIDEO CALL (Module 7) */}
          {activeTab === 'call' && (
            <div className="flex-1 flex flex-col h-full bg-slate-900 text-white p-4 md:p-6 overflow-y-auto">
              {/* Call Status Bar */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-2xl ${
                      callStatus === 'connected'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}
                  >
                    {callType === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Encrypted Case Call: {callType === 'video' ? 'Video Conference' : 'Voice Call'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Target: {otherPartyLabel}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {callStatus === 'connected' && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-xl font-mono text-xs font-bold text-emerald-400 border border-slate-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>
                        {Math.floor(callDuration / 60)}:
                        {(callDuration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      callStatus === 'connected'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : callStatus === 'calling'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                        : callStatus === 'incoming'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {callStatus}
                  </span>
                </div>
              </div>

              {callError && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{callError}</span>
                </div>
              )}

              {/* INCOMING CALL BANNER */}
              {callStatus === 'incoming' && (
                <div className="p-4 mb-4 rounded-3xl bg-gradient-to-r from-indigo-900/90 to-purple-900/90 border border-indigo-500/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce-subtle">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500 text-white rounded-full animate-ping-slow">
                      <PhoneCall className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Incoming {callType} Call...</h4>
                      <p className="text-xs text-indigo-200">
                        {callerName} is requesting a secure call session for complaint #{report.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={acceptIncomingCall}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Accept Call</span>
                    </button>
                    <button
                      type="button"
                      onClick={rejectIncomingCall}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Video Grid Area */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[280px]">
                {/* Local Video Tile */}
                <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center aspect-video">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover ${
                      isVideoDisabled ? 'hidden' : 'block'
                    }`}
                  />
                  {isVideoDisabled && (
                    <div className="flex flex-col items-center text-slate-500">
                      <VideoOff className="w-10 h-10 mb-2 opacity-40" />
                      <span className="text-xs">Camera is paused</span>
                    </div>
                  )}
                  {callStatus === 'idle' && (
                    <div className="flex flex-col items-center text-slate-500">
                      <User className="w-10 h-10 mb-2 opacity-40" />
                      <span className="text-xs">Local Media Feed</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-2.5 py-0.5 rounded-lg text-[11px] font-semibold text-slate-300">
                    You ({user?.name})
                  </div>
                  {isMicMuted && (
                    <div className="absolute top-3 right-3 bg-rose-600 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-1">
                      <MicOff className="w-3 h-3" /> Muted
                    </div>
                  )}
                </div>

                {/* Remote Video Tile */}
                <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center aspect-video">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {callStatus !== 'connected' && (
                    <div className="flex flex-col items-center text-slate-500 text-center p-4">
                      {callStatus === 'calling' ? (
                        <>
                          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
                          <span className="text-xs font-semibold text-white">Ringing {otherPartyLabel}...</span>
                          <span className="text-[11px] text-slate-400 mt-1">Waiting for remote party to answer</span>
                        </>
                      ) : callStatus === 'incoming' ? (
                        <>
                          <Volume2 className="w-8 h-8 text-amber-400 animate-pulse mb-2" />
                          <span className="text-xs font-semibold text-white">Incoming call invitation...</span>
                        </>
                      ) : (
                        <>
                          <User className="w-10 h-10 mb-2 opacity-40" />
                          <span className="text-xs font-semibold text-slate-400">{otherPartyLabel}</span>
                          <span className="text-[11px] text-slate-500 mt-0.5">Remote feed not connected</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-2.5 py-0.5 rounded-lg text-[11px] font-semibold text-slate-300">
                    {otherPartyLabel}
                  </div>
                </div>
              </div>

              {/* Call Controls Bar */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-center gap-3">
                {callStatus === 'idle' || callStatus === 'ended' || callStatus === 'error' ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => startCall('voice')}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Start Voice Call</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startCall('video')}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Start Video Call</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleMic}
                      className={`p-3 rounded-2xl transition cursor-pointer ${
                        isMicMuted
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                      title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
                    >
                      {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    {callType === 'video' && (
                      <button
                        type="button"
                        onClick={toggleVideo}
                        className={`p-3 rounded-2xl transition cursor-pointer ${
                          isVideoDisabled
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                        title={isVideoDisabled ? 'Turn Camera On' : 'Turn Camera Off'}
                      >
                        {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={endCall}
                      className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>End Call</span>
                    </button>
                  </div>
                )}
              </div>

              {/* WebRTC Diagnostics & Setup Guide Note (Module 7) */}
              <div className="mt-4 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>WebRTC Live Real-Time Architecture (Module 7):</strong> Uses browser media APIs (microphone & camera) with Google STUN servers (<code className="text-slate-300">stun:stun.l.google.com:19302</code>) and backend WebSocket signaling. For peer-to-peer testing, open another browser tab or private window logged in as the officer/victim to receive incoming call alerts.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
