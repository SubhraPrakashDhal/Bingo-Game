import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBingoSocket } from '../../context/SocketContext';
import { Mic, MicOff, Volume2, VolumeX, AlertCircle, Loader2 } from 'lucide-react';

type VoiceConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'mic_denied' | 'error';

const getIceServers = (): RTCIceServer[] => {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ];

  const turnUrl = import.meta.env.VITE_TURN_URL;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

  if (turnUrl && turnUsername && turnCredential) {
    servers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return servers;
};

export const VoiceChat: React.FC = () => {
  const { socket, roomState, playerId } = useBingoSocket();

  const [isMicOn, setIsMicOn] = useState(false);
  const [isListenOn, setIsListenOn] = useState(true);
  const [status, setStatus] = useState<VoiceConnectionStatus>('disconnected');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isListenOnRef = useRef<boolean>(true);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const targetSocketIdRef = useRef<string | null>(null);
  const isNegotiatingRef = useRef<boolean>(false);

  // Keep ref synchronized with isListenOn state to prevent stale closure issues in ontrack
  useEffect(() => {
    isListenOnRef.current = isListenOn;
  }, [isListenOn]);

  // Check if user is inside an active room session
  const isInRoom = !!roomState && roomState.stage !== 'WELCOME';
  const opponent = roomState?.players.find(
    (p) => (p.id !== playerId && p.id !== roomState?.mySocketId) && p.isConnected
  );

  // Stop local media stream & close WebRTC peer connection cleanly
  const cleanupWebRTC = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      const pc = peerConnectionRef.current;
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.onnegotiationneeded = null;
      try {
        pc.close();
      } catch (e) {}
      peerConnectionRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    pendingCandidatesRef.current = [];
    targetSocketIdRef.current = null;
    isNegotiatingRef.current = false;
    setStatus('disconnected');
    setStatusMessage(null);
  }, []);

  // Helper to add or replace audio track on active RTCPeerConnection
  const attachTracksToPeerConnection = useCallback((pc: RTCPeerConnection, stream: MediaStream) => {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    const senders = pc.getSenders();
    const existingSender = senders.find((s) => s.track?.kind === 'audio' || (s.track === null && s.dtmf !== null));

    if (existingSender) {
      existingSender.replaceTrack(audioTrack).catch((err) => {
        console.warn('[VOICE] replaceTrack failed, adding track:', err);
        try {
          pc.addTrack(audioTrack, stream);
        } catch (e) {}
      });
    } else {
      try {
        pc.addTrack(audioTrack, stream);
      } catch (e) {}
    }
  }, []);

  // Create & configure RTCPeerConnection instance for P2P audio streaming
  const createPeerConnection = useCallback((targetSocketId: string): RTCPeerConnection => {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {}
    }

    targetSocketIdRef.current = targetSocketId;
    const pc = new RTCPeerConnection({ iceServers: getIceServers() });
    peerConnectionRef.current = pc;

    // Ensure audio transceiver is configured for bidirectional (sendrecv) audio
    try {
      pc.addTransceiver('audio', { direction: 'sendrecv' });
    } catch (e) {
      console.warn('[VOICE] addTransceiver note:', e);
    }

    // Send local ICE candidates through Socket.IO signaling
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('voice:candidate', {
          targetSocketId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Attach remote WebRTC audio stream to HTML audio element
    pc.ontrack = (event) => {
      console.log('[VOICE] Remote track received:', {
        kind: event.track.kind,
        enabled: event.track.enabled,
        muted: event.track.muted,
        readyState: event.track.readyState,
        stream: event.streams?.[0],
      });

      const remoteStream = event.streams?.[0] || new MediaStream([event.track]);
      if (!remoteAudioRef.current) return;

      const audio = remoteAudioRef.current;
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audio.setAttribute('playsinline', 'true');
      audio.muted = !isListenOnRef.current;

      audio.play().then(() => {
        setStatus('connected');
        setStatusMessage('Voice Connected');
      }).catch((err) => {
        console.warn('[VOICE] Remote audio play blocked by browser policy:', err);
        setStatus('connected');
        setStatusMessage('Tap Listen to enable audio');
      });
    };

    // Connection state monitor & sender/receiver logging
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        console.log('[VOICE] Connection state connected:', {
          senders: pc.getSenders().map((s) => ({ kind: s.track?.kind, enabled: s.track?.enabled })),
          receivers: pc.getReceivers().map((r) => ({ kind: r.track?.kind, enabled: r.track?.enabled, readyState: r.track?.readyState })),
        });
        setStatus('connected');
        setStatusMessage('Voice Connected');
      } else if (state === 'connecting') {
        setStatus('connecting');
        setStatusMessage('Connecting Voice...');
      } else if (state === 'failed' || state === 'disconnected') {
        setStatus('disconnected');
        setStatusMessage('Voice Disconnected');
      }
    };

    // Renegotiation handler when track configuration changes
    pc.onnegotiationneeded = async () => {
      try {
        if (isNegotiatingRef.current || pc.signalingState !== 'stable') return;
        isNegotiatingRef.current = true;
        const offer = await pc.createOffer({ offerToReceiveAudio: true });
        await pc.setLocalDescription(offer);
        if (socket && targetSocketIdRef.current) {
          socket.emit('voice:offer', {
            targetSocketId: targetSocketIdRef.current,
            offer,
          });
        }
      } catch (err) {
        console.error('[VOICE] Renegotiation offer error:', err);
      } finally {
        isNegotiatingRef.current = false;
      }
    };

    // Add existing local mic stream if available
    if (localStreamRef.current) {
      attachTracksToPeerConnection(pc, localStreamRef.current);
    }

    return pc;
  }, [socket, attachTracksToPeerConnection]);

  // Drain queued ICE candidates received before remote description set
  const drainPendingCandidates = async (pc: RTCPeerConnection) => {
    while (pendingCandidatesRef.current.length > 0) {
      const candidate = pendingCandidatesRef.current.shift();
      if (candidate && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[VOICE] Pending ICE candidate error:', e);
        }
      }
    }
  };

  // Deterministic initiator check: compare stable IDs to designate a single offerer
  const myId = playerId || roomState?.myPlayerId || '';
  const opponentId = opponent?.id || '';
  const isInitiator = myId && opponentId ? myId.localeCompare(opponentId) < 0 : false;

  // Socket.IO signaling event listener registration
  useEffect(() => {
    if (!socket || !isInRoom) return;

    const handleVoiceReady = async ({ senderSocketId }: { senderSocketId: string }) => {
      if (!senderSocketId || senderSocketId === socket.id) return;

      // Only designated initiator creates the initial offer (prevents glare collisions)
      if (!isInitiator) return;

      try {
        setStatus('connecting');
        setStatusMessage('Connecting Voice...');
        const pc = createPeerConnection(senderSocketId);
        isNegotiatingRef.current = true;
        const offer = await pc.createOffer({ offerToReceiveAudio: true });
        await pc.setLocalDescription(offer);
        socket.emit('voice:offer', { targetSocketId: senderSocketId, offer });
      } catch (err) {
        console.error('[VOICE] Error creating initial offer:', err);
      } finally {
        isNegotiatingRef.current = false;
      }
    };

    const handleVoiceOffer = async ({ senderSocketId, offer }: { senderSocketId: string; offer: RTCSessionDescriptionInit }) => {
      if (!senderSocketId || senderSocketId === socket.id) return;
      try {
        setStatus('connecting');
        setStatusMessage('Connecting Voice...');
        const pc = peerConnectionRef.current || createPeerConnection(senderSocketId);

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await drainPendingCandidates(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('voice:answer', { targetSocketId: senderSocketId, answer });
      } catch (err) {
        console.error('[VOICE] Error handling offer:', err);
      }
    };

    const handleVoiceAnswer = async ({ senderSocketId, answer }: { senderSocketId: string; answer: RTCSessionDescriptionInit }) => {
      if (!senderSocketId || senderSocketId === socket.id) return;
      try {
        const pc = peerConnectionRef.current;
        if (pc && pc.signalingState !== 'closed') {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await drainPendingCandidates(pc);
        }
      } catch (err) {
        console.error('[VOICE] Error handling answer:', err);
      }
    };

    const handleVoiceCandidate = async ({ senderSocketId, candidate }: { senderSocketId: string; candidate: RTCIceCandidateInit }) => {
      if (!senderSocketId || senderSocketId === socket.id) return;
      try {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      } catch (err) {
        console.warn('[VOICE] Error adding candidate:', err);
      }
    };

    const handleVoiceLeave = ({ senderSocketId }: { senderSocketId: string }) => {
      if (senderSocketId && senderSocketId === targetSocketIdRef.current) {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = null;
        }
        setStatus('disconnected');
        setStatusMessage('Opponent Left Voice');
      }
    };

    socket.on('voice:ready', handleVoiceReady);
    socket.on('voice:offer', handleVoiceOffer);
    socket.on('voice:answer', handleVoiceAnswer);
    socket.on('voice:candidate', handleVoiceCandidate);
    socket.on('voice:leave', handleVoiceLeave);

    // Announce voice ready to opponent upon joining or reconnecting
    if (opponent && roomState?.roomId) {
      socket.emit('voice:ready', { roomId: roomState.roomId });
    }

    return () => {
      socket.off('voice:ready', handleVoiceReady);
      socket.off('voice:offer', handleVoiceOffer);
      socket.off('voice:answer', handleVoiceAnswer);
      socket.off('voice:candidate', handleVoiceCandidate);
      socket.off('voice:leave', handleVoiceLeave);
    };
  }, [socket, isInRoom, roomState?.roomId, opponent, isInitiator, createPeerConnection]);

  // Clean up WebRTC session when player leaves room completely
  useEffect(() => {
    if (!isInRoom) {
      cleanupWebRTC();
      setIsMicOn(false);
    }
  }, [isInRoom, cleanupWebRTC]);

  // Toggle Microphone ON / OFF with automatic WebRTC track attach & renegotiation
  const toggleMic = async () => {
    if (!isMicOn) {
      // 1. Explicit Secure Context check (Browsers require HTTPS for getUserMedia except on localhost)
      if (!window.isSecureContext) {
        console.warn('[VOICE] Insecure context: getUserMedia requires HTTPS or localhost');
        setStatus('mic_denied');
        setStatusMessage('Microphone requires HTTPS');
        setIsMicOn(false);
        return;
      }

      // 2. Explicit navigator.mediaDevices availability check
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('[VOICE] mediaDevices API not available in browser');
        setStatus('mic_denied');
        setStatusMessage('Mic unsupported in browser');
        setIsMicOn(false);
        return;
      }

      try {
        let stream = localStreamRef.current;
        if (!stream) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = stream;
        }

        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = true;
        }

        // Attach track to active peer connection if established and trigger renegotiation
        if (peerConnectionRef.current && audioTrack) {
          attachTracksToPeerConnection(peerConnectionRef.current, stream);

          if (peerConnectionRef.current.signalingState === 'stable' && targetSocketIdRef.current && socket) {
            try {
              isNegotiatingRef.current = true;
              const offer = await peerConnectionRef.current.createOffer({ offerToReceiveAudio: true });
              await peerConnectionRef.current.setLocalDescription(offer);
              socket.emit('voice:offer', {
                targetSocketId: targetSocketIdRef.current,
                offer,
              });
            } catch (err) {
              console.error('[VOICE] Error creating mic enable offer:', err);
            } finally {
              isNegotiatingRef.current = false;
            }
          }
        }

        setIsMicOn(true);
        setStatusMessage('Microphone Active');
      } catch (err: any) {
        console.error('[VOICE] Microphone access error:', err);
        setStatus('mic_denied');
        setIsMicOn(false);

        const errName = err?.name || '';
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setStatusMessage('Mic Access Denied');
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          setStatusMessage('No Microphone Found');
        } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
          setStatusMessage('Mic Already In Use');
        } else if (errName === 'SecurityError') {
          setStatusMessage('Microphone Blocked (HTTPS required)');
        } else {
          setStatusMessage('Mic Request Failed');
        }
      }
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      setIsMicOn(false);
      setStatusMessage('Microphone Muted');
    }
  };

  // Toggle Listen / Speaker ON / OFF with user gesture playback activation
  const toggleListen = async () => {
    const nextState = !isListenOn;
    setIsListenOn(nextState);
    isListenOnRef.current = nextState;

    const audio = remoteAudioRef.current;
    if (!audio) return;

    audio.muted = !nextState;

    if (nextState) {
      try {
        await audio.play();
        setStatusMessage('Voice Unmuted');
      } catch (error) {
        console.warn('[VOICE] Remote audio playback blocked:', error);
        setStatusMessage('Tap Listen again to enable audio');
      }
    } else {
      try {
        audio.pause();
      } catch (e) {}
      setStatusMessage('Voice Muted');
    }
  };

  // Hide voice controls if not inside an active private room/lobby
  if (!isInRoom) return null;

  return (
    <>
      {/* Visually Hidden WebRTC Remote Audio Playback Element (Not display:none) */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        className="absolute h-px w-px opacity-0 pointer-events-none"
      />

      {/* Floating Vertical Voice Control Panel on Left Side */}
      <div className="fixed left-3 sm:left-6 bottom-6 sm:bottom-8 z-40 flex flex-col items-start select-none pointer-events-auto">
        <div className="group relative flex flex-col rounded-2xl border border-white/15 bg-slate-950/80 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Status Dot Badge */}
          <div className="absolute top-1.5 right-1.5 z-10 pointer-events-none">
            {status === 'connected' ? (
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            ) : status === 'connecting' ? (
              <Loader2 className="h-2.5 w-2.5 text-amber-400 animate-spin" />
            ) : status === 'mic_denied' ? (
              <AlertCircle className="h-2.5 w-2.5 text-rose-400" />
            ) : null}
          </div>

          {/* Top Button: Microphone (Mic / MicOff) */}
          <button
            type="button"
            onClick={toggleMic}
            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 touch-manipulation ${
              isMicOn
                ? 'bg-blue-500/25 text-blue-300 hover:bg-blue-500/35 shadow-[inset_0_0_12px_rgba(59,130,246,0.3)]'
                : 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
            }`}
            aria-label={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            title={isMicOn ? 'Microphone: ON' : 'Microphone: OFF'}
          >
            {isMicOn ? (
              <Mic className="w-5 h-5 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </button>

          {/* Divider */}
          <div className="w-full h-px bg-white/10" />

          {/* Bottom Button: Listen / Speaker (Volume2 / VolumeX) */}
          <button
            type="button"
            onClick={toggleListen}
            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 touch-manipulation ${
              isListenOn
                ? 'bg-emerald-500/25 text-emerald-300 hover:bg-emerald-500/35 shadow-[inset_0_0_12px_rgba(52,211,153,0.3)]'
                : 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
            }`}
            aria-label={isListenOn ? 'Mute Remote Audio' : 'Unmute Remote Audio'}
            title={isListenOn ? 'Remote Audio: ON' : 'Remote Audio: OFF'}
          >
            {isListenOn ? (
              <Volume2 className="w-5 h-5 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Status Badge / Toast (Visible on Mobile & Desktop) */}
        {statusMessage && (
          <div className={`mt-2 px-3 py-1 rounded-xl text-[11px] font-semibold border backdrop-blur-md shadow-lg transition-all duration-200 ${
            status === 'mic_denied'
              ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
              : status === 'connected'
              ? 'bg-slate-950/80 border-emerald-500/30 text-emerald-300'
              : 'bg-slate-950/80 border-white/15 text-slate-200'
          }`}>
            {statusMessage}
          </div>
        )}
      </div>
    </>
  );
};
