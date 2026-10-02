import React, { useState, useMemo } from 'react';
import {
  FileText,
  X,
  Search,
  Download,
  Filter,
  Layers,
  Copy,
  Check,
  Sparkles,
  MessageSquareQuote,
  Printer,
  ChevronDown,
  Info,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Participant, AdminUser } from '../../types/participant';

interface ReportNotesPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  adminUsers?: AdminUser[];
  eventTitle?: string;
}

export type NotesSortField = 'rank_asc' | 'rank_desc' | 'name_asc' | 'notes_count_desc' | 'order_asc';
export type NotesFilterScope = 'all' | 'with_notes_only' | 'top3' | 'top10';

export const ReportNotesPDFModal: React.FC<ReportNotesPDFModalProps> = ({
  isOpen,
  onClose,
  participants,
  adminUsers = [],
  eventTitle = 'RC Birthday Celebration & Virgo Party 2026',
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterScope, setFilterScope] = useState<NotesFilterScope>('all');
  const [sortField, setSortField] = useState<NotesSortField>('rank_asc');
  const [pageOrientation, setPageOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Dynamic list of designated judges
  const judgesList = useMemo(() => {
    const judgeUsers = adminUsers.filter((u) => u.role === 'juri' || u.username.startsWith('juri'));
    const sorted = [...judgeUsers].sort((a, b) =>
      a.username.localeCompare(b.username, undefined, { numeric: true })
    );

    if (sorted.length > 0) {
      return sorted.map((u, idx) => ({
        id: u.id,
        username: u.username,
        code: `J${idx + 1}`,
        label: u.name || `Juri ${idx + 1}`,
        fullName: u.name || `Dewan Juri ${idx + 1}`,
      }));
    }

    return [
      { id: 'usr-juri1', username: 'juri1', code: 'J1', label: 'Juri 1', fullName: 'Dewan Juri 1' },
      { id: 'usr-juri2', username: 'juri2', code: 'J2', label: 'Juri 2', fullName: 'Dewan Juri 2' },
      { id: 'usr-juri3', username: 'juri3', code: 'J3', label: 'Juri 3', fullName: 'Dewan Juri 3' },
      { id: 'usr-juri4', username: 'juri4', code: 'J4', label: 'Juri 4', fullName: 'Dewan Juri 4' },
      { id: 'usr-juri5', username: 'juri5', code: 'J5', label: 'Juri 5', fullName: 'Dewan Juri 5' },
    ];
  }, [adminUsers]);

  // Filter only confirmed/done and disqualificated participants
  const validParticipants = useMemo(() => {
    return participants.filter(
      (p) => p.status === 'confirmed' || p.status === 'done' || p.status === 'disqualificated'
    );
  }, [participants]);

  // Baseline ranking by accumulated total score (active participants first, disqualified at end)
  const baselineRanked = useMemo(() => {
    const active = validParticipants
      .filter((p) => p.status !== 'disqualificated')
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

    const dq = validParticipants
      .filter((p) => p.status === 'disqualificated')
      .sort((a, b) => (a.orderNumber ?? 999) - (b.orderNumber ?? 999));

    return [...active, ...dq];
  }, [validParticipants]);

  // Rank mapping ID -> Rank Number (only for active participants)
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    let r = 1;
    baselineRanked.forEach((p) => {
      if (p.status !== 'disqualificated') {
        map.set(p.id, r++);
      }
    });
    return map;
  }, [baselineRanked]);

  // Helper to extract and format all judge notes for a participant
  const getParticipantJudgeNotes = (p: Participant) => {
    const notesList: { judgeName: string; note: string; score?: number }[] = [];

    judgesList.forEach((j) => {
      const scoreObj =
        p.scores?.judgeScores?.[j.id] || p.scores?.judgeScores?.[j.username];
      if (scoreObj && scoreObj.notes && scoreObj.notes.trim().length > 0) {
        notesList.push({
          judgeName: scoreObj.judgeName || j.fullName || j.label,
          note: scoreObj.notes.trim(),
          score: scoreObj.total,
        });
      }
    });

    // Also check for general scores.notes if any not captured in judgeScores
    if (p.scores?.notes && p.scores.notes.trim().length > 0) {
      const alreadyCaptured = notesList.some((n) => n.note === p.scores?.notes?.trim());
      if (!alreadyCaptured) {
        notesList.push({
          judgeName: p.scores.judgedBy ? `Catatan (${p.scores.judgedBy})` : 'Catatan Juri Umum',
          note: p.scores.notes.trim(),
        });
      }
    }

    // Also include registration participant note if present
    if (p.notes && p.notes.trim().length > 0) {
      notesList.push({
        judgeName: 'Catatan Panitia / Registrasi',
        note: p.notes.trim(),
      });
    }

    return notesList;
  };

  // Filtered and Sorted list for report and table
  const processedList = useMemo(() => {
    let list = [...baselineRanked];

    // Filter scope
    if (filterScope === 'with_notes_only') {
      list = list.filter((p) => getParticipantJudgeNotes(p).length > 0);
    } else if (filterScope === 'top3') {
      list = baselineRanked.filter((p) => p.status !== 'disqualificated').slice(0, 3);
    } else if (filterScope === 'top10') {
      list = baselineRanked.filter((p) => p.status !== 'disqualificated').slice(0, 10);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          (p.familyName && p.familyName.toLowerCase().includes(q)) ||
          (p.idolSong && p.idolSong.toLowerCase().includes(q)) ||
          (p.idolArtist && p.idolArtist.toLowerCase().includes(q)) ||
          (p.idpopup && p.idpopup.toString().includes(q)) ||
          getParticipantJudgeNotes(p).some((n) =>
            n.note.toLowerCase().includes(q) || n.judgeName.toLowerCase().includes(q)
          )
      );
    }

    // Sorting
    list.sort((a, b) => {
      const isDQA = a.status === 'disqualificated';
      const isDQB = b.status === 'disqualificated';
      const rankA = rankMap.get(a.id) || 9999;
      const rankB = rankMap.get(b.id) || 9999;
      const scoreA = a.totalScore || 0;
      const scoreB = b.totalScore || 0;

      switch (sortField) {
        case 'rank_asc':
          if (isDQA && !isDQB) return 1;
          if (!isDQA && isDQB) return -1;
          return rankA - rankB;
        case 'rank_desc':
          if (isDQA && !isDQB) return 1;
          if (!isDQA && isDQB) return -1;
          return rankB - rankA;
        case 'name_asc':
          return a.fullName.localeCompare(b.fullName);
        case 'notes_count_desc':
          return getParticipantJudgeNotes(b).length - getParticipantJudgeNotes(a).length;
        case 'order_asc':
          return (a.orderNumber || 999) - (b.orderNumber || 999);
        default:
          if (isDQA && !isDQB) return 1;
          if (!isDQA && isDQB) return -1;
          return rankA - rankB;
      }
    });

    return list;
  }, [baselineRanked, filterScope, searchQuery, sortField, rankMap, judgesList]);

  // Generate & Download PDF
  const handleDownloadPDF = () => {
    try {
      setIsGenerating(true);

      const isLandscape = pageOrientation === 'landscape';
      const doc = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;

      // Header Banner Background
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 28, 'F');

      // Gold Top Accent Stripe
      doc.setFillColor(217, 119, 6); // amber-600
      doc.rect(0, 0, pageWidth, 3, 'F');

      // Title & Subtitle in Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(eventTitle.toUpperCase(), margin, 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(251, 191, 36); // amber-400
      doc.text(
        'REKAPITULASI HASIL PENILAIAN & CATATAN EVALUASI DEWAN JURI (AUDIO NYANYI MIRIP IDOLA)',
        margin,
        19
      );

      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225); // slate-300
      const formattedDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      doc.text(
        `Tanggal Cetak: ${formattedDate}  |  Total Peserta: ${processedList.length}  |  Dewan Juri: ${judgesList.length} Juri Mandiri`,
        margin,
        24
      );

      // Prepare Table Data
      const tableHeaders = [
        ['No', 'Nama Peserta & Family', 'Judul Lagu', 'Artis Idola', 'Total Poin', 'Catatan & Evaluasi Dewan Juri'],
      ];

      const tableRows = processedList.map((p, idx) => {
        const isDQ = p.status === 'disqualificated';
        const rank = rankMap.get(p.id);
        const rankText = isDQ
          ? 'DQ'
          : rank === 1
          ? '1 (Juara 1)'
          : rank === 2
          ? '2 (Juara 2)'
          : rank === 3
          ? '3 (Juara 3)'
          : rank !== undefined
          ? `${rank}`
          : '-';

        const nameWithDetails = `${p.fullName}${
          isDQ ? '\n[DISKUALIFIKASI]' : ''
        }${
          p.idpopup ? `\n(ID PopUp: #${p.idpopup})` : ''
        }${p.familyName ? `\nFamily: ${p.familyName}` : ''}`;

        const notesArray = getParticipantJudgeNotes(p);
        let formattedNotes = '';

        if (notesArray.length > 0) {
          formattedNotes = notesArray
            .map(
              (item) =>
                `• [${item.judgeName}${item.score !== undefined ? ` - Nilai: ${item.score.toFixed(1)}` : ''}]:\n  "${item.note}"`
            )
            .join('\n\n');
        } else {
          formattedNotes = '(Tidak ada catatan tertulis dari dewan juri)';
        }

        const scoreFormatted = isDQ
          ? 'DISKUALIFIKASI'
          : p.totalScore !== undefined && p.totalScore > 0
          ? p.totalScore.toFixed(1)
          : 'Belum Dinilai';

        return [
          rankText,
          nameWithDetails,
          p.idolSong || '-',
          p.idolArtist || '-',
          scoreFormatted,
          formattedNotes,
        ];
      });

      // AutoTable Configuration
      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 33,
        margin: { top: 33, right: margin, bottom: 18, left: margin },
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          textColor: [30, 41, 59], // slate-800
          lineColor: [226, 232, 240], // slate-200
          lineWidth: 0.2,
          cellPadding: { top: 3.5, right: 3, bottom: 3.5, left: 3 },
          valign: 'top',
        },
        headStyles: {
          fillColor: [15, 23, 42], // slate-900
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // slate-50
        },
        columnStyles: {
          0: { cellWidth: isLandscape ? 18 : 14, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: isLandscape ? 48 : 36, fontStyle: 'bold' },
          2: { cellWidth: isLandscape ? 40 : 30 },
          3: { cellWidth: isLandscape ? 38 : 28 },
          4: {
            cellWidth: isLandscape ? 22 : 18,
            halign: 'right',
            fontStyle: 'bold',
            textColor: [180, 83, 9], // amber-700
          },
          5: { cellWidth: 'auto' }, // Catatan takes maximum remaining space
        },
        didDrawPage: (data) => {
          // Footer
          const pageCount = doc.getNumberOfPages();
          const currentPage = data.pageNumber;

          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139); // slate-500
          doc.text(
            `Dokumen Rekapitulasi Resmi • RC Birthday Celebration & Virgo Party 2026`,
            margin,
            pageHeight - 8
          );

          doc.text(
            `Halaman ${currentPage} dari ${pageCount}`,
            pageWidth - margin,
            pageHeight - 8,
            { align: 'right' }
          );

          // Divider Line on Top of Footer
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.2);
          doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        },
      });

      // Filename
      const dateString = new Date().toISOString().slice(0, 10);
      const safeTitle = 'Rekap_Catatan_Dewan_Juri_RC_2026';
      doc.save(`${safeTitle}_${dateString}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Gagal membuat file PDF. Silakan coba kembali.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy Summary text to clipboard
  const handleCopyTextSummary = () => {
    let summaryText = `📋 *REKAPITULASI HASIL PENILAIAN & CATATAN DEWAN JURI*\n*${eventTitle}*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    processedList.forEach((p, idx) => {
      const rank = rankMap.get(p.id) || idx + 1;
      const notes = getParticipantJudgeNotes(p);

      summaryText += `${rank}. *${p.fullName}* ${p.familyName ? `(${p.familyName})` : ''}\n`;
      summaryText += `   🎵 Lagu: ${p.idolSong || '-'} | Artis: ${p.idolArtist || '-'}\n`;
      summaryText += `   ⭐ Total Poin: ${p.totalScore !== undefined ? p.totalScore.toFixed(1) : '-'}\n`;

      if (notes.length > 0) {
        summaryText += `   📝 Catatan Dewan Juri:\n`;
        notes.forEach((n) => {
          summaryText += `      • [${n.judgeName}]: "${n.note}"\n`;
        });
      } else {
        summaryText += `   📝 Catatan: (Tidak ada catatan)\n`;
      }
      summaryText += `\n`;
    });

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <MessageSquareQuote className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>Download Rekap Nilai & Catatan Juri</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-semibold">
                  Format PDF
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rekap lengkap: Nama, Judul Lagu, Artis, Total Point, dan seluruh catatan evaluasi dari semua Dewan Juri.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/60 shrink-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari peserta, lagu, catatan..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Filter Scope */}
            <div>
              <select
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value as NotesFilterScope)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
              >
                <option value="all">👥 Semua Peserta ({baselineRanked.length})</option>
                <option value="with_notes_only">📝 Hanya yang Memiliki Catatan</option>
                <option value="top3">👑 Juara 1, 2, dan 3 (Top 3)</option>
                <option value="top10">🌟 Top 10 Teratas</option>
              </select>
            </div>

            {/* Sort Field */}
            <div>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as NotesSortField)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
              >
                <option value="rank_asc">🏆 Peringkat Tertinggi (Juara 1 ➔ Selesai)</option>
                <option value="notes_count_desc">📝 Catatan Terbanyak ➔ Tersedikit</option>
                <option value="name_asc">🔤 Nama Peserta (A ➔ Z)</option>
                <option value="order_asc">🔢 Nomor Urut Tampil (1 ➔ Selesai)</option>
              </select>
            </div>

            {/* PDF Orientation */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-700">
              <button
                type="button"
                onClick={() => setPageOrientation('landscape')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  pageOrientation === 'landscape'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Landscape (Lebar)
              </button>
              <button
                type="button"
                onClick={() => setPageOrientation('portrait')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  pageOrientation === 'portrait'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Portrait (Tegak)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              Menampilkan <strong>{processedList.length}</strong> peserta dalam dokumen PDF ini. Format Landscape direkomendasikan agar catatan panjang juri mudah dibaca.
            </span>
            <span className="text-[11px] font-mono text-amber-300">
              {judgesList.length} Dewan Juri Terdaftar
            </span>
          </div>
        </div>

        {/* Live Table Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-4 w-44">Nama Peserta</th>
                  <th className="py-3 px-4 w-40">Lagu & Artis</th>
                  <th className="py-3 px-3 text-right w-24">Total Poin</th>
                  <th className="py-3 px-4">Catatan Evaluasi Dewan Juri</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-sans">
                {processedList.length > 0 ? (
                  processedList.map((p, idx) => {
                    const isDQ = p.status === 'disqualificated';
                    const rank = rankMap.get(p.id);
                    const notes = getParticipantJudgeNotes(p);
                    const isPodium = !isDQ && (rank === 1 || rank === 2 || rank === 3);

                    return (
                      <tr key={p.id} className={`hover:bg-slate-900/50 transition-colors ${isDQ ? 'bg-red-950/15' : ''}`}>
                        <td className="py-3.5 px-3 text-center font-mono font-bold">
                          {isDQ ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] inline-block font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              DQ
                            </span>
                          ) : isPodium ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] inline-block font-bold ${
                                rank === 1
                                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                                  : rank === 2
                                  ? 'bg-slate-300 text-slate-950'
                                  : 'bg-amber-700 text-white'
                              }`}
                            >
                              #{rank}
                            </span>
                          ) : (
                            <span className="text-slate-400">#{rank ?? '-'}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-100">{p.fullName}</span>
                            {isDQ && (
                              <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[8px] font-mono uppercase font-bold shrink-0">
                                Diskualifikasi
                              </span>
                            )}
                          </div>
                          {p.idpopup && (
                            <div className="text-[10px] font-mono text-amber-400/90 font-semibold">
                              ID: #{p.idpopup}
                            </div>
                          )}
                          {p.familyName && (
                            <div className="text-[10px] text-slate-400">
                              Fam: {p.familyName}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <div className="font-semibold text-slate-200">🎵 {p.idolSong || '-'}</div>
                          <div className="text-[11px] text-slate-400">
                            🎤 {p.idolArtist || '-'}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-amber-400 text-sm">
                          {isDQ ? (
                            <span className="text-[10px] text-red-400 font-bold bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded">
                              DISKUALIFIKASI
                            </span>
                          ) : p.totalScore !== undefined && p.totalScore > 0 ? (
                            p.totalScore.toFixed(1)
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {notes.length > 0 ? (
                            <div className="space-y-2">
                              {notes.map((n, nIdx) => (
                                <div
                                  key={nIdx}
                                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                                >
                                  <div className="flex items-center justify-between font-semibold text-amber-400 text-[11px] mb-1">
                                    <span>• {n.judgeName}</span>
                                    {n.score !== undefined && (
                                      <span className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                                        Nilai: {n.score.toFixed(1)}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-200 italic leading-relaxed whitespace-pre-wrap">
                                    "{n.note}"
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-xs">
                              (Belum ada catatan tertulis)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      Tidak ada data peserta yang cocok dengan kriteria pencarian/filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTextSummary}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-slate-700"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Salin Teks Ringkasan</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating || processedList.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 via-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-xl shadow-red-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{isGenerating ? 'Membuat PDF...' : 'Download PDF Resmi (.pdf)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
