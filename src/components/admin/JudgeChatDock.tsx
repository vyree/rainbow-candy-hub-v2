import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  X,
  Minimize2,
  Users,
  Radio,
  Music,
  Trash2,
  Sparkles,
  ChevronDown,
  Tag,
  Check,
  AlertCircle,
} from 'lucide-react';
import { AdminUser, JudgeChatMessage, Participant } from '../../types/participant';
import {
  fetchJudgeChatMessages,
  sendJudgeChatMessage,
  subscribeToJudgeChat,
  clearJudgeChatMessages,
} from '../../services/supabaseClient';

interface JudgeChatDockProps {
  currentUser: AdminUser;
  activeJudgeId?: string;
  judgesList?: AdminUser[];
  currentParticipant?: Participant | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelectParticipant?: (participantId: string) => void;
}

const QUICK_CHIPS = [
  '👍 Setuju',
  '👏 Vokal Mantap',
  '⏳ Perlu Diskusi Nilai',
  '✅ Nilai Sudah Disubmit',
  '⭐ Calon Juara',
  '🎵 Artikulasi Rapih',
];

export const JudgeChatDock: React.FC<JudgeChatDockProps> = ({
  currentUser,
  activeJudgeId,
  judgesList = [],
  currentParticipant,
  isOpen,
  onToggle,
  onSelectParticipant,
}) => {
  const [messages, setMessages] = useState<JudgeChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachParticipant, setAttachParticipant] = useState(true);
  const [filterByCurrent, setFilterByCurrent] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [peekMessage, setPeekMessage] = useState<JudgeChatMessage | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const peekTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSuperadmin = currentUser?.role === 'superadmin';

  // Load initial messages and subscribe to realtime
  useEffect(() => {
    let isMounted = true;

    fetchJudgeChatMessages().then((res) => {
      if (isMounted && res.data) {
        setMessages(res.data);
      }
    });

    const unsubscribe = subscribeToJudgeChat((newMsg) => {
      if (!isMounted) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev;
        }
        return [...prev, newMsg];
      });

      // Handle unread & peek toast if chat is closed and sender is someone else
      if (!isOpen && newMsg.senderId !== currentUser?.id) {
        setUnreadCount((c) => c + 1);

        // Show subtle peek notification for 4 seconds
        setPeekMessage(newMsg);
        if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current);
        peekTimeoutRef.current = setTimeout(() => {
          if (isMounted) setPeekMessage(null);
        }, 4500);
      }
    });

    const handleClearEvent = () => {
      if (isMounted) setMessages([]);
    };
    window.addEventListener('rc_judge_chat_cleared', handleClearEvent);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('rc_judge_chat_cleared', handleClearEvent);
      if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current);
    };
  }, [isOpen, currentUser?.id]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setPeekMessage(null);
      if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [isOpen]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, filterByCurrent]);

  // Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isSending) return;

    setIsSending(true);
    const participantInfo = attachParticipant && currentParticipant
      ? {
          participantId: currentParticipant.id,
          participantName: `#${currentParticipant.orderNumber || '-'} ${currentParticipant.fullName || 'Peserta'}`,
        }
      : {};

    try {
      await sendJudgeChatMessage({
        senderId: currentUser?.id || 'unknown',
        senderName: currentUser?.name || 'Dewan Juri',
        senderRole: currentUser?.roleTitle || currentUser?.role || 'Dewan Juri',
        senderAvatar: currentUser?.avatar || '⚖️',
        message: text,
        ...participantInfo,
      });

      if (!textToSend) {
        setInputValue('');
      }
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.warn('Failed to send judge chat message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = async () => {
    await clearJudgeChatMessages();
    setMessages([]);
    setShowClearConfirm(false);
  };

  // Filter messages if "Hanya Peserta Ini" is toggled
  const displayedMessages = useMemo(() => {
    if (!filterByCurrent || !currentParticipant) {
      return messages;
    }
    return messages.filter((m) => m.participantId === currentParticipant.id);
  }, [messages, filterByCurrent, currentParticipant]);

  const participantCountMap = useMemo(() => {
    if (!currentParticipant) return 0;
    return messages.filter((m) => m.participantId === currentParticipant.id).length;
  }, [messages, currentParticipant]);

  return (
    <>
      {/* 1. FLOATING PEEK NOTIFICATION TOAST (Non-intrusive banner when chat is closed) */}
      <AnimatePresence>
        {!isOpen && peekMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              onToggle();
              setPeekMessage(null);
            }}
            className="fixed top-4 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] bg-slate-900/95 border border-amber-400/50 rounded-2xl p-3 shadow-2xl backdrop-blur-md cursor-pointer hover:border-amber-400 transition-all flex items-start gap-3 text-slate-100 group"
          >
            <div className="w-9 h-9 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-lg shrink-0">
              {peekMessage.senderAvatar || '⚖️'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-amber-300 truncate">
                  {peekMessage.senderName}
                </span>
                <span className="text-[10px] font-mono text-slate-400">Baru saja</span>
              </div>
              <p className="text-xs text-slate-200 line-clamp-2 mt-0.5">
                {peekMessage.message}
              </p>
              {peekMessage.participantName && (
                <span className="inline-flex items-center gap-1 mt-1 text-[9.5px] font-mono text-amber-400/90 bg-amber-400/10 px-1.5 py-0.5 rounded">
                  <Music className="w-2.5 h-2.5" />
                  {peekMessage.participantName}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPeekMessage(null);
              }}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. FLOATING ACTION BUTTON (Always accessible at bottom-right) */}
      {!isOpen && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-bold shadow-xl shadow-amber-500/25 border border-amber-300/40 backdrop-blur-md cursor-pointer group"
          aria-label="Buka Chat Juri"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-slate-950" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse" />
          </div>
          <span className="text-xs font-black tracking-wide hidden sm:inline">
            Chat Juri
          </span>

          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-mono font-black rounded-full bg-rose-600 text-white shadow-md animate-bounce">
              {unreadCount}
            </span>
          )}
        </motion.button>
      )}

      {/* 3. CHAT PANEL / BOTTOM SHEET (Responsive for Desktop & Mobile) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop Overlay (only on mobile) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="sm:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                height: isMinimized ? 'auto' : undefined,
              }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`fixed z-50 bg-slate-950/95 border border-amber-400/35 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden
                /* Mobile: Bottom sheet */
                inset-x-0 bottom-0 max-h-[85vh] h-[75vh] rounded-t-3xl border-b-0
                /* Desktop: Floating card in bottom-right corner */
                sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96 sm:max-w-[420px] sm:h-[580px] sm:rounded-3xl sm:border-b
              `}
            >
              {/* Top Handle bar (Thumb gesture affordance for mobile) */}
              <div className="sm:hidden w-12 h-1 bg-slate-700/80 rounded-full mx-auto mt-2 mb-1" />

              {/* Header */}
              <div className="p-3.5 px-4 bg-gradient-to-r from-slate-900/90 to-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider truncate">
                        Diskusi Juri
                      </h4>
                      <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {judgesList.length > 0
                        ? `${judgesList.length} Dewan Juri Aktif`
                        : 'Komunikasi Real-time'}
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {isSuperadmin && (
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      title="Bersihkan Semua Pesan"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsMinimized((prev) => !prev)}
                    title={isMinimized ? 'Perbesar' : 'Kecilkan'}
                    className="hidden sm:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={onToggle}
                    title="Tutup Chat"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Clear confirmation alert banner */}
              {showClearConfirm && (
                <div className="p-3 bg-rose-950/80 border-b border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Hapus seluruh riwayat chat untuk semua juri?</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleClearChat}
                      className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[10px] font-bold"
                    >
                      Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2 py-1 bg-slate-800 text-slate-300 rounded-md text-[10px]"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Body (only if not minimized) */}
              {!isMinimized && (
                <>
                  {/* Context Filter Bar (Filter by current participant vs All) */}
                  {currentParticipant && (
                    <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-2 text-[11px] shrink-0">
                      <div className="flex items-center gap-1 text-slate-400 truncate">
                        <Music className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">
                          #{currentParticipant.orderNumber || '-'} {currentParticipant.fullName}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFilterByCurrent((prev) => !prev)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-all shrink-0 ${
                          filterByCurrent
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {filterByCurrent ? 'Hanya Peserta Ini' : `Filter (${participantCountMap})`}
                      </button>
                    </div>
                  )}

                  {/* Messages Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-3.5 space-y-3 overscroll-contain">
                    {displayedMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-2">
                          <MessageSquare className="w-6 h-6 text-amber-400/60" />
                        </div>
                        <p className="text-xs font-semibold text-slate-300">
                          {filterByCurrent
                            ? 'Belum ada diskusi untuk peserta ini'
                            : 'Ruang Diskusi Dewan Juri'}
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-[220px] mt-1">
                          Kirim pesan atau gunakan reaksi cepat di bawah untuk berdiskusi dengan juri lain.
                        </p>
                      </div>
                    ) : (
                      displayedMessages.map((msg) => {
                        const isMe = msg.senderId === currentUser.id;
                        const timeStr = new Date(msg.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            {/* Sender Info (for other users) */}
                            {!isMe && (
                              <div className="flex items-center gap-1.5 mb-1 px-1">
                                <span className="text-xs">{msg.senderAvatar || '⚖️'}</span>
                                <span className="text-[11px] font-bold text-slate-300">
                                  {msg.senderName}
                                </span>
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 border border-slate-700">
                                  {msg.senderRole}
                                </span>
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2 shadow-md relative text-xs leading-relaxed break-words ${
                                isMe
                                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-medium rounded-tr-none'
                                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                              }`}
                            >
                              {/* Attached Participant Pill */}
                              {msg.participantName && (
                                <div
                                  onClick={() => {
                                    if (msg.participantId && onSelectParticipant) {
                                      onSelectParticipant(msg.participantId);
                                    }
                                  }}
                                  className={`mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono cursor-pointer transition-opacity ${
                                    isMe
                                      ? 'bg-black/20 text-slate-950 hover:bg-black/30'
                                      : 'bg-amber-400/10 text-amber-300 border border-amber-400/20 hover:bg-amber-400/20'
                                  }`}
                                  title="Klik untuk melihat peserta ini"
                                >
                                  <Music className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate max-w-[180px]">
                                    {msg.participantName}
                                  </span>
                                </div>
                              )}

                              <p className="whitespace-pre-wrap">{msg.message}</p>

                              <div
                                className={`text-[9px] font-mono text-right mt-1 ${
                                  isMe ? 'text-slate-900/70 font-semibold' : 'text-slate-500'
                                }`}
                              >
                                {timeStr}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Response Chips (Mobile-first Thumb Action) */}
                  <div className="px-3 py-1.5 bg-slate-900/40 border-t border-slate-800/80 overflow-x-auto flex items-center gap-1.5 shrink-0 no-scrollbar">
                    {QUICK_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleSendMessage(chip)}
                        className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-amber-400/20 border border-slate-800 hover:border-amber-400/40 text-[10.5px] text-slate-300 hover:text-amber-300 whitespace-nowrap active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Input & Send Area */}
                  <div className="p-3 bg-slate-950 border-t border-slate-800/90 space-y-2 shrink-0">
                    {/* Attach participant toggle */}
                    {currentParticipant && (
                      <div className="flex items-center justify-between text-[10.5px] px-1 text-slate-400">
                        <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-300 select-none">
                          <input
                            type="checkbox"
                            checked={attachParticipant}
                            onChange={(e) => setAttachParticipant(e.target.checked)}
                            className="rounded border-slate-700 text-amber-400 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                          />
                          <span>
                            Kaitkan ke #{currentParticipant.orderNumber || '-'} {currentParticipant.fullName ? currentParticipant.fullName.split(' ')[0] : 'Peserta'}
                          </span>
                        </label>
                      </div>
                    )}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Tulis pesan ke dewan juri..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60 transition-colors"
                      />

                      <button
                        type="submit"
                        disabled={!inputValue.trim() || isSending}
                        className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:from-amber-300 hover:to-amber-400 active:scale-95 transition-all shadow-md shadow-amber-400/20 shrink-0 flex items-center justify-center"
                        aria-label="Kirim Pesan"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
