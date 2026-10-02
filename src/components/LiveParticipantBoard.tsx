import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  RefreshCw,
  Music,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Radio,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ThemeConfig } from '../types/theme';
import { Participant } from '../types/participant';

interface LiveParticipantBoardProps {
  currentTheme: ThemeConfig;
  participants: Participant[];
  isLoading: boolean;
  onRefresh: () => void;
  isRealtimeActive: boolean;
}

const ITEMS_PER_PAGE = 5;

export const LiveParticipantBoard: React.FC<LiveParticipantBoardProps> = ({
  currentTheme,
  participants,
  isLoading,
  onRefresh,
  isRealtimeActive,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Only include participants with confirmed or done status for landing page display
  const confirmedParticipants = participants.filter(
    (p) =>
      (p.status || '').toLowerCase() === 'confirmed' ||
      (p.status || '').toLowerCase() === 'done'
  );

  // 2. Sort confirmed participants descending by latest confirmed / latest registration timestamp
  // (Yang teratas adalah yang latest confirmed)
  const sortedParticipants = [...confirmedParticipants].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (timeB !== timeA) {
      return timeB - timeA; // Latest registered/confirmed first
    }
    const orderA = a.orderNumber !== undefined ? a.orderNumber : 0;
    const orderB = b.orderNumber !== undefined ? b.orderNumber : 0;
    return orderB - orderA;
  });

  // 3. Filter by search query
  const filteredParticipants = sortedParticipants.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      p.fullName.toLowerCase().includes(term) ||
      p.familyName.toLowerCase().includes(term) ||
      p.idolSong.toLowerCase().includes(term) ||
      (p.idolArtist && p.idolArtist.toLowerCase().includes(term)) ||
      (p.idpopup !== undefined && p.idpopup.toString().includes(term))
    );
  });

  // 4. Pagination calculations (1 page = 5 data)
  const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const displayedParticipants = filteredParticipants.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to page 1 on new search
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <section id="peserta" className="py-20 md:py-28 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-4 text-xs font-bold uppercase tracking-widest font-mono"
            style={{
              backgroundColor: `${currentTheme.accentPrimary}15`,
              borderColor: `${currentTheme.accentPrimary}35`,
              color: currentTheme.accentPrimary,
            }}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Live Participant Board</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-current mb-4">
            Daftar Peserta{' '}
            <span
              className="italic bg-gradient-to-r bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${currentTheme.accentPrimary}, ${currentTheme.accentSecondary})`,
              }}
            >
              Confirmed
            </span>
          </h2>
          <p className="text-base sm:text-lg max-w-xl mx-auto opacity-75 font-light">
            Pantau seluruh talenta vokal yang telah terkonfirmasi resmi untuk panggung perayaan 13 September 2026.
          </p>
        </div>

        {/* Toolbar: Search, Filter, Stats & Refresh */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              placeholder="Cari nama, family, ID PopUp, atau lagu..."
              value={searchTerm}
              onChange={handleSearchChange}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium ${currentTheme.inputBg} border ${currentTheme.inputBorder} text-current placeholder:opacity-40 outline-none transition-all`}
            />
          </div>

          {/* Stats and Refresh Action */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/20 border border-white/10 text-xs font-mono">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: currentTheme.accentPrimary }}
              />
              <span className="opacity-80">Urutan Teratas: Latest Confirmed</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/20 border border-white/10 text-xs font-mono">
              <Users className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
              <span>
                Total Confirmed: <strong className="text-current font-bold">{confirmedParticipants.length}</strong>
              </span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Perbarui data peserta"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-current border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Participant Board Table/Grid */}
        <div
          className={`rounded-3xl ${currentTheme.cardBg} border-2 ${currentTheme.cardBorder} ${currentTheme.cardGlow} overflow-hidden backdrop-blur-2xl shadow-2xl`}
        >
          {/* Table Header: Column Nomor Removed */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-4 border-b border-current/10 text-xs font-mono uppercase font-bold tracking-wider opacity-70">
            <div className="col-span-5">Nama Peserta & Family</div>
            <div className="col-span-5">Lagu Idola & Penyanyi</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          {/* Table Body / Cards */}
          <div className="divide-y divide-current/10">
            {displayedParticipants.length === 0 ? (
              <div className="py-16 text-center text-sm opacity-60">
                {searchTerm ? (
                  <p>Tidak ditemukan peserta confirmed dengan kata kunci "{searchTerm}".</p>
                ) : (
                  <p>Belum ada peserta dengan status Confirmed. Peserta yang telah dikonfirmasi panitia akan tampil di sini.</p>
                )}
              </div>
            ) : (
              displayedParticipants.map((participant, index) => {
                const isNewest = activePage === 1 && index === 0;
                return (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    className={`p-4 sm:px-6 sm:py-4.5 sm:grid sm:grid-cols-12 gap-4 items-center transition-colors group ${
                      isNewest ? 'bg-white/[0.04]' : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Name, ID PopUp & Family (col-span-5, no sequential number) */}
                    <div className="sm:col-span-5 min-w-0 mb-2 sm:mb-0">
                      {/* Mobile Header Row with Tags */}
                      <div className="flex items-center justify-between sm:justify-start gap-2 mb-1.5 sm:mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isNewest && (
                            <span
                              className="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded border"
                              style={{
                                backgroundColor: `${currentTheme.accentPrimary}20`,
                                borderColor: `${currentTheme.accentPrimary}45`,
                                color: currentTheme.accentPrimary,
                              }}
                            >
                              Terbaru
                            </span>
                          )}
                          {participant.idpopup !== undefined && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                              ID: #{participant.idpopup}
                            </span>
                          )}
                        </div>

                        {/* Mobile Only Status Badge */}
                        <div className="sm:hidden">
                          {participant.status === 'done' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                              <CheckCircle2 className="w-3 h-3 text-blue-400" />
                              <span>Done</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Confirmed</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="font-serif-luxury font-bold text-sm sm:text-base text-current truncate group-hover:text-amber-300 transition-colors">
                        {participant.fullName}
                      </p>
                      <p className="text-xs opacity-75 flex items-center gap-1.5 mt-0.5 truncate">
                        <Users className="w-3 h-3 shrink-0" style={{ color: currentTheme.accentSecondary }} />
                        <span className="font-semibold">{participant.familyName || 'not available'}</span>
                      </p>
                    </div>

                    {/* Song Title & Artist (col-span-5) */}
                    <div className="sm:col-span-5 min-w-0 mb-3 sm:mb-0">
                      <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-current">
                          <Music className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                          <span className="truncate">{participant.idolSong || 'not available'}</span>
                        </div>
                        {participant.idolArtist && (
                          <p className="text-[11px] opacity-70 pl-5 truncate font-medium">
                            Idola: <span className="font-semibold text-current">{participant.idolArtist}</span>
                          </p>
                        )}
                        {participant.audioLink && (
                          <div className="pl-5 pt-0.5">
                            <a
                              href={participant.audioLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:underline"
                            >
                              <span>Audio Minus-One</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Badge Desktop (col-span-2) */}
                    <div className="hidden sm:block sm:col-span-2 text-right">
                      {participant.status === 'done' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase px-3 py-1 rounded-full border bg-blue-500/20 text-blue-300 border-blue-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>Done</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase px-3 py-1 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Confirmed</span>
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Pagination Controls & Bottom Footer */}
          <div className="px-4 sm:px-6 py-4 bg-black/30 border-t border-current/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
            {/* Info Summary */}
            <div className="flex items-center gap-2 opacity-80 text-center sm:text-left">
              <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: currentTheme.accentPrimary }} />
              <span>
                Menampilkan{' '}
                <strong className="text-current">
                  {filteredParticipants.length > 0 ? startIndex + 1 : 0}
                </strong>
                -
                <strong className="text-current">
                  {Math.min(startIndex + ITEMS_PER_PAGE, filteredParticipants.length)}
                </strong>{' '}
                dari total <strong className="text-current">{filteredParticipants.length}</strong> peserta confirmed
              </span>
            </div>

            {/* Pagination Buttons (1 page 5 data) */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(activePage - 1)}
                  disabled={activePage <= 1}
                  className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-white/5 border border-white/10 transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed text-current"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isActive = pageNum === activePage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 rounded-lg font-mono font-bold text-xs transition-all flex items-center justify-center cursor-pointer"
                        style={
                          isActive
                            ? {
                                backgroundColor: currentTheme.accentPrimary,
                                color: '#090d16',
                                boxShadow: `0 0 10px ${currentTheme.accentPrimary}40`,
                              }
                            : {
                                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                color: 'currentColor',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                              }
                        }
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(activePage + 1)}
                  disabled={activePage >= totalPages}
                  className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-white/5 border border-white/10 transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed text-current"
                  title="Halaman Selanjutnya"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
