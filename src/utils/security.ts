/**
 * Security & Input Validation Utilities
 * Melindungi aplikasi dari SQL Injection, Cross-Site Scripting (XSS), dan karakter terlarang.
 */

// Regex untuk huruf alfabet, angka, dan spasi saja (A-Z, a-z, 0-9, spasi)
export const ALPHANUMERIC_SPACE_REGEX = /^[a-zA-Z0-9 ]+$/;

// Regex untuk angka murni saja (0-9) tanpa koma, titik, atau simbol
export const DIGITS_ONLY_REGEX = /^[0-9]+$/;

// Pola mencurigakan umum untuk SQL Injection dan XSS
const MALICIOUS_PATTERNS = [
  /(\b(select|insert|update|delete|drop|union|alter|create|truncate|exec|execute|declare)\b)/i,
  /(--|\/\*|\*\/|;|'|"|`|<|>|=|\||&|\$|\{|\}|\[|\]|\\|\^)/,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/i,
  /on\w+\s*=/i, // onload=, onerror=, onclick=
];

/**
 * Memeriksa apakah teks mengandung pola injeksi berbahaya
 */
export function checkMaliciousPatterns(input: string): boolean {
  if (!input) return false;
  return MALICIOUS_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Membersihkan input teks agar hanya berisi karakter Alfanumerik (A-Z, a-z, 0-9) dan spasi
 */
export function sanitizeAlphanumeric(input: string): string {
  if (!input) return '';
  return input
    .replace(/[^a-zA-Z0-9 ]/g, '') // Hapus semua karakter selain huruf, angka, dan spasi
    .replace(/\s+/g, ' ') // Gabungkan spasi berlebih menjadi satu spasi
    .trim();
}

/**
 * Membersihkan input agar HANYA berupa angka (0-9) tanpa tanda pagar (#), koma, titik, spasi, atau karakter lain
 */
export function sanitizeDigitsOnly(input: string): string {
  if (!input) return '';
  return input.replace(/^#+/, '').replace(/[^0-9]/g, '');
}

/**
 * Memeriksa keabsahan format input Alfanumerik
 */
export function isValidAlphanumeric(input: string): boolean {
  if (!input || !input.trim()) return false;
  return ALPHANUMERIC_SPACE_REGEX.test(input.trim());
}

/**
 * Memeriksa keabsahan format input angka murni
 */
export function isValidDigitsOnly(input: string): boolean {
  if (!input || !input.trim()) return false;
  const clean = input.replace(/^#+/, '').trim();
  return clean === '' ? false : DIGITS_ONLY_REGEX.test(clean);
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized: {
    fullName: string;
    familyName: string;
    idpopup?: number;
    idolSong: string;
    idolArtist?: string;
    whatsapp: string;
  };
}

/**
 * Validasi mendalam untuk seluruh formulir pendaftaran sebelum dikirim ke database
 */
export function validateRegistrationPayload(data: {
  fullName: string;
  familyName: string;
  idpopup?: string | number;
  idolSong: string;
  idolArtist?: string;
  whatsapp: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const cleanFullName = (data.fullName || '').trim();
  const cleanFamilyName = (data.familyName || '').trim();
  const cleanIdolSong = (data.idolSong || '').trim();
  const cleanIdolArtist = (data.idolArtist || '').trim();
  const cleanWhatsapp = (data.whatsapp || '').trim();

  // 1. Validasi Nama Peserta (Wajib, Alfanumerik + spasi, min 2 karakter)
  if (!cleanFullName) {
    errors.fullName = 'Nama Peserta wajib diisi.';
  } else if (cleanFullName.length < 2) {
    errors.fullName = 'Nama Peserta minimal 2 karakter.';
  } else if (!ALPHANUMERIC_SPACE_REGEX.test(cleanFullName)) {
    errors.fullName = 'Nama Peserta hanya boleh berisi huruf abjad (A-Z, a-z) dan angka (0-9) tanpa simbol/karakter khusus.';
  } else if (checkMaliciousPatterns(cleanFullName)) {
    errors.fullName = 'Input terdeteksi mengandung pola karakter tidak aman.';
  }

  // 2. Validasi Nama Family (Wajib, Alfanumerik + spasi, min 2 karakter)
  if (!cleanFamilyName) {
    errors.familyName = 'Nama Family / Komunitas wajib diisi.';
  } else if (cleanFamilyName.length < 2) {
    errors.familyName = 'Nama Family minimal 2 karakter.';
  } else if (!ALPHANUMERIC_SPACE_REGEX.test(cleanFamilyName)) {
    errors.familyName = 'Nama Family hanya boleh berisi huruf abjad (A-Z, a-z) dan angka (0-9) tanpa simbol/karakter khusus.';
  } else if (checkMaliciousPatterns(cleanFamilyName)) {
    errors.familyName = 'Input terdeteksi mengandung pola karakter tidak aman.';
  }

  // 3. Validasi ID PopUp (Opsional, Angka Murni tanpa koma/titik/huruf/#)
  let parsedIdPopup: number | undefined = undefined;
  if (data.idpopup !== undefined && data.idpopup !== null && String(data.idpopup).trim() !== '') {
    // Bersihkan tanda # dan semua karakter non-digit
    const cleanIdPopup = String(data.idpopup).replace(/^#+/, '').replace(/[^0-9]/g, '').trim();
    if (cleanIdPopup !== '') {
      const parsed = parseInt(cleanIdPopup, 10);
      if (isNaN(parsed) || parsed < 0) {
        errors.idpopup = 'ID PopUp harus berupa angka bulat integer valid.';
      } else {
        parsedIdPopup = parsed;
      }
    }
  }

  // 4. Validasi Lagu Idola (Wajib, Alfanumerik + spasi)
  if (!cleanIdolSong) {
    errors.idolSong = 'Judul Lagu Idola wajib diisi.';
  } else if (cleanIdolSong.length < 2) {
    errors.idolSong = 'Judul Lagu Idola minimal 2 karakter.';
  } else if (!ALPHANUMERIC_SPACE_REGEX.test(cleanIdolSong)) {
    errors.idolSong = 'Judul Lagu hanya boleh berisi huruf abjad (A-Z, a-z) dan angka (0-9) tanpa simbol khusus.';
  } else if (checkMaliciousPatterns(cleanIdolSong)) {
    errors.idolSong = 'Input terdeteksi mengandung pola karakter tidak aman.';
  }

  // 5. Validasi Nama Penyanyi Asli (Opsional, jika diisi harus Alfanumerik + spasi)
  if (cleanIdolArtist) {
    if (!ALPHANUMERIC_SPACE_REGEX.test(cleanIdolArtist)) {
      errors.idolArtist = 'Nama Penyanyi hanya boleh berisi huruf abjad (A-Z, a-z) dan angka (0-9).';
    } else if (checkMaliciousPatterns(cleanIdolArtist)) {
      errors.idolArtist = 'Input terdeteksi mengandung pola karakter tidak aman.';
    }
  }

  // 6. Validasi Kontak WhatsApp (Wajib, Angka Murni saja, 9-16 digit)
  if (!cleanWhatsapp) {
    errors.whatsapp = 'Kontak WhatsApp wajib diisi.';
  } else if (!DIGITS_ONLY_REGEX.test(cleanWhatsapp)) {
    errors.whatsapp = 'Kontak WhatsApp hanya boleh berupa angka saja tanpa spasi, tanda plus (+), minus (-), atau huruf.';
  } else if (cleanWhatsapp.length < 9 || cleanWhatsapp.length > 16) {
    errors.whatsapp = 'Nomor WhatsApp tidak valid (harus antara 9 s/d 16 digit angka).';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    sanitized: {
      fullName: sanitizeAlphanumeric(cleanFullName),
      familyName: sanitizeAlphanumeric(cleanFamilyName),
      idpopup: parsedIdPopup,
      idolSong: sanitizeAlphanumeric(cleanIdolSong),
      idolArtist: cleanIdolArtist ? sanitizeAlphanumeric(cleanIdolArtist) : undefined,
      whatsapp: sanitizeDigitsOnly(cleanWhatsapp),
    },
  };
}
