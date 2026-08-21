import React, { useState, useEffect, useRef } from 'react';
import { GameChatMessage } from '../../../../shared/types';
import { useBingoSocket } from '../../context/SocketContext';
import { MessageCircle, MessageSquare, X, SendHorizontal, Sparkles, CheckCheck } from 'lucide-react';

interface ToastState {
  message: GameChatMessage;
  isExiting: boolean;
}

export const GameChat: React.FC = () => {
  const { roomState, playerId, sendChatMessage } = useBingoSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [incomingToast, setIncomingToast] = useState<ToastState | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessagesCount = useRef(roomState?.chatMessages?.length || 0);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastExitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return 'now';
    const now = Date.now();
    if (now - timestamp < 60000) return 'now';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearToastTimers = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    if (toastExitTimeoutRef.current) clearTimeout(toastExitTimeoutRef.current);
  };

  useEffect(() => {
    if (!roomState) {
      setUnreadCount(0);
      setIncomingToast(null);
      previousMessagesCount.current = 0;
      return;
    }

    const currentMessages = roomState.chatMessages || [];
    const count = currentMessages.length;

    if (count > previousMessagesCount.current) {
      const newMsg = currentMessages[count - 1];
      const isOpponent = newMsg && newMsg.senderId !== playerId && newMsg.senderId !== roomState.mySocketId;

      if (isOpponent) {
        if (!isOpen) {
          setUnreadCount((prev) => prev + 1);

          clearToastTimers();
          setIncomingToast({ message: newMsg, isExiting: false });

          toastTimeoutRef.current = setTimeout(() => {
            setIncomingToast((prev) => (prev ? { ...prev, isExiting: true } : null));
            toastExitTimeoutRef.current = setTimeout(() => {
              setIncomingToast(null);
            }, 350);
          }, 4500);
        }
      }
    } else if (count === 0) {
      setUnreadCount(0);
      setIncomingToast(null);
    }

    previousMessagesCount.current = count;
  }, [roomState?.chatMessages, playerId, roomState?.mySocketId, isOpen]);

  useEffect(() => {
    return () => clearToastTimers();
  }, []);

  const handleOpenChat = () => {
    clearToastTimers();
    setIncomingToast(null);
    setUnreadCount(0);
    setIsOpen(true);
  };

  const handleToggleChat = () => {
    if (!isOpen) {
      handleOpenChat();
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [roomState?.chatMessages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputMessage.trim();
    if (cleanText) {
      setInputMessage('');
      await sendChatMessage(cleanText);
    }
  };

  if (!roomState) return null;

  const messages = roomState.chatMessages || [];
  const opponent = roomState.players.find((p) => p.id !== playerId && p.id !== roomState.mySocketId);

  return (
    <div className="fixed right-3 sm:right-6 bottom-6 sm:bottom-8 z-40 flex items-end pointer-events-none">
      <div className="relative flex items-end justify-end gap-3 pointer-events-auto">
        {/* Floating Incoming Notification Toast */}
        {!isOpen && incomingToast && (
          <div
            onClick={handleOpenChat}
            className={`group cursor-pointer pointer-events-auto relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-950/85 backdrop-blur-2xl border border-sky-400/30 shadow-[0_15px_35px_rgba(0,0,0,0.55)] max-w-[210px] sm:max-w-[250px] transition-all hover:border-sky-400/60 hover:bg-slate-950/95 ${
              incomingToast.isExiting ? 'animate-toast-slide-out' : 'animate-toast-slide-in'
            }`}
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/20 text-xs font-black text-amber-300 shadow-md">
              {incomingToast.message.senderName?.charAt(0).toUpperCase() || 'O'}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1.5">
                <span className="truncate text-xs font-bold text-white">
                  {incomingToast.message.senderName}
                </span>
                <span className="text-[9px] font-semibold text-slate-400 shrink-0">
                  {formatTime(incomingToast.message.timestamp)}
                </span>
              </div>
              <p className="truncate text-[11px] font-medium text-slate-200 mt-0.5">
                {incomingToast.message.message || incomingToast.message.text}
              </p>
            </div>
          </div>
        )}

        {/* Expanded Chat Panel */}
        <div
          className={`origin-bottom-right transition-all duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isOpen
              ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto'
              : 'scale-75 opacity-0 translate-y-4 pointer-events-none absolute bottom-0 right-0'
          }`}
          style={{ transformOrigin: 'calc(100% - 28px) calc(100% - 28px)' }}
        >
          <div className="relative w-[calc(100vw-24px)] max-w-[340px] sm:w-[340px] h-[460px] max-h-[75vh] rounded-[28px] border border-white/15 bg-slate-950/85 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.65)] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-300 shadow-inner">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                    <span>Game Chat</span>
                    <Sparkles className="w-3 h-3 text-sky-400 opacity-80" />
                  </h3>
                  <p className="text-[10px] font-medium text-slate-400">
                    {opponent ? `vs ${opponent.nickname}` : 'In-game chat'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close chat panel"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-auto">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-300 mb-2.5 shadow-inner">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Game Chat</h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                    Talk with your opponent while you play.
                  </p>
                </div>
              ) : (
                messages.map((msg: GameChatMessage) => {
                  const isMe = msg.senderId === playerId || msg.senderId === roomState.mySocketId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] font-semibold text-slate-400 mb-1 px-1">
                        {isMe ? 'You' : msg.senderName}
                      </span>
                      <div
                        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words border shadow-md backdrop-blur-md relative ${
                          isMe
                            ? 'bg-sky-600/30 border-sky-400/35 text-sky-50 rounded-tr-xs shadow-sky-900/20'
                            : 'bg-slate-900/60 border-white/10 text-slate-100 rounded-tl-xs shadow-black/40'
                        }`}
                      >
                        <p>{msg.message || msg.text}</p>
                        <div className={`mt-1 flex items-center gap-1 text-[9px] font-semibold ${isMe ? 'justify-end text-sky-300/80' : 'justify-end text-slate-400'}`}>
                          <span>{formatTime(msg.timestamp)}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-sky-300" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/[0.08] bg-slate-900/50">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  maxLength={200}
                  placeholder="Type a message..."
                  className="w-full pl-3.5 pr-11 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-400 outline-none focus:outline-none focus:border-white/30 focus:bg-white/[0.08] focus:ring-0 focus:shadow-none transition-colors duration-200 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="absolute right-1.5 w-8 h-8 rounded-xl bg-sky-500/30 border border-sky-400/40 text-sky-200 hover:bg-sky-500/50 hover:text-white disabled:opacity-40 disabled:hover:bg-sky-500/30 flex items-center justify-center transition-all shadow-sm"
                  aria-label="Send message"
                >
                  <SendHorizontal className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Circular Floating Chat Button */}
        {!isOpen && (
          <button
            type="button"
            onClick={handleToggleChat}
            className="group relative w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-full border border-white/20 bg-slate-900/60 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_35px_rgba(56,189,248,0.25)] hover:border-white/35 hover:scale-105 active:scale-95 flex items-center justify-center transition-all duration-200 cursor-pointer overflow-hidden shrink-0"
            aria-label="Open in-game chat"
          >
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-sky-300 drop-shadow-md transition-transform duration-200 group-hover:scale-110" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sky-500 px-1.5 text-[10px] font-black text-slate-950 shadow-md border border-slate-950 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
