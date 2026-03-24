export type TipoBando = 'tech' | 'green' | 'people';
export type Complessita = 'bassa' | 'media' | 'alta';
export type DimensioneAzienda = 'micro' | 'piccola' | 'media' | 'grande';

export interface Bando {
    id: string;
    titolo: string;
    ente_erogatore: string;
    tipo_bando: TipoBando;
    importo_max_euro: number;
    percentuale_fondo_perduto: number;
    requisiti_azienda: {
        dimensione: DimensioneAzienda | 'tutte';
        settori_ateco: string[];
        anzianita_minima_anni: number;
    };
    documentazione_necessaria: string[];
    scadenza: string;
    complessita_candidatura: Complessita;
    compatibilita_manifattura_lombarda: 'sì' | 'parziale' | 'no';
    sintesi_100_parole: string;
    url_originale: string;
    data_rilevamento: string;
}

export interface ProfiloAzienda {
    id?: string;
    settore_ateco: string;
    dimensione: DimensioneAzienda;
    fatturato_range: '<500k' | '500k-2M' | '2M-10M' | '>10M';
    provincia: string;
    anno_fondazione: number;
    obiettivi: ('digitalizzazione' | 'energia' | 'formazione' | 'macchinari' | 'ricerca')[];
    budget_coinvestimento: '<10k' | '10k-50k' | '50k-200k' | '>200k';
    de_minimis: boolean | null;
}

export interface MatchResult {
    bando: Bando;
    score: number;
    motivo_match: string;
}
