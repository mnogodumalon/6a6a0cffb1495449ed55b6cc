// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Sachbearbeiter {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    abteilung?: string;
    funktion?: string;
  };
}

export interface Foerderantraege {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    anrede?: LookupValue;
    antragsteller_vorname?: string;
    antragsteller_nachname?: string;
    organisation?: string;
    rechtsform?: LookupValue;
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
    land?: string;
    antragsteller_email?: string;
    antragsteller_telefon?: string;
    antragsteller_website?: string;
    projekttitel?: string;
    projektkurzbeschreibung?: string;
    projektbeginn?: string; // Format: YYYY-MM-DD oder ISO String
    projektende?: string; // Format: YYYY-MM-DD oder ISO String
    projektort?: string;
    foerderprogramm?: string;
    foerderkategorie?: LookupValue;
    gesamtkosten?: number;
    beantragter_foerderbetrag?: number;
    eigenanteil?: number;
    drittmittel?: number;
    finanzierungsplan?: string;
    projektziele?: string;
    zielgruppe?: string;
    massnahmen?: string;
    erwartete_ergebnisse?: string;
    nachhaltigkeit?: string;
    datei_projektbeschreibung?: string;
    datei_kostenplan?: string;
    datei_weitere_anlagen?: string;
    eingangsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    antragsstatus?: LookupValue;
    bearbeiter?: string; // applookup -> URL zu 'Sachbearbeiter' Record
    bearbeitungsnotizen?: string;
  };
}

export const APP_IDS = {
  SACHBEARBEITER: '6a6a0ce307bddb5f86863950',
  FOERDERANTRAEGE: '6a6a0ce7c5bcc98ee5003a98',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'foerderantraege': {
    anrede: [{ key: "herr", label: "Herr" }, { key: "frau", label: "Frau" }, { key: "divers", label: "Divers" }, { key: "keine_angabe", label: "Keine Angabe" }],
    rechtsform: [{ key: "ev", label: "Eingetragener Verein (e.V.)" }, { key: "gmbh", label: "GmbH" }, { key: "gbr", label: "GbR" }, { key: "einzelperson", label: "Einzelperson" }, { key: "stiftung", label: "Stiftung" }, { key: "sonstige", label: "Sonstige" }],
    foerderkategorie: [{ key: "kultur_bildung", label: "Kultur & Bildung" }, { key: "soziales_integration", label: "Soziales & Integration" }, { key: "umwelt_nachhaltigkeit", label: "Umwelt & Nachhaltigkeit" }, { key: "wirtschaft_innovation", label: "Wirtschaft & Innovation" }, { key: "sport_gesundheit", label: "Sport & Gesundheit" }, { key: "sonstige_kategorie", label: "Sonstige" }],
    antragsstatus: [{ key: "eingegangen", label: "Eingegangen" }, { key: "in_bearbeitung", label: "In Bearbeitung" }, { key: "nachforderung", label: "Nachforderung" }, { key: "bewilligt", label: "Bewilligt" }, { key: "abgelehnt", label: "Abgelehnt" }, { key: "zurueckgezogen", label: "Zurückgezogen" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'sachbearbeiter': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
    'abteilung': 'string/text',
    'funktion': 'string/text',
  },
  'foerderantraege': {
    'anrede': 'lookup/select',
    'antragsteller_vorname': 'string/text',
    'antragsteller_nachname': 'string/text',
    'organisation': 'string/text',
    'rechtsform': 'lookup/select',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
    'land': 'string/text',
    'antragsteller_email': 'string/email',
    'antragsteller_telefon': 'string/tel',
    'antragsteller_website': 'string/url',
    'projekttitel': 'string/text',
    'projektkurzbeschreibung': 'string/textarea',
    'projektbeginn': 'date/date',
    'projektende': 'date/date',
    'projektort': 'string/text',
    'foerderprogramm': 'string/text',
    'foerderkategorie': 'lookup/select',
    'gesamtkosten': 'number',
    'beantragter_foerderbetrag': 'number',
    'eigenanteil': 'number',
    'drittmittel': 'number',
    'finanzierungsplan': 'string/textarea',
    'projektziele': 'string/textarea',
    'zielgruppe': 'string/textarea',
    'massnahmen': 'string/textarea',
    'erwartete_ergebnisse': 'string/textarea',
    'nachhaltigkeit': 'string/textarea',
    'datei_projektbeschreibung': 'file',
    'datei_kostenplan': 'file',
    'datei_weitere_anlagen': 'file',
    'eingangsdatum': 'date/date',
    'antragsstatus': 'lookup/select',
    'bearbeiter': 'applookup/select',
    'bearbeitungsnotizen': 'string/textarea',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateSachbearbeiter = StripLookup<Sachbearbeiter['fields']>;
export type CreateFoerderantraege = StripLookup<Foerderantraege['fields']>;