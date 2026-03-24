import { ProfiloAzienda, MatchResult, Bando } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function salvaProfilo(profilo: ProfiloAzienda): Promise<{ id: string }> {
    const res = await fetch(`${API_BASE}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilo),
    });
    return res.json();
}

export async function getBandiCompatibili(profileId: string): Promise<MatchResult[]> {
    const res = await fetch(`${API_BASE}/api/bandi/${profileId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function getSchedaBando(
    bandoId: string,
    profileId: string
): Promise<{
    bando: Bando;
    checklist: string[];
    template_progetto: string;
    giorni_preparazione: number;
}> {
    const res = await fetch(`${API_BASE}/api/bando/${bandoId}/scheda?profileId=${profileId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export interface GapAnalysis {
    score_ammissibilita: number;
    ammissibile: boolean;
    requisiti_soddisfatti: string[];
    requisiti_mancanti: {
        requisito: string;
        priorita: 'bloccante' | 'importante' | 'minore';
    }[];
}

export async function startApplication(
    bandoId: string,
    profileId: string
): Promise<{ id?: string; gap_analysis: GapAnalysis }> {
    const res = await fetch(`${API_BASE}/api/application/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bandoId, profileId }),
    });
    
    if (!res.ok && res.status !== 422) {
        throw new Error(`HTTP Error ${res.status}`);
    }
    
    return res.json();
}

export interface DocumentoStatus {
    nome: string;
    stato: 'gia_pronto' | 'da_preparare' | 'da_verificare';
}

export interface TimelineStep {
    titolo: string;
    descrizione: string;
    giorni: number;
    completato: boolean;
}

export interface FaqItem {
    domanda: string;
    risposta: string;
}

export interface ChecklistItem {
    id: string;
    label: string;
    done: boolean;
}

export interface ApplicationData {
    id: string;
    bando_titolo: string;
    ente_erogatore: string;
    scadenza: string;
    importo_max_euro: number;
    percentuale_fondo_perduto: number;
    scheda_operativa?: string | null;
    documenti?: DocumentoStatus[] | null;
    lista_documenti?: unknown;
    business_plan_template?: string | null;
    timeline?: TimelineStep[] | null;
    faq?: FaqItem[] | null;
    checklist?: ChecklistItem[] | null;
    gap_analysis?: unknown;
}

export async function getApplicationData(applicationId: string): Promise<ApplicationData> {
    const res = await fetch(`${API_BASE}/api/application/${applicationId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data) throw new Error('Invalid response');
    return data;
}
