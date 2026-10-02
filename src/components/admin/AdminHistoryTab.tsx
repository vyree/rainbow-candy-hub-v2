import React, { useMemo, useState } from 'react';
import { Archive, ChevronDown, Trophy, Users, Calendar, Eye } from 'lucide-react';
import { RCEvent } from '../../types/event';
import { Participant } from '../../types/participant';

interface AdminHistoryTabProps {
  events: RCEvent[];
  participants: Participant[]; // all participants (unfiltered) so history is complete
  onViewEvent?: (eventId: string) => void;
}

export const AdminHistoryTab: React.FC<AdminHistoryTabProps> = ({
  events,
  participants,
  onViewEvent,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const endedEvents = useMemo(
    () =>
      events
        .filter((e) => e.status === 'ended')
        .sort(
          (a, b) =>
            new Date(b.endDate || b.updatedAt || 0).getTime() -
            new Date(a.endDate || a.updatedAt || 0).getTime()
        ),
    [events]
  );

  const statsFor = (eventId: string) => {
    const ps = participants.filter((p) => p.eventId === eventId);
    const winners = ps
      .filter((p) => p.winnerTitle)
      .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
    return { total: ps.length, winners };
  };

  if (endedEvents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-12 text-center">
        <Archive className="mx-auto mb-4 h-12 w-12 text-slate-500" />
        <h3 className="text-lg font-bold text-slate-200">Belum ada event yang selesai</h3>
        <p className="mt-2 text-sm text-slate-400">
          Event dengan status <span className="font-semibold text-slate-300">ended</span> akan muncul di sini
          sebagai arsip read-only beserta daftar pemenangnya.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Archive className="h-6 w-6 text-amber-300" />
        <div>
          <h2 className="text-xl font-bold text-slate-100">Riwayat Event</h2>
          <p className="text-sm text-slate-400">
            Arsip read-only event yang sudah selesai — untuk review dan dokumentasi.
          </p>
        </div>
      </div>

      {endedEvents.map((event) => {
        const { total, winners } = statsFor(event.id);
        const expanded = expandedId === event.id;
        return (
          <div
            key={event.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            <button
              onClick={() => setExpandedId(expanded ? null : event.id)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400/15">
                <Trophy className="h-6 w-6 text-amber-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-slate-100">{event.title}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  {event.endDate && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(event.endDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {total} peserta
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5" />
                    {winners.length} pemenang
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                  expanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expanded && (
              <div className="border-t border-white/10 px-5 py-4">
                {event.description && (
                  <p className="mb-4 text-sm leading-relaxed text-slate-300 line-clamp-3">
                    {event.description}
                  </p>
                )}
                {winners.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Belum ada data pemenang untuk event ini.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                          <th className="px-4 py-2">Pemenang</th>
                          <th className="px-4 py-2">Nama</th>
                          <th className="px-4 py-2 text-right">Total Skor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {winners.map((w) => (
                          <tr key={w.id} className="border-t border-white/5 hover:bg-white/5">
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                                <Trophy className="h-3 w-3" />
                                {w.winnerTitle}
                              </span>
                            </td>
                            <td className="px-4 py-2 font-medium text-slate-100">
                              {w.fullName}
                            </td>
                            <td className="px-4 py-2 text-right text-slate-300">
                              {w.totalScore ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {onViewEvent && (
                  <button
                    onClick={() => onViewEvent(event.id)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-pink-400 hover:text-pink-300"
                  >
                    <Eye className="h-4 w-4" />
                    Lihat halaman publik event
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
