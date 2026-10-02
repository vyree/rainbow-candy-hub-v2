import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Mic, Heart, Star, Sparkles, Check, HelpCircle, Music2, Shield, Flame, MessageCircle, ExternalLink, FileText, Users } from 'lucide-react';
import { ThemeConfig } from '../types/theme';
import { RC_LOGO_IMAGE, CONTACT_PERSON_WA, CONTACT_PERSON_WA_LINK } from '../assets/logo';
import { RCEvent } from '../types/event';

interface EventDetailsSectionProps {
  currentTheme: ThemeConfig;
  event?: RCEvent;
  onOpenTermsModal?: () => void;
}

export const EventDetailsSection: React.FC<EventDetailsSectionProps> = ({ currentTheme, event, onOpenTermsModal }) => {
  const criteria = [
    {
      title: 'Teknikalitas',
      desc: 'Ketepatan nada (pitch), tempo, kontrol pernapasan, artikulasi, kestabilan vokal, dan dinamika bernyanyi.',
      icon: Music2,
      percentage: '30%',
    },
    {
      title: 'Kemiripan',
      desc: 'Karakter suara, warna vokal (timbre), cengkok khas, dan keunikan gaya bernyanyi menyerupai idola.',
      icon: Mic,
      percentage: '30%',
    },
    {
      title: 'Penjiwaan',
      desc: 'Penghayatan lirik, ekspresi emosional, penyampaian rasa, dan interpretasi mendalam terhadap lagu.',
      icon: Flame,
      percentage: '20%',
    },
    {
      title: 'Presentasi',
      desc: 'Kualitas penyampaian audio, kejelasan artikulasi rekaman, keseimbangan vokal dengan musik (balance), dan flow audio.',
      icon: Sparkles,
      percentage: '20%',
    },
  ];

  const faqs = useMemo(() => {
    const eventName = event?.title || 'Event Nyanyi Mirip Idola';
    const regDeadline = event?.registrationDeadline || '10 September 2026 pukul 23:59 WIB';
    const eventSchedule = event ? `${event.startDate} pukul ${event.time}` : 'Minggu, 13 September 2026, mulai pukul 10:00 WIB hingga selesai';

    return [
      {
        q: `Apa itu ${eventName}?`,
        a: event?.description || 'Ajang kompetisi bernyanyi di mana peserta membawakan lagu pilihan dengan menirukan karakter vokal, gaya, atau penjiwaan dari penyanyi idola aslinya.',
      },
      {
        q: 'Kapan batas akhir pendaftaran dan pengiriman lagu?',
        a: `Batas akhir registrasi dan pengiriman pilihan lagu adalah ${regDeadline}.`,
      },
      {
        q: 'Kapan jadwal Teknikal Meeting (TM) dilaksanakan?',
        a: 'Teknikal Meeting (TM) wajib diikuti seluruh peserta pada hari Minggu sebelum acara untuk pengundian nomor urut tampil.',
      },
      {
        q: 'Kapan hari H panggung utama acara diselenggarakan?',
        a: `Acara perayaan lomba berlangsung serentak pada ${eventSchedule}.`,
      },
      {
        q: 'Bagaimana jika ingin bertanya mengenai pendaftaran atau lagu pilihan?',
        a: `Peserta dapat langsung menghubungi Contact Person resmi Rainbow Candy via WhatsApp di nomor ${CONTACT_PERSON_WA}.`,
      },
      {
        q: 'Apakah diperbolehkan membawa pendukung / supporter family?',
        a: 'Sangat diperbolehkan! Kehadiran keluarga dan komunitas Rainbow Candy Collaboration akan semakin menyemarakkan acara.',
      },
    ];
  }, [event]);

  return (
    <section className="py-20 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Collaboration Feature Highlight with Logo */}
        <div
          className={`p-8 sm:p-12 rounded-3xl ${currentTheme.cardBg} border-2 ${currentTheme.cardBorder} ${currentTheme.cardGlow} backdrop-blur-2xl shadow-2xl mb-16 relative overflow-hidden`}
        >
          <div className="max-w-3xl mx-auto text-center space-y-4">
            {/* Rainbow Candy Logo Brand Display */}
            <div className="flex justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1.5 bg-white shadow-xl border border-white/50 overflow-hidden flex items-center justify-center">
                <img
                  src={RC_LOGO_IMAGE}
                  alt="Rainbow Candy (RC) Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest font-mono mx-auto"
              style={{
                backgroundColor: `${currentTheme.accentPrimary}15`,
                borderColor: `${currentTheme.accentPrimary}35`,
                color: currentTheme.accentPrimary,
              }}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Semangat Kebersamaan Rainbow Candy</span>
            </div>

            <h3 className="font-serif-luxury text-2xl sm:text-4xl font-black text-current">
              Kolaborasi Hangat{' '}
              <span
                className="italic bg-gradient-to-r bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${currentTheme.accentPrimary}, ${currentTheme.accentSecondary})`,
                }}
              >
                Rainbow Candy & Virgo Season
              </span>
            </h3>

            <p className="text-sm sm:text-base opacity-80 leading-relaxed font-light">
              Peringatan hari ulang tahun Rainbow Candy ini dikemas dalam atmosfer penuh kegembiraan, apresiasi talenta, dan perayaan zodiak Virgo. Satukan suara, nikmati euforia, dan jadilah bagian dari momen bersejarah ini!
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {onOpenTermsModal && (
                <button
                  type="button"
                  onClick={onOpenTermsModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-sm hover:scale-105"
                  style={{
                    backgroundColor: `${currentTheme.accentPrimary}20`,
                    borderColor: `${currentTheme.accentPrimary}50`,
                    color: currentTheme.accentPrimary,
                  }}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Baca Syarat & Ketentuan (S&K)</span>
                </button>
              )}

              <a
                href={CONTACT_PERSON_WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hubungi CP WhatsApp: <strong>{CONTACT_PERSON_WA}</strong></span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Assessment Criteria Grid */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h3 className="font-serif-luxury text-2xl sm:text-3xl font-black text-current mb-2">
              Kriteria Penilaian Lomba
            </h3>
            <p className="text-xs sm:text-sm opacity-75 font-light">
              Standar penilaian transparan dan objektif untuk menentukan pemenang sejati.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {criteria.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} flex flex-col justify-between group hover:border-current/40 transition-all`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                        style={{
                          background: `linear-gradient(135deg, ${currentTheme.accentPrimary}25, ${currentTheme.accentSecondary}10)`,
                          border: `1px solid ${currentTheme.accentPrimary}40`,
                        }}
                      >
                        <Icon className="w-5 h-5" style={{ color: currentTheme.accentPrimary }} />
                      </div>
                      <span
                        className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${currentTheme.accentPrimary}20`,
                          color: currentTheme.accentPrimary,
                        }}
                      >
                        Bobot {item.percentage}
                      </span>
                    </div>

                    <h4 className="font-serif-luxury font-bold text-base text-current mb-2">
                      {item.title}
                    </h4>
                    <p className="text-xs opacity-75 leading-relaxed font-light">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="font-serif-luxury text-2xl font-bold text-current mb-1">
              Pertanyaan Seputar Acara (FAQ)
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl ${currentTheme.cardBg} border ${currentTheme.cardBorder} text-left`}
              >
                <p className="font-serif-luxury font-bold text-sm sm:text-base text-current flex items-center gap-2 mb-2">
                  <HelpCircle className="w-4 h-4 shrink-0" style={{ color: currentTheme.accentPrimary }} />
                  <span>{faq.q}</span>
                </p>
                <p className="text-xs sm:text-sm opacity-75 pl-6 font-light leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
