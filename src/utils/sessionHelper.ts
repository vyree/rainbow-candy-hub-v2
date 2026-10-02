import { AdminUser } from '../types/participant';

const SESSION_KEY = 'rc_admin_session';

/**
 * Get active admin session from persistent localStorage or sessionStorage
 */
export function getStoredAdminSession(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const VALID_ROLES = ['superadmin', 'panitia', 'juri', 'stage_mgr', 'viewer'];

    const sanitizeUser = (parsed: any): AdminUser | null => {
      if (!parsed || typeof parsed !== 'object') return null;
      if (!parsed.id || !parsed.username) return null;
      
      const role = VALID_ROLES.includes(parsed.role) ? parsed.role : 'panitia';
      return {
        ...parsed,
        role,
        name: parsed.name || parsed.username || 'Admin',
        avatar: parsed.avatar || (role === 'juri' ? '⚖️' : '👤'),
      };
    };

    // Check localStorage first (persistent across tab reloads / app switches)
    const localData = localStorage.getItem(SESSION_KEY);
    if (localData) {
      const parsed = JSON.parse(localData);
      const sanitized = sanitizeUser(parsed);
      if (sanitized) {
        return sanitized;
      }
    }

    // Fallback to sessionStorage
    const sessionData = sessionStorage.getItem(SESSION_KEY);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      const sanitized = sanitizeUser(parsed);
      if (sanitized) {
        // Sync to localStorage as well so it doesn't get lost
        localStorage.setItem(SESSION_KEY, JSON.stringify(sanitized));
        return sanitized;
      }
    }
  } catch (err) {
    console.warn('Error reading admin session from storage:', err);
  }
  return null;
}

/**
 * Save active admin session persistently to both localStorage and sessionStorage
 */
export function saveStoredAdminSession(user: AdminUser): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(user);
    localStorage.setItem(SESSION_KEY, serialized);
    sessionStorage.setItem(SESSION_KEY, serialized);
  } catch (err) {
    console.warn('Error saving admin session to storage:', err);
  }
}

/**
 * Clear admin session on explicit user logout
 */
export function clearStoredAdminSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.warn('Error clearing admin session from storage:', err);
  }
}
