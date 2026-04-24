/**
 * Helper per gestire un profileId persistente lato client.
 * Usa localStorage per mantenere lo stesso profileId tra sessioni
 * senza richiedere autenticazione Supabase.
 */

const KEY = 'incentio_profile_id';

/** Genera un UUID v4 client-side */
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Restituisce il profileId persistente, creandolo se non esiste. */
export function getDemoProfileId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(KEY, id);
  }
  return id;
}

/** Reimposta il profileId (utile per "logout" demo). */
export function resetDemoProfileId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
