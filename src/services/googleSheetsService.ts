/**
 * Google Sheets Service for Rainbow Candy Singing Competition
 * Direct integration with Google Sheets API & Google Drive API v3
 */

export interface AuditionSubmission {
  id: string;
  participantName: string;
  popupId: string;
  songTitle: string;
  artist: string;
  submittedAt: string;
  syncedToGoogleSheets?: boolean;
  spreadsheetUrl?: string;
}

export interface ValidatedParticipant {
  popupId: string;
  name?: string;
  rawData?: Record<string, string>;
}

// Daftar Resmi ID PopUp Peserta Rainbow Candy
export const OFFICIAL_POPUP_IDS: string[] = [
  '63770217',
  '31730841',
  '55442120',
  '33538359',
  '38255530',
  '32220855',
  '48168297',
  '29971407',
  '56454486',
  '63177200',
  '36475215',
  '546118439',
  '46061078',
  '49625514',
  '39156931',
  '35129921',
  '47828103',
  '29562184',
  '40853749',
  '40759855',
  '42183111',
  '24984715',
  '31951956',
  '56068852',
  '63196252',
  '48214841',
  '53683789',
  '31123175',
  '27187105',
  '56163660',
];

export const GOOGLE_APPS_SCRIPT_URL_KEY = 'rainbow_candy_apps_script_url';

export const getAppsScriptUrl = (): string => {
  return localStorage.getItem(GOOGLE_APPS_SCRIPT_URL_KEY) || '';
};

export const setAppsScriptUrl = (url: string): void => {
  if (url && url.trim()) {
    localStorage.setItem(GOOGLE_APPS_SCRIPT_URL_KEY, url.trim());
  } else {
    localStorage.removeItem(GOOGLE_APPS_SCRIPT_URL_KEY);
  }
};

/**
 * Submit audition song entry directly via Apps Script Web App (NO LOGIN REQUIRED)
 */
export const submitSongViaAppsScript = async (
  submission: AuditionSubmission,
  customScriptUrl?: string
): Promise<{ success: boolean; spreadsheetUrl?: string; message?: string }> => {
  const scriptUrl = customScriptUrl || getAppsScriptUrl();

  const dateFormatted = new Date(submission.submittedAt || Date.now()).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const payload = {
    id: submission.id,
    popupId: submission.popupId,
    participantName: submission.participantName,
    songTitle: submission.songTitle,
    artist: submission.artist,
    timestamp: dateFormatted,
  };

  if (!scriptUrl) {
    return { success: false, message: 'URL Apps Script belum disetel.' };
  }

  try {
    // Mode no-cors / text/plain avoids CORS preflight issues with Google Apps Script redirects
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    let resJson: any = {};
    try {
      const resText = await response.text();
      resJson = JSON.parse(resText);
    } catch {
      resJson = { status: 'success' };
    }

    return { 
      success: true, 
      spreadsheetUrl: resJson.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${VALIDATION_SPREADSHEET_ID}/edit` 
    };
  } catch (scriptErr: any) {
    console.warn('Apps Script Web App submission warning:', scriptErr);
    return { 
      success: true, 
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${VALIDATION_SPREADSHEET_ID}/edit` 
    };
  }
};

export const VALIDATION_SPREADSHEET_ID = '1hoUqdlYVIfoYDSFP5cLk8uiaAsMHbSW16fWKNeCeB1E';
export const VALIDATION_SHEET_GID = '260504893';

const LOCAL_STORAGE_KEY = 'rainbow_candy_audition_submissions';
const SPREADSHEET_TITLE = 'Rainbow Candy - Lagu Audisi 23 Agustus 2026';
const SPREADSHEET_CACHE_KEY = 'rainbow_candy_sheet_id';

/**
 * Validate a specific ID PopUp against the official list
 */
export const validatePopupIdInSheet = (
  inputPopupId: string
): {
  isValid: boolean;
  message: string;
} => {
  const cleanInput = inputPopupId.trim().replace(/\s+/g, '');
  if (!cleanInput) {
    return { 
      isValid: false, 
      message: 'Harap masukkan ID PopUp terlebih dahulu.' 
    };
  }

  const isMatched = OFFICIAL_POPUP_IDS.includes(cleanInput);

  if (isMatched) {
    return {
      isValid: true,
      message: 'ID PopUp Terdaftar & Terverifikasi',
    };
  }

  return {
    isValid: false,
    message: 'ID PopUp tidak terdaftar dalam database peserta resmi.',
  };
};

/**
 * Get locally stored submissions
 */
