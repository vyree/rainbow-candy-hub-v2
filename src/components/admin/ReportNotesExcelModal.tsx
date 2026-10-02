import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  X,
  Search,
  Download,
  Copy,
  Check,
  Sparkles,
  Info,
  Layers,
  ChevronDown,
  Table,
  FileText,
  Sheet as SheetIcon,
  Crown,
  Users,
  Award,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Participant, AdminUser } from '../../types/participant';

interface ReportNotesExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  adminUsers?: AdminUser[];
  eventTitle?: string;
}

export type NotesSortField = 'rank_asc' | 'order_asc' | 'name_asc' | 'notes_count_desc';
export type NotesFilterScope = 'all' | 'with_notes_only' | 'top3' | 'top10';

export const ReportNotesExcelModal: React.FC<ReportNotesExcelModalProps> = ({
  isOpen,
  onClose,
  participants,
  adminUsers = [],
  eventTitle = 'RC Birthday Celebration & Virgo Party 2026',
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterScope, setFilterScope] = useState<NotesFilterScope>('all');
  const [sortField, setSortField] = useState<NotesSortField>('rank_asc');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedClipboard, setCopiedClipboard] = useState<boolean>(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'rekap' | 'catatan' | 'bagan'>('rekap');

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

  // Filter only participants with status 'confirmed', 'done', or 'disqualificated' (exclude pending & canceled)
  const validParticipants = useMemo(() => {
    return (participants || []).filter(
      (p) => p.status === 'confirmed' || p.status === 'done' || p.status === 'disqualificated'
    );
  }, [participants]);

  // Baseline ranking by accumulated total score (active non-disqualified ranked first, followed by disqualified)
  const baselineRanked = useMemo(() => {
    const active = validParticipants.filter((p) => p.status !== 'disqualificated');
    const dq = validParticipants.filter((p) => p.status === 'disqualificated');
    active.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    dq.sort((a, b) => (a.orderNumber ?? 999) - (b.orderNumber ?? 999));
    return [...active, ...dq];
  }, [validParticipants]);

  // Rank mapping ID -> Rank Number (only active non-disqualified participants get numeric rank)
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    let counter = 1;
    baselineRanked.forEach((p) => {
      if (p.status !== 'disqualificated') {
        map.set(p.id, counter++);
      }
    });
    return map;
  }, [baselineRanked]);

  // Helper to extract and format all judge notes for a participant
  const getParticipantJudgeNotes = (p: Participant) => {
    const notesList: { judgeName: string; judgeCode: string; note: string; score?: number }[] = [];

    judgesList.forEach((j) => {
      const scoreObj =
        p.scores?.judgeScores?.[j.id] || p.scores?.judgeScores?.[j.username];
      if (scoreObj && scoreObj.notes && scoreObj.notes.trim().length > 0) {
        notesList.push({
          judgeName: scoreObj.judgeName || j.fullName || j.label,
          judgeCode: j.code,
          note: scoreObj.notes.trim(),
          score: scoreObj.total,
        });
      }
    });

    if (p.scores?.notes && p.scores.notes.trim().length > 0) {
      const alreadyCaptured = notesList.some((n) => n.note === p.scores?.notes?.trim());
      if (!alreadyCaptured) {
        notesList.push({
          judgeName: p.scores.judgedBy ? `Catatan (${p.scores.judgedBy})` : 'Catatan Juri Umum',
          judgeCode: 'JU',
          note: p.scores.notes.trim(),
        });
      }
    }

    if (p.notes && p.notes.trim().length > 0) {
      notesList.push({
        judgeName: 'Catatan Panitia / Registrasi',
        judgeCode: 'PANITIA',
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

      switch (sortField) {
        case 'rank_asc':
          if (isDQA && !isDQB) return 1;
          if (!isDQA && isDQB) return -1;
          return rankA - rankB;
        case 'order_asc': {
          const orderA = typeof a.orderNumber === 'number' && a.orderNumber > 0 ? a.orderNumber : 9999;
          const orderB = typeof b.orderNumber === 'number' && b.orderNumber > 0 ? b.orderNumber : 9999;
          return orderA - orderB;
        }
        case 'name_asc':
          return a.fullName.localeCompare(b.fullName);
        case 'notes_count_desc':
          return getParticipantJudgeNotes(b).length - getParticipantJudgeNotes(a).length;
        default:
          if (isDQA && !isDQB) return 1;
          if (!isDQA && isDQB) return -1;
          return rankA - rankB;
      }
    });

    return list;
  }, [baselineRanked, filterScope, searchQuery, sortField, rankMap, judgesList]);

  // Total notes count
  const totalNotesCount = useMemo(() => {
    return baselineRanked.reduce((acc, p) => acc + getParticipantJudgeNotes(p).length, 0);
  }, [baselineRanked]);

  // Generate & Download Excel (.xlsx) Workbook with Multiple Sheets
  const handleDownloadExcel = () => {
    try {
      setIsGenerating(true);

      const wb = XLSX.utils.book_new();

      // ==========================================
      // SHEET 1: Rekap Total Nilai (Semua Juri)
      // ==========================================
      const sheet1TotalOnlyData: Record<string, any>[] = processedList.map((p, idx) => {
        const isDQ = p.status === 'disqualificated';
        const rank = rankMap.get(p.id);
        const rankLabel = isDQ
          ? 'DISKUALIFIKASI (DQ)'
          : rank === 1
          ? 'Juara 1'
          : rank === 2
          ? 'Juara 2'
          : rank === 3
          ? 'Juara 3'
          : rank !== undefined
          ? `Peringkat ${rank}`
          : '-';

        const baganNum =
          typeof p.orderNumber === 'number' && p.orderNumber >= 1 && p.orderNumber <= 30
            ? `Bagan ${Math.ceil(p.orderNumber / 6)}`
            : '-';

        const statusLabel = isDQ
          ? 'DISKUALIFIKASI'
          : p.status === 'done'
          ? 'SELESAI (DONE)'
          : 'TERKONFIRMASI';

        return {
          'Peringkat': rankLabel,
          'No Urut': p.orderNumber ?? '-',
          'Bagan': baganNum,
          'ID PopUp': p.idpopup ? `#${p.idpopup}` : '-',
          'Nama Peserta': p.fullName,
          'Family': p.familyName || '-',
          'Judul Lagu Idola': p.idolSong || '-',
          'Artis Idola': p.idolArtist || '-',
          'Status Peserta': statusLabel,
          'Total Skor (Semua Juri)': isDQ
            ? 'DISKUALIFIKASI'
            : p.totalScore !== undefined && p.totalScore > 0
            ? Number(p.totalScore.toFixed(1))
            : 0,
          'Catatan Panitia': p.notes || '-',
        };
      });

      const ws0 = XLSX.utils.json_to_sheet(sheet1TotalOnlyData);
      ws0['!cols'] = [
        { wch: 22 }, // Peringkat
        { wch: 10 }, // No Urut
        { wch: 12 }, // Bagan
        { wch: 12 }, // ID PopUp
        { wch: 26 }, // Nama Peserta
        { wch: 18 }, // Family
        { wch: 28 }, // Judul Lagu
        { wch: 24 }, // Artis Idola
        { wch: 18 }, // Status
        { wch: 24 }, // Total Skor (Semua Juri)
        { wch: 30 }, // Catatan Panitia
      ];
      XLSX.utils.book_append_sheet(wb, ws0, 'Rekap Total Nilai');

      // ==========================================
      // SHEET 2: Rincian Lengkap & Skor Tiap Juri
      // ==========================================
      const sheet1Data: Record<string, any>[] = processedList.map((p, idx) => {
        const isDQ = p.status === 'disqualificated';
        const rank = rankMap.get(p.id);
        const rankLabel = isDQ
          ? 'DISKUALIFIKASI (DQ)'
          : rank === 1
          ? 'Juara 1'
          : rank === 2
          ? 'Juara 2'
          : rank === 3
          ? 'Juara 3'
          : rank !== undefined
          ? `Peringkat ${rank}`
          : '-';

        const baganNum =
          typeof p.orderNumber === 'number' && p.orderNumber >= 1 && p.orderNumber <= 30
            ? `Bagan ${Math.ceil(p.orderNumber / 6)}`
            : '-';

        const statusLabel = isDQ
          ? 'DISKUALIFIKASI'
          : p.status === 'done'
          ? 'SELESAI (DONE)'
          : 'TERKONFIRMASI';

        const row: Record<string, any> = {
          'Peringkat': rankLabel,
          'No Urut': p.orderNumber ?? '-',
          'Bagan': baganNum,
          'ID PopUp': p.idpopup ? `#${p.idpopup}` : '-',
          'Nama Peserta': p.fullName,
          'Family': p.familyName || '-',
          'Judul Lagu Idola': p.idolSong || '-',
          'Artis Idola': p.idolArtist || '-',
          'Status Peserta': statusLabel,
          'Total Skor Akhir': isDQ
            ? 'DISKUALIFIKASI'
            : p.totalScore !== undefined && p.totalScore > 0
            ? Number(p.totalScore.toFixed(1))
            : 0,
          'Rata-Rata Skor':
            !isDQ && p.totalScore !== undefined && p.totalScore > 0 && judgesList.length > 0
              ? Number((p.totalScore / judgesList.length).toFixed(2))
              : 0,
        };

        // Add columns for each judge's breakdown and notes
        judgesList.forEach((j) => {
          const scoreObj =
            p.scores?.judgeScores?.[j.id] || p.scores?.judgeScores?.[j.username];
          const prefix = `[${j.code} - ${j.label}]`;

          row[`${prefix} Total`] = scoreObj?.total !== undefined ? Number(scoreObj.total.toFixed(1)) : '-';
          row[`${prefix} Vokal (0-30)`] = scoreObj?.vocalTechnique !== undefined ? Number(scoreObj.vocalTechnique.toFixed(1)) : '-';
          row[`${prefix} Kemiripan (0-30)`] = scoreObj?.similarity !== undefined ? Number(scoreObj.similarity.toFixed(1)) : '-';
          row[`${prefix} Penjiwaan (0-20)`] = scoreObj?.expression !== undefined ? Number(scoreObj.expression.toFixed(1)) : '-';
          row[`${prefix} Presentasi (0-20)`] = scoreObj?.presentation !== undefined ? Number(scoreObj.presentation.toFixed(1)) : '-';
          row[`${prefix} Catatan`] = scoreObj?.notes ? scoreObj.notes.trim() : '-';
        });

        // Combined notes column
        const notesArr = getParticipantJudgeNotes(p);
        row['Semua Catatan Juri (Gabungan)'] =
          notesArr.length > 0
            ? notesArr.map((n) => `[${n.judgeName}]: ${n.note}`).join(' | ')
            : '-';

        row['Catatan Panitia'] = p.notes || '-';

        return row;
      });

      const ws1 = XLSX.utils.json_to_sheet(sheet1Data);

      // Auto-set optimal column widths
      const colWidths: { wch: number }[] = [
        { wch: 15 }, // Peringkat
        { wch: 10 }, // No Urut
        { wch: 12 }, // Bagan
        { wch: 12 }, // ID PopUp
        { wch: 26 }, // Nama Peserta
        { wch: 18 }, // Family
        { wch: 28 }, // Judul Lagu
        { wch: 24 }, // Artis Idola
        { wch: 15 }, // Status
        { wch: 16 }, // Total Skor
        { wch: 15 }, // Rata-Rata
      ];

      judgesList.forEach(() => {
        colWidths.push(
          { wch: 14 }, // Total
          { wch: 15 }, // Vokal
          { wch: 16 }, // Kemiripan
          { wch: 16 }, // Penjiwaan
          { wch: 16 }, // Presentasi
          { wch: 45 }  // Catatan
        );
      });

      colWidths.push({ wch: 60 }); // Catatan Gabungan
      colWidths.push({ wch: 30 }); // Catatan Panitia

      ws1['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws1, 'Rincian Lengkap Juri');

      // ==========================================
      // SHEET 2: Khusus Catatan & Evaluasi Juri
      // ==========================================
      const sheet2Data: Record<string, any>[] = [];
      processedList.forEach((p, idx) => {
        const rank = rankMap.get(p.id) || idx + 1;
        const notesArr = getParticipantJudgeNotes(p);

        if (notesArr.length > 0) {
          notesArr.forEach((n) => {
            sheet2Data.push({
              'Peringkat': rank,
              'No Urut': p.orderNumber ?? '-',
              'Nama Peserta': p.fullName,
              'Family': p.familyName || '-',
              'Judul Lagu': p.idolSong || '-',
              'Dewan Juri': n.judgeName,
              'Nilai Total Juri': n.score !== undefined ? Number(n.score.toFixed(1)) : '-',
              'Catatan & Evaluasi': n.note,
            });
          });
        } else {
          sheet2Data.push({
            'Peringkat': rank,
            'No Urut': p.orderNumber ?? '-',
            'Nama Peserta': p.fullName,
            'Family': p.familyName || '-',
            'Judul Lagu': p.idolSong || '-',
            'Dewan Juri': '-',
            'Nilai Total Juri': '-',
            'Catatan & Evaluasi': '(Tidak ada catatan tertulis)',
          });
        }
      });

      const ws2 = XLSX.utils.json_to_sheet(sheet2Data);
      ws2['!cols'] = [
        { wch: 10 },
        { wch: 10 },
        { wch: 25 },
        { wch: 18 },
        { wch: 26 },
        { wch: 22 },
        { wch: 16 },
        { wch: 65 },
      ];
      XLSX.utils.book_append_sheet(wb, ws2, 'Catatan Evaluasi Juri');

      // ==========================================
      // SHEET 4: Peringkat Juara & Bagan Panggung
      // ==========================================
      const sheet3Data: Record<string, any>[] = [];

      // Top 3 Podium (Active non-disqualified winners only)
      const activeWinners = baselineRanked.filter((p) => p.status !== 'disqualificated' && (p.totalScore || 0) > 0);

      sheet3Data.push({
        'Kategori / Babak': '👑 PODIUM JUARA',
        'Peringkat': 'JUARA 1',
        'No Urut': activeWinners[0]?.orderNumber ?? '-',
        'Nama Peserta': activeWinners[0]?.fullName ?? '-',
        'Family': activeWinners[0]?.familyName ?? '-',
        'Lagu Idola': activeWinners[0]?.idolSong ?? '-',
        'Total Poin': activeWinners[0]?.totalScore?.toFixed(1) ?? '-',
      });
      sheet3Data.push({
        'Kategori / Babak': '👑 PODIUM JUARA',
        'Peringkat': 'JUARA 2',
        'No Urut': activeWinners[1]?.orderNumber ?? '-',
        'Nama Peserta': activeWinners[1]?.fullName ?? '-',
        'Family': activeWinners[1]?.familyName ?? '-',
        'Lagu Idola': activeWinners[1]?.idolSong ?? '-',
        'Total Poin': activeWinners[1]?.totalScore?.toFixed(1) ?? '-',
      });
      sheet3Data.push({
        'Kategori / Babak': '👑 PODIUM JUARA',
        'Peringkat': 'JUARA 3',
        'No Urut': activeWinners[2]?.orderNumber ?? '-',
        'Nama Peserta': activeWinners[2]?.fullName ?? '-',
        'Family': activeWinners[2]?.familyName ?? '-',
        'Lagu Idola': activeWinners[2]?.idolSong ?? '-',
        'Total Poin': activeWinners[2]?.totalScore?.toFixed(1) ?? '-',
      });

      // Spacer row
      sheet3Data.push({
        'Kategori / Babak': '---------------------',
        'Peringkat': '----------',
        'No Urut': '---',
        'Nama Peserta': '---------------------',
        'Family': '----------',
        'Lagu Idola': '---------------------',
        'Total Poin': '----------',
      });

      // Bagan breakdown (using validParticipants: confirmed and disqualified)
      [1, 2, 3, 4, 5].forEach((b) => {
        const minOrder = (b - 1) * 6 + 1;
        const maxOrder = b * 6;
        const baganParticipants = validParticipants.filter(
          (p) => typeof p.orderNumber === 'number' && p.orderNumber >= minOrder && p.orderNumber <= maxOrder
        ).sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0));

        baganParticipants.forEach((p) => {
          const isDQ = p.status === 'disqualificated';
          const r = rankMap.get(p.id);
          sheet3Data.push({
            'Kategori / Babak': `Bagan ${b} (#${minOrder}-${maxOrder})`,
            'Peringkat': isDQ ? 'DISKUALIFIKASI (DQ)' : r ? `Rank ${r}` : '-',
            'No Urut': p.orderNumber ?? '-',
            'Nama Peserta': p.fullName,
            'Family': p.familyName || '-',
            'Lagu Idola': p.idolSong || '-',
            'Total Poin': isDQ
              ? 'DISKUALIFIKASI'
              : p.totalScore !== undefined && p.totalScore > 0
              ? p.totalScore.toFixed(1)
              : '-',
          });
        });
      });

      const ws3 = XLSX.utils.json_to_sheet(sheet3Data);
      ws3['!cols'] = [
        { wch: 24 },
        { wch: 14 },
        { wch: 10 },
        { wch: 26 },
        { wch: 18 },
        { wch: 28 },
        { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, ws3, 'Juara & Bagan Panggung');

      // Save file
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `Rekap_Lengkap_Catatan_Juri_${dateStr}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Failed to generate Excel:', err);
      alert('Gagal membuat file Excel. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy Full Table in TSV format (Direct Paste into Google Sheets or Excel)
  const handleCopyTSV = () => {
    try {
      const headers = [
        'Peringkat',
        'No Urut',
        'Bagan',
        'ID PopUp',
        'Nama Peserta',
        'Family',
        'Judul Lagu',
        'Artis Idola',
        'Total Skor',
        ...judgesList.flatMap((j) => [
          `[${j.code}] Total`,
          `[${j.code}] Vokal`,
          `[${j.code}] Kemiripan`,
          `[${j.code}] Penjiwaan`,
          `[${j.code}] Presentasi`,
          `[${j.code}] Catatan`,
        ]),
        'Semua Catatan (Gabungan)',
      ];

      const rows = processedList.map((p, idx) => {
        const rank = rankMap.get(p.id) || idx + 1;
        const baganNum =
          typeof p.orderNumber === 'number' && p.orderNumber >= 1 && p.orderNumber <= 30
            ? `Bagan ${Math.ceil(p.orderNumber / 6)}`
            : '-';

        const rowValues = [
          rank,
          p.orderNumber ?? '-',
          baganNum,
          p.idpopup ? `#${p.idpopup}` : '-',
          p.fullName,
          p.familyName || '-',
          p.idolSong || '-',
          p.idolArtist || '-',
          p.totalScore !== undefined && p.totalScore > 0 ? p.totalScore.toFixed(1) : '0.0',
        ];

        judgesList.forEach((j) => {
          const scoreObj =
            p.scores?.judgeScores?.[j.id] || p.scores?.judgeScores?.[j.username];
          rowValues.push(
            scoreObj?.total !== undefined ? scoreObj.total.toFixed(1) : '-',
            scoreObj?.vocalTechnique !== undefined ? scoreObj.vocalTechnique.toFixed(1) : '-',
            scoreObj?.similarity !== undefined ? scoreObj.similarity.toFixed(1) : '-',
            scoreObj?.expression !== undefined ? scoreObj.expression.toFixed(1) : '-',
            scoreObj?.presentation !== undefined ? scoreObj.presentation.toFixed(1) : '-',
            scoreObj?.notes ? scoreObj.notes.replace(/\t|\r|\n/g, ' ') : '-'
          );
        });

        const notesArr = getParticipantJudgeNotes(p);
        rowValues.push(
          notesArr.length > 0
            ? notesArr.map((n) => `[${n.judgeName}]: ${n.note.replace(/\t|\r|\n/g, ' ')}`).join(' | ')
            : '-'
        );

        return rowValues.join('\t');
      });

      const tsvContent = [headers.join('\t'), ...rows].join('\n');
      navigator.clipboard.writeText(tsvContent);
      setCopiedClipboard(true);
      setTimeout(() => setCopiedClipboard(false), 3000);
    } catch (err) {
      console.error('Failed to copy TSV:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>Download Rekap Nilai & Catatan Juri</span>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <SheetIcon className="w-3 h-3" /> Format Excel (.xlsx) / Sheets
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Format spreadsheet multi-sheet lengkap: detail 4 kriteria per dewan juri, nomor urut tampil, bagan, dan catatan evaluasi.
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
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            {/* Filter Scope */}
            <div>
              <select
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value as NotesFilterScope)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:border-emerald-400 transition-colors cursor-pointer"
              >
                <option value="all">👥 Semua Peserta ({baselineRanked.length})</option>
                <option value="with_notes_only">📝 Hanya yang Memiliki Catatan ({totalNotesCount} Catatan)</option>
                <option value="top3">👑 Juara 1, 2, dan 3 (Top 3)</option>
                <option value="top10">🌟 Top 10 Teratas</option>
              </select>
            </div>

            {/* Sort Field */}
            <div>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as NotesSortField)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:border-emerald-400 transition-colors cursor-pointer"
              >
                <option value="rank_asc">🏆 Peringkat Nilai Tertinggi (Juara 1 ➔ Selesai)</option>
                <option value="order_asc">🔢 Urutan Tampil Panggung (#1 ➔ Selesai)</option>
                <option value="notes_count_desc">📝 Catatan Terbanyak ➔ Tersedikit</option>
                <option value="name_asc">🔤 Nama Peserta (A ➔ Z)</option>
              </select>
            </div>

            {/* Preview Sheet Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setActivePreviewTab('rekap')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                  activePreviewTab === 'rekap'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rekap & Detail
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('catatan')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                  activePreviewTab === 'catatan'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Catatan Juri
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('bagan')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                  activePreviewTab === 'bagan'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Juara & Bagan
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 pt-1 gap-2">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                File Excel memuat <strong>4 Sheet terpisah</strong>: Rekap Total Nilai (Semua Juri), Rincian Lengkap (+ detail 4 kriteria tiap juri), Catatan Evaluasi Juri, dan Juara & Bagan.
              </span>
            </span>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-slate-300">
                Peserta: <strong className="text-emerald-400">{processedList.length}</strong>
              </span>
              <span className="text-slate-300">
                Dewan Juri: <strong className="text-amber-400">{judgesList.length} Juri</strong>
              </span>
              <span className="text-slate-300">
                Total Catatan: <strong className="text-sky-400">{totalNotesCount}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Live Table Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar min-h-0">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner">
            <div className="overflow-x-auto">
              {activePreviewTab === 'rekap' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                      <th className="py-3 px-3 text-center w-12">Rank</th>
                      <th className="py-3 px-3 text-center w-14">No Urut</th>
                      <th className="py-3 px-4 min-w-[180px]">Nama Peserta & Family</th>
                      <th className="py-3 px-4 min-w-[180px]">Lagu Idola & Artis</th>
                      <th className="py-3 px-3 text-right min-w-[90px]">Total Skor</th>
                      {judgesList.map((j) => (
                        <th key={j.id} className="py-3 px-3 text-center min-w-[100px] border-l border-slate-800 text-amber-300">
                          {j.code} ({j.label})
                        </th>
                      ))}
                      <th className="py-3 px-4 min-w-[280px] border-l border-slate-800">Catatan Dewan Juri</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-sans">
                    {processedList.length > 0 ? (
                      processedList.map((p, idx) => {
                        const isDQ = p.status === 'disqualificated';
                        const rank = rankMap.get(p.id);
                        const notes = getParticipantJudgeNotes(p);
                        const isPodium = !isDQ && (rank === 1 || rank === 2 || rank === 3);
                        const baganNum =
                          typeof p.orderNumber === 'number' && p.orderNumber >= 1 && p.orderNumber <= 30
                            ? Math.ceil(p.orderNumber / 6)
                            : null;

                        return (
                          <tr key={p.id} className={`hover:bg-slate-900/50 transition-colors ${isDQ ? 'bg-red-950/15' : ''}`}>
                            <td className="py-3 px-3 text-center font-mono font-bold">
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
                            <td className="py-3 px-3 text-center font-mono">
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-400 font-bold border border-slate-700/60">
                                #{p.orderNumber ?? '-'}
                              </span>
                              {baganNum && (
                                <div className="text-[9px] text-pink-400 font-mono mt-0.5">
                                  Bagan {baganNum}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-100">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-100">{p.fullName}</span>
                                {isDQ && (
                                  <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[8px] font-mono uppercase font-bold shrink-0">
                                    Diskualifikasi
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                {p.idpopup && (
                                  <span className="font-mono text-amber-400/90 font-semibold">
                                    ID: #{p.idpopup}
                                  </span>
                                )}
                                {p.familyName && <span>• Fam: {p.familyName}</span>}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                              <div className="font-semibold text-slate-200">🎵 {p.idolSong || '-'}</div>
                              <div className="text-[11px] text-slate-400">
                                🎤 {p.idolArtist || '-'}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-amber-400 text-sm">
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

                            {/* Individual Judge Scores */}
                            {judgesList.map((j) => {
                              const scoreObj =
                                p.scores?.judgeScores?.[j.id] || p.scores?.judgeScores?.[j.username];
                              return (
                                <td key={j.id} className="py-3 px-3 text-center font-mono border-l border-slate-800">
                                  {scoreObj?.total !== undefined ? (
                                    <div className="inline-flex flex-col items-center">
                                      <span className="font-bold text-slate-200 text-xs">
                                        {scoreObj.total.toFixed(1)}
                                      </span>
                                      <span className="text-[9px] text-slate-500">
                                        {scoreObj.vocalTechnique || 0}/{scoreObj.similarity || 0}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-600 italic text-[11px]">-</span>
                                  )}
                                </td>
                              );
                            })}

                            {/* Judge Notes Preview */}
                            <td className="py-3 px-4 text-slate-300 border-l border-slate-800">
                              {notes.length > 0 ? (
                                <div className="space-y-1.5 max-w-lg">
                                  {notes.map((n, nIdx) => (
                                    <div
                                      key={nIdx}
                                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px]"
                                    >
                                      <span className="font-semibold text-amber-400 mr-1.5">
                                        [{n.judgeName}]:
                                      </span>
                                      <span className="text-slate-200 italic">
                                        "{n.note}"
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-500 italic text-xs">
                                  (Tidak ada catatan)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6 + judgesList.length} className="py-12 text-center text-slate-500">
                          Tidak ada data peserta yang cocok dengan kriteria pencarian/filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {activePreviewTab === 'catatan' && (
                <div className="p-4 space-y-3">
                  {processedList.filter((p) => getParticipantJudgeNotes(p).length > 0).length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      Belum ada catatan tertulis yang diinputkan oleh dewan juri untuk filter ini.
                    </div>
                  ) : (
                    processedList
                      .filter((p) => getParticipantJudgeNotes(p).length > 0)
                      .map((p, pIdx) => {
                        const notes = getParticipantJudgeNotes(p);
                        const rank = rankMap.get(p.id) || pIdx + 1;

                        return (
                          <div
                            key={p.id}
                            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-mono font-bold text-xs flex items-center justify-center">
                                  #{rank}
                                </span>
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
                                  Urutan #{p.orderNumber ?? '-'}
                                </span>
                                <span className="font-bold text-sm text-slate-100">{p.fullName}</span>
                                {p.familyName && (
                                  <span className="text-xs text-slate-400">({p.familyName})</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-300 font-mono">
                                🎵 {p.idolSong} • Artis: {p.idolArtist} •{' '}
                                <strong className="text-amber-400">
                                  Total Skor: {p.totalScore ? p.totalScore.toFixed(1) : '-'}
                                </strong>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                              {notes.map((n, nIdx) => (
                                <div
                                  key={nIdx}
                                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between text-amber-400 font-semibold text-[11px]">
                                    <span>• {n.judgeName}</span>
                                    {n.score !== undefined && (
                                      <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                                        Skor Juri: {n.score.toFixed(1)}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-200 italic leading-relaxed whitespace-pre-wrap">
                                    "{n.note}"
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}

              {activePreviewTab === 'bagan' && (
                <div className="p-4 space-y-6">
                  {/* Podium Juara */}
                  <div>
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Crown className="w-4 h-4" /> Penetapan Podium Juara
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[1, 2, 3].map((pos) => {
                        const activePodium = baselineRanked.filter((p) => p.status !== 'disqualificated' && (p.totalScore || 0) > 0);
                        const p = activePodium[pos - 1];
                        return (
                          <div
                            key={pos}
                            className={`p-4 rounded-2xl border ${
                              pos === 1
                                ? 'bg-amber-500/10 border-amber-500/30'
                                : pos === 2
                                ? 'bg-slate-400/10 border-slate-400/30'
                                : 'bg-amber-800/10 border-amber-800/30'
                            }`}
                          >
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider block text-amber-400 mb-1">
                              Juara {pos}
                            </span>
                            {p ? (
                              <div>
                                <div className="font-bold text-slate-100 text-sm">{p.fullName}</div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {p.idolSong} • {p.familyName || '-'}
                                </div>
                                <div className="mt-2 text-xs font-mono font-bold text-amber-400">
                                  Skor: {p.totalScore ? p.totalScore.toFixed(1) : '-'} Poin (No Urut #{p.orderNumber ?? '-'})
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500 italic">Belum ditentukan</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pembagian Bagan 1 - 5 */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-pink-400" /> Pembagian Bagan Panggung (6 Peserta Per Bagan)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {[1, 2, 3, 4, 5].map((b) => {
                        const minOrder = (b - 1) * 6 + 1;
                        const maxOrder = b * 6;
                        const baganList = validParticipants
                          .filter(
                            (p) =>
                              typeof p.orderNumber === 'number' &&
                              p.orderNumber >= minOrder &&
                              p.orderNumber <= maxOrder
                          )
                          .sort((x, y) => (x.orderNumber ?? 0) - (y.orderNumber ?? 0));

                        return (
                          <div
                            key={b}
                            className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
                          >
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                              <span className="text-xs font-bold text-pink-400">
                                Bagan {b}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                #{minOrder} - #{maxOrder}
                              </span>
                            </div>
                            <div className="space-y-1 text-xs">
                              {baganList.length > 0 ? (
                                baganList.map((p) => {
                                  const isDQ = p.status === 'disqualificated';
                                  return (
                                    <div
                                      key={p.id}
                                      className={`p-1.5 rounded-lg border flex items-center justify-between gap-1 text-[11px] ${
                                        isDQ
                                          ? 'bg-red-950/20 border-red-500/30'
                                          : 'bg-slate-950/60 border-slate-800/80'
                                      }`}
                                    >
                                      <div className="truncate flex items-center gap-1">
                                        <span className="font-mono text-amber-400 font-bold">
                                          #{p.orderNumber}
                                        </span>
                                        <span className="text-slate-200 truncate max-w-[80px]">
                                          {p.fullName.split(' ')[0]}
                                        </span>
                                      </div>
                                      {isDQ ? (
                                        <span className="text-[9px] font-mono font-bold text-red-400 shrink-0">
                                          DQ
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                          {p.totalScore ? p.totalScore.toFixed(1) : '-'}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-[10px] text-slate-500 italic py-2 text-center">
                                  Belum ada peserta
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTSV}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-slate-700"
              title="Salin tabel data lengkap ke clipboard untuk langsung di-paste ke Google Sheets atau Excel"
            >
              {copiedClipboard ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Data Tersalin! Paste ke Sheet</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Salin Data untuk Google Sheets</span>
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
              onClick={handleDownloadExcel}
              disabled={isGenerating || processedList.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Download file Excel (.xlsx) dengan 3 Sheet terpisah dan detail lengkap"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{isGenerating ? 'Membuat Excel...' : 'Download File Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
