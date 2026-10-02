import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Sparkles, Music, Star, ArrowLeft, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { ThemeConfig } from '../types/theme';
import { RCEvent, EventWinner } from '../types/event';

interface EndedEventWinnerShowcaseProps {
  event: RCEvent;
  currentTheme: ThemeConfig;
  onNavigateToEventList: () => void;
  onNavigateToProfile: () => void;
}

export const EndedEventWinnerShowcase: React.FC<EndedEventWinnerShowcaseProps> = ({
  event,
  currentTheme,
  onNavigateToEventList,
  onNavigateToProfile,
}) => {
  const winners = event.winners && event.winners.length > 0 ? event.winners : [];

  const juara1 = winners.find((w) => w.rank === 1);
  const juara2 = winners.find((w) => w.rank === 2);
  const juara3 = winners.find((w) => w.rank === 3);
  const others = winners.filter((w) => w.rank !== 1 && w.rank !== 2 && w.rank !== 3);

  return (
    <section className="relative w-full py-12 sm:py-16 overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <button
            type="button"
            onClick={onNavigateToEventList}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs sm:text-sm font-semibold transition-all cursor-pointer backdrop-blur-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog Event</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              Event Telah Selesai (Ended)
            </span>
          </div>
        </div>

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase border shadow-sm"
            style={{
              backgroundColor: `${currentTheme.accentPrimary}15`,
              borderColor: `${currentTheme.accentPrimary}35`,
              color: currentTheme.accentPrimary,
            }}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Hall of Fame & Hasil Lomba</span>
          </motion.div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-black text-current tracking-tight">
            Pemenang Resmi {event.title}
          </h2>

          <p className="text-sm sm:text-base opacity-80 font-light leading-relaxed">
            Selamat kepada para peraih gelar juara yang telah menampilkan harmonisasi vokal dan performa panggung luar biasa di hadapan dewan juri kehormatan Rainbow Candy.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs opacity-75 font-mono pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Periode: {event.startDate} • {event.time}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              {event.venue}
            </span>
          </div>
        </div>

        {/* PODIUM OF CHAMPIONS (Juara 1, 2, 3 - strictly NO SCORES / POINTS) */}
        {winners.length > 0 ? (
          <div className="space-y-12">
            {/* Grid for Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-end">
              {/* JUARA 2 (Silver - Left) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="order-2 md:order-1 relative rounded-3xl p-6 sm:p-7 border backdrop-blur-xl bg-slate-900/60 border-slate-400/30 shadow-xl overflow-hidden text-center flex flex-col justify-between h-full"
                style={{
                  boxShadow: '0 10px 30px rgba(148, 163, 184, 0.1)',
                }}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-950 flex items-center justify-center shadow-lg shadow-slate-300/20 font-bold">
                    <Medal className="w-8 h-8 text-slate-800" />
                  </div>

                  <div>
                    <span className="inline-block px-3 py-0.5 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-slate-400/20 text-slate-300 border border-slate-400/40 mb-2">
                      JUARA 2
                    </span>
                    <h3 className="font-serif-luxury text-2xl font-bold text-white">
                      {juara2 ? juara2.participantName : 'Belum Ditentukan'}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {juara2?.familyName || 'Rainbow Candy Family'}
                    </p>
                  </div>

                  {juara2?.idolSong && (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-left space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
                        <Music className="w-3 h-3 text-slate-300" />
                        <span>Lagu Idola yang Dibawakan:</span>
                      </div>
                      <p className="font-semibold text-slate-200">
                        {juara2.idolSong}
                        {juara2.idolArtist ? ` - ${juara2.idolArtist}` : ''}
                      </p>
                    </div>
                  )}

                  {juara2?.reward && (
                    <div className="p-2.5 rounded-xl bg-slate-400/10 border border-slate-400/20 text-xs text-slate-300 font-semibold">
                      🎁 {juara2.reward}
                    </div>
                  )}

                  {juara2?.notes && (
                    <p className="text-xs text-slate-400 italic">
                      "{juara2.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <Star className="w-3 h-3 text-slate-300 fill-slate-300" />
                  <span>Podium Perak • Prestasi Terverifikasi</span>
                </div>
              </motion.div>

              {/* JUARA 1 (Gold - Center & Elevated) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="order-1 md:order-2 relative rounded-3xl p-7 sm:p-9 border-2 backdrop-blur-2xl bg-gradient-to-b from-amber-500/15 via-slate-900/80 to-slate-950/90 border-amber-400/60 shadow-2xl overflow-hidden text-center flex flex-col justify-between md:-translate-y-4"
                style={{
                  boxShadow: '0 20px 50px rgba(251, 191, 36, 0.25)',
                }}
              >
                {/* Decorative golden badge */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-4">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-400/30">
                      <Crown className="w-10 h-10 text-slate-950 fill-slate-950" />
                    </div>
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500 text-white shadow-md">
                      CHAMPION
                    </span>
                  </div>

                  <div>
                    <span className="inline-block px-4 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/50 mb-2">
                      👑 JUARA 1 • UTAMA
                    </span>
                    <h3 className="font-serif-luxury text-3xl sm:text-4xl font-black text-amber-200">
                      {juara1 ? juara1.participantName : 'Belum Ditentukan'}
                    </h3>
                    <p className="text-sm text-amber-300/80 font-medium mt-1">
                      {juara1?.familyName || 'Rainbow Candy Family'}
                    </p>
                  </div>

                  {juara1?.idolSong && (
                    <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-xs text-left space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-mono">
                        <Music className="w-3.5 h-3.5 text-amber-400" />
                        <span>Karya / Lagu Pilihan Juara:</span>
                      </div>
                      <p className="font-bold text-amber-100 text-sm">
                        {juara1.idolSong}
                        {juara1.idolArtist ? ` - ${juara1.idolArtist}` : ''}
                      </p>
                    </div>
                  )}

                  {juara1?.reward && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-amber-400/20 to-amber-500/20 border border-amber-400/40 text-xs sm:text-sm text-amber-200 font-bold">
                      🏆 {juara1.reward}
                    </div>
                  )}

                  {juara1?.notes && (
                    <p className="text-xs text-amber-200/90 italic leading-relaxed">
                      "{juara1.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-amber-400/20 flex items-center justify-center gap-1.5 text-xs font-mono text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gelar Kehormatan Tertinggi Fams RC</span>
                </div>
              </motion.div>

              {/* JUARA 3 (Bronze - Right) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="order-3 relative rounded-3xl p-6 sm:p-7 border backdrop-blur-xl bg-slate-900/60 border-amber-700/40 shadow-xl overflow-hidden text-center flex flex-col justify-between h-full"
                style={{
                  boxShadow: '0 10px 30px rgba(180, 83, 9, 0.1)',
                }}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-amber-100 flex items-center justify-center shadow-lg shadow-amber-800/20 font-bold">
                    <Medal className="w-8 h-8 text-amber-200" />
                  </div>

                  <div>
                    <span className="inline-block px-3 py-0.5 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-amber-700/20 text-amber-400 border border-amber-700/40 mb-2">
                      JUARA 3
                    </span>
                    <h3 className="font-serif-luxury text-2xl font-bold text-white">
                      {juara3 ? juara3.participantName : 'Belum Ditentukan'}
                    </h3>
                    <p className="text-xs text-amber-300/70 font-medium mt-0.5">
                      {juara3?.familyName || 'Rainbow Candy Family'}
                    </p>
                  </div>

                  {juara3?.idolSong && (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-left space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400/80 text-[11px] font-mono">
                        <Music className="w-3 h-3 text-amber-400" />
                        <span>Lagu Idola yang Dibawakan:</span>
                      </div>
                      <p className="font-semibold text-slate-200">
                        {juara3.idolSong}
                        {juara3.idolArtist ? ` - ${juara3.idolArtist}` : ''}
                      </p>
                    </div>
                  )}

                  {juara3?.reward && (
                    <div className="p-2.5 rounded-xl bg-amber-800/20 border border-amber-700/30 text-xs text-amber-300 font-semibold">
                      🎁 {juara3.reward}
                    </div>
                  )}

                  {juara3?.notes && (
                    <p className="text-xs text-slate-400 italic">
                      "{juara3.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-1.5 text-[11px] font-mono text-amber-400/80">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Podium Perunggu • Prestasi Terverifikasi</span>
                </div>
              </motion.div>
            </div>

            {/* Additional Laurels / Harapan / Favorit if present */}
            {others.length > 0 && (
              <div className="pt-6">
                <h4 className="text-center font-serif-luxury text-lg font-bold text-current mb-4">
                  Penghargaan Khusus & Favorit Dewan Juri
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {others.map((other, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1.5"
                    >
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {other.title}
                      </span>
                      <p className="font-bold text-current text-base">{other.participantName}</p>
                      <p className="text-xs opacity-75">{other.familyName}</p>
                      {other.idolSong && (
                        <p className="text-xs text-amber-400 italic font-medium">"{other.idolSong}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center max-w-xl mx-auto space-y-3">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto opacity-75" />
            <h3 className="font-serif-luxury text-xl font-bold text-current">
              Rekap Hasil Lomba Sedang Disusun
            </h3>
            <p className="text-xs opacity-75">
              Dewan juri sedang memfinalisasi penetapan gelar resmi pemenang untuk event ini. Hubungi panitia atau pantau pengumuman berkala.
            </p>
          </div>
        )}

        {/* CLOSED REGISTRATION NOTICE BANNER */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-700/60 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase text-rose-400">
                PENDAFTARAN RESMI DITUTUP
              </span>
            </div>
            <h3 className="font-serif-luxury text-lg sm:text-xl font-bold text-white">
              Event ini telah berakhir. Ingin ikut kompetisi berikutnya?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Jangan lewatkan keseruan di panggung Rainbow Candy selanjutnya. Kunjungi katalog event untuk melihat lomba yang sedang membuka registrasi.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={onNavigateToEventList}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-400/20 hover:scale-105 transition-all cursor-pointer text-center"
            >
              Lihat Event yang Masih Buka
            </button>
            <button
              type="button"
              onClick={onNavigateToProfile}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-white/15 hover:bg-white/5 text-slate-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer text-center"
            >
              Profil Fams RC
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