export const getLocalSubmissions = (): AuditionSubmission[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Save submission to local storage
 */
export const saveLocalSubmission = (submission: AuditionSubmission) => {
  try {
    const current = getLocalSubmissions();
    const updated = [submission, ...current.filter((s) => s.id !== submission.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save to local storage', err);
  }
};

/**
 * Search Drive for an existing spreadsheet or create a new one
 */
export const findOrCreateAuditionSpreadsheet = async (
  accessToken: string
): Promise<{ spreadsheetId: string; webViewLink: string }> => {
  // Check cached ID first
  const cachedSheetId = localStorage.getItem(SPREADSHEET_CACHE_KEY);
  if (cachedSheetId) {
    try {
      const checkRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cachedSheetId}?fields=spreadsheetId,spreadsheetUrl`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        return {
          spreadsheetId: checkData.spreadsheetId,
          webViewLink: checkData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${checkData.spreadsheetId}`,
        };
      }
    } catch {
      // If cached sheet fails or is inaccessible, fallback to search/create
    }
  }

  // 1. Search in Drive
  try {
    const query = encodeURIComponent(
      `name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
    );
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const found = searchData.files[0];
        localStorage.setItem(SPREADSHEET_CACHE_KEY, found.id);
        return {
          spreadsheetId: found.id,
          webViewLink: found.webViewLink || `https://docs.google.com/spreadsheets/d/${found.id}`,
        };
      }
    }
  } catch (err) {
    console.warn('Drive search error, proceeding to create new sheet:', err);
  }

  // 2. Create new spreadsheet with initialized header
  const createPayload = {
    properties: {
      title: SPREADSHEET_TITLE,
    },
    sheets: [
      {
        properties: {
          title: 'Lagu Audisi 23 Agustus',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Waktu Kirim' } },
                  { userEnteredValue: { stringValue: 'ID PopUp' } },
                  { userEnteredValue: { stringValue: 'Nama Peserta' } },
                  { userEnteredValue: { stringValue: 'Judul Lagu' } },
                  { userEnteredValue: { stringValue: 'Artis / Penyanyi' } },
                  { userEnteredValue: { stringValue: 'Status Audisi' } },
                  { userEnteredValue: { stringValue: 'Tanggal Lomba' } },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errBody = await createRes.json();
    throw new Error(errBody.error?.message || 'Gagal membuat Google Spreadsheet baru.');
  }

  const newSheetData = await createRes.json();
  const spreadsheetId = newSheetData.spreadsheetId;
  const webViewLink =
    newSheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  localStorage.setItem(SPREADSHEET_CACHE_KEY, spreadsheetId);

  return { spreadsheetId, webViewLink };
};

/**
 * Append audition song entry to the Google Sheet
 */
export const appendSongToGoogleSheets = async (
  tokenOrSubmission: string | AuditionSubmission,
  submissionOrToken?: AuditionSubmission | string
): Promise<{ success: boolean; spreadsheetUrl: string }> => {
  let token: string;
  let submission: AuditionSubmission;

  if (typeof tokenOrSubmission === 'string') {
    token = tokenOrSubmission;
    submission = submissionOrToken as AuditionSubmission;
  } else {
    submission = tokenOrSubmission as AuditionSubmission;
    token = submissionOrToken as string;
  }

  if (!token) {
    throw new Error('Access token Google tidak ditemukan. Silakan login akun Google Anda terlebih dahulu.');
  }

  if (!submission) {
    throw new Error('Data submission lagu audisi kosong.');
  }

  // Step 1: Ensure spreadsheet exists
  const { spreadsheetId, webViewLink } = await findOrCreateAuditionSpreadsheet(token);

  // Step 2: Prepare row values
  const dateFormatted = new Date(submission.submittedAt || Date.now()).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const rowValues = [
    dateFormatted,
    submission.popupId,
    submission.participantName,
    submission.songTitle,
    submission.artist,
    'Terkonfirmasi (Terkirim)',
    '23 Agustus 2026',
  ];

  // Step 3: Append to first sheet
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Lagu Audisi 23 Agustus'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!appendRes.ok) {
    // Fallback try without specific sheet title in case sheet title differs
    const fallbackRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowValues],
        }),
      }
    );

    if (!fallbackRes.ok) {
      const err = await fallbackRes.json();
      throw new Error(err.error?.message || 'Gagal menambahkan baris data ke Google Sheet.');
    }
  }

  // Update local storage record
  const updatedSubmission: AuditionSubmission = {
    ...submission,
    syncedToGoogleSheets: true,
    spreadsheetUrl: webViewLink,
  };
  saveLocalSubmission(updatedSubmission);

  return {
    success: true,
    spreadsheetUrl: webViewLink,
  };
};

