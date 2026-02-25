import { OperationalEvent, Operator, UserRole } from '../types';

/**
 * Persistenza "Local Storage" per il prototipo VV.F.
 * - Nessun backend richiesto per mantenere i dati fra refresh
 * - Chiavi versionate per evitare rotture future
 */

const PREFIX = 'vvfm_prototipo_v1';
const KEY_EVENTS = `${PREFIX}:events`;
const KEY_OPERATORS = `${PREFIX}:operators`;
const KEY_SESSION = `${PREFIX}:session`;
const KEY_SELECTED_DATE = `${PREFIX}:selectedDate`;

type SessionData = {
  role: UserRole;
  authenticatedAt: string; // ISO
};

const hasWindow = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export function loadEvents(fallback: OperationalEvent[]): OperationalEvent[] {
  if (!hasWindow()) return fallback;
  const parsed = safeParseJSON<OperationalEvent[]>(localStorage.getItem(KEY_EVENTS));
  return Array.isArray(parsed) ? parsed : fallback;
}

export function saveEvents(events: OperationalEvent[]) {
  if (!hasWindow()) return;
  const s = safeStringify(events);
  if (s) localStorage.setItem(KEY_EVENTS, s);
}

export function loadOperators(fallback: Operator[]): Operator[] {
  if (!hasWindow()) return fallback;
  const parsed = safeParseJSON<Operator[]>(localStorage.getItem(KEY_OPERATORS));
  return Array.isArray(parsed) ? parsed : fallback;
}

export function saveOperators(operators: Operator[]) {
  if (!hasWindow()) return;
  const s = safeStringify(operators);
  if (s) localStorage.setItem(KEY_OPERATORS, s);
}

export function loadSession(): SessionData | null {
  if (!hasWindow()) return null;
  return safeParseJSON<SessionData>(localStorage.getItem(KEY_SESSION));
}

export function saveSession(role: UserRole) {
  if (!hasWindow()) return;
  const payload: SessionData = { role, authenticatedAt: new Date().toISOString() };
  const s = safeStringify(payload);
  if (s) localStorage.setItem(KEY_SESSION, s);
}

export function clearSession() {
  if (!hasWindow()) return;
  localStorage.removeItem(KEY_SESSION);
}

export function loadSelectedDate(fallback: string): string {
  if (!hasWindow()) return fallback;
  return localStorage.getItem(KEY_SELECTED_DATE) || fallback;
}

export function saveSelectedDate(date: string) {
  if (!hasWindow()) return;
  localStorage.setItem(KEY_SELECTED_DATE, date);
}

export function clearAllLocalData() {
  if (!hasWindow()) return;
  localStorage.removeItem(KEY_EVENTS);
  localStorage.removeItem(KEY_OPERATORS);
  localStorage.removeItem(KEY_SESSION);
  localStorage.removeItem(KEY_SELECTED_DATE);
}
