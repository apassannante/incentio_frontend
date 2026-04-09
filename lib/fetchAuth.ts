/**
 * Wrapper fetch che aggiunge automaticamente il token JWT Supabase.
 * Usalo al posto di fetch() per chiamate al backend che richiedono auth.
 *
 * Esempio:
 *   import { fetchAuth } from '@/lib/fetchAuth';
 *   const res = await fetchAuth('/api/visura/parse', { method: 'POST', body: ... });
 */

import { createClient } from './supabase/client';

export async function fetchAuth(
    url: string,
    init?: RequestInit
): Promise<Response> {
    const headers = new Headers(init?.headers);

    // Aggiunge Content-Type se non presente e c'è un body
    if (init?.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    // Aggiunge Authorization se l'utente è autenticato
    try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            headers.set('Authorization', `Bearer ${session.access_token}`);
        }
    } catch {
        // Prosegue senza auth
    }

    return fetch(url, { ...init, headers });
}
