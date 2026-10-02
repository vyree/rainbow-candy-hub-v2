import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Sparkles, Award, FileText, CheckCircle2, Star } from 'lucide-react';
import { ThemeConfig } from '../types/theme';
import { PrizeItem } from '../types/participant';

interface PrizeShowcaseProps {
  currentTheme: ThemeConfig;
  customPrizes?: { rank: number; title: string; reward: string; description?: string }[];
}

export const PrizeShowcase: React.FC<PrizeShowcaseProps> = ({ currentTheme, customPrizes }) => {
  const defaultPrizes: PrizeItem[] = [
    {
      rank: 1,
      title: 'Juara 1',
      subtitle: 'The Grand Champion',
      prizeAmount: 'Rp500.000',
      numericPrize: 500000,
      certificateText: '+ Sertifikat Resmi Juara 1',
      badge: 'Utama / Grand Winner',
      crownColor: '#FFD700',
      accentColor: currentTheme.accentPrimary,
      benefits: [
        'Uang Tunai Rp500.000 Langsung',
        'E-Sertifikat Eksklusif Kejuaraan',
        'Gelar Bintang Idola RC 2026',
        'Apresiasi & Spotlight Khusus',
      ],
    },
    {
      rank: 2,
      title: 'Juara 2',
      subtitle: 'Runner Up I',
      prizeAmount: 'Rp300.000',
      numericPrize: 300000,
      certificateText: '+ Sertifikat Resmi Juara 2',
      badge: 'Runner Up I',
      crownColor: '#C0C0C0',
      accentColor: currentTheme.accentSecondary,
      benefits: [
        'Uang Tunai Rp300.000 Langsung',
        'E-Sertifikat Eksklusif Kejuaraan',
        'Penghargaan Penampil Terbaik',
        'Apresiasi & Spotlight Khusus',
      ],
    },
    {
      rank: 3,
      title: 'Juara 3',
      subtitle: 'Runner Up II',
      prizeAmount: 'Rp200.000',
      numericPrize: 200000,
      certificateText: '+ Sertifikat Resmi Juara 3',
      badge: 'Runner Up II',
      crownColor: '#CD7F32',
      accentColor: currentTheme.accentSecondary,
      benefits: [
        'Uang Tunai Rp200.000 Langsung',
        'E-Sertifikat Eksklusif Kejuaraan',
        'Penghargaan Penjiwaan Idola',
        'Apresiasi & Spotlight Khusus',
      ],
    },
  ];

  const prizes: PrizeItem[] = customPrizes && customPrizes.length > 0
    ? customPrizes.map((cp, idx) => {
        const fallback = defaultPrizes[idx] || defaultPrizes[0];
        return {
          ...fallback,
          rank: cp.rank || idx + 1,
          title: cp.title || fallback.title,
          prizeAmount: cp.reward || fallback.prizeAmount,
          subtitle: cp.description || fallback.subtitle,
        };
      })
    : defaultPrizes;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-8 h-8 text-amber-400 stroke-[2.5]" />;
      case 2:
        return <Trophy className="w-8 h-8 text-slate-300 stroke-[2.5]" />;
      case 3:
        return <Medal className="w-8 h-8 text-amber-600 stroke-[2.5]" />;
      default:
        return <Award className="w-8 h-8 text-current" />;
    }
  };

  return (
    <section id="hadiah" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-4 text-xs font-bold uppercase tracking-widest font-mono"
            style={{
              backgroundColor: `${currentTheme.accentPrimary}15`,
              borderColor: `${currentTheme.accentPrimary}35`,
              color: currentTheme.accentPrimary,
            }}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Penghargaan & Apresiasi</span>
          </div>

          <h2 className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-current mb-4">
            Total Hadiah{' '}
            <span
              className="italic bg-gradient-to-r bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${currentTheme.accentPrimary}, ${currentTheme.accentSecondary})`,
              }}
            >
              Rp1.000.000
            </span>
          </h2>
          <p className="text-base sm:text-lg max-w-xl mx-auto opacity-75 font-light">
            Setiap pemenang berhak mendapatkan uang tunai resmi dan E-Sertifikat Prestasi Berlisensi RC Collaboration.
          </p>
        </div>

        {/* 3-Column Prize Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {prizes.map((prize, index) => {
            const isFirst = prize.rank === 1;

            return (
              <motion.div
                key={prize.rank}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className={`relative rounded-3xl ${currentTheme.cardBg} border-2 ${
                  isFirst ? currentTheme.cardBorder : 'border-white/10 hover:border-white/30'
                } ${currentTheme.cardGlow} p-6 sm:p-8 flex flex-col justify-between backdrop-blur-2xl transition-all duration-300 group overflow-hidden ${
                  isFirst ? 'md:-translate-y-3 ring-2 ring-amber-400/30' : ''
                }`}
              >
                {/* Background ambient glow for 1st place */}
                {isFirst && (
                  <div
                    className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
                    style={{ backgroundColor: currentTheme.accentPrimary }}
                  />
                )}

                {/* Top Badge & Rank Header */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${currentTheme.accentPrimary}25, ${currentTheme.accentSecondary}10)`,
                        border: `1px solid ${currentTheme.accentPrimary}40`,
                      }}
                    >
                      {getRankIcon(prize.rank)}
                    </div>

                    <span
                      className={`text-xs font-mono font-black uppercase px-3 py-1 rounded-full border ${
                        isFirst
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                          : 'bg-white/10 text-current/80 border-white/10'
                      }`}
                    >
                      {prize.badge}
                    </span>
                  </div>

                  {/* Rank Title */}
                  <h3 className="font-serif-luxury text-2xl sm:text-3xl font-black text-current mb-1">
                    {prize.title}
                  </h3>
                  <p className="text-xs font-mono opacity-70 uppercase tracking-wider mb-6">
                    {prize.subtitle}
                  </p>

                  {/* Prize Amount (Big Headline) */}
                  <div className="py-4 px-5 rounded-2xl bg-black/20 border border-white/5 mb-6 text-center group-hover:border-white/15 transition-colors">
                    <span
                      className="font-serif-luxury text-3xl sm:text-4xl font-black tracking-tight block"
                      style={{ color: currentTheme.accentPrimary }}
                    >
                      {prize.prizeAmount}
                    </span>
                    <span className="text-xs font-medium opacity-85 mt-1 inline-flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" style={{ color: currentTheme.accentSecondary }} />
                      <span className="font-bold text-current">{prize.certificateText}</span>
                    </span>
                  </div>

                  {/* Benefits Checklist */}
                  <div className="space-y-2.5 mb-8">
                    {prize.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-current/85">
                        <CheckCircle2
                          className="w-4 h-4 shrink-0"
                          style={{ color: currentTheme.accentPrimary }}
                        />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action / CTA */}
                <a
                  href="#daftar"
                  className={`w-full py-3 rounded-xl text-xs uppercase tracking-wider font-extrabold text-center transition-all flex items-center justify-center gap-2 ${
                    isFirst
                      ? currentTheme.accentButton
                      : `bg-white/10 hover:bg-white/15 text-current border border-white/10`
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Raih Juara Ini</span>
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
