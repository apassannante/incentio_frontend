/**
 * Centralized config — single source of truth for runtime URLs.
 * Importa da qui invece di duplicare `process.env.NEXT_PUBLIC_API_URL` ovunque.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
